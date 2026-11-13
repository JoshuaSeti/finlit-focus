export function LearnerAvatar({ url, emoji, size = 64 }: { url?: string | null; emoji?: string | null; size?: number }) {
  const s = { width: size, height: size };
  return url
    ? <img src={url} alt="" style={s} className="rounded-full object-cover bg-accent shrink-0" loading="lazy" />
    : <div style={{ ...s, fontSize: size * 0.55 }} className="rounded-full bg-accent grid place-items-center shrink-0">{emoji || '🦁'}</div>;
}
