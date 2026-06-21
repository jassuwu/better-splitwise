import {
  SplitwiseClient,
  type CreateExpenseParams,
  type Friend,
  type Group,
  type SplitwiseUser,
} from '@repo/splitwise';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false } },
});

// Talks to the same-origin proxy; the http-only sw_token cookie carries the
// Splitwise key server-side, so no key ever lands in browser JS and there's no CORS.
export const client = new SplitwiseClient({ baseUrl: '/api/splitwise', token: () => '' });

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
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  if (!res.ok) throw new Error(res.status === 401 ? 'That key was rejected by Splitwise.' : 'Sign-in failed.');
  return (await res.json()) as SplitwiseUser;
}
export async function logout(): Promise<void> {
  await fetch('/api/login', { method: 'DELETE' });
}
