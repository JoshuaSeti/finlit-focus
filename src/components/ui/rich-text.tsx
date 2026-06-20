import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface RichTextProps {
  html?: string | null;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const ALLOWED_TAGS = [
  'p', 'br', 'span', 'div', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'hr',
];

/** Sanitized, styled HTML renderer. */
export function RichText({ html, className, as: Tag = 'div' }: RichTextProps) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'style', 'class'],
    ALLOW_DATA_ATTR: false,
  });
  return (
    <Tag
      className={cn('rich-text prose prose-sm max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** Strip all HTML tags — used for plain text previews and line-clamped excerpts. */
export function stripHtml(html?: string | null): string {
  if (!html) return '';
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  const txt = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (txt) {
    txt.innerHTML = sanitized;
    return txt.textContent || txt.innerText || '';
  }
  return sanitized.replace(/<[^>]+>/g, '');
}
