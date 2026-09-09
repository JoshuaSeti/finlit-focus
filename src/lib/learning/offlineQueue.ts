import { supabase } from '@/integrations/supabase/client';

type Pending = { table: 'question_answers' | 'lesson_completions'; row: Record<string, unknown> };

const KEY = 'finlit_learn_pending_v1';

function read(): Pending[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Pending[];
  } catch {
    return [];
  }
}

function write(items: Pending[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

/** Save immediately, but never lose the answer if the connection drops. */
export async function saveRow(table: Pending['table'], row: Record<string, unknown>) {
  const { error } = await supabase.from(table).insert(row as never);
  if (error) write([...read(), { table, row }]);
}

export async function flushQueue() {
  const items = read();
  if (!items.length) return;
  const remaining: Pending[] = [];
  for (const item of items) {
    const { error } = await supabase.from(item.table).insert(item.row as never);
    if (error) remaining.push(item);
  }
  write(remaining);
}

export function pendingCount() {
  return read().length;
}
