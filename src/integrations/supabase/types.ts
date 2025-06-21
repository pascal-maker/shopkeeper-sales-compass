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
      credit_transactions: {
        Row: {
          amount: number
          created_at: string | null
          customer_id: string | null
          id: string
          local_id: string | null
          notes: string | null
          sale_id: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          transaction_date: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          amount: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          local_id?: string | null
          notes?: string | null
          sale_id?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          transaction_date?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          amount?: number
          created_at?: string | null
          customer_id?: string | null
          id?: string
          local_id?: string | null
          notes?: string | null
          sale_id?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          transaction_date?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "daily_sales_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          id: string
          local_id: string | null
          location: string | null
          name: string
          notes: string | null
          phone: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          local_id?: string | null
          location?: string | null
          name: string
          notes?: string | null
          phone: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          local_id?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          phone?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_adjustments: {
        Row: {
          adjustment_date: string | null
          adjustment_quantity: number
          created_at: string | null
          id: string
          local_id: string | null
          notes: string | null
          product_id: string | null
          reason: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
        }
        Insert: {
          adjustment_date?: string | null
          adjustment_quantity: number
          created_at?: string | null
          id?: string
          local_id?: string | null
          notes?: string | null
          product_id?: string | null
          reason?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
        }
        Update: {
          adjustment_date?: string | null
          adjustment_quantity?: number
          created_at?: string | null
          id?: string
          local_id?: string | null
          notes?: string | null
          product_id?: string | null
          reason?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          local_id: string | null
          min_stock_level: number | null
          name: string
          quantity: number | null
          selling_price: number
          sku: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          local_id?: string | null
          min_stock_level?: number | null
          name: string
          quantity?: number | null
          selling_price: number
          sku?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          local_id?: string | null
          min_stock_level?: number | null
          name?: string
          quantity?: number | null
          selling_price?: number
          sku?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          local_id: string | null
          product_id: string | null
          quantity: number
          sale_id: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          local_id?: string | null
          product_id?: string | null
          quantity: number
          sale_id?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          local_id?: string | null
          product_id?: string | null
          quantity?: number
          sale_id?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "low_stock_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "daily_sales_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          local_id: string | null
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          sale_date: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          local_id?: string | null
          notes?: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          sale_date?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_amount: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          local_id?: string | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          sale_date?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          operation: string
          record_id: string
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          synced_at: string | null
          table_name: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation: string
          record_id: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          table_name: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          record_id?: string
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          synced_at?: string | null
          table_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_credit_balances: {
        Row: {
          credit_balance: number | null
          id: string | null
          last_credit_date: string | null
          last_payment_date: string | null
          name: string | null
          phone: string | null
        }
        Insert: {
          credit_balance?: never
          id?: string | null
          last_credit_date?: never
          last_payment_date?: never
          name?: string | null
          phone?: string | null
        }
        Update: {
          credit_balance?: never
          id?: string | null
          last_credit_date?: never
          last_payment_date?: never
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      daily_sales_summary: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string | null
          local_id: string | null
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"] | null
          sale_date: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          local_id?: string | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          sale_date?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string | null
          local_id?: string | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"] | null
          sale_date?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_credit_balances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      low_stock_products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string | null
          expiry_date: string | null
          id: string | null
          local_id: string | null
          min_stock_level: number | null
          name: string | null
          quantity: number | null
          selling_price: number | null
          shortage_quantity: number | null
          sku: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          unit_type: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          local_id?: string | null
          min_stock_level?: number | null
          name?: string | null
          quantity?: number | null
          selling_price?: number | null
          shortage_quantity?: never
          sku?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string | null
          local_id?: string | null
          min_stock_level?: number | null
          name?: string | null
          quantity?: number | null
          selling_price?: number | null
          shortage_quantity?: never
          sku?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          unit_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_type: "cash" | "mobile_money" | "credit"
      sync_status: "pending" | "synced" | "failed"
      transaction_type: "sale" | "payment" | "adjustment"
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
    Enums: {
      payment_type: ["cash", "mobile_money", "credit"],
      sync_status: ["pending", "synced", "failed"],
      transaction_type: ["sale", "payment", "adjustment"],
    },
  },
} as const
