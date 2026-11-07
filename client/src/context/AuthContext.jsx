import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';
import { gql } from '@/lib/api';
import { USER } from '@/lib/fields';

const AuthCtx = createContext(null);

const ME = `query { me { ${USER} } }`;
const LOGIN = `mutation($email: String!, $password: String!) { login(email: $email, password: $password) { user { ${USER} } } }`;
const SIGNUP = `mutation($firstName: String!, $lastName: String!, $email: String!, $password: String!) {
  signup(firstName: $firstName, lastName: $lastName, email: $email, password: $password) { user { ${USER} } } }`;
const RESET = `mutation($token: String!, $password: String!) { resetPassword(token: $token, password: $password) { user { ${USER} } } }`;

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => gql(ME).then((d) => d.me ?? null),
    staleTime: Infinity,
    retry: false,
  });

  const onAuthed = (user) => qc.setQueryData(['me'], user);
  const login = useMutation({ mutationFn: (vars) => gql(LOGIN, vars).then((d) => ({ user: d.login.user })), onSuccess: (d) => onAuthed(d.user) });
  const signup = useMutation({ mutationFn: (vars) => gql(SIGNUP, vars).then((d) => ({ user: d.signup.user })), onSuccess: (d) => onAuthed(d.user) });
  const resetPassword = useMutation({ mutationFn: (vars) => gql(RESET, vars).then((d) => ({ user: d.resetPassword.user })), onSuccess: (d) => onAuthed(d.user) });
  const logout = useMutation({
    mutationFn: () => gql('mutation { logout }'),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(['me'], null);
    },
  });

  const value = useMemo(
    () => ({ user: me.data ?? null, loading: me.isPending, login, signup, logout, resetPassword }),
    [me.data, me.isPending, login, signup, logout, resetPassword],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
