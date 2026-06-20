import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { cn } from '@/lib/utils';

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'blockquote'],
  ['clean'],
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeight = 180,
}: RichTextEditorProps) {
  return (
    <div className={cn('rich-text-editor bg-background rounded-md', className)}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        modules={{ toolbar: toolbarOptions }}
      />
      <style>{`
        .rich-text-editor .ql-container { min-height: ${minHeight}px; font-family: inherit; font-size: 0.875rem; }
        .rich-text-editor .ql-toolbar { border-top-left-radius: 0.375rem; border-top-right-radius: 0.375rem; border-color: hsl(var(--border)); background: hsl(var(--muted) / 0.3); }
        .rich-text-editor .ql-container { border-bottom-left-radius: 0.375rem; border-bottom-right-radius: 0.375rem; border-color: hsl(var(--border)); }
        .rich-text-editor .ql-editor { min-height: ${minHeight}px; color: hsl(var(--foreground)); }
        .rich-text-editor .ql-editor.ql-blank::before { color: hsl(var(--muted-foreground)); font-style: normal; }
      `}</style>
    </div>
  );
}
