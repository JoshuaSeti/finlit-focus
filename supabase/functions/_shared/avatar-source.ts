/** Only an owner's image inside the configured private avatar bucket is valid. */
function safeOwnerPath(path: string, owner: string): string | null {
  const parts = path.split('/');
  if (parts.length !== 2 || parts[0] !== owner || !parts[1]) return null;
  if (parts.some((part) => part === '.' || part === '..') || /[\\\x00-\x1f?#]/.test(path)) return null;
  return path;
}

export function avatarObjectPath(value: unknown, origin: string, owner: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (!value.includes('://')) {
    if (value.startsWith('/') || value.includes('%')) {
      try {
        return safeOwnerPath(decodeURIComponent(value), owner);
      } catch {
        return null;
      }
    }
    return safeOwnerPath(value, owner);
  }
  try {
    const url = new URL(value);
    if (url.origin !== new URL(origin).origin || url.username || url.password) return null;
    const prefix = '/storage/v1/object/sign/avatars/';
    if (!url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    return safeOwnerPath(path, owner);
  } catch {
    return null;
  }
}