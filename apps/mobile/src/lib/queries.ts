import type {
  AddUserToGroupParams,
  Comment,
  CreateExpenseParams,
  CreateFriendParams,
  CreateGroupInput,
  Expense,
  Friend,
  GetExpensesParams,
  Group,
  SettleInput,
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
  friend: (id: number) => ['friend', id] as const,
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
  const id = params.group_id ?? params.friend_id;
  return useQuery({
    queryKey: keys.expenses(params),
    queryFn: () => client().getExpenses(params),
    enabled: id === undefined || Number.isFinite(id),
  });
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
  void qc.invalidateQueries({ queryKey: ['friend'] });
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

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: number;
      params: Partial<CreateExpenseParams>;
      comment?: string;
      // Splitwise has no comment-edit endpoint — delete the stale itemization
      // comment (best-effort) before posting the fresh one.
      replaceCommentId?: number;
    }) => {
      const c = client();
      const expense = await c.updateExpense(input.id, input.params);
      if (input.replaceCommentId !== undefined) {
        try {
          await c.deleteComment(input.replaceCommentId);
        } catch {
          // already gone / not deletable — keep going so the new comment still lands
        }
      }
      if (input.comment) await c.createComment(input.id, input.comment);
      return expense;
    },
    onSuccess: (_expense, input) => {
      invalidateLedger(qc);
      void qc.invalidateQueries({ queryKey: keys.expense(input.id) });
      void qc.invalidateQueries({ queryKey: keys.comments(input.id) });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => client().deleteExpense(id),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useFriend(id: number): UseQueryResult<Friend> {
  return useQuery({ queryKey: keys.friend(id), queryFn: () => client().getFriend(id), enabled: Number.isFinite(id) });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) => client().createGroup(input),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useAddUserToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: AddUserToGroupParams) => client().addUserToGroup(params),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => client().leaveGroup(groupId),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => client().deleteGroup(groupId),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useCreateFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateFriendParams) => client().createFriend(params),
    onSuccess: () => invalidateLedger(qc),
  });
}

export function useSettleUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SettleInput) => client().settleUp(input),
    onSuccess: () => invalidateLedger(qc),
  });
}
