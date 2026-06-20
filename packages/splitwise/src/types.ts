export interface Balance {
  /** ISO 4217 currency code. */
  currency_code: string;
  /** Signed decimal string: positive = owed to the user, negative = the user owes. */
  amount: string;
}

export interface Debt {
  from: number;
  to: number;
  amount: string;
  currency_code: string;
}

export interface SplitwiseUser {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  default_currency?: string | null;
  balance?: Balance[];
  groups?: { group_id: number; balance: Balance[] }[];
  picture?: { small?: string | null; medium?: string | null; large?: string | null } | null;
}

export interface Group {
  id: number;
  name: string;
  members: SplitwiseUser[];
  simplify_by_default?: boolean;
  simplified_debts?: Debt[];
  original_debts?: Debt[];
  updated_at?: string;
}

export type Friend = SplitwiseUser;

export interface ExpenseShare {
  user_id?: number;
  user?: SplitwiseUser;
  /** Decimal string, e.g. "33.80". */
  paid_share: string;
  /** Decimal string, e.g. "15.00". */
  owed_share: string;
  net_balance?: string;
}

export interface Expense {
  id: number;
  group_id: number | null;
  description: string;
  cost: string;
  currency_code: string;
  date?: string;
  payment: boolean;
  deleted_at?: string | null;
  updated_at?: string;
  details?: string | null;
  users: ExpenseShare[];
}

export interface Comment {
  id: number;
  content: string;
  comment_type?: string;
  relation_type?: string;
  relation_id?: number;
  created_at?: string;
  user?: SplitwiseUser;
}

/** Query params for get_expenses. Delta sync uses `updated_after`. */
export interface GetExpensesParams {
  group_id?: number;
  friend_id?: number;
  dated_after?: string;
  dated_before?: string;
  updated_after?: string;
  updated_before?: string;
  limit?: number;
  offset?: number;
}

/** Flattened create_expense body — Splitwise's by-shares wire format (`users__0__user_id`, ...). */
export type CreateExpenseParams = Record<string, string | number | boolean>;
