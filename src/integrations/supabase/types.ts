export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_memory: {
        Row: {
          assistant_response: string | null
          created_at: string | null
          id: number
          session_id: string
          user_message: string | null
        }
        Insert: {
          assistant_response?: string | null
          created_at?: string | null
          id?: number
          session_id: string
          user_message?: string | null
        }
        Update: {
          assistant_response?: string | null
          created_at?: string | null
          id?: number
          session_id?: string
          user_message?: string | null
        }
        Relationships: []
      }
      credit_card_settings: {
        Row: {
          closing_day: number | null
          created_at: string
          enabled: boolean | null
          id: string
          payment_day: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          closing_day?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          payment_day?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          closing_day?: number | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          payment_day?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recorrencias: {
        Row: {
          categoria: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          frequencia: string
          id: string
          nome_recorrencia: string
          tipo_transacao: string
          user_id: string
          valor_recorrencia: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          frequencia: string
          id?: string
          nome_recorrencia: string
          tipo_transacao: string
          user_id: string
          valor_recorrencia: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          frequencia?: string
          id?: string
          nome_recorrencia?: string
          tipo_transacao?: string
          user_id?: string
          valor_recorrencia?: number
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          categoria: string
          created_at: string
          data_transacao: string
          id: string
          installments: number | null
          is_paid: boolean | null
          is_recorrente: boolean | null
          is_subscription: boolean | null
          nome_gasto: string
          purchase_date: string | null
          tipo_transacao: string
          total_amount: number | null
          transaction_group_id: string | null
          user_id: string
          valor_gasto: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data_transacao: string
          id?: string
          installments?: number | null
          is_paid?: boolean | null
          is_recorrente?: boolean | null
          is_subscription?: boolean | null
          nome_gasto: string
          purchase_date?: string | null
          tipo_transacao: string
          total_amount?: number | null
          transaction_group_id?: string | null
          user_id: string
          valor_gasto: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_transacao?: string
          id?: string
          installments?: number | null
          is_paid?: boolean | null
          is_recorrente?: boolean | null
          is_subscription?: boolean | null
          nome_gasto?: string
          purchase_date?: string | null
          tipo_transacao?: string
          total_amount?: number | null
          transaction_group_id?: string | null
          user_id?: string
          valor_gasto?: number
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
