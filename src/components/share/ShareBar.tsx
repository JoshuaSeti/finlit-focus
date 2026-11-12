import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const SITE = 'https://finlit-empower-hub.lovable.app';

/** Builds the link that shows a rich preview card in WhatsApp and other apps, then opens the page. */
const SHARE = 'https://finlit-share.finlitzambia.workers.dev';

export function shareLink(kind: 'blog' | 'team', key: string) {
  return `${SHARE}/${kind}/${encodeURIComponent(key)}`;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.9 1.9 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zm8.4-18.2C18.1 1.3 15.1 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.6 4.2 1.6 6L0 24l6.3-1.6c1.8 1 3.8 1.5 5.7 1.5 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.5-8.4z" />
    </svg>
  );
}

type Props = { kind: 'blog' | 'team'; id: string; title: string; text?: string; className?: string; tone?: 'light' | 'onColor' };

export function ShareBar({ kind, id, title, text, className = '', tone = 'light' }: Props) {
  const [copied, setCopied] = useState(false);
  const url = shareLink(kind, id);
  const msg = `${title}${text ? ` — ${text}` : ''}`;

  const native = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: msg, url }); } catch { /* closed */ }
    } else copy();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); toast.success('Link copied'); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error('Could not copy the link'); }
  };

  const btn = tone === 'onColor'
    ? 'border-current/30 bg-background/15 hover:bg-background/25 backdrop-blur'
    : 'border-border bg-background hover:bg-muted text-foreground';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider opacity-70 mr-1">Share</span>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${msg}\n${url}`)}`}
        target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp"
        className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
      >
        <WhatsAppIcon className="w-4 h-4" /> WhatsApp
      </a>
      <button onClick={native} aria-label="Share" className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${btn}`}>
        <Share2 className="w-4 h-4" /> Share
      </button>
      <button onClick={copy} aria-label="Copy link" className={`inline-flex items-center justify-center rounded-full border w-9 h-9 transition ${btn}`}>
        {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
