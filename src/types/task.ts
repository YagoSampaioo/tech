export interface Task {
  id: number;
  created_at: string;
  task: string | null;
  priority: string | null;
  status: string | null;
  trigger: string | null;
  notes: string | null;
  delivery_time: string | null;
  description: string | null;
}