import {
  SplitwiseAuthError,
  SplitwiseConstraintError,
  SplitwiseHttpError,
  SplitwiseRateLimitError,
} from "./errors";
import type {
  Comment,
  CreateExpenseParams,
  Expense,
  Friend,
  GetExpensesParams,
  Group,
  SplitwiseUser,
} from "./types";

/** A bearer token: a Splitwise personal API key, an OAuth2 access token, or a (possibly async) provider returning one. */
export type TokenInput = string | (() => string | Promise<string>);

export interface SplitwiseClientOptions {
  token: TokenInput;
  /** Defaults to https://secure.splitwise.com/api/v3.0 */
  baseUrl?: string;
  /** Inject a fetch implementation; defaults to the global fetch. Useful for tests. */
  fetch?: typeof globalThis.fetch;
}

const DEFAULT_BASE_URL = "https://secure.splitwise.com/api/v3.0";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

/**
 * A thin, token-agnostic Splitwise client over `fetch`. It does not care whether
 * the token is a personal API key or an OAuth2 access token — both are bearer
 * tokens — so the OAuth flow can be added later with no changes here.
 */
export class SplitwiseClient {
  private readonly token: TokenInput;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(options: SplitwiseClientOptions) {
    this.token = options.token;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const f = options.fetch ?? globalThis.fetch;
    if (!f) throw new Error("SplitwiseClient: no fetch implementation available; pass `fetch` in options");
    this.fetchImpl = f;
  }

  private async resolveToken(): Promise<string> {
    return typeof this.token === "function" ? this.token() : this.token;
  }

  // Build the URL by hand rather than via `new URL()` — React Native's URL /
  // URLSearchParams support is historically unreliable, and fetch needs none of it.
  private buildUrl(path: string, query?: RequestOptions["query"]): string {
    let url = `${this.baseUrl}/${path}`;
    if (query) {
      const qs = Object.entries(query)
        .filter((entry): entry is [string, string | number | boolean] => entry[1] !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  private async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const token = await this.resolveToken();
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    const init: RequestInit = { method, headers };
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }

    const res = await this.fetchImpl(this.buildUrl(path, opts.query), init);

    if (res.status === 401) throw new SplitwiseAuthError();
    if (res.status === 429) {
      const retry = res.headers.get("Retry-After");
      throw new SplitwiseRateLimitError(retry ? Number(retry) : undefined);
    }
    if (!res.ok) throw new SplitwiseHttpError(res.status, await safeText(res));

    const json = (await res.json()) as unknown;
    assertNoErrors(json);
    return json as T;
  }

  // --- reads ---
  async getCurrentUser(): Promise<SplitwiseUser> {
    return (await this.request<{ user: SplitwiseUser }>("GET", "get_current_user")).user;
  }
  async getGroups(): Promise<Group[]> {
    return (await this.request<{ groups: Group[] }>("GET", "get_groups")).groups;
  }
  async getGroup(id: number): Promise<Group> {
    return (await this.request<{ group: Group }>("GET", `get_group/${id}`)).group;
  }
  async getFriends(): Promise<Friend[]> {
    return (await this.request<{ friends: Friend[] }>("GET", "get_friends")).friends;
  }
  async getExpenses(params: GetExpensesParams = {}): Promise<Expense[]> {
    const query = params as Record<string, string | number | boolean | undefined>;
    return (await this.request<{ expenses: Expense[] }>("GET", "get_expenses", { query })).expenses;
  }
  async getExpense(id: number): Promise<Expense> {
    return (await this.request<{ expense: Expense }>("GET", `get_expense/${id}`)).expense;
  }
  async getComments(expenseId: number): Promise<Comment[]> {
    return (
      await this.request<{ comments: Comment[] }>("GET", "get_comments", { query: { expense_id: expenseId } })
    ).comments;
  }

  // --- writes ---
  async createExpense(params: CreateExpenseParams): Promise<Expense> {
    const res = await this.request<{ expenses: Expense[] }>("POST", "create_expense", { body: params });
    const expense = res.expenses?.[0];
    if (!expense) throw new SplitwiseHttpError(200, "create_expense returned no expense");
    return expense;
  }
  async updateExpense(id: number, params: Partial<CreateExpenseParams>): Promise<Expense> {
    const res = await this.request<{ expenses: Expense[] }>("POST", `update_expense/${id}`, { body: params });
    const expense = res.expenses?.[0];
    if (!expense) throw new SplitwiseHttpError(200, "update_expense returned no expense");
    return expense;
  }
  async deleteExpense(id: number): Promise<void> {
    await this.request<{ success: boolean }>("POST", `delete_expense/${id}`);
  }
  async createComment(expenseId: number, content: string): Promise<Comment> {
    return (
      await this.request<{ comment: Comment }>("POST", "create_comment", {
        body: { expense_id: expenseId, content },
      })
    ).comment;
  }
  async deleteComment(id: number): Promise<void> {
    await this.request<{ comment: Comment }>("POST", `delete_comment/${id}`);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function assertNoErrors(json: unknown): void {
  if (json && typeof json === "object" && "errors" in json) {
    const errors = (json as { errors: unknown }).errors;
    const nonEmpty = Array.isArray(errors)
      ? errors.length > 0
      : errors != null && typeof errors === "object" && Object.keys(errors).length > 0;
    if (nonEmpty) throw new SplitwiseConstraintError(errors);
  }
}
