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
      app_settings: {
        Row: {
          cleaning_markup_percent: number
          commission_per_booking: number
          currency: string
          firewood_markup_percent: number
          grocery_delivery_fee: number
          id: number
          linen_markup_percent: number
          updated_at: string
        }
        Insert: {
          cleaning_markup_percent?: number
          commission_per_booking?: number
          currency?: string
          firewood_markup_percent?: number
          grocery_delivery_fee?: number
          id?: number
          linen_markup_percent?: number
          updated_at?: string
        }
        Update: {
          cleaning_markup_percent?: number
          commission_per_booking?: number
          currency?: string
          firewood_markup_percent?: number
          grocery_delivery_fee?: number
          id?: number
          linen_markup_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      booking_extras: {
        Row: {
          booking_id: string
          cost_price: number
          created_at: string
          grocery_delivery_time: string | null
          grocery_order_reference: string | null
          grocery_receipt_url: string | null
          guest_price: number
          id: string
          platform_fee: number
          quantity: number
          service_provider_id: string | null
          service_type: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          cost_price?: number
          created_at?: string
          grocery_delivery_time?: string | null
          grocery_order_reference?: string | null
          grocery_receipt_url?: string | null
          guest_price?: number
          id?: string
          platform_fee?: number
          quantity?: number
          service_provider_id?: string | null
          service_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          cost_price?: number
          created_at?: string
          grocery_delivery_time?: string | null
          grocery_order_reference?: string | null
          grocery_receipt_url?: string | null
          guest_price?: number
          id?: string
          platform_fee?: number
          quantity?: number
          service_provider_id?: string | null
          service_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_extras_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_extras_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "cleaning_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cabin_id: string
          check_in: string
          check_out: string
          cleaning_fee: number
          commission_amount: number
          commission_earned_at: string | null
          commission_invoiced_at: string | null
          commission_paid_at: string | null
          commission_status: string
          created_at: string
          currency: string
          guest_id: string
          guest_message: string | null
          guests: number
          host_id: string
          host_invoice_id: string | null
          id: string
          nightly_total: number
          nights: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          service_fee: number
          status: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          cabin_id: string
          check_in: string
          check_out: string
          cleaning_fee?: number
          commission_amount?: number
          commission_earned_at?: string | null
          commission_invoiced_at?: string | null
          commission_paid_at?: string | null
          commission_status?: string
          created_at?: string
          currency?: string
          guest_id: string
          guest_message?: string | null
          guests?: number
          host_id: string
          host_invoice_id?: string | null
          id?: string
          nightly_total: number
          nights: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          service_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_price: number
          updated_at?: string
        }
        Update: {
          cabin_id?: string
          check_in?: string
          check_out?: string
          cleaning_fee?: number
          commission_amount?: number
          commission_earned_at?: string | null
          commission_invoiced_at?: string | null
          commission_paid_at?: string | null
          commission_status?: string
          created_at?: string
          currency?: string
          guest_id?: string
          guest_message?: string | null
          guests?: number
          host_id?: string
          host_invoice_id?: string | null
          id?: string
          nightly_total?: number
          nights?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          service_fee?: number
          status?: Database["public"]["Enums"]["booking_status"]
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_host_invoice_id_fkey"
            columns: ["host_invoice_id"]
            isOneToOne: false
            referencedRelation: "host_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_blocked_dates: {
        Row: {
          cabin_id: string
          check_in: string
          check_out: string
          created_at: string
          external_uid: string | null
          id: string
          source: string
          summary: string | null
        }
        Insert: {
          cabin_id: string
          check_in: string
          check_out: string
          created_at?: string
          external_uid?: string | null
          id?: string
          source?: string
          summary?: string | null
        }
        Update: {
          cabin_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          external_uid?: string | null
          id?: string
          source?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cabin_blocked_dates_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_ical_feeds: {
        Row: {
          active: boolean
          cabin_id: string
          created_at: string
          id: string
          label: string
          last_error: string | null
          last_event_count: number | null
          last_synced_at: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          cabin_id: string
          created_at?: string
          id?: string
          label?: string
          last_error?: string | null
          last_event_count?: number | null
          last_synced_at?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          cabin_id?: string
          created_at?: string
          id?: string
          label?: string
          last_error?: string | null
          last_event_count?: number | null
          last_synced_at?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_ical_feeds_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_images: {
        Row: {
          cabin_id: string
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          url: string
        }
        Insert: {
          cabin_id: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          url: string
        }
        Update: {
          cabin_id?: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_images_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_pricing_rules: {
        Row: {
          cabin_id: string
          created_at: string
          early_bird_days: number
          early_bird_discount_pct: number
          high_demand_markup_pct: number
          id: string
          last_minute_days: number
          last_minute_discount_pct: number
          long_stay_discount_pct: number
          long_stay_nights: number
          updated_at: string
        }
        Insert: {
          cabin_id: string
          created_at?: string
          early_bird_days?: number
          early_bird_discount_pct?: number
          high_demand_markup_pct?: number
          id?: string
          last_minute_days?: number
          last_minute_discount_pct?: number
          long_stay_discount_pct?: number
          long_stay_nights?: number
          updated_at?: string
        }
        Update: {
          cabin_id?: string
          created_at?: string
          early_bird_days?: number
          early_bird_discount_pct?: number
          high_demand_markup_pct?: number
          id?: string
          last_minute_days?: number
          last_minute_discount_pct?: number
          long_stay_discount_pct?: number
          long_stay_nights?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_pricing_rules_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: true
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_season_prices: {
        Row: {
          cabin_id: string
          created_at: string
          end_date: string
          id: string
          label: string
          min_nights: number | null
          price_per_night: number
          price_per_week: number | null
          start_date: string
          weekend_only: boolean
          weekend_surcharge_pct: number
        }
        Insert: {
          cabin_id: string
          created_at?: string
          end_date: string
          id?: string
          label: string
          min_nights?: number | null
          price_per_night: number
          price_per_week?: number | null
          start_date: string
          weekend_only?: boolean
          weekend_surcharge_pct?: number
        }
        Update: {
          cabin_id?: string
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          min_nights?: number | null
          price_per_night?: number
          price_per_week?: number | null
          start_date?: string
          weekend_only?: boolean
          weekend_surcharge_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "cabin_season_prices_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          address: string | null
          amenities: string[]
          area_slug: string
          bathrooms: number
          bedrooms: number
          beds: number
          check_in_weekday: number | null
          cleaning_fee: number
          created_at: string
          description: string | null
          description_de: string | null
          description_en: string | null
          host_id: string
          ical_token: string
          id: string
          instant_book: boolean
          lat: number | null
          lng: number | null
          max_guests: number
          min_nights: number
          price_per_night: number
          size_sqm: number | null
          slug: string
          status: Database["public"]["Enums"]["cabin_status"]
          title: string
          title_de: string | null
          title_en: string | null
          translated_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[]
          area_slug: string
          bathrooms?: number
          bedrooms?: number
          beds?: number
          check_in_weekday?: number | null
          cleaning_fee?: number
          created_at?: string
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          host_id: string
          ical_token?: string
          id?: string
          instant_book?: boolean
          lat?: number | null
          lng?: number | null
          max_guests?: number
          min_nights?: number
          price_per_night?: number
          size_sqm?: number | null
          slug: string
          status?: Database["public"]["Enums"]["cabin_status"]
          title: string
          title_de?: string | null
          title_en?: string | null
          translated_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[]
          area_slug?: string
          bathrooms?: number
          bedrooms?: number
          beds?: number
          check_in_weekday?: number | null
          cleaning_fee?: number
          created_at?: string
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          host_id?: string
          ical_token?: string
          id?: string
          instant_book?: boolean
          lat?: number | null
          lng?: number | null
          max_guests?: number
          min_nights?: number
          price_per_night?: number
          size_sqm?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["cabin_status"]
          title?: string
          title_de?: string | null
          title_en?: string | null
          translated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cleaning_firm_prices: {
        Row: {
          created_at: string
          firm_id: string
          id: string
          max_sqm: number
          min_sqm: number
          price_to_firm: number
        }
        Insert: {
          created_at?: string
          firm_id: string
          id?: string
          max_sqm: number
          min_sqm: number
          price_to_firm: number
        }
        Update: {
          created_at?: string
          firm_id?: string
          id?: string
          max_sqm?: number
          min_sqm?: number
          price_to_firm?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_firm_prices_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "cleaning_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_firms: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          invoice_email: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          invoice_email?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          invoice_email?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          cabin_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          cabin_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          cabin_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_areas: {
        Row: {
          area_slug: string
          created_at: string
          firm_id: string
        }
        Insert: {
          area_slug: string
          created_at?: string
          firm_id: string
        }
        Update: {
          area_slug?: string
          created_at?: string
          firm_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_areas_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "cleaning_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_redemptions: {
        Row: {
          amount_ore: number
          booking_id: string | null
          created_at: string
          gift_card_id: string
          id: string
          redeemed_by: string
        }
        Insert: {
          amount_ore: number
          booking_id?: string | null
          created_at?: string
          gift_card_id: string
          id?: string
          redeemed_by: string
        }
        Update: {
          amount_ore?: number
          booking_id?: string | null
          created_at?: string
          gift_card_id?: string
          id?: string
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_redemptions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount_ore: number
          code: string
          created_at: string
          created_by: string | null
          currency: string
          expires_at: string | null
          id: string
          issued_to_email: string | null
          issued_to_name: string | null
          message: string | null
          redeemed_ore: number
          status: string
          updated_at: string
        }
        Insert: {
          amount_ore: number
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          issued_to_email?: string | null
          issued_to_name?: string | null
          message?: string | null
          redeemed_ore?: number
          status?: string
          updated_at?: string
        }
        Update: {
          amount_ore?: number
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          issued_to_email?: string | null
          issued_to_name?: string | null
          message?: string | null
          redeemed_ore?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      host_invoice_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          invoice_id: string
          note: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          invoice_id: string
          note?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          invoice_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "host_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      host_invoices: {
        Row: {
          booking_count: number
          commission_net: number
          created_at: string
          currency: string
          due_date: string | null
          extras_breakdown: Json
          extras_net: number
          host_id: string
          id: string
          invoice_number: string
          issued_at: string
          ocr_reference: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_amount: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          booking_count?: number
          commission_net?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          extras_breakdown?: Json
          extras_net?: number
          host_id: string
          id?: string
          invoice_number: string
          issued_at?: string
          ocr_reference?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount?: number
          vat_amount?: number
          vat_rate?: number
        }
        Update: {
          booking_count?: number
          commission_net?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          extras_breakdown?: Json
          extras_net?: number
          host_id?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          ocr_reference?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: []
      }
      host_payout_details: {
        Row: {
          bank_account: string | null
          bankgiro: string | null
          created_at: string
          host_id: string
          is_business: boolean
          payment_instructions: string | null
          swish_number: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bankgiro?: string | null
          created_at?: string
          host_id: string
          is_business?: boolean
          payment_instructions?: string | null
          swish_number?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bankgiro?: string | null
          created_at?: string
          host_id?: string
          is_business?: boolean
          payment_instructions?: string | null
          swish_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          active: boolean
          area_slug: string | null
          created_at: string
          email: string
          id: string
          last_notified_at: string | null
          max_price_per_night: number
          region_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          area_slug?: string | null
          created_at?: string
          email: string
          id?: string
          last_notified_at?: string | null
          max_price_per_night: number
          region_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          area_slug?: string | null
          created_at?: string
          email?: string
          id?: string
          last_notified_at?: string | null
          max_price_per_night?: number
          region_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          is_host: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_host?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_host?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_flags: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          cabin_id: string
          comment: string | null
          created_at: string
          guest_id: string
          hidden: boolean
          hidden_reason: string | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          cabin_id: string
          comment?: string | null
          created_at?: string
          guest_id: string
          hidden?: boolean
          hidden_reason?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rating: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          cabin_id?: string
          comment?: string | null
          created_at?: string
          guest_id?: string
          hidden?: boolean
          hidden_reason?: string | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      wishlist_cabins: {
        Row: {
          added_at: string
          added_by: string
          cabin_id: string
          note: string | null
          wishlist_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          cabin_id: string
          note?: string | null
          wishlist_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          cabin_id?: string
          note?: string | null
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_cabins_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_cabins_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_members: {
        Row: {
          added_at: string
          user_id: string
          wishlist_id: string
        }
        Insert: {
          added_at?: string
          user_id: string
          wishlist_id: string
        }
        Update: {
          added_at?: string
          user_id?: string
          wishlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_members_wishlist_id_fkey"
            columns: ["wishlist_id"]
            isOneToOne: false
            referencedRelation: "wishlists"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_private: boolean
          name: string
          owner_id: string
          share_slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          owner_id: string
          share_slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          owner_id?: string
          share_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      cabin_unavailable_dates: {
        Row: {
          cabin_id: string | null
          check_in: string | null
          check_out: string | null
        }
        Relationships: []
      }
      host_balances: {
        Row: {
          earned_amount: number | null
          earned_count: number | null
          host_id: string | null
          invoiced_amount: number | null
          invoiced_count: number | null
          paid_amount: number | null
          paid_count: number | null
          total_owed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      complete_past_bookings: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_monthly_host_invoices: {
        Args: never
        Returns: {
          booking_count: number
          host_id: string
          invoice_id: string
          total_amount: number
        }[]
      }
      get_my_phone: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_wishlist_member: {
        Args: { _user: string; _wishlist: string }
        Returns: boolean
      }
      lookup_gift_card: {
        Args: { _code: string }
        Returns: {
          currency: string
          expires_at: string
          id: string
          remaining_ore: number
          status: string
        }[]
      }
      mark_overdue_invoices: { Args: never; Returns: number }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_gift_card: {
        Args: { _amount_ore: number; _booking_id: string; _code: string }
        Returns: {
          applied_ore: number
          redemption_id: string
          remaining_ore: number
        }[]
      }
    }
    Enums: {
      app_role: "guest" | "host" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "declined"
        | "cancelled"
        | "completed"
      cabin_status: "draft" | "published" | "paused"
      payment_status: "unpaid" | "authorized" | "paid" | "refunded" | "failed"
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
      app_role: ["guest", "host", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "declined",
        "cancelled",
        "completed",
      ],
      cabin_status: ["draft", "published", "paused"],
      payment_status: ["unpaid", "authorized", "paid", "refunded", "failed"],
    },
  },
} as const
