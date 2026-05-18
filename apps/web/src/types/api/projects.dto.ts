export interface ProjectDto {
  id: string;
  name: string;
  description?: string | null;
  area?: string | null;
  status?: string | null;
  priority?: string | null;
  impact?: number | null;
  startDate?: string | null;
  endDate?: string | null; // Legacy field
  targetEndDate?: string | null;
  actualEndDate?: string | null;
  completedDate?: string | null;
  subCategory?: string | null;
  notes?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  taskCount?: number | null;
  completedTaskCount?: number | null;
  healthScore?: number | null;
  tags?: string[] | null;
  goalIds?: string[] | null;
  // Legacy snake_case keys for backwards compatibility during migration
  start_date?: string | null;
  target_end_date?: string | null;
  actual_end_date?: string | null;
  sub_category?: string | null;
  user_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  task_count?: number | null;
  completed_task_count?: number | null;
  health_score?: number | null;
}
