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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      account_initial_balances: {
        Row: {
          account_id: string
          amount: number
          balance_date: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount?: number
          balance_date: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          balance_date?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          created_at: string
          credit_limit: number | null
          id: string
          institution_id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["account_kind"]
          last_reconciled_at: string | null
          last_reconciliation_method:
            | Database["public"]["Enums"]["reconciliation_method"]
            | null
          name: string
          subtype: Database["public"]["Enums"]["account_subtype"]
          type: Database["public"]["Enums"]["account_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_limit?: number | null
          id?: string
          institution_id: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["account_kind"]
          last_reconciled_at?: string | null
          last_reconciliation_method?:
            | Database["public"]["Enums"]["reconciliation_method"]
            | null
          name: string
          subtype: Database["public"]["Enums"]["account_subtype"]
          type?: Database["public"]["Enums"]["account_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          credit_limit?: number | null
          id?: string
          institution_id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["account_kind"]
          last_reconciled_at?: string | null
          last_reconciliation_method?:
            | Database["public"]["Enums"]["reconciliation_method"]
            | null
          name?: string
          subtype?: Database["public"]["Enums"]["account_subtype"]
          type?: Database["public"]["Enums"]["account_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          budgeted_amount: number
          category_id: string
          created_at: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budgeted_amount?: number
          category_id: string
          created_at?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budgeted_amount?: number
          category_id?: string
          created_at?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparties: {
        Row: {
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_cards: {
        Row: {
          card_limit: number
          created_at: string
          id: string
          institution_id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          card_limit: number
          created_at?: string
          id?: string
          institution_id: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          card_limit?: number
          created_at?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_balances: {
        Row: {
          balance: number
          created_at: string
          id: string
          investment_id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance: number
          created_at?: string
          id?: string
          investment_id: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          investment_id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_balances_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          transaction_date: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_transactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          created_at: string
          display_order: number | null
          due_date: string | null
          id: string
          institution_id: string | null
          issuer: string | null
          name: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          due_date?: string | null
          id?: string
          institution_id?: string | null
          issuer?: string | null
          name: string
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          due_date?: string | null
          id?: string
          institution_id?: string | null
          issuer?: string | null
          name?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      market_indicators: {
        Row: {
          cdi: number | null
          created_at: string
          indicator_date: string
          ipca: number | null
          selic: number | null
          updated_at: string
        }
        Insert: {
          cdi?: number | null
          created_at?: string
          indicator_date: string
          ipca?: number | null
          selic?: number | null
          updated_at?: string
        }
        Update: {
          cdi?: number | null
          created_at?: string
          indicator_date?: string
          ipca?: number | null
          selic?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_installments: {
        Row: {
          created_at: string
          due_date: string
          id: string
          plan_id: string
          planned_amount: number
          settled_amount: number
          settled_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          plan_id: string
          planned_amount: number
          settled_amount?: number
          settled_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          plan_id?: string
          planned_amount?: number
          settled_amount?: number
          settled_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_installments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          plan_id: string
          user_id: string
          withdrawal_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          plan_id: string
          user_id: string
          withdrawal_date: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          plan_id?: string
          user_id?: string
          withdrawal_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_withdrawals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          end_date: string
          id: string
          image_url: string | null
          name: string
          notes: string | null
          start_date: string
          total_amount: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          start_date: string
          total_amount: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          start_date?: string
          total_amount?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          favorite_expense_account_id: string | null
          favorite_income_account_id: string | null
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          monthly_cost_of_living: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          favorite_expense_account_id?: string | null
          favorite_income_account_id?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          monthly_cost_of_living?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          favorite_expense_account_id?: string | null
          favorite_income_account_id?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          monthly_cost_of_living?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          amount: number | null
          auto_categorize: boolean | null
          category_id: string | null
          counterparty_id: string | null
          created_at: string
          day_of_month: number | null
          description: string
          expected_amount: number
          id: string
          last_payment_date: string | null
          next_due_date: string
          notes: string | null
          notification_days: number | null
          recurrence_pattern: string
          status: string
          template_name: string
          type: string
          updated_at: string
          user_id: string
          variance_tolerance: number | null
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          auto_categorize?: boolean | null
          category_id?: string | null
          counterparty_id?: string | null
          created_at?: string
          day_of_month?: number | null
          description: string
          expected_amount?: number
          id?: string
          last_payment_date?: string | null
          next_due_date: string
          notes?: string | null
          notification_days?: number | null
          recurrence_pattern?: string
          status?: string
          template_name: string
          type: string
          updated_at?: string
          user_id: string
          variance_tolerance?: number | null
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          auto_categorize?: boolean | null
          category_id?: string | null
          counterparty_id?: string | null
          created_at?: string
          day_of_month?: number | null
          description?: string
          expected_amount?: number
          id?: string
          last_payment_date?: string | null
          next_due_date?: string
          notes?: string | null
          notification_days?: number | null
          recurrence_pattern?: string
          status?: string
          template_name?: string
          type?: string
          updated_at?: string
          user_id?: string
          variance_tolerance?: number | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_tags: {
        Row: {
          created_at: string
          tag_id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tag_id: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tag_id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          counterparty_id: string | null
          created_at: string
          credit_card_id: string | null
          description: string
          event_date: string
          id: string
          input_source: Database["public"]["Enums"]["input_source_type"]
          installment_id: string | null
          installment_number: number | null
          is_reviewed: boolean
          notes: string | null
          total_installments: number | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          counterparty_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          description: string
          event_date: string
          id?: string
          input_source?: Database["public"]["Enums"]["input_source_type"]
          installment_id?: string | null
          installment_number?: number | null
          is_reviewed?: boolean
          notes?: string | null
          total_installments?: number | null
          type: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          counterparty_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          description?: string
          event_date?: string
          id?: string
          input_source?: Database["public"]["Enums"]["input_source_type"]
          installment_id?: string | null
          installment_number?: number | null
          is_reviewed?: boolean
          notes?: string | null
          total_installments?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_next_due_date: {
        Args: {
          p_current_date: string
          p_day_of_month?: number
          p_recurrence_pattern: string
        }
        Returns: string
      }
      cleanup_ocr_temp_files: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_account_balances: {
        Args: { p_as_of_date?: string }
        Returns: {
          account_id: string
          current_balance: number
        }[]
      }
      get_monthly_budget_actuals: {
        Args: { p_month: string }
        Returns: {
          actual_amount: number
          budgeted_amount: number
          category_id: string
          category_type: string
        }[]
      }
      get_recurring_transactions_analytics: {
        Args: { p_user_id: string }
        Returns: {
          account_name: string
          avg_last_3_months: number
          category_name: string
          counterparty_name: string
          days_until_due: number
          description: string
          expected_amount: number
          id: string
          last_amount: number
          next_due_date: string
          status: string
          template_name: string
          type: string
          variance_percentage: number
        }[]
      }
    }
    Enums: {
      account_kind: "asset" | "liability"
      account_subtype:
        | "cash"
        | "bank"
        | "investment"
        | "property_rights"
        | "other_assets"
        | "credit_card"
        | "loan"
        | "other_liabilities"
      account_type: "on_budget" | "credit"
      input_source_type:
        | "manual"
        | "import"
        | "ai_agent"
        | "recurring"
        | "installment"
      reconciliation_method: "manual" | "automacao" | "open_finance"
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
      account_kind: ["asset", "liability"],
      account_subtype: [
        "cash",
        "bank",
        "investment",
        "property_rights",
        "other_assets",
        "credit_card",
        "loan",
        "other_liabilities",
      ],
      account_type: ["on_budget", "credit"],
      input_source_type: [
        "manual",
        "import",
        "ai_agent",
        "recurring",
        "installment",
      ],
      reconciliation_method: ["manual", "automacao", "open_finance"],
    },
  },
} as const
