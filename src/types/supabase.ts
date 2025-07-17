
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          cin: string
          phone: string
          company_name: string
          address: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          cin: string
          phone: string
          company_name: string
          address: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          cin?: string
          phone?: string
          company_name?: string
          address?: string
          created_at?: string
        }
      }
      developers: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          cin: string
          phone: string
          company_name: string
          address: string
          created_at: string
          assigned_vehicle_ids: string[]
          assigned_user_ids: string[]
          admin_uid: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          cin: string
          phone: string
          company_name: string
          address: string
          created_at?: string
          assigned_vehicle_ids?: string[]
          assigned_user_ids?: string[]
          admin_uid: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          cin?: string
          phone?: string
          company_name?: string
          address?: string
          created_at?: string
          assigned_vehicle_ids?: string[]
          assigned_user_ids?: string[]
          admin_uid?: string
        }
      }
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          cin: string
          phone: string
          company_name: string
          address: string
          vehicle_id: string | null
          admin_uid: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          cin: string
          phone: string
          company_name: string
          address: string
          vehicle_id?: string | null
          admin_uid: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          cin?: string
          phone?: string
          company_name?: string
          address?: string
          vehicle_id?: string | null
          admin_uid?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          plate_number: string
          status: 'active' | 'inactive' | 'maintenance'
          current_location: Json
          history: Json[]
          admin_uid: string
        }
        Insert: {
          id?: string
          plate_number: string
          status: 'active' | 'inactive' | 'maintenance'
          current_location: Json
          history?: Json[]
          admin_uid: string
        }
        Update: {
          id?: string
          plate_number?: string
          status?: 'active' | 'inactive' | 'maintenance'
          current_location?: Json
          history?: Json[]
          admin_uid?: string
        }
      }
      alerts: {
        Row: {
          id: string
          vehicle_id: string
          type: 'speeding' | 'geofence' | 'maintenance'
          description: string
          timestamp: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          type: 'speeding' | 'geofence' | 'maintenance'
          description: string
          timestamp?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          type?: 'speeding' | 'geofence' | 'maintenance'
          description?: string
          timestamp?: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
