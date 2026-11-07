import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim() || !form.password) return setError('Enter your email and password');
    login.mutate(form, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome back, ${user.firstName}`);
        navigate(location.state?.from ?? '/app', { replace: true });
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <AuthLayout
      title="Login"
      subtitle="Welcome back. The smoke is waiting."
      footer={<>Don’t have an account? <AuthLink to="/signup">Create one</AuthLink></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <Field label="Password" type="password" autoComplete="current-password" value={form.password} onChange={set('password')} placeholder="Your password" />
        <div className="text-right">
          <AuthLink to="/forgot-password" className="text-sm font-medium text-brand hover:underline">Forgot password?</AuthLink>
        </div>
        {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={login.isPending}>Login</Button>
      </form>
    </AuthLayout>
  );
}
