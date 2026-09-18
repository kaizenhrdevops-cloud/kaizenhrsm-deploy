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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_replies: {
        Row: {
          contact_id: string
          created_at: string | null
          id: string
          replied_by: string
          reply_message: string
          reply_method: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          id?: string
          replied_by: string
          reply_message: string
          reply_method: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          id?: string
          replied_by?: string
          reply_message?: string
          reply_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_replies_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_replies_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          business_email: string
          company: string
          company_size: string
          contact_number: string
          created_at: string | null
          full_name: string
          id: string
          is_starred: boolean | null
          last_reply_at: string | null
          message: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          business_email: string
          company: string
          company_size: string
          contact_number: string
          created_at?: string | null
          full_name: string
          id?: string
          is_starred?: boolean | null
          last_reply_at?: string | null
          message: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          business_email?: string
          company?: string
          company_size?: string
          contact_number?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_starred?: boolean | null
          last_reply_at?: string | null
          message?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          email_type: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status: string
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      hrms_features: {
        Row: {
          bg_color: string
          created_at: string | null
          description: string
          id: string
          layout: string
          media_alt: string
          media_src: string
          media_type: string
          module_slug: string
          order_index: number
          title: string
          updated_at: string | null
        }
        Insert: {
          bg_color?: string
          created_at?: string | null
          description?: string
          id?: string
          layout?: string
          media_alt?: string
          media_src?: string
          media_type?: string
          module_slug: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Update: {
          bg_color?: string
          created_at?: string | null
          description?: string
          id?: string
          layout?: string
          media_alt?: string
          media_src?: string
          media_type?: string
          module_slug?: string
          order_index?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrms_features_module_slug_fkey"
            columns: ["module_slug"]
            isOneToOne: false
            referencedRelation: "hrms_modules"
            referencedColumns: ["slug"]
          },
        ]
      }
      hrms_modules: {
        Row: {
          created_at: string | null
          hero_bg: string
          icon_name: string
          image_ratio: string
          image_src: string
          name: string
          nav_description: string
          order_index: number
          outro_text: string | null
          slug: string
          status: string
          tagline: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hero_bg?: string
          icon_name?: string
          image_ratio?: string
          image_src?: string
          name: string
          nav_description?: string
          order_index?: number
          outro_text?: string | null
          slug: string
          status?: string
          tagline?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hero_bg?: string
          icon_name?: string
          image_ratio?: string
          image_src?: string
          name?: string
          nav_description?: string
          order_index?: number
          outro_text?: string | null
          slug?: string
          status?: string
          tagline?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          id: string
          post_id: string
          preview_text: string | null
          queued_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_by: string
          sent_count: number | null
          status: string | null
          subject: string
          total_failed: number | null
          total_recipients: number
          total_sent: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          post_id: string
          preview_text?: string | null
          queued_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by: string
          sent_count?: number | null
          status?: string | null
          subject: string
          total_failed?: number | null
          total_recipients?: number
          total_sent?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          id?: string
          post_id?: string
          preview_text?: string | null
          queued_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string
          sent_count?: number | null
          status?: string | null
          subject?: string
          total_failed?: number | null
          total_recipients?: number
          total_sent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_campaigns_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_send_log: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          opened_at: string | null
          sent_at: string | null
          status: string | null
          subscriber_id: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          subscriber_id: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          opened_at?: string | null
          sent_at?: string | null
          status?: string | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_send_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_send_log_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          status: Database["public"]["Enums"]["newsletter_status"]
          unsubscribe_token: string | null
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: Database["public"]["Enums"]["newsletter_status"]
          unsubscribe_token?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["newsletter_status"]
          unsubscribe_token?: string | null
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      post_blocks: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          order_index: number
          post_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          order_index: number
          post_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          order_index?: number
          post_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_blocks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_revisions: {
        Row: {
          blocks: Json
          change_summary: string | null
          created_at: string | null
          created_by: string
          excerpt: string | null
          featured_image: string | null
          featured_image_alt: string | null
          id: string
          metadata: Json | null
          post_id: string
          revision_number: number
          seo_meta_description: string | null
          seo_meta_title: string | null
          seo_og_image: string | null
          title: string
        }
        Insert: {
          blocks: Json
          change_summary?: string | null
          created_at?: string | null
          created_by: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          metadata?: Json | null
          post_id: string
          revision_number: number
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          seo_og_image?: string | null
          title: string
        }
        Update: {
          blocks?: Json
          change_summary?: string | null
          created_at?: string | null
          created_by?: string
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          id?: string
          metadata?: Json | null
          post_id?: string
          revision_number?: number
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          seo_og_image?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          category: string
          created_at: string | null
          draft_blocks: Json | null
          draft_excerpt: string | null
          draft_featured_image: string | null
          draft_featured_image_alt: string | null
          draft_seo_meta_description: string | null
          draft_seo_meta_title: string | null
          draft_seo_og_image: string | null
          draft_slug: string | null
          draft_title: string | null
          excerpt: string | null
          featured_image: string | null
          featured_image_alt: string | null
          has_unpublished_changes: boolean | null
          id: string
          last_autosaved_at: string | null
          metadata: Json | null
          newsletter_sent_at: string | null
          published_at: string | null
          seo_meta_description: string | null
          seo_meta_title: string | null
          seo_og_image: string | null
          short_id: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          author_id?: string | null
          category: string
          created_at?: string | null
          draft_blocks?: Json | null
          draft_excerpt?: string | null
          draft_featured_image?: string | null
          draft_featured_image_alt?: string | null
          draft_seo_meta_description?: string | null
          draft_seo_meta_title?: string | null
          draft_seo_og_image?: string | null
          draft_slug?: string | null
          draft_title?: string | null
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          has_unpublished_changes?: boolean | null
          id?: string
          last_autosaved_at?: string | null
          metadata?: Json | null
          newsletter_sent_at?: string | null
          published_at?: string | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          seo_og_image?: string | null
          short_id?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string
          created_at?: string | null
          draft_blocks?: Json | null
          draft_excerpt?: string | null
          draft_featured_image?: string | null
          draft_featured_image_alt?: string | null
          draft_seo_meta_description?: string | null
          draft_seo_meta_title?: string | null
          draft_seo_og_image?: string | null
          draft_slug?: string | null
          draft_title?: string | null
          excerpt?: string | null
          featured_image?: string | null
          featured_image_alt?: string | null
          has_unpublished_changes?: boolean | null
          id?: string
          last_autosaved_at?: string | null
          metadata?: Json | null
          newsletter_sent_at?: string | null
          published_at?: string | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          seo_og_image?: string | null
          short_id?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_short_id: { Args: never; Returns: string }
      get_all_users_with_profiles: {
        Args: never
        Returns: {
          created_by_id: string
          created_by_name: string
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          role: string
          status: string
        }[]
      }
      get_campaign_stats: {
        Args: { campaign_uuid: string }
        Returns: {
          total_clicked: number
          total_failed: number
          total_opened: number
          total_sent: number
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_remaining_daily_email_quota: { Args: never; Returns: number }
      get_user_last_sign_in: { Args: { user_id: string }; Returns: string }
      get_user_status_by_email: { Args: { _email: string }; Returns: string }
    }
    Enums: {
      newsletter_status: "subscribed" | "unverified" | "unsubscribed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      newsletter_status: ["subscribed", "unverified", "unsubscribed"],
    },
  },
} as const
