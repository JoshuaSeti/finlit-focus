import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

interface RichTextProps {
  html?: string | null;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const ALLOWED_TAGS = [
  'p', 'br', 'span', 'div', 'section', 'article', 'header', 'footer', 'aside', 'main', 'nav',
  'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'small', 'sub', 'sup', 'mark', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code', 'kbd', 'samp', 'q', 'cite', 'abbr',
  'a', 'img', 'figure', 'figcaption', 'picture', 'source', 'video', 'audio',
  'hr', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'details', 'summary', 'style',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'srcset', 'sizes', 'alt', 'title', 'style', 'class', 'id',
  'width', 'height', 'align', 'valign', 'colspan', 'rowspan', 'span',
  'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'type',
  'name', 'lang', 'dir', 'role', 'tabindex', 'open',
];

/** Sanitized, styled HTML renderer. Supports inline CSS and <style> blocks for advanced styling. */
export function RichText({ html, className, as: Tag = 'div' }: RichTextProps) {
  if (!html) return null;
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ADD_TAGS: ['style'],
    ADD_ATTR: ['style'],
    ALLOW_DATA_ATTR: true,
    FORCE_BODY: true,
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
