import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(f) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = 'Required';
  if (!f.lastName.trim()) e.lastName = 'Required';
  if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email';
  if (f.password.length < 8) e.password = 'At least 8 characters';
  if (f.confirm !== f.password) e.confirm = 'Passwords don’t match';
  return e;
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const set = (k) => (e) => {
    const next = { ...form, [k]: e.target.value };
    setForm(next);
    if (touched) setErrors(validate(next));
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const { confirm: _c, ...body } = form;
    signup.mutate(body, {
      onSuccess: ({ user }) => {
        toast.success(`Welcome to HitVerse, ${user.firstName}!`);
        navigate(location.state?.from ?? '/app', { replace: true });
      },
      onError: (err) => setErrors({ form: err.message }),
    });
  };

  return (
    <AuthLayout
      title="Sign Up"
      subtitle="Join the verse. Hear it first, rate it, back your artist."
      footer={<>Already have an account? <AuthLink to="/login">Login</AuthLink></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} error={errors.firstName} />
          <Field label="Last name" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} error={errors.lastName} />
        </div>
        <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <Field label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} error={errors.password} placeholder="At least 8 characters" />
        <Field label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        {errors.form && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{errors.form}</p>}
        <Button type="submit" className="w-full" size="lg" loading={signup.isPending}>Create your account</Button>
      </form>
    </AuthLayout>
  );
}
