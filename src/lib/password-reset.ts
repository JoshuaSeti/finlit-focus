const loginPages = ['/login?mode=signin', '/admin/login', '/facilitator/login', '/sim/login.html'];

export function resetLoginPath(value: string | null) {
  return value && loginPages.includes(value) ? value : '/login?mode=signin';
}

export function isRecoveryLink(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get('type') === 'recovery' && Boolean(params.get('access_token')) && !params.has('error');
}