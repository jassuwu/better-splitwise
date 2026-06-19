import type {
  Comment,
  CreateExpenseParams,
  Expense,
  Friend,
  GetExpensesParams,
  Group,
  SplitwiseUser,
} from '@repo/splitwise';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { createSplitwiseClient } from './splitwise';

const client = () => createSplitwiseClient();

export const keys = {
  currentUser: ['currentUser'] as const,
  groups: ['groups'] as const,
  group: (id: number) => ['group', id] as const,
  friends: ['friends'] as const,
  expenses: (params: GetExpensesParams) => ['expenses', params] as const,
  expense: (id: number) => ['expense', id] as const,
  comments: (expenseId: number) => ['comments', expenseId] as const,
};

export function useCurrentUser(): UseQueryResult<SplitwiseUser> {
  return useQuery({ queryKey: keys.currentUser, queryFn: () => client().getCurrentUser() });
}

export function useGroups(): UseQueryResult<Group[]> {
  return useQuery({ queryKey: keys.groups, queryFn: () => client().getGroups() });
}

export function useGroup(id: number): UseQueryResult<Group> {
  return useQuery({ queryKey: keys.group(id), queryFn: () => client().getGroup(id), enabled: Number.isFinite(id) });
}

export function useFriends(): UseQueryResult<Friend[]> {
  return useQuery({ queryKey: keys.friends, queryFn: () => client().getFriends() });
}

export function useExpenses(params: GetExpensesParams): UseQueryResult<Expense[]> {
  return useQuery({ queryKey: keys.expenses(params), queryFn: () => client().getExpenses(params) });
}

export function useExpense(id: number): UseQueryResult<Expense> {
  return useQuery({ queryKey: keys.expense(id), queryFn: () => client().getExpense(id), enabled: Number.isFinite(id) });
}

export function useComments(expenseId: number): UseQueryResult<Comment[]> {
  return useQuery({
    queryKey: keys.comments(expenseId),
    queryFn: () => client().getComments(expenseId),
    enabled: Number.isFinite(expenseId),
  });
}

function invalidateLedger(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['groups'] });
  void qc.invalidateQueries({ queryKey: ['group'] });
  void qc.invalidateQueries({ queryKey: ['friends'] });
  void qc.invalidateQueries({ queryKey: ['expenses'] });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { params: CreateExpenseParams; comment?: string }) => {
      const c = client();
      const expense = await c.createExpense(input.params);
      if (input.comment) await c.createComment(expense.id, input.comment);
      return expense;
    },
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client().deleteExpense(id),
    onSuccess: () => invalidateLedger(qc),
  });
}
