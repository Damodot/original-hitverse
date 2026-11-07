// A tiny toast store. Same call style as before: toast('Saved'), toast.success(...), toast.error(...).
// <Toaster /> renders them with React Bits' SwipeToast.
let items = [];
let seq = 0;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l(items));

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function show(type, title, opts = {}) {
  const id = opts.id ?? `t${++seq}`;
  const next = { id, type, title, description: opts.description, action: opts.action, duration: opts.duration ?? (type === 'error' ? 6000 : 4000), open: true };
  // Re-using an id replaces that toast instead of stacking a copy.
  items = items.some((t) => t.id === id) ? items.map((t) => (t.id === id ? next : t)) : [...items, next].slice(-4);
  emit();
  return id;
}

export const toast = (title, opts) => show('default', title, opts);
toast.success = (title, opts) => show('success', title, opts);
toast.error = (title, opts) => show('error', title, opts);
/** Starts the slide-out; the toast is removed once its animation ends. */
toast.dismiss = (id) => {
  items = items.map((t) => (t.id === id ? { ...t, open: false } : t));
  emit();
};
export function removeToast(id) {
  items = items.filter((t) => t.id !== id);
  emit();
}
