import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'select';

export interface ApplicationField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface Props {
  fields: ApplicationField[];
  onChange: (fields: ApplicationField[]) => void;
}

export function ApplicationFieldBuilder({ fields, onChange }: Props) {
  const update = (idx: number, patch: Partial<ApplicationField>) => {
    const next = [...fields];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const add = () => {
    onChange([
      ...fields,
      {
        id: crypto.randomUUID(),
        label: 'New question',
        type: 'text',
        required: false,
      },
    ]);
  };

  const remove = (idx: number) => onChange(fields.filter((_, i) => i !== idx));

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">Application form fields</Label>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus size={14} className="mr-1" /> Add field
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4 text-center">
          No custom fields yet. Applicants will still be asked for name, email, and phone.
        </p>
      )}

      {fields.map((f, idx) => (
        <div key={f.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-start gap-2">
            <div className="flex flex-col text-muted-foreground pt-2">
              <button type="button" onClick={() => move(idx, -1)} className="hover:text-foreground text-xs">▲</button>
              <GripVertical size={14} />
              <button type="button" onClick={() => move(idx, 1)} className="hover:text-foreground text-xs">▼</button>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Question</Label>
                <Input value={f.label} onChange={(e) => update(idx, { label: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={f.type} onValueChange={(v) => update(idx, { type: v as FieldType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Short text</SelectItem>
                    <SelectItem value="textarea">Long text</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {f.type === 'select' && (
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    value={(f.options || []).join(', ')}
                    onChange={(e) => update(idx, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Placeholder (optional)</Label>
                <Input value={f.placeholder || ''} onChange={(e) => update(idx, { placeholder: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={f.required} onCheckedChange={(c) => update(idx, { required: c })} />
                <Label className="text-xs">Required</Label>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} className="text-destructive">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
