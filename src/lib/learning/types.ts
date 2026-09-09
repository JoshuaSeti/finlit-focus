export type CourseType = 'core' | 'elective';
export type PublishStatus = 'draft' | 'published';
export type CheckKind = 'diagnostic' | 'field_check' | 'lesson_check' | 'refresher' | 'retention';
export type FieldState = 'locked' | 'open' | 'passed' | 'needs_review';
export type LessonTemplate =
  | 'reading'
  | 'video_reflection'
  | 'drag_drop'
  | 'branching_scenario'
  | 'interactive';

export const LESSON_TEMPLATES: { value: LessonTemplate; label: string; hint: string }[] = [
  { value: 'reading', label: 'Straight reading', hint: 'Text and images only — lightest to load' },
  { value: 'video_reflection', label: 'Video + reflection', hint: 'Short embed plus a reflection prompt' },
  { value: 'drag_drop', label: 'Drag-and-drop exercise', hint: 'Sort items into the right buckets' },
  { value: 'branching_scenario', label: 'Branching scenario', hint: 'Choices that lead to outcomes' },
  { value: 'interactive', label: 'Interactive', hint: 'Custom interactive block' },
];

export interface EngineSettings {
  id: string;
  core_levels: number;
  tier_weights: Record<string, number>;
  check_length: number;
  pass_threshold: number;
  ceiling_tier3_correct: number;
  min_reliability_questions: number;
  rolling_window_unit: string;
  rolling_window_size: number;
  repeat_avoid_checks: number;
  lessons_before_check: number;
  diagnostic_questions_per_field: number;
  refresher_questions_per_field: number;
  refresher_blocking: boolean;
  lesson_checks_enabled: boolean;
  lesson_check_count: number;
  lesson_checks_count_toward_mastery: boolean;
  retention_enabled: boolean;
  retention_interval_days: number;
}

export interface SkillField {
  id: string;
  name: string;
  description: string | null;
}

export interface PrerequisiteCondition {
  course_id: string;
  requirement: 'passed' | 'in_progress_or_passed';
}

export interface PrerequisiteRule {
  mode: 'auto' | 'custom';
  conditions: PrerequisiteCondition[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  course_type: CourseType;
  track: string | null;
  level: number;
  description: string | null;
  cover_image_url: string | null;
  icon: string | null;
  accent_color: string | null;
  status: PublishStatus;
  field_order_mode: string;
  prerequisite_rule: PrerequisiteRule;
  settings_override: Partial<EngineSettings>;
}

export interface Question {
  id: string;
  field_id: string;
  lesson_id: string | null;
  tier: number;
  prompt: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  status: PublishStatus;
}

export interface AnsweredItem {
  tier: number;
  is_correct: boolean;
}
