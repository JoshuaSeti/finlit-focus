import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApplicationField } from './ApplicationFieldBuilder';

interface Props {
  fields: ApplicationField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function ApplicationFormRenderer({ fields, values, onChange }: Props) {
  const set = (id: string, v: string) => onChange({ ...values, [id]: v });

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.id} className="space-y-2">
          <Label>
            {f.label}
            {f.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {f.type === 'textarea' ? (
            <Textarea
              value={values[f.id] || ''}
              onChange={(e) => set(f.id, e.target.value)}
              required={f.required}
              placeholder={f.placeholder}
              rows={4}
            />
          ) : f.type === 'select' ? (
            <Select value={values[f.id] || ''} onValueChange={(v) => set(f.id, v)}>
              <SelectTrigger><SelectValue placeholder={f.placeholder || 'Select an option'} /></SelectTrigger>
              <SelectContent>
                {(f.options || []).map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : f.type === 'phone' ? 'tel' : 'text'}
              value={values[f.id] || ''}
              onChange={(e) => set(f.id, e.target.value)}
              required={f.required}
              placeholder={f.placeholder}
            />
          )}
        </div>
      ))}
    </div>
  );
}
