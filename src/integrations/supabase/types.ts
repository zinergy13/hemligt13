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
      host_invoices: {
        Row: {
          booking_count: number
          created_at: string
          currency: string
          host_id: string
          id: string
          invoice_number: string
          issued_at: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          total_amount: number
        }
        Insert: {
          booking_count?: number
          created_at?: string
          currency?: string
          host_id: string
          id?: string
          invoice_number: string
          issued_at?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: string
          total_amount?: number
        }
        Update: {
          booking_count?: number
          created_at?: string
          currency?: string
          host_id?: string
          id?: string
          invoice_number?: string
          issued_at?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          total_amount?: number
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
      generate_monthly_host_invoices: {
        Args: never
        Returns: {
          booking_count: number
          host_id: string
          invoice_id: string
          total_amount: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
