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
    }
  }
}
