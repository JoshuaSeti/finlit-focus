const SHARE = 'https://finlit-share.finlitzambia.workers.dev';

export const INVITE_TEXT = "I'm learning lots of stuff about money on FinLit! Check out my profile and join me:";
export const profileLink = (id: string) => `${window.location.origin}/u/${id}`;
export const shareableProfileLink = (id: string) =>
  `https://jznoczszgcvusizcpzhc.supabase.co/functions/v1/share?t=u&id=${encodeURIComponent(id)}`;

export const whatsappInvite = (id: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${INVITE_TEXT}\n${shareableProfileLink(id)}`)}`;
