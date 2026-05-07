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
      ai_topic_queue: {
        Row: {
          blog_id: string | null
          category_id: string | null
          created_at: string
          error: string | null
          id: string
          keywords: string[] | null
          processed_at: string | null
          source_name: string | null
          source_url: string | null
          status: string
          topic: string
        }
        Insert: {
          blog_id?: string | null
          category_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          keywords?: string[] | null
          processed_at?: string | null
          source_name?: string | null
          source_url?: string | null
          status?: string
          topic: string
        }
        Update: {
          blog_id?: string | null
          category_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          keywords?: string[] | null
          processed_at?: string | null
          source_name?: string | null
          source_url?: string | null
          status?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_topic_queue_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_topic_queue_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          blog_id: string
          tag_id: string
        }
        Insert: {
          blog_id: string
          tag_id: string
        }
        Update: {
          blog_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_tags_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          ai_quality_score: number | null
          author_id: string | null
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          faq: Json | null
          id: string
          is_breaking: boolean
          is_featured: boolean
          last_updated_at: string | null
          like_count: number
          plagiarism_score: number | null
          published_at: string | null
          reading_time_minutes: number | null
          reviewed_by: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          source: Database["public"]["Enums"]["blog_source"]
          sources: Json | null
          status: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          ai_quality_score?: number | null
          author_id?: string | null
          category_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          faq?: Json | null
          id?: string
          is_breaking?: boolean
          is_featured?: boolean
          last_updated_at?: string | null
          like_count?: number
          plagiarism_score?: number | null
          published_at?: string | null
          reading_time_minutes?: number | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          source?: Database["public"]["Enums"]["blog_source"]
          sources?: Json | null
          status?: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          ai_quality_score?: number | null
          author_id?: string | null
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          faq?: Json | null
          id?: string
          is_breaking?: boolean
          is_featured?: boolean
          last_updated_at?: string | null
          like_count?: number
          plagiarism_score?: number | null
          published_at?: string | null
          reading_time_minutes?: number | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          source?: Database["public"]["Enums"]["blog_source"]
          sources?: Json | null
          status?: Database["public"]["Enums"]["blog_status"]
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blogs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blogs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          blog_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          blog_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          blog_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          workflow_mode: Database["public"]["Enums"]["workflow_mode"]
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          workflow_mode?: Database["public"]["Enums"]["workflow_mode"]
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          workflow_mode?: Database["public"]["Enums"]["workflow_mode"]
        }
        Relationships: []
      }
      comments: {
        Row: {
          blog_id: string
          body: string
          created_at: string
          id: string
          is_hidden: boolean
          parent_id: string | null
          upvotes: number
          user_id: string
        }
        Insert: {
          blog_id: string
          body: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          upvotes?: number
          user_id: string
        }
        Update: {
          blog_id?: string
          body?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_events: {
        Row: {
          actual: string | null
          country: string | null
          created_at: string
          currency: string | null
          event_time: string
          forecast: string | null
          id: string
          impact: string | null
          previous: string | null
          title: string
        }
        Insert: {
          actual?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          event_time: string
          forecast?: string | null
          id?: string
          impact?: string | null
          previous?: string | null
          title: string
        }
        Update: {
          actual?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          event_time?: string
          forecast?: string | null
          id?: string
          impact?: string | null
          previous?: string | null
          title?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          blog_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          blog_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          blog_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_submissions: {
        Row: {
          amount_usd: number
          created_at: string
          firm_id: string | null
          id: string
          is_rejected: boolean
          notes: string | null
          proof_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["payout_status"]
          upvotes: number
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          firm_id?: string | null
          id?: string
          is_rejected?: boolean
          notes?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          upvotes?: number
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          firm_id?: string | null
          id?: string
          is_rejected?: boolean
          notes?: string | null
          proof_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_submissions_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          expertise: string | null
          id: string
          linkedin_url: string | null
          twitter_url: string | null
          updated_at: string
          username: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          expertise?: string | null
          id: string
          linkedin_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          expertise?: string | null
          id?: string
          linkedin_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          username?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_text: string | null
          expires_at: string | null
          firm_id: string | null
          id: string
          is_active: boolean
          usage_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_text?: string | null
          expires_at?: string | null
          firm_id?: string | null
          id?: string
          is_active?: boolean
          usage_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_text?: string | null
          expires_at?: string | null
          firm_id?: string | null
          id?: string
          is_active?: boolean
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      prop_firms: {
        Row: {
          cons: string[] | null
          created_at: string
          description: string | null
          founded_year: number | null
          headquarters: string | null
          id: string
          is_featured: boolean
          logo_url: string | null
          max_funding: string | null
          min_account_size: string | null
          name: string
          payout_frequency: string | null
          popularity_score: number | null
          pricing_summary: string | null
          profit_split: string | null
          pros: string[] | null
          rules: Json | null
          scaling_plan: string | null
          slug: string
          total_payouts_usd: number | null
          trust_score: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          cons?: string[] | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          max_funding?: string | null
          min_account_size?: string | null
          name: string
          payout_frequency?: string | null
          popularity_score?: number | null
          pricing_summary?: string | null
          profit_split?: string | null
          pros?: string[] | null
          rules?: Json | null
          scaling_plan?: string | null
          slug: string
          total_payouts_usd?: number | null
          trust_score?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          cons?: string[] | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          headquarters?: string | null
          id?: string
          is_featured?: boolean
          logo_url?: string | null
          max_funding?: string | null
          min_account_size?: string | null
          name?: string
          payout_frequency?: string | null
          popularity_score?: number | null
          pricing_summary?: string | null
          profit_split?: string | null
          pros?: string[] | null
          rules?: Json | null
          scaling_plan?: string | null
          slug?: string
          total_payouts_usd?: number | null
          trust_score?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      propfirm_reviews: {
        Row: {
          body: string
          created_at: string
          firm_id: string
          id: string
          is_verified: boolean
          rating: number
          title: string | null
          upvotes: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          firm_id: string
          id?: string
          is_verified?: boolean
          rating: number
          title?: string | null
          upvotes?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          firm_id?: string
          id?: string
          is_verified?: boolean
          rating?: number
          title?: string | null
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "propfirm_reviews_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      related_blogs: {
        Row: {
          blog_id: string
          related_id: string
          similarity: number | null
        }
        Insert: {
          blog_id: string
          related_id: string
          similarity?: number | null
        }
        Update: {
          blog_id?: string
          related_id?: string
          similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "related_blogs_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_blogs_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      rss_sources: {
        Row: {
          category_slug: string | null
          created_at: string
          feed_url: string
          id: string
          is_active: boolean
          last_fetched_at: string | null
          name: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string
          feed_url: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string
          feed_url?: string
          id?: string
          is_active?: boolean
          last_fetched_at?: string | null
          name?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          confirm_token: string | null
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          status: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at: string | null
        }
        Insert: {
          confirm_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at?: string | null
        }
        Update: {
          confirm_token?: string | null
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["subscriber_status"]
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          usage_count?: number
        }
        Relationships: []
      }
      topic_history: {
        Row: {
          blog_id: string | null
          created_at: string
          id: string
          keywords: string[] | null
          normalized_topic: string
        }
        Insert: {
          blog_id?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          normalized_topic: string
        }
        Update: {
          blog_id?: string | null
          created_at?: string
          id?: string
          keywords?: string[] | null
          normalized_topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_history_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "author" | "user"
      blog_source: "manual" | "ai_auto" | "ai_assisted"
      blog_status:
        | "draft"
        | "scheduled"
        | "pending_approval"
        | "published"
        | "rejected"
      payout_status: "pending" | "approved" | "rejected"
      subscriber_status: "pending" | "confirmed" | "unsubscribed"
      workflow_mode: "auto_publish" | "draft_only" | "manual_approval"
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
      app_role: ["admin", "moderator", "author", "user"],
      blog_source: ["manual", "ai_auto", "ai_assisted"],
      blog_status: [
        "draft",
        "scheduled",
        "pending_approval",
        "published",
        "rejected",
      ],
      payout_status: ["pending", "approved", "rejected"],
      subscriber_status: ["pending", "confirmed", "unsubscribed"],
      workflow_mode: ["auto_publish", "draft_only", "manual_approval"],
    },
  },
} as const
