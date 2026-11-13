export const INVITE_TEXT = "I'm learning so much about budgeting, investments and everything concerning money in Zambia right now on FinLit, join me!";
export const profileLink = (id: string) => `${window.location.origin}/u/${id}`;
export const whatsappInvite = (id: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${INVITE_TEXT} ${profileLink(id)}`)}`;
