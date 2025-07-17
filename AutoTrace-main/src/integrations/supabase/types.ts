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
      admins: {
        Row: {
          address: string
          cin: string
          company_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Insert: {
          address: string
          cin: string
          company_name: string
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Update: {
          address?: string
          cin?: string
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          description: string
          id: string
          timestamp: string
          type: string
          vehicle_id: string
        }
        Insert: {
          description: string
          id?: string
          timestamp?: string
          type: string
          vehicle_id: string
        }
        Update: {
          description?: string
          id?: string
          timestamp?: string
          type?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          address: string
          admin_uid: string
          assigned_user_ids: string[]
          assigned_vehicle_ids: string[]
          cin: string
          company_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Insert: {
          address: string
          admin_uid: string
          assigned_user_ids?: string[]
          assigned_vehicle_ids?: string[]
          cin: string
          company_name: string
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Update: {
          address?: string
          admin_uid?: string
          assigned_user_ids?: string[]
          assigned_vehicle_ids?: string[]
          cin?: string
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
        }
        Relationships: []
      }
      devices: {
        Row: {
          id: string
          vehicle_id: string
        }
        Insert: {
          id: string
          vehicle_id: string
        }
        Update: {
          id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string
          admin_uid: string
          cin: string
          company_name: string
          first_name: string
          id: string
          last_name: string
          phone: string
          vehicle_id: string | null
        }
        Insert: {
          address: string
          admin_uid: string
          cin: string
          company_name: string
          first_name: string
          id: string
          last_name: string
          phone: string
          vehicle_id?: string | null
        }
        Update: {
          address?: string
          admin_uid?: string
          cin?: string
          company_name?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      vehicle_positions: {
        Row: {
          accel_x: number | null
          accel_y: number | null
          accel_z: number | null
          created_at: string | null
          device_id: string
          id: string
          latitude: number
          longitude: number
          pitch: number | null
          roll: number | null
          speed: number | null
        }
        Insert: {
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          created_at?: string | null
          device_id: string
          id?: string
          latitude: number
          longitude: number
          pitch?: number | null
          roll?: number | null
          speed?: number | null
        }
        Update: {
          accel_x?: number | null
          accel_y?: number | null
          accel_z?: number | null
          created_at?: string | null
          device_id?: string
          id?: string
          latitude?: number
          longitude?: number
          pitch?: number | null
          roll?: number | null
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_positions_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          admin_uid: string
          assigned_devices: string[] | null
          id: string
          model: string | null
          plate_number: string
          status: string
          type: string | null
        }
        Insert: {
          admin_uid: string
          assigned_devices?: string[] | null
          id?: string
          model?: string | null
          plate_number: string
          status: string
          type?: string | null
        }
        Update: {
          admin_uid?: string
          assigned_devices?: string[] | null
          id?: string
          model?: string | null
          plate_number?: string
          status?: string
          type?: string | null
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
