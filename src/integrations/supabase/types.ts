export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          link_label: string | null
          link_url: string | null
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          link_label?: string | null
          link_url?: string | null
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessment_checks: {
        Row: {
          completed: boolean
          course_id: string
          created_at: string
          field_id: string | null
          id: string
          kind: Database["public"]["Enums"]["check_kind"]
          length: number
          lesson_id: string | null
          passed: boolean | null
          results: Json
          star_rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          course_id: string
          created_at?: string
          field_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["check_kind"]
          length?: number
          lesson_id?: string | null
          passed?: boolean | null
          results?: Json
          star_rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          course_id?: string
          created_at?: string
          field_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["check_kind"]
          length?: number
          lesson_id?: string | null
          passed?: boolean | null
          results?: Json
          star_rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_checks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_checks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_checks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      carousel_slides: {
        Row: {
          background_image_url: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          display_order: number
          id: string
          is_active: boolean
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          message: string
          phone: string | null
          school_name: string
          status: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          message: string
          phone?: string | null
          school_name: string
          status?: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          phone?: string | null
          school_name?: string
          status?: string
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          note: string | null
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          note?: string | null
          snapshot: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          note?: string | null
          snapshot?: Json
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string
          diagnostic_done: boolean
          field_queue: Json
          id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string
          diagnostic_done?: boolean
          field_queue?: Json
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string
          diagnostic_done?: boolean
          field_queue?: Json
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_fields: {
        Row: {
          course_id: string
          created_at: string
          field_id: string
          id: string
          position: number
        }
        Insert: {
          course_id: string
          created_at?: string
          field_id: string
          id?: string
          position?: number
        }
        Update: {
          course_id?: string
          created_at?: string
          field_id?: string
          id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_fields_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          blocks: Json
          comprehension_count: number | null
          comprehension_enabled: boolean | null
          course_id: string
          created_at: string
          field_id: string
          id: string
          position: number
          status: Database["public"]["Enums"]["publish_status"]
          template: Database["public"]["Enums"]["lesson_template"]
          title: string
          updated_at: string
        }
        Insert: {
          blocks?: Json
          comprehension_count?: number | null
          comprehension_enabled?: boolean | null
          course_id: string
          created_at?: string
          field_id: string
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["publish_status"]
          template?: Database["public"]["Enums"]["lesson_template"]
          title: string
          updated_at?: string
        }
        Update: {
          blocks?: Json
          comprehension_count?: number | null
          comprehension_enabled?: boolean | null
          course_id?: string
          created_at?: string
          field_id?: string
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["publish_status"]
          template?: Database["public"]["Enums"]["lesson_template"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          accent_color: string | null
          course_type: Database["public"]["Enums"]["course_type"]
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          field_order_mode: string
          icon: string | null
          id: string
          level: number
          prerequisite_rule: Json
          settings_override: Json
          slug: string
          status: Database["public"]["Enums"]["publish_status"]
          title: string
          track: string | null
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          course_type?: Database["public"]["Enums"]["course_type"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          field_order_mode?: string
          icon?: string | null
          id?: string
          level?: number
          prerequisite_rule?: Json
          settings_override?: Json
          slug: string
          status?: Database["public"]["Enums"]["publish_status"]
          title: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          course_type?: Database["public"]["Enums"]["course_type"]
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          field_order_mode?: string
          icon?: string | null
          id?: string
          level?: number
          prerequisite_rule?: Json
          settings_override?: Json
          slug?: string
          status?: Database["public"]["Enums"]["publish_status"]
          title?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      engine_settings: {
        Row: {
          ceiling_tier3_correct: number
          check_length: number
          core_levels: number
          created_at: string
          diagnostic_questions_per_field: number
          id: string
          lesson_check_count: number
          lesson_checks_count_toward_mastery: boolean
          lesson_checks_enabled: boolean
          lessons_before_check: number
          min_reliability_questions: number
          pass_threshold: number
          refresher_blocking: boolean
          refresher_questions_per_field: number
          repeat_avoid_checks: number
          retention_enabled: boolean
          retention_interval_days: number
          rolling_window_size: number
          rolling_window_unit: string
          singleton: boolean
          tier_weights: Json
          updated_at: string
        }
        Insert: {
          ceiling_tier3_correct?: number
          check_length?: number
          core_levels?: number
          created_at?: string
          diagnostic_questions_per_field?: number
          id?: string
          lesson_check_count?: number
          lesson_checks_count_toward_mastery?: boolean
          lesson_checks_enabled?: boolean
          lessons_before_check?: number
          min_reliability_questions?: number
          pass_threshold?: number
          refresher_blocking?: boolean
          refresher_questions_per_field?: number
          repeat_avoid_checks?: number
          retention_enabled?: boolean
          retention_interval_days?: number
          rolling_window_size?: number
          rolling_window_unit?: string
          singleton?: boolean
          tier_weights?: Json
          updated_at?: string
        }
        Update: {
          ceiling_tier3_correct?: number
          check_length?: number
          core_levels?: number
          created_at?: string
          diagnostic_questions_per_field?: number
          id?: string
          lesson_check_count?: number
          lesson_checks_count_toward_mastery?: boolean
          lesson_checks_enabled?: boolean
          lessons_before_check?: number
          min_reliability_questions?: number
          pass_threshold?: number
          refresher_blocking?: boolean
          refresher_questions_per_field?: number
          repeat_avoid_checks?: number
          retention_enabled?: boolean
          retention_interval_days?: number
          rolling_window_size?: number
          rolling_window_unit?: string
          singleton?: boolean
          tier_weights?: Json
          updated_at?: string
        }
        Relationships: []
      }
      facilitator_resources: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_active: boolean
          resource_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          resource_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          resource_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      field_progress: {
        Row: {
          course_id: string
          created_at: string
          field_id: string
          id: string
          last_retention_at: string | null
          lessons_completed: number
          lessons_since_check: number
          passed_at: string | null
          queue_position: number
          star_rating: number
          state: Database["public"]["Enums"]["field_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          field_id: string
          id?: string
          last_retention_at?: string | null
          lessons_completed?: number
          lessons_since_check?: number
          passed_at?: string | null
          queue_position?: number
          star_rating?: number
          state?: Database["public"]["Enums"]["field_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          field_id?: string
          id?: string
          last_retention_at?: string | null
          lessons_completed?: number
          lessons_since_check?: number
          passed_at?: string | null
          queue_position?: number
          star_rating?: number
          state?: Database["public"]["Enums"]["field_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "field_progress_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string
          course_id: string
          field_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          field_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          field_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          description: string | null
          display_order: number
          file_url: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          file_url?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          file_url?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          school_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          school_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          school_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string | null
          created_at: string
          id: string
          program_id: string
          responses: Json
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          applicant_phone?: string | null
          created_at?: string
          id?: string
          program_id: string
          responses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string | null
          created_at?: string
          id?: string
          program_id?: string
          responses?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_applications_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          application_fields: Json
          close_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hero_image_url: string | null
          id: string
          is_accepting_applications: boolean
          is_active: boolean
          open_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          application_fields?: Json
          close_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_accepting_applications?: boolean
          is_active?: boolean
          open_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          application_fields?: Json
          close_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hero_image_url?: string | null
          id?: string
          is_accepting_applications?: boolean
          is_active?: boolean
          open_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_answers: {
        Row: {
          check_id: string | null
          counts_toward_mastery: boolean
          course_id: string | null
          created_at: string
          field_id: string
          id: string
          is_correct: boolean
          kind: Database["public"]["Enums"]["check_kind"]
          question_id: string
          selected_index: number | null
          tier: number
          user_id: string
        }
        Insert: {
          check_id?: string | null
          counts_toward_mastery?: boolean
          course_id?: string | null
          created_at?: string
          field_id: string
          id?: string
          is_correct: boolean
          kind?: Database["public"]["Enums"]["check_kind"]
          question_id: string
          selected_index?: number | null
          tier: number
          user_id: string
        }
        Update: {
          check_id?: string | null
          counts_toward_mastery?: boolean
          course_id?: string | null
          created_at?: string
          field_id?: string
          id?: string
          is_correct?: boolean
          kind?: Database["public"]["Enums"]["check_kind"]
          question_id?: string
          selected_index?: number | null
          tier?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_answers_check_id_fkey"
            columns: ["check_id"]
            isOneToOne: false
            referencedRelation: "assessment_checks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          field_id: string
          id: string
          lesson_id: string | null
          options: Json
          prompt: string
          status: Database["public"]["Enums"]["publish_status"]
          tier: number
          updated_at: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          field_id: string
          id?: string
          lesson_id?: string | null
          options?: Json
          prompt: string
          status?: Database["public"]["Enums"]["publish_status"]
          tier?: number
          updated_at?: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          field_id?: string
          id?: string
          lesson_id?: string | null
          options?: Json
          prompt?: string
          status?: Database["public"]["Enums"]["publish_status"]
          tier?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "skill_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_fields: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          bio: string | null
          created_at: string
          display_order: number | null
          full_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          role: string
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          full_name: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          role: string
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_order?: number | null
          full_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "admin" | "facilitator"
      check_kind:
        | "diagnostic"
        | "field_check"
        | "lesson_check"
        | "refresher"
        | "retention"
      course_type: "core" | "elective"
      field_state: "locked" | "open" | "passed" | "needs_review"
      lesson_template:
        | "reading"
        | "video_reflection"
        | "drag_drop"
        | "branching_scenario"
        | "interactive"
      publish_status: "draft" | "published"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "facilitator"],
      check_kind: [
        "diagnostic",
        "field_check",
        "lesson_check",
        "refresher",
        "retention",
      ],
      course_type: ["core", "elective"],
      field_state: ["locked", "open", "passed", "needs_review"],
      lesson_template: [
        "reading",
        "video_reflection",
        "drag_drop",
        "branching_scenario",
        "interactive",
      ],
      publish_status: ["draft", "published"],
    },
  },
} as const
