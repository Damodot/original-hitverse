import { GraphQLError } from 'graphql';
import { ZodError } from 'zod';

/** An error the person should see. `code` tells the app what kind; `field` points at a form input. */
export const fail = (message, code = 'BAD_USER_INPUT', extra = {}) => new GraphQLError(message, { extensions: { code, ...extra } });
export const unauthenticated = () => fail('You must be signed in', 'UNAUTHENTICATED');
export const forbidden = (message = 'You don’t have access to that') => fail(message, 'FORBIDDEN');
export const notFound = (what = 'That') => fail(`${what} wasn’t found`, 'NOT_FOUND');

/** Turns known errors into friendly ones and hides anything unexpected (logged on the server instead). */
export function maskError(error) {
  const original = error.originalError ?? error;
  if (original instanceof GraphQLError && original.extensions?.code) return original;
  if (original instanceof ZodError) {
    const issue = original.issues[0];
    if (issue?.code === 'invalid_type' && /received undefined/.test(issue.message) && issue.path.length) {
      const field = String(issue.path.at(-1)).replace(/([A-Z])/g, ' $1').toLowerCase();
      return fail(`${field[0].toUpperCase()}${field.slice(1)} is required`, 'BAD_USER_INPUT', { field: issue.path.at(-1) });
    }
    return fail(issue?.message ?? 'Invalid input', 'BAD_USER_INPUT', issue?.path?.length ? { field: issue.path.at(-1) } : {});
  }
  if (original?.code === 11000 && original.keyPattern?.isrc) return fail('Another song on HitVerse already has this ISRC', 'CONFLICT', { field: 'isrc' });
  if (original?.name === 'CastError') return fail('Invalid id');
  if (original?.expose) return fail(original.message, original.status === 503 ? 'UNAVAILABLE' : 'BAD_USER_INPUT');
  // GraphQL's own validation errors (bad query shape) are fine to show.
  if (!error.originalError) return error;
  console.error(original);
  return fail('Something went wrong', 'INTERNAL_SERVER_ERROR');
}
