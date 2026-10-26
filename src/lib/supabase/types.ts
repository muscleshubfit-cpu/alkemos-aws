// Supabase database types — mirrors the schema in /supabase/migrations.
// When you change the schema in Supabase, regenerate this file with:
// npx supabase gen types typescript --project-id <your-id> > src/lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          role: "client" | "coach" | "admin";
          // Added by migration 0067 (admin clients unification — coach-type
          // distinction): 'site' = follows up site members (B2C), 'b2b' =
          // external partner with his own clients + wallet. Only meaningful
          // when role='coach'; every existing coach defaults to 'b2b'.
          coach_kind: string | null;
          // Added by migration 0099 (W1-2c — S-05): the single-consumption
          // adoption claim. NULL = never claimed (every historical row);
          // set once (a per-call UUID token) by complete-invite's
          // conditional UPDATE = the adoption is claimed by exactly one
          // caller. TEXT, not timestamptz: token uniqueness is what makes
          // the failure-release safe. Written exclusively by the
          // service-role route; read by nothing else today.
          invite_adopted_at: string | null;
          avatar_url: string | null;
          referral_code: string | null;
          is_test_account: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          role?: "client" | "coach" | "admin";
          coach_kind?: string | null;
          invite_adopted_at?: string | null;
          avatar_url?: string | null;
          referral_code?: string | null;
          is_test_account?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          role?: "client" | "coach" | "admin";
          coach_kind?: string | null;
          invite_adopted_at?: string | null;
          avatar_url?: string | null;
          referral_code?: string | null;
          is_test_account?: boolean;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          client_id: string;
          tier: string;
          months: number;
          start_date: string | null;
          end_date: string | null;
          status: "active" | "expired" | "pending";
          subscription_type: string | null;
          // Added by migration 0057 (affiliate foundation — cancel flow):
          cancel_requested_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          tier: string;
          months: number;
          start_date?: string | null;
          end_date?: string | null;
          status?: "active" | "expired" | "pending";
          subscription_type?: string | null;
          cancel_requested_at?: string | null;
          created_at?: string;
        };
        Update: {
          tier?: string;
          months?: number;
          start_date?: string | null;
          end_date?: string | null;
          status?: "active" | "expired" | "pending";
          subscription_type?: string | null;
          cancel_requested_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "subscriptions_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      nutrition_questionnaires: {
        Row: {
          id: string;
          client_id: string;
          data: Json;
          status: "draft" | "submitted" | "approved" | "needs_info";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          data?: Json;
          status?: "draft" | "submitted" | "approved" | "needs_info";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          data?: Json;
          status?: "draft" | "submitted" | "approved" | "needs_info";
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "nutrition_questionnaires_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      fitness_questionnaires: {
        Row: {
          id: string;
          client_id: string;
          data: Json;
          status: "draft" | "submitted" | "approved" | "needs_info";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          data?: Json;
          status?: "draft" | "submitted" | "approved" | "needs_info";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          data?: Json;
          status?: "draft" | "submitted" | "approved" | "needs_info";
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "fitness_questionnaires_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      progress_entries: {
        Row: {
          id: string;
          client_id: string;
          weight: number | null;
          waist: number | null;
          chest: number | null;
          hips: number | null;
          arm: number | null;
          neck: number | null;
          energy: number | null;
          adherence: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          weight?: number | null;
          waist?: number | null;
          chest?: number | null;
          hips?: number | null;
          arm?: number | null;
          neck?: number | null;
          energy?: number | null;
          adherence?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          weight?: number | null;
          waist?: number | null;
          chest?: number | null;
          hips?: number | null;
          arm?: number | null;
          neck?: number | null;
          energy?: number | null;
          adherence?: number | null;
          notes?: string | null;
        };
        Relationships: [
          { foreignKeyName: "progress_entries_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      plans: {
        Row: {
          id: string;
          client_id: string;
          type: "meal" | "workout";
          title: string;
          notes: string | null;
          file_url: string | null;
          content: Json | null;
          status: string | null;
          is_current: boolean | null;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          type: "meal" | "workout";
          title: string;
          notes?: string | null;
          file_url?: string | null;
          content?: Json | null;
          status?: string | null;
          is_current?: boolean | null;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          type?: "meal" | "workout";
          title?: string;
          notes?: string | null;
          file_url?: string | null;
          content?: Json | null;
          status?: string | null;
          is_current?: boolean | null;
          approved_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "plans_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      support_tickets: {
        Row: {
          id: string;
          client_id: string;
          subject: string;
          status: "open" | "pending" | "closed";
          priority: "low" | "normal" | "high";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          subject: string;
          status?: "open" | "pending" | "closed";
          priority?: "low" | "normal" | "high";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subject?: string;
          status?: "open" | "pending" | "closed";
          priority?: "low" | "normal" | "high";
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "support_tickets_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [
          { foreignKeyName: "ticket_messages_ticket_id_fkey"; columns: ["ticket_id"]; isOneToOne: false; referencedRelation: "support_tickets"; referencedColumns: ["id"] },
          { foreignKeyName: "ticket_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          client_id: string;
          role: "user" | "assistant";
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          role: "user" | "assistant";
          body: string;
          created_at?: string;
        };
        Update: {
          body?: string;
        };
        Relationships: [];
      };
      tool_leads: {
        Row: {
          id: string;
          tool_slug: "calorie-calculator" | "bmi-calculator" | "macro-calculator" | "body-fat-calculator" | "water-tracker" | "meal-planner" | "newsletter" | "signup";
          email: string | null;
          name: string | null;
          whatsapp: string | null;
          result_summary: string | null;
          result_json: Json | null;
          lang: string | null;
          type: string;
          consent: boolean;
          contacted: boolean;
          converted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tool_slug: "calorie-calculator" | "bmi-calculator" | "macro-calculator" | "body-fat-calculator" | "water-tracker" | "meal-planner" | "newsletter" | "signup";
          email?: string | null;
          name?: string | null;
          whatsapp?: string | null;
          result_summary?: string | null;
          result_json?: Json | null;
          lang?: string | null;
          type?: string;
          consent?: boolean;
          contacted?: boolean;
          converted?: boolean;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          name?: string | null;
          whatsapp?: string | null;
          result_summary?: string | null;
          result_json?: Json | null;
          lang?: string | null;
          type?: string;
          consent?: boolean;
          contacted?: boolean;
          converted?: boolean;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          language: "en" | "ar";
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          meta_title: string | null;
          meta_description: string | null;
          focus_keyword: string | null;
          keywords: string[];
          category: string;
          tags: string[];
          featured_image: string | null;
          cover_alt: string | null;
          reading_time: number;
          author: string;
          published_at: string | null;
          updated_at: string;
          is_published: boolean;
          faq_json: Json | null;
          schema_json: Json | null;
          linked_post_id: string | null;
          created_at: string;
          /** 0097 (audit Phase 2 · item 1): 'pending' until the owner
           *  actually reviews; 'reviewed' only via the admin-gated review
           *  action / the owner's own editor publish. Never automatic. */
          review_status: string;
          /** 0097: the REAL review timestamp — null = never reviewed. */
          last_reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          language: "en" | "ar";
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          focus_keyword?: string | null;
          keywords?: string[];
          category?: string;
          tags?: string[];
          featured_image?: string | null;
          cover_alt?: string | null;
          reading_time?: number;
          author?: string;
          published_at?: string | null;
          updated_at?: string;
          is_published?: boolean;
          faq_json?: Json | null;
          schema_json?: Json | null;
          linked_post_id?: string | null;
          created_at?: string;
          review_status?: string;
          last_reviewed_at?: string | null;
        };
        Update: {
          language?: "en" | "ar";
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          focus_keyword?: string | null;
          keywords?: string[];
          category?: string;
          tags?: string[];
          featured_image?: string | null;
          cover_alt?: string | null;
          reading_time?: number;
          author?: string;
          published_at?: string | null;
          updated_at?: string;
          is_published?: boolean;
          faq_json?: Json | null;
          schema_json?: Json | null;
          linked_post_id?: string | null;
          review_status?: string;
          last_reviewed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "blog_posts_linked_post_id_fkey"; columns: ["linked_post_id"]; isOneToOne: false; referencedRelation: "blog_posts"; referencedColumns: ["id"] },
        ];
      };
      blog_generation_queue: {
        Row: {
          id: string;
          topic: string;
          topic_ar: string | null;
          focus_keyword: string;
          focus_keyword_ar: string | null;
          category: string | null;
          rationale: string | null;
          status: string;
          language: string | null;
          article_bundle: Json;
          error_message: string | null;
          en_post_id: string | null;
          ar_post_id: string | null;
          /** Phase 157: bilingual pair twin link (0076) — NULL = legacy independent run. */
          pair_id: string | null;
          created_at: string;
          generated_at: string | null;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          topic: string;
          topic_ar?: string | null;
          focus_keyword: string;
          focus_keyword_ar?: string | null;
          category?: string | null;
          rationale?: string | null;
          status?: string;
          language?: string | null;
          article_bundle?: Json | null;
          error_message?: string | null;
          en_post_id?: string | null;
          ar_post_id?: string | null;
          /** Phase 157: set when this row is one side of a bilingual daily pair. */
          pair_id?: string | null;
          created_at?: string;
          generated_at?: string | null;
          published_at?: string | null;
        };
        Update: {
          topic?: string;
          topic_ar?: string | null;
          focus_keyword?: string;
          focus_keyword_ar?: string | null;
          category?: string | null;
          rationale?: string | null;
          status?: string;
          language?: string | null;
          article_bundle?: Json | null;
          error_message?: string | null;
          en_post_id?: string | null;
          ar_post_id?: string | null;
          pair_id?: string | null;
          created_at?: string;
          generated_at?: string | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
          payload: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
          payload?: Json | null;
        };
        Update: {
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          read?: boolean;
          payload?: Json | null;
        };
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          body: string | null;
          link: string | null;
          target_role: string;
          target_coach_id: string | null;
          read: boolean;
          created_at: string;
          payload: Json | null;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          body?: string | null;
          link?: string | null;
          target_role?: string;
          target_coach_id?: string | null;
          read?: boolean;
          created_at?: string;
          payload?: Json | null;
        };
        Update: {
          type?: string;
          title?: string;
          body?: string | null;
          link?: string | null;
          target_role?: string;
          target_coach_id?: string | null;
          read?: boolean;
          payload?: Json | null;
        };
        Relationships: [
          { foreignKeyName: "admin_notifications_target_coach_id_fkey"; columns: ["target_coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      // mirror RUN_ON_SUPABASE_0037 (PART B) + 0038 price_usd rename —
      // added Phase 93 (was from("coach_ads" as any) in /api/coach/ads)
      coach_ads: {
        Row: {
          id: string;
          coach_id: string;
          package_id: string;
          days: number;
          price_usd: number;
          status: string;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          package_id: string;
          days: number;
          price_usd: number;
          status?: string;
          starts_at?: string;
          ends_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          package_id?: string;
          days?: number;
          price_usd?: number;
          status?: string;
          starts_at?: string;
          ends_at?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_ads_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coach_assignments: {
        Row: {
          id: string;
          client_id: string;
          coach_id: string;
          assigned_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          coach_id: string;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          coach_id?: string;
          assigned_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_assignments_client_id_fkey"; columns: ["client_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_assignments_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coach_emails: {
        Row: {
          email: string;
          created_at: string;
        };
        Insert: {
          email: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      coach_fees: {
        Row: {
          coach_id: string;
          fee_per_client: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          coach_id: string;
          fee_per_client?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          coach_id?: string;
          fee_per_client?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_fees_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coach_payments: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          subscription_id: string | null;
          tier: string;
          months: number;
          amount: number | null;
          currency: string;
          method: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          subscription_id?: string | null;
          tier: string;
          months: number;
          amount?: number | null;
          currency?: string;
          method?: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          client_id?: string;
          subscription_id?: string | null;
          tier?: string;
          months?: number;
          amount?: number | null;
          currency?: string;
          method?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_payments_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_payments_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_payments_subscription_id_fkey"; columns: ["subscription_id"]; isOneToOne: false; referencedRelation: "subscriptions"; referencedColumns: ["id"] },
        ];
      };
      coach_wallets: {
        Row: {
          coach_id: string;
          balance: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          coach_id: string;
          balance?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          coach_id?: string;
          balance?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_wallets_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coach_topup_requests: {
        Row: {
          id: string;
          coach_id: string;
          amount: number;
          currency: string;
          method: string;
          receipt_path: string;
          note: string | null;
          status: string;
          admin_note: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          amount: number;
          currency?: string;
          method: string;
          receipt_path: string;
          note?: string | null;
          status?: string;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          amount?: number;
          currency?: string;
          method?: string;
          receipt_path?: string;
          note?: string | null;
          status?: string;
          admin_note?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_topup_requests_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_topup_requests_reviewed_by_fkey"; columns: ["reviewed_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      coach_wallet_transactions: {
        Row: {
          id: string;
          coach_id: string;
          kind: string;
          amount: number;
          balance_after: number;
          ref_id: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          kind: string;
          amount: number;
          balance_after: number;
          ref_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          kind?: string;
          amount?: number;
          balance_after?: number;
          ref_id?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_wallet_transactions_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      // mirror 0037 COACH_BOOST — added Phase 95 (was
      // from("coach_support_messages" as any) in admin/coach-support)
      coach_support_messages: {
        Row: {
          id: string;
          coach_id: string;
          parent_id: string | null;
          sender_role: "coach" | "admin";
          subject: string;
          body: string;
          status: "open" | "answered" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          parent_id?: string | null;
          sender_role?: "coach" | "admin";
          subject?: string;
          body: string;
          status?: "open" | "answered" | "closed";
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          parent_id?: string | null;
          sender_role?: "coach" | "admin";
          subject?: string;
          body?: string;
          status?: "open" | "answered" | "closed";
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_support_messages_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "coach_support_messages_parent_id_fkey"; columns: ["parent_id"]; isOneToOne: false; referencedRelation: "coach_support_messages"; referencedColumns: ["id"] },
        ];
      };
      // mirror 0031+0032 base + 0037 (photo_url, results_photos, social,
      // whatsapp_phone) + 0046 (review_status) + 0049 (certificates) —
      // columns added Phase 93 (was from("coach_pages" as any) in the
      // landing/coach-pages consumers)
      coach_pages: {
        Row: {
          coach_id: string;
          slug: string;
          headline: string;
          bio: string;
          specialties: string;
          headline_en: string;
          bio_en: string;
          specialties_en: string;
          is_published: boolean;
          review_status: string;
          review_note: string;
          reviewed_at: string | null;
          photo_url: string;
          results_photos: Json;
          instagram_url: string;
          facebook_url: string;
          tiktok_url: string;
          youtube_url: string;
          whatsapp_phone: string;
          certificates: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          coach_id: string;
          slug: string;
          headline?: string;
          bio?: string;
          specialties?: string;
          headline_en?: string;
          bio_en?: string;
          specialties_en?: string;
          is_published?: boolean;
          review_status?: string;
          review_note?: string;
          reviewed_at?: string | null;
          photo_url?: string;
          results_photos?: Json;
          instagram_url?: string;
          facebook_url?: string;
          tiktok_url?: string;
          youtube_url?: string;
          whatsapp_phone?: string;
          certificates?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          coach_id?: string;
          slug?: string;
          headline?: string;
          bio?: string;
          specialties?: string;
          headline_en?: string;
          bio_en?: string;
          specialties_en?: string;
          is_published?: boolean;
          review_status?: string;
          review_note?: string;
          reviewed_at?: string | null;
          photo_url?: string;
          results_photos?: Json;
          instagram_url?: string;
          facebook_url?: string;
          tiktok_url?: string;
          youtube_url?: string;
          whatsapp_phone?: string;
          certificates?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coach_pages_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string | null;
          referred_email: string | null;
          referral_code: string;
          status: "pending" | "completed" | "rejected";
          commission_amount: number;
          subscription_request_id: string | null;
          created_at: string;
          completed_at: string | null;
          last_seen: string | null;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id?: string | null;
          referred_email?: string | null;
          referral_code?: string;
          status?: "pending" | "completed" | "rejected";
          commission_amount?: number;
          subscription_request_id?: string | null;
          created_at?: string;
          completed_at?: string | null;
          last_seen?: string | null;
        };
        Update: {
          referred_id?: string | null;
          referred_email?: string | null;
          status?: "pending" | "completed" | "rejected";
          commission_amount?: number;
          subscription_request_id?: string | null;
          completed_at?: string | null;
          last_seen?: string | null;
        };
        Relationships: [
          { foreignKeyName: "referrals_referrer_id_fkey"; columns: ["referrer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "referrals_referred_id_fkey"; columns: ["referred_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      referral_earnings: {
        Row: {
          id: string;
          user_id: string;
          referral_id: string | null;
          amount: number;
          status: "pending" | "available" | "requested" | "paid";
          created_at: string;
          requested_at: string | null;
          paid_at: string | null;
          payout_method: string | null;
          payout_details: string | null;
          // Added by migration 0015 (Affiliate Engine Foundation):
          affiliate_commission_id: string | null;
          transaction_type:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation"
            | null;
          // Added by migration 0062 (7-day refund safety hold):
          available_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          referral_id?: string | null;
          amount: number;
          status?: "pending" | "available" | "requested" | "paid";
          created_at?: string;
          requested_at?: string | null;
          paid_at?: string | null;
          payout_method?: string | null;
          payout_details?: string | null;
          affiliate_commission_id?: string | null;
          transaction_type?:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation"
            | null;
          available_at?: string;
        };
        Update: {
          referral_id?: string | null;
          amount?: number;
          status?: "pending" | "available" | "requested" | "paid";
          requested_at?: string | null;
          paid_at?: string | null;
          payout_method?: string | null;
          payout_details?: string | null;
          affiliate_commission_id?: string | null;
          transaction_type?:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation"
            | null;
          available_at?: string;
        };
        Relationships: [
          { foreignKeyName: "referral_earnings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "referral_earnings_referral_id_fkey"; columns: ["referral_id"]; isOneToOne: false; referencedRelation: "referrals"; referencedColumns: ["id"] },
          { foreignKeyName: "referral_earnings_affiliate_commission_id_fkey"; columns: ["affiliate_commission_id"]; isOneToOne: false; referencedRelation: "affiliate_commissions"; referencedColumns: ["id"] },
        ];
      };
      affiliate_transactions: {
        Row: {
          id: string;
          user_id: string;
          affiliate_user_id: string | null;
          transaction_type:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation";
          amount: number;
          currency: string;
          external_reference: string | null;
          product_id: string | null;
          affiliate_eligible: boolean;
          status: "completed" | "refunded" | "reversed" | "pending";
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          affiliate_user_id?: string | null;
          transaction_type:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation";
          amount: number;
          currency?: string;
          external_reference?: string | null;
          product_id?: string | null;
          affiliate_eligible?: boolean;
          status?: "completed" | "refunded" | "reversed" | "pending";
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          affiliate_user_id?: string | null;
          transaction_type?:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation";
          amount?: number;
          currency?: string;
          external_reference?: string | null;
          product_id?: string | null;
          affiliate_eligible?: boolean;
          status?: "completed" | "refunded" | "reversed" | "pending";
          metadata?: Json | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "affiliate_transactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "affiliate_transactions_affiliate_user_id_fkey"; columns: ["affiliate_user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      affiliate_commissions: {
        Row: {
          id: string;
          affiliate_user_id: string;
          transaction_id: string;
          referral_id: string | null;
          commission_type:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation";
          amount: number;
          rate: number;
          status: "pending" | "available" | "requested" | "paid" | "reversed";
          reversed_at: string | null;
          reversal_reason: string | null;
          earning_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          affiliate_user_id: string;
          transaction_id: string;
          referral_id?: string | null;
          commission_type:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation";
          amount: number;
          rate?: number;
          status?: "pending" | "available" | "requested" | "paid" | "reversed";
          reversed_at?: string | null;
          reversal_reason?: string | null;
          earning_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          affiliate_user_id?: string;
          transaction_id?: string;
          referral_id?: string | null;
          commission_type?:
            | "subscription_initial"
            | "subscription_renewal"
            | "one_time_product"
            | "one_time_service"
            | "coach_client_activation";
          amount?: number;
          rate?: number;
          status?: "pending" | "available" | "requested" | "paid" | "reversed";
          reversed_at?: string | null;
          reversal_reason?: string | null;
          earning_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "affiliate_commissions_affiliate_user_id_fkey"; columns: ["affiliate_user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "affiliate_commissions_transaction_id_fkey"; columns: ["transaction_id"]; isOneToOne: false; referencedRelation: "affiliate_transactions"; referencedColumns: ["id"] },
          { foreignKeyName: "affiliate_commissions_referral_id_fkey"; columns: ["referral_id"]; isOneToOne: false; referencedRelation: "referrals"; referencedColumns: ["id"] },
          { foreignKeyName: "affiliate_commissions_earning_id_fkey"; columns: ["earning_id"]; isOneToOne: false; referencedRelation: "referral_earnings"; referencedColumns: ["id"] },
        ];
      };
      referral_payouts: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          method: "cash_wallet" | "subscription_discount" | "bank_transfer";
          wallet_number: string | null;
          bank_details: string | null;
          status: "pending" | "approved" | "rejected" | "paid";
          admin_note: string | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          method: "cash_wallet" | "subscription_discount" | "bank_transfer";
          wallet_number?: string | null;
          bank_details?: string | null;
          status?: "pending" | "approved" | "rejected" | "paid";
          admin_note?: string | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          amount?: number;
          method?: "cash_wallet" | "subscription_discount" | "bank_transfer";
          wallet_number?: string | null;
          bank_details?: string | null;
          status?: "pending" | "approved" | "rejected" | "paid";
          admin_note?: string | null;
          processed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "referral_payouts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      refund_requests: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          tier: string;
          months: number | null;
          amount_usd: number | null;
          payment_reference: string | null;
          payment_source: string | null;
          status: "pending" | "approved" | "rejected";
          admin_note: string | null;
          usage_snapshot: Json | null;
          created_at: string;
          processed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          tier: string;
          months?: number | null;
          amount_usd?: number | null;
          payment_reference?: string | null;
          payment_source?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_note?: string | null;
          usage_snapshot?: Json | null;
          created_at?: string;
          processed_at?: string | null;
        };
        Update: {
          subscription_id?: string | null;
          tier?: string;
          months?: number | null;
          amount_usd?: number | null;
          payment_reference?: string | null;
          payment_source?: string | null;
          status?: "pending" | "approved" | "rejected";
          admin_note?: string | null;
          usage_snapshot?: Json | null;
          processed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "refund_requests_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "refund_requests_subscription_id_fkey"; columns: ["subscription_id"]; isOneToOne: false; referencedRelation: "subscriptions"; referencedColumns: ["id"] },
        ];
      };
      saved_results: {
        Row: {
          id: string;
          user_id: string;
          tool_slug: "calorie-calculator" | "bmi-calculator" | "macro-calculator" | "body-fat-calculator" | "water-tracker";
          title: string | null;
          result_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_slug: "calorie-calculator" | "bmi-calculator" | "macro-calculator" | "body-fat-calculator" | "water-tracker";
          title?: string | null;
          result_data: Json;
          created_at?: string;
        };
        Update: {
          tool_slug?: "calorie-calculator" | "bmi-calculator" | "macro-calculator" | "body-fat-calculator" | "water-tracker";
          title?: string | null;
          result_data?: Json;
        };
        Relationships: [];
      };
      ai_jobs: {
        Row: {
          id: string;
          job_type: string;
          status: string;
          payload: Json;
          result: Json | null;
          error_message: string | null;
          requested_by: string | null;
          attempts: number;
          created_at: string;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          job_type: string;
          status?: string;
          payload?: Json;
          result?: Json | null;
          error_message?: string | null;
          requested_by?: string | null;
          attempts?: number;
          created_at?: string;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: {
          job_type?: string;
          status?: string;
          payload?: Json;
          result?: Json | null;
          error_message?: string | null;
          requested_by?: string | null;
          attempts?: number;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "ai_jobs_requested_by_fkey"; columns: ["requested_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ];
      };
      meal_plans: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          plan_data: Json;
          total_calories: number | null;
          total_protein: number | null;
          total_carbs: number | null;
          total_fat: number | null;
          meal_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          plan_data: Json;
          total_calories?: number | null;
          total_protein?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          meal_count?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string | null;
          plan_data?: Json;
          total_calories?: number | null;
          total_protein?: number | null;
          total_carbs?: number | null;
          total_fat?: number | null;
          meal_count?: number | null;
        };
        Relationships: [];
      };
      plan_swaps: {
        // PLAN-TYPE 2026-10-27 (Task QA-TEST-ACCOUNTS-2026-10-26 live QA
        // round): mirrors the MEASURED live production shape (read-only
        // via the PostgREST OpenAPI spec) — the repo migrations/types
        // were missing the NOT NULL plan_type column (the reason every
        // ledger insert ever failed) plus the member-swap durability
        // columns (day_index/item_index/old_item/new_item/reason, all
        // nullable). The DB leads here, exactly like migration 0063's
        // "types generated FROM the live database" posture.
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          plan_type: string;
          swap_type: string;
          day_index: number | null;
          item_index: number | null;
          old_item: Json | null;
          new_item: Json | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          plan_type: string;
          swap_type: string;
          day_index?: number | null;
          item_index?: number | null;
          old_item?: Json | null;
          new_item?: Json | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          plan_id?: string | null;
          plan_type?: string;
          swap_type?: string;
          day_index?: number | null;
          item_index?: number | null;
          old_item?: Json | null;
          new_item?: Json | null;
          reason?: string | null;
        };
        Relationships: [];
      };
      evo_call_stats: {
        // EVO-5 (migration 0081) — per-dispatch call telemetry for
        // /admin/evo-analytics: provider success, cache hit rate, intent
        // distribution, latency. Zero client policies by design (0080
        // posture — service-role only; written best-effort in `after()`).
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          language: string;
          intent: string;
          provider: string;
          cache_hit: boolean;
          success: boolean;
          latency_ms: number | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          language?: string;
          intent?: string;
          provider: string;
          cache_hit?: boolean;
          success?: boolean;
          latency_ms?: number | null;
        };
        Update: {
          created_at?: string;
          user_id?: string | null;
          language?: string;
          intent?: string;
          provider?: string;
          cache_hit?: boolean;
          success?: boolean;
          latency_ms?: number | null;
        };
        Relationships: [];
      };
      evo_chat_cache: {
        // EVO-5 (migration 0081) — frequent-question answer cache, served
        // ONLY to context-free requests (empty history, no subscriber
        // context, no memory, no plan/swap intent, no crisis). «دلالي» =
        // text normalization + pg_trgm similarity — no 4th provider.
        // Zero client policies by design (0080 posture — service-role only).
        Row: {
          id: string;
          question_hash: string;
          question_norm: string;
          language: string;
          answer: string;
          source: string;
          hits: number;
          created_at: string;
          last_hit_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          question_hash: string;
          question_norm: string;
          language?: string;
          answer: string;
          source: string;
          hits?: number;
          created_at?: string;
          last_hit_at?: string | null;
          expires_at: string;
        };
        Update: {
          question_hash?: string;
          question_norm?: string;
          language?: string;
          answer?: string;
          source?: string;
          hits?: number;
          last_hit_at?: string | null;
          expires_at?: string;
        };
        Relationships: [];
      };
      evo_eval_runs: {
        // EVO-5 (migration 0081) — weekly eval harness results (GHA
        // evo-weekly-eval.yml): reference AR/EN questions answered via the
        // REAL system prompt + provider chain, scored by a cheap judge.
        // Zero client policies by design (0080 posture — service-role only).
        Row: {
          id: string;
          created_at: string;
          question_id: string;
          language: string;
          provider: string | null;
          model: string | null;
          score: number;
          safety_pass: boolean;
          language_match: boolean;
          notes: string | null;
          answer_excerpt: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          question_id: string;
          language: string;
          provider?: string | null;
          model?: string | null;
          score: number;
          safety_pass?: boolean;
          language_match?: boolean;
          notes?: string | null;
          answer_excerpt?: string | null;
        };
        Update: {
          created_at?: string;
          question_id?: string;
          language?: string;
          provider?: string | null;
          model?: string | null;
          score?: number;
          safety_pass?: boolean;
          language_match?: boolean;
          notes?: string | null;
          answer_excerpt?: string | null;
        };
        Relationships: [];
      };
      evo_memory: {
        // EVO-2 (migration 0078) — permanent third-person facts extracted
        // every 10th chat message (fast chain, PII denial-list in prompt).
        // FREE for all logged-in users (D1 163.1); admin-only deletion (D2).
        Row: {
          id: string;
          client_id: string;
          fact: string;
          category: string;
          source: string;
          confidence: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          fact: string;
          category?: string;
          source?: string;
          confidence?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          fact?: string;
          category?: string;
          source?: string;
          confidence?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      evo_memory_state: {
        // EVO-2 (migration 0078) — server-side per-user extraction counter.
        // Zero client-facing policies by design; service-role is the only
        // writer (anti-tamper posture of the evo_chat_usage ledger family).
        Row: {
          client_id: string;
          messages_since_extract: number;
          last_extracted_at: string | null;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          messages_since_extract?: number;
          last_extracted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          messages_since_extract?: number;
          last_extracted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      evo_feedback: {
        // EVO-1 (migration 0077) — 👍/👎 quality signal on EVO chat replies.
        // Append-only: no UPDATE/DELETE policies by design (plan_swaps law).
        // client_id null = anonymous rater. snippet = admin-review context.
        Row: {
          id: string;
          client_id: string | null;
          feedback: string;
          reason: string | null;
          message_id: string | null;
          snippet: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          feedback: string;
          reason?: string | null;
          message_id?: string | null;
          snippet?: Json | null;
          created_at?: string;
        };
        Update: {
          client_id?: string | null;
          feedback?: string;
          reason?: string | null;
          message_id?: string | null;
          snippet?: Json | null;
        };
        Relationships: [];
      };
      evo_followup_prefs: {
        // EVO-3 (migration 0079, D4) — weekly check-in email opt-in ledger.
        // Opt-in MANDATORY (default false); opt-out is an UPDATE, never a
        // delete (D2). last_sent_at is stamped by the dispatch route via
        // service-role (bypasses RLS — evo_memory_state posture).
        // INFRASTRUCTURE-ONLY until SMTP is verified live and
        // EVO_FOLLOWUP_ENABLED=true (activation decree, separate step).
        Row: {
          client_id: string;
          opted_in: boolean;
          language: string;
          last_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          opted_in?: boolean;
          language?: string;
          last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          opted_in?: boolean;
          language?: string;
          last_sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evo_followup_prefs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      evo_nutrition_patterns: {
        // EVO-4 (migration 0080, W4 E1+E2+E3) — anonymized PLATFORM-level
        // nutrition knowledge injected into plan generation. Aggregate only;
        // sources are existing plans/meal_plans/external_plans/plan_swaps.
        // ZERO client policies by design (service-role only — the
        // evo_memory_state anti-tamper posture): the generator/runner read
        // and write server-side; nothing client-facing touches this table.
        Row: {
          id: string;
          bucket: string;
          key: string;
          payload: Json;
          sample_size: number;
          computed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          bucket: string;
          key: string;
          payload?: Json;
          sample_size?: number;
          computed_at?: string;
          created_at?: string;
        };
        Update: {
          bucket?: string;
          key?: string;
          payload?: Json;
          sample_size?: number;
          computed_at?: string;
        };
        Relationships: [];
      };
      coach_presence: {
        // Phase 105: mirror corrected to the LIVE production shape proven
        // column-by-column in Phase 99-run (id · coach_id · last_seen ·
        // updated_at). The old user_id/status mirror was fiction and made
        // 0066 v1 abort with 42703 + kept presence helpers silently offline.
        Row: {
          id: string;
          coach_id: string;
          last_seen: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          last_seen?: string;
          updated_at?: string;
        };
        Update: {
          coach_id?: string;
          last_seen?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_photos: {
        // Phase 105: mirror corrected to the LIVE production shape proven
        // column-by-column in Phase 99-run (id · user_id · photo_url ·
        // taken_at · created_at). The old file_path/taken_on/note mirror
        // broke the member photos list silently on production.
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          taken_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          taken_at?: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          photo_url?: string;
          taken_at?: string;
        };
        Relationships: [];
      };
      // Added by migration 0067 (admin clients unification): the B2C
      // follow-up roster — member ↔ site-coach. Deliberately SEPARATE from
      // coach_assignments (the B2B money relation feeding wallet bills and
      // affiliate attribution). One member ↔ one site coach (unique client_id).
      site_coach_assignments: {
        Row: {
          id: string;
          coach_id: string;
          client_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          coach_id: string;
          client_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          coach_id?: string;
          client_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "site_coach_assignments_coach_id_fkey"; columns: ["coach_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "site_coach_assignments_client_id_fkey"; columns: ["client_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "site_coach_assignments_assigned_by_fkey"; columns: ["assigned_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      // SITE-CONTENT-281 — mirrors migration 0094 (site_content_editor).
      // value_* jsonb is NULL when the key falls back to its code-default
      // (the fallback law: a missing row can never blank a page).
      site_content: {
        Row: {
          key: string;
          value_en: Json | null;
          value_ar: Json | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value_en?: Json | null;
          value_ar?: Json | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value_en?: Json | null;
          value_ar?: Json | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          { foreignKeyName: "site_content_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ];
      };
      subscription_requests: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          whatsapp: string | null;
          plan_tier: string;
          duration_months: number;
          price_usd: number | null;
          payment_method: "instapay" | "vodafone_cash" | "paypal" | null;
          receipt_path: string | null;
          status: "pending" | "approved" | "rejected";
          reviewed_at: string | null;
          created_at: string;
          // RUN_ON_SUPABASE_0042 evidence gate (consumption marker) —
          // verified live 2026-09-14 via PostgREST probe (select=consumed_at
          // → 200; control fake column → 42703); was invisible to the
          // migration_audit line-parser until the Phase-191 wrap fix
          consumed_at: string | null;
          // 0098 (W0-3) — the PayPal capture claim: the partial unique
          // index uq_subscription_requests_paypal_order makes the payment
          // record insert the ATOMIC replay lock (23505 = already processed)
          paypal_order_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          whatsapp?: string | null;
          plan_tier: string;
          duration_months?: number;
          price_usd?: number | null;
          payment_method?: "instapay" | "vodafone_cash" | "paypal" | null;
          receipt_path?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          created_at?: string;
          consumed_at?: string | null;
          paypal_order_id?: string | null;
        };
        Update: {
          full_name?: string | null;
          whatsapp?: string | null;
          plan_tier?: string;
          duration_months?: number;
          price_usd?: number | null;
          payment_method?: "instapay" | "vodafone_cash" | "paypal" | null;
          receipt_path?: string | null;
          status?: "pending" | "approved" | "rejected";
          reviewed_at?: string | null;
          consumed_at?: string | null;
          paypal_order_id?: string | null;
        };
        Relationships: [];
      };
      // mirror RUN_ON_SUPABASE_0022 — tamper-proof EVO usage ledger
      // (server-writes only; added Phase 93, was from("evo_chat_usage" as any))
      evo_chat_usage: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "evo_chat_usage_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ];
      };
      // mirror RUN_ON_SUPABASE_0028 — anonymous EVO usage ledger
      // (salted-IP-hash key; server-role writes only)
      ai_plan_usage: {
        Row: {
          id: string;
          user_id: string | null;
          guest_key: string | null;
          ip_key: string | null;
          kind: string;
          surface: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_key?: string | null;
          ip_key?: string | null;
          kind: string;
          surface?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_key?: string | null;
          ip_key?: string | null;
          kind?: string;
          surface?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "ai_plan_usage_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "auth.users"; referencedColumns: ["id"] },
        ];
      },
      evo_anon_usage: {
        Row: {
          id: string;
          anon_key: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          anon_key: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          anon_key?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      external_plans: {
        Row: {
          id: string;
          person_name: string;
          person_contact: string | null;
          plan_type: "workout" | "meal";
          title: string;
          notes: string | null;
          content: Json;
          status: "draft" | "final";
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_name: string;
          person_contact?: string | null;
          plan_type: "workout" | "meal";
          title: string;
          notes?: string | null;
          content?: Json;
          status?: "draft" | "final";
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          person_name?: string;
          person_contact?: string | null;
          plan_type?: "workout" | "meal";
          title?: string;
          notes?: string | null;
          content?: Json;
          status?: "draft" | "final";
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "external_plans_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: {};
    Functions: {
      // EVO-5 (migration 0081) — one round-trip cache lookup: exact hash
      // first, else the most similar unexpired same-language row at/above
      // the pg_trgm similarity floor. Caller: service-role only.
      evo_cache_lookup: {
        Args: {
          p_hash: string;
          p_norm: string;
          p_lang: string;
          p_min_sim?: number;
        };
        Returns: {
          id: string;
          question_hash: string;
          answer: string;
          source: string;
        }[];
      };
      // mirror RUN_ON_SUPABASE_0035 (PART 4) — the ONLY wallet writer;
      // signed amount, raises 'insufficient wallet balance' on over-debit.
      coach_adjust_wallet: {
        Args: {
          p_coach_id: string;
          p_amount: number;
          p_kind: string;
          p_ref_id?: string | null;
          p_note?: string | null;
          p_created_by?: string | null;
        };
        Returns: number;
      };
      auto_promote_coach_if_allowed: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_profile_role: {
        Args: { p_user_id: string };
        Returns: "client" | "coach" | "admin";
      };
      extend_subscription: {
        Args: {
          p_client_id: string;
          p_tier: string;
          p_months: number;
          p_subscription_type?: string;
          p_request_id?: string | null;
        };
        Returns: {
          id: string;
          client_id: string;
          tier: string;
          months: number;
          start_date: string | null;
          end_date: string | null;
          status: "active" | "expired" | "pending";
          subscription_type: string | null;
          created_at: string;
        };
      };
      // 0098 (W0-3) — claim-first atomic PayPal capture: inserts the
      // payment record (the uq_subscription_requests_paypal_order lock)
      // and calls extend_subscription in ONE transaction — a 23505 on
      // the claim returns already_processed=true (idempotent success,
      // never a second extension); an extension failure rolls the
      // claim back. p_tier = CANONICAL model tier (0045 guard);
      // p_plan_tier = original product id kept on the record (0046).
      capture_paypal_subscription: {
        Args: {
          p_user_id: string;
          p_tier: string;
          p_months: number;
          p_amount_usd: number;
          p_order_id: string;
          p_full_name: string;
          p_plan_tier?: string;
        };
        Returns: Json;
      };
      // 0100 (W2-1a/P-03) — the notifications retention prune: deletes
      // rows past the retention window (default 90 days, clamped to
      // [7, 3650]) and returns the deleted count. Service-role only —
      // the weekly runner scripts/notifications-prune.mjs (via
      // .github/workflows/notifications-prune.yml) is the sole caller.
      prune_notifications: {
        Args: {
          p_retention_days?: number;
        };
        Returns: number;
      };
      get_coach_client_list: {
        Args: Record<string, never>;
        Returns: {
          client_id: string;
          client_email: string;
          client_full_name: string;
          client_phone: string;
          client_avatar_url: string;
          client_created_at: string;
          sub_tier: string;
          sub_status: string;
          sub_end_date: string;
          sub_months: number;
          pending_payments: number;
          nutri_q_status: string;
          fit_q_status: string;
          assigned_coach_id: string | null;
          assigned_coach_name: string | null;
        }[];
      };
      // 0047 (Phase 52) — server-side paging/filtering/sorting. bigint
      // (total_count) arrives as a string from PostgREST.
      get_coach_client_list_paged: {
        Args: {
          p_limit: number;
          p_offset: number;
          p_search: string | null;
          p_filter: string;
          p_segment: string;
          p_sort: string;
        };
        Returns: {
          client_id: string;
          client_email: string;
          client_full_name: string;
          client_phone: string;
          client_avatar_url: string;
          client_created_at: string;
          sub_tier: string;
          sub_status: string;
          sub_end_date: string;
          sub_months: number;
          pending_payments: number;
          nutri_q_status: string;
          fit_q_status: string;
          assigned_coach_id: string | null;
          assigned_coach_name: string | null;
          total_count: string;
          // 0092 (m-C): additive columns — absent before the migration.
          member_kind?: string | null;
          site_member_active?: boolean | null;
          invite_pending?: boolean | null;
        }[];
      };
      get_coach_client_stats: {
        Args: Record<string, never>;
        Returns: {
          total: string;
          active: string;
          expiring: string;
          no_plan: string;
          no_questionnaire: string;
          pending_payment: string;
          expired: string;
          premium: string;
          pro: string;
          coaching: string;
          coach_clients: string;
          site_clients: string;
          // 0092 (m-C): additive column — absent before the migration.
          pending_invites?: string;
        }[];
      };
      // Added by migration 0067 — the unified admin clients feed (every
      // role, membership lifecycle, B2B + site-coach relations, type/test
      // filters). Admin-only: non-admin callers get an empty set.
      get_admin_clients_paged: {
        Args: {
          p_limit: number;
          p_offset: number;
          p_search: string | null;
          p_filter: string;
          p_type: string;
          p_test: string;
          p_sort: string;
        };
        Returns: {
          client_id: string;
          client_email: string;
          client_full_name: string;
          client_phone: string;
          client_avatar_url: string;
          client_created_at: string;
          role: string;
          coach_kind: string;
          is_test_account: boolean;
          sub_tier: string;
          sub_status: string;
          sub_end_date: string;
          sub_months: number;
          pending_payments: number;
          assigned_coach_id: string | null;
          assigned_coach_name: string | null;
          assigned_coach_role: string | null;
          site_coach_id: string | null;
          site_coach_name: string | null;
          b2b_clients: number;
          site_members: number;
          total_count: string;
        }[];
      };
      get_admin_clients_stats: {
        Args: Record<string, never>;
        Returns: {
          total: string;
          member_site: string;
          client_of_coach: string;
          coach_site: string;
          coach_b2b: string;
          admin_count: string;
          test_count: string;
          active: string;
          expiring: string;
          expired: string;
          pending_payment: string;
        }[];
      };
    };
    Enums: {
      user_role: "client" | "coach" | "admin";
      questionnaire_status: "draft" | "submitted" | "approved" | "needs_info";
      subscription_status: "active" | "expired" | "pending";
      plan_type: "meal" | "workout";
      ticket_status: "open" | "pending" | "closed";
      ticket_priority: "low" | "normal" | "high";
    };
    CompositeTypes: {};
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type ProgressEntry = Database["public"]["Tables"]["progress_entries"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type SupportTicket = Database["public"]["Tables"]["support_tickets"]["Row"];
export type TicketMessage = Database["public"]["Tables"]["ticket_messages"]["Row"];
export type ToolLead = Database["public"]["Tables"]["tool_leads"]["Row"];
export type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type AdminNotification = Database["public"]["Tables"]["admin_notifications"]["Row"];
export type SavedResult = Database["public"]["Tables"]["saved_results"]["Row"];
export type MealPlan = Database["public"]["Tables"]["meal_plans"]["Row"];
export type SubscriptionRequest = Database["public"]["Tables"]["subscription_requests"]["Row"];
export type Referral = Database["public"]["Tables"]["referrals"]["Row"];
export type ReferralEarning = Database["public"]["Tables"]["referral_earnings"]["Row"];
export type ReferralPayout = Database["public"]["Tables"]["referral_payouts"]["Row"];
export type CoachPage = Database["public"]["Tables"]["coach_pages"]["Row"];
export type NutritionQuestionnaire = Database["public"]["Tables"]["nutrition_questionnaires"]["Row"];
export type FitnessQuestionnaire = Database["public"]["Tables"]["fitness_questionnaires"]["Row"];
export type ProgressPhoto = Database["public"]["Tables"]["progress_photos"]["Row"];
export type CoachAd = Database["public"]["Tables"]["coach_ads"]["Row"];
export type CoachTopupRequest = Database["public"]["Tables"]["coach_topup_requests"]["Row"];
export type CoachWalletTransaction = Database["public"]["Tables"]["coach_wallet_transactions"]["Row"];
export type EvoChatUsage = Database["public"]["Tables"]["evo_chat_usage"]["Row"];
export type EvoAnonUsage = Database["public"]["Tables"]["evo_anon_usage"]["Row"];
export type AiPlanUsage = Database["public"]["Tables"]["ai_plan_usage"]["Row"];
export type SiteCoachAssignment = Database["public"]["Tables"]["site_coach_assignments"]["Row"];
