// Apply the saved theme before first paint so there is no flash. Kept as a file (not inline) for the CSP.
try {
  if (localStorage.getItem('hv-theme') === 'light') document.documentElement.classList.remove('dark');
} catch (e) { /* storage blocked */ }
