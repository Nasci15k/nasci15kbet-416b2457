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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          referred_user_id: string | null
          status: string | null
          type: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referred_user_id?: string | null
          status?: string | null
          type: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          referred_user_id?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          commission_percent: number | null
          commission_type: string | null
          cookie_days: number | null
          id: string
          is_active: boolean | null
          min_payout: number | null
          terms: string | null
          updated_at: string | null
        }
        Insert: {
          commission_percent?: number | null
          commission_type?: string | null
          cookie_days?: number | null
          id?: string
          is_active?: boolean | null
          min_payout?: number | null
          terms?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_percent?: number | null
          commission_type?: string | null
          cookie_days?: number | null
          id?: string
          is_active?: boolean | null
          min_payout?: number | null
          terms?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          pending_commission: number | null
          total_clicks: number | null
          total_commission: number | null
          total_deposits: number | null
          total_signups: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          pending_commission?: number | null
          total_clicks?: number | null
          total_commission?: number | null
          total_deposits?: number | null
          total_signups?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          pending_commission?: number | null
          total_clicks?: number | null
          total_commission?: number | null
          total_deposits?: number | null
          total_signups?: number | null
          user_id?: string
        }
        Relationships: []
      }
      api_settings: {
        Row: {
          agent_token: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          rtp_default: number | null
          secret_key: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          agent_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider: string
          rtp_default?: number | null
          secret_key?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          agent_token?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          rtp_default?: number | null
          secret_key?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      appearance_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          custom_css: string | null
          custom_js: string | null
          font_family: string | null
          footer_text: string | null
          header_color: string | null
          hero_banners: Json | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean | null
          primary_color: string | null
          secondary_color: string | null
          sidebar_color: string | null
          site_favicon: string | null
          site_logo: string | null
          site_name: string | null
          social_links: Json | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          custom_css?: string | null
          custom_js?: string | null
          font_family?: string | null
          footer_text?: string | null
          header_color?: string | null
          hero_banners?: Json | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          sidebar_color?: string | null
          site_favicon?: string | null
          site_logo?: string | null
          site_name?: string | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          custom_css?: string | null
          custom_js?: string | null
          font_family?: string | null
          footer_text?: string | null
          header_color?: string | null
          hero_banners?: Json | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          sidebar_color?: string | null
          site_favicon?: string | null
          site_logo?: string | null
          site_name?: string | null
          social_links?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bonuses: {
        Row: {
          code: string | null
          created_at: string | null
          current_uses: number | null
          description: string | null
          id: string
          is_active: boolean | null
          max_bonus: number | null
          max_uses: number | null
          min_deposit: number | null
          name: string
          target_users: string | null
          type: string
          valid_days: number | null
          value: number
          value_type: string | null
          wagering_requirement: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_bonus?: number | null
          max_uses?: number | null
          min_deposit?: number | null
          name: string
          target_users?: string | null
          type: string
          valid_days?: number | null
          value: number
          value_type?: string | null
          wagering_requirement?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_bonus?: number | null
          max_uses?: number | null
          min_deposit?: number | null
          name?: string
          target_users?: string | null
          type?: string
          valid_days?: number | null
          value?: number
          value_type?: string | null
          wagering_requirement?: number | null
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string | null
          expires_at: string | null
          external_id: string | null
          fee: number | null
          id: string
          payment_method_id: string | null
          pix_code: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_id?: string | null
          fee?: number | null
          id?: string
          payment_method_id?: string | null
          pix_code?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_id?: string | null
          fee?: number | null
          id?: string
          payment_method_id?: string | null
          pix_code?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      game_categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      game_providers: {
        Row: {
          created_at: string | null
          external_id: number | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          order_index: number | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          external_id?: number | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          order_index?: number | null
          slug: string
        }
        Update: {
          created_at?: string | null
          external_id?: number | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          order_index?: number | null
          slug?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          end_balance: number | null
          ended_at: string | null
          game_id: string
          id: string
          rounds_played: number | null
          start_balance: number | null
          started_at: string | null
          total_bet: number | null
          total_win: number | null
          user_id: string
        }
        Insert: {
          end_balance?: number | null
          ended_at?: string | null
          game_id: string
          id?: string
          rounds_played?: number | null
          start_balance?: number | null
          started_at?: string | null
          total_bet?: number | null
          total_win?: number | null
          user_id: string
        }
        Update: {
          end_balance?: number | null
          ended_at?: string | null
          game_id?: string
          id?: string
          rounds_played?: number | null
          start_balance?: number | null
          started_at?: string | null
          total_bet?: number | null
          total_win?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          category_id: string | null
          created_at: string | null
          external_code: string
          id: string
          image: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_live: boolean | null
          is_new: boolean | null
          is_original: boolean | null
          max_bet: number | null
          min_bet: number | null
          name: string
          order_index: number | null
          play_count: number | null
          provider_id: string | null
          rtp: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          external_code: string
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_live?: boolean | null
          is_new?: boolean | null
          is_original?: boolean | null
          max_bet?: number | null
          min_bet?: number | null
          name: string
          order_index?: number | null
          play_count?: number | null
          provider_id?: string | null
          rtp?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          external_code?: string
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_live?: boolean | null
          is_new?: boolean | null
          is_original?: boolean | null
          max_bet?: number | null
          min_bet?: number | null
          name?: string
          order_index?: number | null
          play_count?: number | null
          provider_id?: string | null
          rtp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "game_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "game_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          config: Json | null
          created_at: string | null
          deposit_fee_percent: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_deposit: number | null
          max_withdrawal: number | null
          min_deposit: number | null
          min_withdrawal: number | null
          name: string
          processing_time: string | null
          type: string
          withdrawal_fee_percent: number | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          deposit_fee_percent?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_deposit?: number | null
          max_withdrawal?: number | null
          min_deposit?: number | null
          min_withdrawal?: number | null
          name: string
          processing_time?: string | null
          type: string
          withdrawal_fee_percent?: number | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          deposit_fee_percent?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_deposit?: number | null
          max_withdrawal?: number | null
          min_deposit?: number | null
          min_withdrawal?: number | null
          name?: string
          processing_time?: string | null
          type?: string
          withdrawal_fee_percent?: number | null
        }
        Relationships: []
      }
      popups: {
        Row: {
          button_text: string | null
          button_url: string | null
          content: string | null
          created_at: string | null
          delay_seconds: number | null
          end_date: string | null
          id: string
          image: string | null
          is_active: boolean | null
          show_once: boolean | null
          start_date: string | null
          title: string
          trigger_type: string | null
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          content?: string | null
          created_at?: string | null
          delay_seconds?: number | null
          end_date?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          show_once?: boolean | null
          start_date?: string | null
          title: string
          trigger_type?: string | null
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          content?: string | null
          created_at?: string | null
          delay_seconds?: number | null
          end_date?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          show_once?: boolean | null
          start_date?: string | null
          title?: string
          trigger_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          blocked_reason: string | null
          bonus_balance: number | null
          cpf: string | null
          created_at: string | null
          email: string
          id: string
          is_blocked: boolean | null
          name: string | null
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          total_deposited: number | null
          total_wagered: number | null
          total_withdrawn: number | null
          total_won: number | null
          updated_at: string | null
          user_id: string
          vip_level: number | null
          vip_points: number | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          blocked_reason?: string | null
          bonus_balance?: number | null
          cpf?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_blocked?: boolean | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_deposited?: number | null
          total_wagered?: number | null
          total_withdrawn?: number | null
          total_won?: number | null
          updated_at?: string | null
          user_id: string
          vip_level?: number | null
          vip_points?: number | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          blocked_reason?: string | null
          bonus_balance?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_blocked?: boolean | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_deposited?: number | null
          total_wagered?: number | null
          total_withdrawn?: number | null
          total_won?: number | null
          updated_at?: string | null
          user_id?: string
          vip_level?: number | null
          vip_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          image: string | null
          is_active: boolean | null
          order_index: number | null
          start_date: string | null
          terms: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          order_index?: number | null
          start_date?: string | null
          terms?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          order_index?: number | null
          start_date?: string | null
          terms?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          created_at: string | null
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          message: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bonuses: {
        Row: {
          amount: number
          bonus_id: string
          completed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          required_wagering: number
          status: string | null
          user_id: string
          wagered: number | null
        }
        Insert: {
          amount: number
          bonus_id: string
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          required_wagering: number
          status?: string | null
          user_id: string
          wagered?: number | null
        }
        Update: {
          amount?: number
          bonus_id?: string
          completed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          required_wagering?: number
          status?: string | null
          user_id?: string
          wagered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bonuses_bonus_id_fkey"
            columns: ["bonus_id"]
            isOneToOne: false
            referencedRelation: "bonuses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_levels: {
        Row: {
          benefits: Json | null
          cashback_percent: number | null
          color: string | null
          created_at: string | null
          dedicated_support: boolean | null
          icon: string | null
          id: string
          level: number
          min_points: number
          name: string
          special_bonuses: boolean | null
          withdrawal_priority: boolean | null
        }
        Insert: {
          benefits?: Json | null
          cashback_percent?: number | null
          color?: string | null
          created_at?: string | null
          dedicated_support?: boolean | null
          icon?: string | null
          id?: string
          level: number
          min_points: number
          name: string
          special_bonuses?: boolean | null
          withdrawal_priority?: boolean | null
        }
        Update: {
          benefits?: Json | null
          cashback_percent?: number | null
          color?: string | null
          created_at?: string | null
          dedicated_support?: boolean | null
          icon?: string | null
          id?: string
          level?: number
          min_points?: number
          name?: string
          special_bonuses?: boolean | null
          withdrawal_priority?: boolean | null
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_info: Json | null
          created_at: string | null
          fee: number | null
          id: string
          payment_method_id: string | null
          pix_key: string | null
          pix_key_type: string | null
          rejected_reason: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_info?: Json | null
          created_at?: string | null
          fee?: number | null
          id?: string
          payment_method_id?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_info?: Json | null
          created_at?: string | null
          fee?: number | null
          id?: string
          payment_method_id?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          rejected_reason?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      transaction_status: "pending" | "completed" | "failed" | "cancelled"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "bet"
        | "win"
        | "bonus"
        | "refund"
        | "adjustment"
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
      app_role: ["admin", "moderator", "user"],
      transaction_status: ["pending", "completed", "failed", "cancelled"],
      transaction_type: [
        "deposit",
        "withdrawal",
        "bet",
        "win",
        "bonus",
        "refund",
        "adjustment",
      ],
    },
  },
} as const
