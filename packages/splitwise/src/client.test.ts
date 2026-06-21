import { describe, it, expect, vi } from "vitest";
import { SplitwiseClient } from "./client";
import { SplitwiseAuthError, SplitwiseConstraintError, SplitwiseRateLimitError } from "./errors";

function mockResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  const status = init.status ?? 200;
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (k: string) => init.headers?.[k] ?? null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("SplitwiseClient", () => {
  it("sends a Bearer token and unwraps the response envelope", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ user: { id: 7, first_name: "Jas" } }));
    const client = new SplitwiseClient({ token: "key-123", fetch: fetchImpl });
    const user = await client.getCurrentUser();
    expect(user.id).toBe(7);
    const call = fetchImpl.mock.calls[0];
    expect(String(call?.[0])).toContain("/get_current_user");
    expect(call?.[1]?.headers).toMatchObject({ Authorization: "Bearer key-123" });
  });

  it("resolves an async token-provider function per request", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ groups: [] }));
    const client = new SplitwiseClient({ token: async () => "fresh-token", fetch: fetchImpl });
    await client.getGroups();
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: "Bearer fresh-token" });
  });

  it("builds query strings for get_expenses (delta sync)", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ expenses: [] }));
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    await client.getExpenses({ group_id: 5, updated_after: "2026-01-01T00:00:00Z", limit: 50 });
    const url = String(fetchImpl.mock.calls[0]?.[0]);
    expect(url).toContain("group_id=5");
    expect(url).toContain("updated_after=2026-01-01T00%3A00%3A00Z");
    expect(url).toContain("limit=50");
  });

  it("throws SplitwiseConstraintError on a 200 with non-empty errors", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      mockResponse({ expenses: [], errors: { base: ["owed shares differ from cost"] } }),
    );
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    await expect(client.createExpense({ cost: "10.00", description: "x", group_id: 0 })).rejects.toBeInstanceOf(
      SplitwiseConstraintError,
    );
  });

  it("does not throw on an empty errors object", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ expenses: [{ id: 1 }], errors: {} }));
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    const expense = await client.createExpense({ cost: "10.00", description: "x", group_id: 0 });
    expect(expense.id).toBe(1);
  });

  it("maps 401 to SplitwiseAuthError", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({}, { status: 401 }));
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    await expect(client.getCurrentUser()).rejects.toBeInstanceOf(SplitwiseAuthError);
  });

  it("maps 429 to SplitwiseRateLimitError and carries Retry-After seconds", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      mockResponse({}, { status: 429, headers: { "Retry-After": "42" } }),
    );
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    await expect(client.getCurrentUser()).rejects.toBeInstanceOf(SplitwiseRateLimitError);
    await expect(client.getCurrentUser()).rejects.toMatchObject({ retryAfterSeconds: 42 });
  });

  it("createGroup posts to create_group and unwraps the group", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ group: { id: 99, name: "Goa", members: [] } }));
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    const g = await client.createGroup({ name: "Goa", group_type: "trip" });
    expect(g.id).toBe(99);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/create_group");
  });

  it("throws on a success:false write even with empty errors", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ success: false, errors: {} }));
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    await expect(client.removeUserFromGroup(1, 2)).rejects.toBeInstanceOf(SplitwiseConstraintError);
  });

  it("settleUp posts a payment with the debtor paying the creditor", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => mockResponse({ expenses: [{ id: 3, payment: true }] }));
    const client = new SplitwiseClient({ token: "k", fetch: fetchImpl });
    const e = await client.settleUp({ groupId: 5, debtorId: 7, creditorId: 9, amount: "10", currencyCode: "INR" });
    expect(e.id).toBe(3);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body.payment).toBe(true);
    expect(body["users__0__user_id"]).toBe(7);
    expect(body.group_id).toBe(5);
  });
});
