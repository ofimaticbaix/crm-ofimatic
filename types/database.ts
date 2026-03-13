// Database types - Generated from Supabase schema

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
      workspaces: {
        Row: {
          id: string
          name: string
          slug: string
          settings: Json
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
          subscription_tier: 'starter' | 'professional' | 'enterprise'
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          locale: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          workspace_id: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          email: string | null
          phone: string | null
          mobile: string | null
          job_title: string | null
          department: string | null
          company_id: string | null
          linkedin_url: string | null
          twitter_handle: string | null
          website: string | null
          lifecycle_stage: 'lead' | 'prospect' | 'customer' | 'evangelist'
          lead_source: string | null
          language: string
          owner_id: string | null
          created_by_id: string | null
          updated_by_id: string | null
          consent_marketing: boolean
          consent_communications: boolean
          consent_date: string | null
          birthday: string | null
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          is_decision_maker: boolean
          notes: string | null
          custom_fields: Json
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'full_name' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      companies: {
        Row: {
          id: string
          workspace_id: string
          name: string
          website: string | null
          industry: string | null
          company_size: '1-10' | '11-50' | '51-200' | '201-500' | '501+' | null
          annual_revenue: number | null
          vat_number: string | null
          billing_address: Json | null
          shipping_address: Json | null
          linkedin_url: string | null
          owner_id: string | null
          created_by_id: string | null
          updated_by_id: string | null
          health_score: number | null
          lifetime_value: number
          account_type: 'customer' | 'prospect' | 'lead' | 'partner' | 'supplier'
          account_status: 'active' | 'inactive' | 'negotiating' | 'churned'
          description: string | null
          founded_year: number | null
          employees_exact: number | null
          phone: string | null
          email: string | null
          // Geolocation fields
          latitude: number | null
          longitude: number | null
          geocoded_at: string | null
          custom_fields: Json
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      deals: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          pipeline_id: string
          stage_id: string
          value: number | null
          currency: string
          is_recurring: boolean
          recurring_period: 'monthly' | 'quarterly' | 'annual' | null
          expected_close_date: string | null
          actual_close_date: string | null
          company_id: string | null
          owner_id: string | null
          created_by_id: string | null
          updated_by_id: string | null
          status: 'open' | 'won' | 'lost'
          loss_reason: string | null
          next_step: string | null
          competitors: string[] | null
          custom_fields: Json
          metadata: Json
          created_at: string
          updated_at: string
          stage_changed_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['deals']['Row'], 'id' | 'created_at' | 'updated_at' | 'stage_changed_at'>
        Update: Partial<Database['public']['Tables']['deals']['Insert']>
      }
      pipelines: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          is_default: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['pipelines']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['pipelines']['Insert']>
      }
      stages: {
        Row: {
          id: string
          pipeline_id: string
          name: string
          description: string | null
          probability: number
          position: number
          is_closed_won: boolean
          is_closed_lost: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stages']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['stages']['Insert']>
      }
      activities: {
        Row: {
          id: string
          workspace_id: string
          type: 'call' | 'meeting' | 'email' | 'note' | 'task'
          subject: string | null
          description: string | null
          outcome: string | null
          scheduled_at: string | null
          completed_at: string | null
          due_date: string | null
          is_completed: boolean
          assigned_to_id: string | null
          contact_id: string | null
          company_id: string | null
          deal_id: string | null
          created_by_id: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['activities']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['activities']['Insert']>
      }
      visits: {
        Row: {
          id: string
          workspace_id: string
          company_id: string
          contact_id: string | null
          deal_id: string | null
          user_id: string
          check_in_at: string
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_address: string | null
          check_out_at: string | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          visit_type: 'presencial' | 'videollamada' | 'llamada'
          purpose: string | null
          notes: string | null
          outcome: 'positive' | 'neutral' | 'negative' | 'no_show' | null
          next_steps: string | null
          duration_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['visits']['Row'], 'id' | 'created_at' | 'updated_at' | 'duration_minutes'>
        Update: Partial<Database['public']['Tables']['visits']['Insert']>
      }
      routes: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          name: string
          planned_date: string
          status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
          company_ids: string[]
          total_distance_km: number | null
          estimated_duration_minutes: number | null
          route_polyline: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['routes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['routes']['Insert']>
      }
      webhooks: {
        Row: {
          id: string
          workspace_id: string
          name: string
          url: string
          secret: string | null
          events: string[]
          is_active: boolean
          last_triggered_at: string | null
          last_status_code: number | null
          failure_count: number
          created_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['webhooks']['Row'], 'id' | 'created_at' | 'updated_at' | 'failure_count'>
        Update: Partial<Database['public']['Tables']['webhooks']['Insert']>
      }
      webhook_logs: {
        Row: {
          id: string
          webhook_id: string
          event_type: string
          payload: Json
          status_code: number | null
          response_body: string | null
          error_message: string | null
          triggered_at: string
          duration_ms: number | null
        }
        Insert: Omit<Database['public']['Tables']['webhook_logs']['Row'], 'id' | 'triggered_at'>
        Update: Partial<Database['public']['Tables']['webhook_logs']['Insert']>
      }
    }
  }
}
