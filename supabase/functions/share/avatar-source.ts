/** Only an owner's image inside the configured private avatar bucket is valid. */
export function avatarObjectPath(value: unknown, origin: string, owner: string): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(origin).origin || url.username || url.password) return null;
    const prefix = '/storage/v1/object/sign/avatars/';
    if (!url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    const parts = path.split('/');
    if (parts.length !== 2 || parts[0] !== owner || !parts[1]) return null;
    if (parts.some((part) => part === '.' || part === '..') || /[\\\x00-\x1f]/.test(path)) return null;
    return path;
  } catch {
    return null;
  }
}