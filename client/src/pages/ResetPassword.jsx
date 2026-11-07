import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from '@/lib/toast';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords don’t match');
    resetPassword.mutate({ token, password }, {
      onSuccess: () => {
        toast.success('Password updated. You’re signed in.');
        navigate('/app', { replace: true });
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <AuthLayout title="New password" footer={<AuthLink to="/forgot-password">Need a new link?</AuthLink>}>
      {!token ? (
        <p className="text-center text-muted">This reset link is missing its token. Request a new one.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={resetPassword.isPending}>Save password</Button>
        </form>
      )}
    </AuthLayout>
  );
}
