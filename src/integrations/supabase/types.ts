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
    PostgrestVersion: "14.1"
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
      bankruptcies: {
        Row: {
          created_at: string
          id: number
          note: string | null
          profile_id: string
          resolved_at: string | null
          turning_points: Json
        }
        Insert: {
          created_at?: string
          id?: never
          note?: string | null
          profile_id: string
          resolved_at?: string | null
          turning_points?: Json
        }
        Update: {
          created_at?: string
          id?: never
          note?: string | null
          profile_id?: string
          resolved_at?: string | null
          turning_points?: Json
        }
        Relationships: [
          {
            foreignKeyName: "bankruptcies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
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
      cash_ledger: {
        Row: {
          amount: number
          created_at: string
          id: number
          profile_id: string
          reason: string
          related_id: number | null
          related_table: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          profile_id: string
          reason: string
          related_id?: number | null
          related_table?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          profile_id?: string
          reason?: string
          related_id?: number | null
          related_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_ledger_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      character_trait_rules: {
        Row: {
          flag_key: string
          note: string
          points: number
          trait: string
        }
        Insert: {
          flag_key: string
          note: string
          points: number
          trait: string
        }
        Update: {
          flag_key?: string
          note?: string
          points?: number
          trait?: string
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
      debts: {
        Row: {
          annual_interest_rate: number
          billed_cycles: number
          created_at: string
          due_amount: number
          due_since: string | null
          id: number
          installment: number | null
          last_accrual_at: string
          lender_kind: string
          missed_count: number
          outstanding_balance: number
          principal: number
          product: string | null
          profile_id: string
          rollovers: number
          status: string
          story_tag: string | null
          structure: string
          term_months: number | null
        }
        Insert: {
          annual_interest_rate: number
          billed_cycles?: number
          created_at?: string
          due_amount?: number
          due_since?: string | null
          id?: never
          installment?: number | null
          last_accrual_at?: string
          lender_kind: string
          missed_count?: number
          outstanding_balance: number
          principal: number
          product?: string | null
          profile_id: string
          rollovers?: number
          status?: string
          story_tag?: string | null
          structure?: string
          term_months?: number | null
        }
        Update: {
          annual_interest_rate?: number
          billed_cycles?: number
          created_at?: string
          due_amount?: number
          due_since?: string | null
          id?: never
          installment?: number | null
          last_accrual_at?: string
          lender_kind?: string
          missed_count?: number
          outstanding_balance?: number
          principal?: number
          product?: string | null
          profile_id?: string
          rollovers?: number
          status?: string
          story_tag?: string | null
          structure?: string
          term_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      holdings: {
        Row: {
          avg_buy_price: number
          id: number
          instrument_id: number
          profile_id: string
          quantity: number
        }
        Insert: {
          avg_buy_price?: number
          id?: never
          instrument_id: number
          profile_id: string
          quantity?: number
        }
        Update: {
          avg_buy_price?: number
          id?: never
          instrument_id?: number
          profile_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "holdings_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instrument_price_history: {
        Row: {
          id: number
          instrument_id: number
          price: number
          recorded_at: string
        }
        Insert: {
          id?: never
          instrument_id: number
          price: number
          recorded_at?: string
        }
        Update: {
          id?: never
          instrument_id?: number
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instrument_price_history_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      instruments: {
        Row: {
          current_price: number
          id: number
          is_active: boolean
          kind: string
          name: string
          ticker: string
        }
        Insert: {
          current_price: number
          id?: never
          is_active?: boolean
          kind: string
          name: string
          ticker: string
        }
        Update: {
          current_price?: number
          id?: never
          is_active?: boolean
          kind?: string
          name?: string
          ticker?: string
        }
        Relationships: []
      }
      learner_blunders: {
        Row: {
          amount: number
          blunder_id: number
          created_at: string
          debriefed_at: string | null
          id: number
          missed_on: string
          option_order: number[]
          profile_id: string
          recovered: number
          status: string
        }
        Insert: {
          amount: number
          blunder_id: number
          created_at?: string
          debriefed_at?: string | null
          id?: never
          missed_on: string
          option_order: number[]
          profile_id: string
          recovered?: number
          status?: string
        }
        Update: {
          amount?: number
          blunder_id?: number
          created_at?: string
          debriefed_at?: string | null
          id?: never
          missed_on?: string
          option_order?: number[]
          profile_id?: string
          recovered?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_blunders_blunder_id_fkey"
            columns: ["blunder_id"]
            isOneToOne: false
            referencedRelation: "yungsta_blunders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_blunders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_daily_check: {
        Row: {
          check_date: string
          fired_event_id: number | null
          profile_id: string
          rolled: boolean
        }
        Insert: {
          check_date: string
          fired_event_id?: number | null
          profile_id: string
          rolled?: boolean
        }
        Update: {
          check_date?: string
          fired_event_id?: number | null
          profile_id?: string
          rolled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "learner_daily_check_fired_event_id_fkey"
            columns: ["fired_event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_daily_check_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_event_log: {
        Row: {
          cash_delta: number | null
          choice_index: number | null
          created_at: string
          event_id: number | null
          flag_set: string | null
          id: number
          node_key: string | null
          note: string | null
          profile_id: string
          reputation_delta: number | null
        }
        Insert: {
          cash_delta?: number | null
          choice_index?: number | null
          created_at?: string
          event_id?: number | null
          flag_set?: string | null
          id?: never
          node_key?: string | null
          note?: string | null
          profile_id: string
          reputation_delta?: number | null
        }
        Update: {
          cash_delta?: number | null
          choice_index?: number | null
          created_at?: string
          event_id?: number | null
          flag_set?: string | null
          id?: never
          node_key?: string | null
          note?: string | null
          profile_id?: string
          reputation_delta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_event_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_event_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_feature_unlocks: {
        Row: {
          feature_key: string
          id: number
          profile_id: string
          unlocked_at: string | null
          unlocked_via_event_id: number | null
        }
        Insert: {
          feature_key: string
          id?: never
          profile_id: string
          unlocked_at?: string | null
          unlocked_via_event_id?: number | null
        }
        Update: {
          feature_key?: string
          id?: never
          profile_id?: string
          unlocked_at?: string | null
          unlocked_via_event_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_feature_unlocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_feature_unlocks_unlocked_via_event_id_fkey"
            columns: ["unlocked_via_event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_flags: {
        Row: {
          created_at: string
          flag_key: string
          id: number
          profile_id: string
          set_by_event_id: number | null
        }
        Insert: {
          created_at?: string
          flag_key: string
          id?: never
          profile_id: string
          set_by_event_id?: number | null
        }
        Update: {
          created_at?: string
          flag_key?: string
          id?: never
          profile_id?: string
          set_by_event_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learner_flags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_flags_set_by_event_id_fkey"
            columns: ["set_by_event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_lessons: {
        Row: {
          completed_at: string
          lesson_id: string
          profile_id: string
        }
        Insert: {
          completed_at?: string
          lesson_id: string
          profile_id: string
        }
        Update: {
          completed_at?: string
          lesson_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_lessons_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_mirror: {
        Row: {
          advice: string
          barrier: string | null
          checked_at: string | null
          commit_when: string | null
          created_at: string
          due_at: string | null
          id: number
          lesson_id: string
          nudges: number
          practice_id: number
          profile_id: string
          stance: string
          status: string
        }
        Insert: {
          advice: string
          barrier?: string | null
          checked_at?: string | null
          commit_when?: string | null
          created_at?: string
          due_at?: string | null
          id?: never
          lesson_id: string
          nudges?: number
          practice_id: number
          profile_id: string
          stance: string
          status?: string
        }
        Update: {
          advice?: string
          barrier?: string | null
          checked_at?: string | null
          commit_when?: string | null
          created_at?: string
          due_at?: string | null
          id?: never
          lesson_id?: string
          nudges?: number
          practice_id?: number
          profile_id?: string
          stance?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_mirror_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: true
            referencedRelation: "learner_practice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_mirror_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_pending_events: {
        Row: {
          available_at: string
          context: Json | null
          created_at: string
          event_id: number
          id: number
          node_key: string
          profile_id: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          available_at?: string
          context?: Json | null
          created_at?: string
          event_id: number
          id?: never
          node_key: string
          profile_id: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          available_at?: string
          context?: Json | null
          created_at?: string
          event_id?: number
          id?: never
          node_key?: string
          profile_id?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_pending_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_pending_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_practice: {
        Row: {
          completed_at: string | null
          correct_count: number | null
          id: number
          lesson_id: string
          profile_id: string
          started_at: string
        }
        Insert: {
          completed_at?: string | null
          correct_count?: number | null
          id?: never
          lesson_id: string
          profile_id: string
          started_at?: string
        }
        Update: {
          completed_at?: string | null
          correct_count?: number | null
          id?: never
          lesson_id?: string
          profile_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_practice_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_questions: {
        Row: {
          answered_at: string | null
          attempt: number
          available_at: string
          chosen_index: number | null
          correct: boolean | null
          created_at: string
          id: number
          option_order: number[]
          practice_id: number | null
          profile_id: string
          question_id: number
          status: string
        }
        Insert: {
          answered_at?: string | null
          attempt?: number
          available_at?: string
          chosen_index?: number | null
          correct?: boolean | null
          created_at?: string
          id?: never
          option_order: number[]
          practice_id?: number | null
          profile_id: string
          question_id: number
          status?: string
        }
        Update: {
          answered_at?: string | null
          attempt?: number
          available_at?: string
          chosen_index?: number | null
          correct?: boolean | null
          created_at?: string
          id?: never
          option_order?: number[]
          practice_id?: number | null
          profile_id?: string
          question_id?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_questions_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "learner_practice"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_questions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "yungsta_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_modules: {
        Row: {
          category: string
          created_at: string
          default_path: string | null
          description: string | null
          id: string
          is_published: boolean
          practice_enabled: boolean
          slug: string
          sort_order: number
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          default_path?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          practice_enabled?: boolean
          slug: string
          sort_order?: number
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          default_path?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          practice_enabled?: boolean
          slug?: string
          sort_order?: number
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lender_limit_rules: {
        Row: {
          ceiling: number
          excludes_flag: string | null
          id: number
          lender_kind: string
          min_days_since_signup: number
          note: string | null
          requires_flag: string | null
        }
        Insert: {
          ceiling: number
          excludes_flag?: string | null
          id?: never
          lender_kind: string
          min_days_since_signup?: number
          note?: string | null
          requires_flag?: string | null
        }
        Update: {
          ceiling?: number
          excludes_flag?: string | null
          id?: never
          lender_kind?: string
          min_days_since_signup?: number
          note?: string | null
          requires_flag?: string | null
        }
        Relationships: []
      }
      lender_products: {
        Row: {
          annual_rate: number
          label: string
          late_fee_pct: number
          lesson_id: string
          note: string | null
          product: string
          rollover_fee_pct: number | null
          structure: string
          term_default: number | null
          term_options: number[] | null
        }
        Insert: {
          annual_rate: number
          label: string
          late_fee_pct?: number
          lesson_id?: string
          note?: string | null
          product: string
          rollover_fee_pct?: number | null
          structure: string
          term_default?: number | null
          term_options?: number[] | null
        }
        Update: {
          annual_rate?: number
          label?: string
          late_fee_pct?: number
          lesson_id?: string
          note?: string | null
          product?: string
          rollover_fee_pct?: number | null
          structure?: string
          term_default?: number | null
          term_options?: number[] | null
        }
        Relationships: []
      }
      lesson_access: {
        Row: {
          granted_at: string
          payment_reference: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          payment_reference?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          payment_reference?: string | null
          user_id?: string
        }
        Relationships: []
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
      lesson_flag_map: {
        Row: {
          flag_key: string
          lesson_id: string
          reputation_delta: number
        }
        Insert: {
          flag_key: string
          lesson_id: string
          reputation_delta?: number
        }
        Update: {
          flag_key?: string
          lesson_id?: string
          reputation_delta?: number
        }
        Relationships: []
      }
      lesson_titles: {
        Row: {
          lesson_id: string
          title: string
        }
        Insert: {
          lesson_id: string
          title: string
        }
        Update: {
          lesson_id?: string
          title?: string
        }
        Relationships: []
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
      lipila_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          phone: string
          raw: Json | null
          reference_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          phone: string
          raw?: Json | null
          reference_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          phone?: string
          raw?: Json | null
          reference_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          module_slug: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          module_slug: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          module_slug?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          certificate_claimed_at: string | null
          certificate_name: string | null
          completed_at: string | null
          created_at: string
          id: string
          module_slug: string
          progress: Json
          quiz_correct: number | null
          quiz_total: number | null
          sections_done: number
          sections_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_claimed_at?: string | null
          certificate_name?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          module_slug: string
          progress?: Json
          quiz_correct?: number | null
          quiz_total?: number | null
          sections_done?: number
          sections_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_claimed_at?: string | null
          certificate_name?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          module_slug?: string
          progress?: Json
          quiz_correct?: number | null
          quiz_total?: number | null
          sections_done?: number
          sections_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          cash: number
          debt_outstanding: number
          id: number
          investments_value: number
          net_worth: number
          profile_id: string
          snapshot_date: string
          ventures_value: number
        }
        Insert: {
          cash: number
          debt_outstanding: number
          id?: never
          investments_value: number
          net_worth: number
          profile_id: string
          snapshot_date: string
          ventures_value: number
        }
        Update: {
          cash?: number
          debt_outstanding?: number
          id?: never
          investments_value?: number
          net_worth?: number
          profile_id?: string
          snapshot_date?: string
          ventures_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "net_worth_snapshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      placement_results: {
        Row: {
          correct: number
          created_at: string
          id: string
          scores: Json
          start_group: string
          total: number
          user_id: string
        }
        Insert: {
          correct?: number
          created_at?: string
          id?: string
          scores?: Json
          start_group: string
          total?: number
          user_id: string
        }
        Update: {
          correct?: number
          created_at?: string
          id?: string
          scores?: Json
          start_group?: string
          total?: number
          user_id?: string
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
      quiz_archetypes: {
        Row: {
          bias: number
          blind: string
          blurb: string
          emoji: string
          key: string
          lesson_file: string
          lesson_pitch: string
          lesson_title: string
          likely: string
          power: string
          sort: number
          title: string
          z: Json
        }
        Insert: {
          bias?: number
          blind: string
          blurb: string
          emoji: string
          key: string
          lesson_file: string
          lesson_pitch: string
          lesson_title: string
          likely: string
          power: string
          sort: number
          title: string
          z: Json
        }
        Update: {
          bias?: number
          blind?: string
          blurb?: string
          emoji?: string
          key?: string
          lesson_file?: string
          lesson_pitch?: string
          lesson_title?: string
          likely?: string
          power?: string
          sort?: number
          title?: string
          z?: Json
        }
        Relationships: []
      }
      quiz_dim_stats: {
        Row: {
          dim: string
          mean: number
          std: number
        }
        Insert: {
          dim: string
          mean: number
          std: number
        }
        Update: {
          dim?: string
          mean?: number
          std?: number
        }
        Relationships: []
      }
      quiz_events: {
        Row: {
          code: string | null
          created_at: string
          id: number
          kind: string
          meta: Json | null
          vid: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: never
          kind: string
          meta?: Json | null
          vid?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: never
          kind?: string
          meta?: Json | null
          vid?: string | null
        }
        Relationships: []
      }
      quiz_presets: {
        Row: {
          emoji: string
          id: number
          is_active: boolean
          options: Json
          prompt: string
          question_key: string
          wise_index: number
        }
        Insert: {
          emoji: string
          id: number
          is_active?: boolean
          options: Json
          prompt: string
          question_key: string
          wise_index: number
        }
        Update: {
          emoji?: string
          id?: number
          is_active?: boolean
          options?: Json
          prompt?: string
          question_key?: string
          wise_index?: number
        }
        Relationships: []
      }
      quiz_rate: {
        Row: {
          bucket: string
          ip_hash: string
          kind: string
          n: number
        }
        Insert: {
          bucket: string
          ip_hash: string
          kind: string
          n?: number
        }
        Update: {
          bucket?: string
          ip_hash?: string
          kind?: string
          n?: number
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          answers: number[]
          archetype: string | null
          character: string | null
          compat: number | null
          created_at: string
          guesses: number[] | null
          id: number
          judge: number | null
          matches: number
          name: string
          name_key: string
          quiz_id: number
          traits: Json
        }
        Insert: {
          answers: number[]
          archetype?: string | null
          character?: string | null
          compat?: number | null
          created_at?: string
          guesses?: number[] | null
          id?: never
          judge?: number | null
          matches: number
          name: string
          name_key: string
          quiz_id: number
          traits: Json
        }
        Update: {
          answers?: number[]
          archetype?: string | null
          character?: string | null
          compat?: number | null
          created_at?: string
          guesses?: number[] | null
          id?: never
          judge?: number | null
          matches?: number
          name?: string
          name_key?: string
          quiz_id?: number
          traits?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          accepted: number[] | null
          bluffs: number[] | null
          code: string
          created_at: string
          creator_archetype: string | null
          creator_name: string
          creator_traits: Json | null
          id: number
          is_active: boolean
          picks: number[] | null
          question_ids: number[]
          response_count: number
          theme: string
          token_hash: string
        }
        Insert: {
          accepted?: number[] | null
          bluffs?: number[] | null
          code: string
          created_at?: string
          creator_archetype?: string | null
          creator_name: string
          creator_traits?: Json | null
          id?: never
          is_active?: boolean
          picks?: number[] | null
          question_ids: number[]
          response_count?: number
          theme?: string
          token_hash: string
        }
        Update: {
          accepted?: number[] | null
          bluffs?: number[] | null
          code?: string
          created_at?: string
          creator_archetype?: string | null
          creator_name?: string
          creator_traits?: Json | null
          id?: never
          is_active?: boolean
          picks?: number[] | null
          question_ids?: number[]
          response_count?: number
          theme?: string
          token_hash?: string
        }
        Relationships: []
      }
      reputation_events: {
        Row: {
          created_at: string
          delta: number
          id: number
          profile_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: never
          profile_id: string
          reason: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: never
          profile_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sim_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      sim_goals: {
        Row: {
          amount: number
          backstory: string
          emoji: string
          game_months: number
          title: string
        }
        Insert: {
          amount: number
          backstory: string
          emoji?: string
          game_months?: number
          title: string
        }
        Update: {
          amount?: number
          backstory?: string
          emoji?: string
          game_months?: number
          title?: string
        }
        Relationships: []
      }
      sim_personal_decisions: {
        Row: {
          advice: string | null
          amount_committed: number | null
          chosen_index: number
          created_at: string
          event_title: string | null
          id: string
          options: Json
          pending_id: number | null
          profile_id: string
          reflection: string | null
          scenario: string
          was_wise: boolean
          wise_index: number
        }
        Insert: {
          advice?: string | null
          amount_committed?: number | null
          chosen_index: number
          created_at?: string
          event_title?: string | null
          id?: string
          options: Json
          pending_id?: number | null
          profile_id: string
          reflection?: string | null
          scenario: string
          was_wise: boolean
          wise_index: number
        }
        Update: {
          advice?: string | null
          amount_committed?: number | null
          chosen_index?: number
          created_at?: string
          event_title?: string | null
          id?: string
          options?: Json
          pending_id?: number | null
          profile_id?: string
          reflection?: string | null
          scenario?: string
          was_wise?: boolean
          wise_index?: number
        }
        Relationships: []
      }
      sim_profiles: {
        Row: {
          avatar: string
          backstory: string | null
          bankrupt_count: number
          cash_balance: number
          character_name: string | null
          comeback_at: string | null
          created_at: string
          debt_autopay: boolean
          debt_plan_at: string | null
          debt_strategy: string
          display_name: string
          goal_baseline: number | null
          goal_cycle: number
          goal_started_at: string | null
          id: string
          last_guided_on: string | null
          last_pause_on: string | null
          neglect_through: string | null
          paused_until: string | null
          relationship: string | null
          reputation_score: number
          stress: number | null
          stress_updated_at: string | null
        }
        Insert: {
          avatar?: string
          backstory?: string | null
          bankrupt_count?: number
          cash_balance?: number
          character_name?: string | null
          comeback_at?: string | null
          created_at?: string
          debt_autopay?: boolean
          debt_plan_at?: string | null
          debt_strategy?: string
          display_name: string
          goal_baseline?: number | null
          goal_cycle?: number
          goal_started_at?: string | null
          id: string
          last_guided_on?: string | null
          last_pause_on?: string | null
          neglect_through?: string | null
          paused_until?: string | null
          relationship?: string | null
          reputation_score?: number
          stress?: number | null
          stress_updated_at?: string | null
        }
        Update: {
          avatar?: string
          backstory?: string | null
          bankrupt_count?: number
          cash_balance?: number
          character_name?: string | null
          comeback_at?: string | null
          created_at?: string
          debt_autopay?: boolean
          debt_plan_at?: string | null
          debt_strategy?: string
          display_name?: string
          goal_baseline?: number | null
          goal_cycle?: number
          goal_started_at?: string | null
          id?: string
          last_guided_on?: string | null
          last_pause_on?: string | null
          neglect_through?: string | null
          paused_until?: string | null
          relationship?: string | null
          reputation_score?: number
          stress?: number | null
          stress_updated_at?: string | null
        }
        Relationships: []
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
      story_event_lessons: {
        Row: {
          event_key: string
          lesson_id: string
          ord: number
          point: string
        }
        Insert: {
          event_key: string
          lesson_id: string
          ord?: number
          point: string
        }
        Update: {
          event_key?: string
          lesson_id?: string
          ord?: number
          point?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_event_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lesson_titles"
            referencedColumns: ["lesson_id"]
          },
        ]
      }
      story_events: {
        Row: {
          category: string
          character_key: string | null
          created_at: string
          eligibility_config: Json
          entry_node: string
          event_key: string
          id: number
          intro: string | null
          is_active: boolean
          repeatable: boolean
          title: string | null
          trigger_config: Json
          trigger_type: string
          unlocks_feature: string | null
        }
        Insert: {
          category: string
          character_key?: string | null
          created_at?: string
          eligibility_config?: Json
          entry_node?: string
          event_key: string
          id?: never
          intro?: string | null
          is_active?: boolean
          repeatable?: boolean
          title?: string | null
          trigger_config?: Json
          trigger_type: string
          unlocks_feature?: string | null
        }
        Update: {
          category?: string
          character_key?: string | null
          created_at?: string
          eligibility_config?: Json
          entry_node?: string
          event_key?: string
          id?: never
          intro?: string | null
          is_active?: boolean
          repeatable?: boolean
          title?: string | null
          trigger_config?: Json
          trigger_type?: string
          unlocks_feature?: string | null
        }
        Relationships: []
      }
      story_loan_products: {
        Row: {
          product: string
          story_tag: string
          term_months: number | null
        }
        Insert: {
          product: string
          story_tag: string
          term_months?: number | null
        }
        Update: {
          product?: string
          story_tag?: string
          term_months?: number | null
        }
        Relationships: []
      }
      story_nodes: {
        Row: {
          body: string | null
          choices: Json
          event_id: number
          id: number
          node_key: string
        }
        Insert: {
          body?: string | null
          choices?: Json
          event_id: number
          id?: never
          node_key: string
        }
        Update: {
          body?: string | null
          choices?: Json
          event_id?: number
          id?: never
          node_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_nodes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "story_events"
            referencedColumns: ["id"]
          },
        ]
      }
      stress_flag_effects: {
        Row: {
          cancelled_by: string[] | null
          delay_months: number
          delta: number
          fade_months: number
          flag_key: string
          id: number
          pattern_key: string | null
          why: string
        }
        Insert: {
          cancelled_by?: string[] | null
          delay_months?: number
          delta: number
          fade_months?: number
          flag_key: string
          id?: never
          pattern_key?: string | null
          why: string
        }
        Update: {
          cancelled_by?: string[] | null
          delay_months?: number
          delta?: number
          fade_months?: number
          flag_key?: string
          id?: never
          pattern_key?: string | null
          why?: string
        }
        Relationships: []
      }
      stress_history: {
        Row: {
          day: string
          profile_id: string
          samples: number
          stress: number
          stress_sum: number
        }
        Insert: {
          day: string
          profile_id: string
          samples?: number
          stress: number
          stress_sum: number
        }
        Update: {
          day?: string
          profile_id?: string
          samples?: number
          stress?: number
          stress_sum?: number
        }
        Relationships: [
          {
            foreignKeyName: "stress_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      trades: {
        Row: {
          created_at: string
          id: number
          instrument_id: number
          price_at_trade: number
          profile_id: string
          quantity: number
          side: string
          total_value: number
        }
        Insert: {
          created_at?: string
          id?: never
          instrument_id: number
          price_at_trade: number
          profile_id: string
          quantity: number
          side: string
          total_value: number
        }
        Update: {
          created_at?: string
          id?: never
          instrument_id?: number
          price_at_trade?: number
          profile_id?: string
          quantity?: number
          side?: string
          total_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "trades_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      venture_category_rates: {
        Row: {
          category: string
          cost_ratio: number
          monthly_revenue_rate: number
          volatility: number
        }
        Insert: {
          category: string
          cost_ratio: number
          monthly_revenue_rate: number
          volatility: number
        }
        Update: {
          category?: string
          cost_ratio?: number
          monthly_revenue_rate?: number
          volatility?: number
        }
        Relationships: []
      }
      venture_events: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: number
          kind: string
          venture_id: number
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: never
          kind: string
          venture_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: never
          kind?: string
          venture_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "venture_events_venture_id_fkey"
            columns: ["venture_id"]
            isOneToOne: false
            referencedRelation: "ventures"
            referencedColumns: ["id"]
          },
        ]
      }
      ventures: {
        Row: {
          capital: number | null
          category: string
          closed_at: string | null
          created_at: string
          id: number
          income_mult: number
          income_mult_until: string | null
          insured_until: string | null
          last_income_at: string
          name: string
          profile_id: string
          retained: number
          shock_guard_until: string | null
          starting_capital: number
          status: string
        }
        Insert: {
          capital?: number | null
          category: string
          closed_at?: string | null
          created_at?: string
          id?: never
          income_mult?: number
          income_mult_until?: string | null
          insured_until?: string | null
          last_income_at?: string
          name: string
          profile_id: string
          retained?: number
          shock_guard_until?: string | null
          starting_capital: number
          status?: string
        }
        Update: {
          capital?: number | null
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: never
          income_mult?: number
          income_mult_until?: string | null
          insured_until?: string | null
          last_income_at?: string
          name?: string
          profile_id?: string
          retained?: number
          shock_guard_until?: string | null
          starting_capital?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "sim_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      yungsta_blunders: {
        Row: {
          blunder_key: string
          correct_index: number
          debrief_options: Json
          debrief_question: string
          id: number
          is_active: boolean
          loss_mult: number
          recovery_text: string
          story: string
          title: string
        }
        Insert: {
          blunder_key: string
          correct_index: number
          debrief_options: Json
          debrief_question: string
          id?: never
          is_active?: boolean
          loss_mult?: number
          recovery_text: string
          story: string
          title: string
        }
        Update: {
          blunder_key?: string
          correct_index?: number
          debrief_options?: Json
          debrief_question?: string
          id?: never
          is_active?: boolean
          loss_mult?: number
          recovery_text?: string
          story?: string
          title?: string
        }
        Relationships: []
      }
      yungsta_questions: {
        Row: {
          correct_index: number
          id: number
          is_active: boolean
          lesson_id: string
          options: Json
          question: string
          question_key: string
          topic: string | null
        }
        Insert: {
          correct_index: number
          id?: never
          is_active?: boolean
          lesson_id: string
          options: Json
          question: string
          question_key: string
          topic?: string | null
        }
        Update: {
          correct_index?: number
          id?: never
          is_active?: boolean
          lesson_id?: string
          options?: Json
          question?: string
          question_key?: string
          topic?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_cash_balance: {
        Args: {
          p_delta: number
          p_profile_id: string
          p_reason: string
          p_related_id?: number
          p_related_table?: string
        }
        Returns: number
      }
      adjust_reputation_score: {
        Args: { p_delta: number; p_profile_id: string; p_reason: string }
        Returns: number
      }
      debt_apply_payment: {
        Args: { p: string; p_amount: number; p_debt_id: number }
        Returns: Json
      }
      debt_borrow: {
        Args: { p_amount: number; p_product: string; p_term_months?: number }
        Returns: Json
      }
      debt_execute_plan: {
        Args: { p_budget: number; p_strategy: string }
        Returns: Json
      }
      debt_installment: {
        Args: { n: number; p: number; rate: number }
        Returns: number
      }
      debt_overview: { Args: never; Returns: Json }
      debt_pay_due: { Args: never; Returns: Json }
      debt_plan: { Args: { p_budget: number }; Returns: Json }
      debt_plan_inputs: { Args: { p: string }; Returns: Json }
      debt_quote: {
        Args: { p_amount: number; p_product: string; p_term_months?: number }
        Returns: Json
      }
      debt_rollover: { Args: { p_debt_id: number }; Returns: Json }
      debt_run_strategy: {
        Args: { p_budget: number; p_debts: Json; p_strategy: string }
        Returns: Json
      }
      debt_schedule: { Args: { p_debt_id: number }; Returns: Json }
      debt_set_prefs: {
        Args: { p_autopay: boolean; p_strategy: string }
        Returns: Json
      }
      debt_tick: { Args: { p: string }; Returns: undefined }
      mirror_advice: { Args: { p: string; p_lesson: string }; Returns: string }
      mirror_check: { Args: { p_done: boolean; p_id: number }; Returns: Json }
      mirror_due: { Args: never; Returns: Json }
      practice_mirror_get: { Args: { p_lesson: string }; Returns: Json }
      practice_mirror_save: {
        Args: {
          p_barrier?: string
          p_lesson: string
          p_stance: string
          p_when?: string
        }
        Returns: Json
      }
      practice_progress: {
        Args: { p: string; p_lesson: string; p_session: number }
        Returns: Json
      }
      practice_start: { Args: { p_lesson: string }; Returns: Json }
      practice_status: { Args: { p_lesson: string }; Returns: Json }
      practice_title: { Args: { p_lesson: string }; Returns: string }
      set_character: {
        Args: {
          p_avatar: string
          p_backstory: string
          p_name: string
          p_relationship: string
        }
        Returns: Json
      }
      sim_buy_cover: { Args: { p_venture_id: number }; Returns: Json }
      sim_cfg: { Args: { d: number; k: string }; Returns: number }
      sim_character_summary: { Args: never; Returns: Json }
      sim_collect_income: { Args: never; Returns: Json }
      sim_create_venture: {
        Args: { p_capital: number; p_category: string; p_name: string }
        Returns: Json
      }
      sim_log_venture_event: {
        Args: {
          p_amount: number
          p_desc: string
          p_kind: string
          p_venture_id: number
        }
        Returns: Json
      }
      sim_repay: {
        Args: { p_amount: number; p_debt_id: number }
        Returns: Json
      }
      sim_repay_core: {
        Args: { p_amount: number; p_debt_id: number }
        Returns: Json
      }
      sim_teachback: { Args: { p_pending_id: number }; Returns: Json }
      sim_today: { Args: never; Returns: string }
      sim_trade: {
        Args: { p_instrument_id: number; p_qty: number; p_side: string }
        Returns: Json
      }
      sim_venture_payout: {
        Args: {
          p_reinvest: number
          p_topup: number
          p_venture_id: number
          p_withdraw: number
        }
        Returns: Json
      }
      story_bootstrap: { Args: never; Returns: undefined }
      story_borrow: {
        Args: { p_amount: number; p_kind: string }
        Returns: Json
      }
      story_borrow_limits: { Args: never; Returns: Json }
      story_choose: {
        Args: { p_choice_index: number; p_pending_id: number }
        Returns: Json
      }
      story_choose_core: {
        Args: { p_choice_index: number; p_pending_id: number }
        Returns: Json
      }
      story_daily_roll: { Args: { p: string }; Returns: undefined }
      story_days_since_signup: { Args: { p: string }; Returns: number }
      story_eligible: {
        Args: {
          e: Database["public"]["Tables"]["story_events"]["Row"]
          p: string
        }
        Returns: boolean
      }
      story_feature_open: { Args: { f: string; p: string }; Returns: boolean }
      story_feature_state: { Args: never; Returns: Json }
      story_fill: {
        Args: { ctx?: Json; p: string; t: string }
        Returns: string
      }
      story_fire_lesson: { Args: { p_lesson: string }; Returns: Json }
      story_flag_any: { Args: { j: Json; p: string }; Returns: boolean }
      story_game_months_to_days: { Args: { m: number }; Returns: number }
      story_has_flag: { Args: { f: string; p: string }; Returns: boolean }
      story_lender_ceiling: {
        Args: { p: string; p_kind: string }
        Returns: number
      }
      story_lessons_for: { Args: { k: string }; Returns: Json }
      story_pending: { Args: never; Returns: Json }
      story_run_unlocks: { Args: { p: string }; Returns: string[] }
      story_schedule_followups: {
        Args: { ctx?: Json; new_flags: string[]; p: string }
        Returns: undefined
      }
      story_set_flag: {
        Args: { ev: number; f: string; p: string }
        Returns: undefined
      }
      story_trigger_met: {
        Args: {
          e: Database["public"]["Tables"]["story_events"]["Row"]
          p: string
        }
        Returns: boolean
      }
      story_venture_insured: {
        Args: { ctx: Json; p: string }
        Returns: boolean
      }
      story_visible_choices: {
        Args: { choices: Json; ctx?: Json; p: string }
        Returns: Json
      }
      stress_band: { Args: { s: number }; Returns: string }
      stress_board: { Args: never; Returns: Json }
      stress_calm_enough: { Args: { p: string }; Returns: boolean }
      stress_compute: { Args: { p: string }; Returns: Json }
      stress_other_assets: { Args: { p: string }; Returns: number }
      stress_restart: { Args: { p_note?: string }; Returns: Json }
      stress_status: { Args: never; Returns: Json }
      stress_tick: { Args: { p: string }; Returns: Json }
      yungsta_answer: {
        Args: { p_choice: number; p_id: number }
        Returns: Json
      }
      yungsta_blunders_new: { Args: { p: string }; Returns: Json }
      yungsta_blunders_skip: { Args: never; Returns: Json }
      yungsta_current: { Args: { p: string }; Returns: Json }
      yungsta_debrief: {
        Args: { p_choice: number; p_id: number }
        Returns: Json
      }
      yungsta_mark_guided: { Args: { p: string }; Returns: undefined }
      yungsta_neglect_check: { Args: { p: string }; Returns: number }
      yungsta_pause: { Args: { p_days?: number }; Returns: Json }
      yungsta_schedule: { Args: { p: string }; Returns: undefined }
      yungsta_status: { Args: { p: string }; Returns: Json }
      yungsta_warning: { Args: never; Returns: Json }
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
