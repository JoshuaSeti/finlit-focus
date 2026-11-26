import { useLearnerAvatarUrl } from '@/lib/avatar';

export function LearnerAvatar({ url, profileId, emoji, size = 64 }: { url?: string | null; profileId?: string | null; emoji?: string | null; size?: number }) {
  const src = useLearnerAvatarUrl(profileId, url);
  const s = { width: size, height: size };
  return src
    ? <img src={src} alt="" style={s} className="rounded-full object-cover bg-accent shrink-0" loading="lazy" />
    : <div style={{ ...s, fontSize: size * 0.55 }} className="rounded-full bg-accent grid place-items-center shrink-0">{emoji || '🦁'}</div>;
}
