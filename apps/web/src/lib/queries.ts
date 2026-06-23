import {
  SplitwiseClient,
  type CreateExpenseParams,
  type Friend,
  type Group,
  type SplitwiseUser,
} from '@repo/splitwise';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } },
  });
}

const TOKEN_KEY = 'sw_token';
function getToken(): string {
  return typeof localStorage !== 'undefined' ? (localStorage.getItem(TOKEN_KEY) ?? '') : '';
}

// BYO personal key, kept in localStorage, sent as `Authorization: Bearer <key>`. The
// same-origin /api/splitwise proxy forwards that header to secure.splitwise.com
// server-side (fixes CORS). The key is the user's own — same trust model as the app.
export const client = new SplitwiseClient({ baseUrl: '/api/splitwise', token: getToken });

export function useMe() {
  return useQuery<SplitwiseUser>({ queryKey: ['me'], queryFn: () => client.getCurrentUser() });
}
export function useGroups() {
  return useQuery<Group[]>({ queryKey: ['groups'], queryFn: () => client.getGroups() });
}
export function useFriends() {
  return useQuery<Friend[]>({ queryKey: ['friends'], queryFn: () => client.getFriends() });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: CreateExpenseParams) => client.createExpense(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['groups'] });
      void qc.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export async function login(key: string): Promise<SplitwiseUser> {
  if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, key);
  try {
    return await client.getCurrentUser();
  } catch {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
    throw new Error('That key was rejected by Splitwise.');
  }
}
export function logout(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}
