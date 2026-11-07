import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import { useState } from 'react';
import { AuthLayout, AuthLink } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/input';
import { gql } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const send = useMutation({ mutationFn: () => gql('mutation($email: String!) { forgotPassword(email: $email) }', { email }).then((message) => ({ message: message.forgotPassword })) });

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter the email linked to your account and we’ll send you a reset link."
      footer={<>Remembered it? <AuthLink to="/login">Back to login</AuthLink></>}
    >
      {send.isSuccess ? (
        <div className="space-y-3 text-center">
          <MailCheck className="mx-auto size-12 text-brand" />
          <p>{send.data.message}</p>
          <p className="text-sm text-muted">The link expires in 1 hour.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); send.mutate(); }} className="space-y-4" noValidate>
          <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={send.error?.message} />
          <Button type="submit" className="w-full" size="lg" loading={send.isPending} disabled={!email.trim()}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
}
