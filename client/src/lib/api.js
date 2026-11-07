export class ApiError extends Error {
  constructor(message, status, field) {
    super(message);
    this.status = status;
    this.field = field; // which input the server rejected, when it says
  }
}

const STATUS = { UNAUTHENTICATED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, BAD_USER_INPUT: 400, UNAVAILABLE: 503 };

/**
 * Runs a GraphQL query or mutation against /graphql and returns `data`.
 * Errors throw an ApiError with the server's friendly message (plus `code` and `field` when given).
 */
export async function gql(query, variables, { keepalive = false } = {}) {
  let res;
  try {
    res = await fetch('/graphql', {
      method: 'POST',
      credentials: 'include',
      keepalive,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new ApiError('Can’t reach HitVerse. Check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => ({}));
  const first = body.errors?.[0];
  if (first) {
    const code = first.extensions?.code;
    const error = new ApiError(first.message || 'Something went wrong. Try again.', STATUS[code] ?? res.status ?? 500, first.extensions?.field);
    error.code = code;
    throw error;
  }
  if (!res.ok) throw new ApiError('Something went wrong. Try again.', res.status);
  return body.data;
}

/** Sends a FormData upload and reports progress (0 to 1). fetch can't report upload progress, so this uses XHR. */
export function upload(path, formData, { onProgress, signal, method = 'POST' } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `/api${path}`);
    xhr.withCredentials = true;
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      const data = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new ApiError(data.error || 'Upload failed. Try again.', xhr.status));
    };
    xhr.onerror = () => reject(new ApiError('Upload failed. Check your connection and try again.', 0));
    xhr.onabort = () => reject(new ApiError('Upload cancelled', 0));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(formData);
  });
}
