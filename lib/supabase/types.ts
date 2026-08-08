// lib/supabase/types.ts
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
      members: {
        Row: {
          id: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          member_type: 'professional' | 'student' | 'institutional'
          organization: string | null
          country: string | null
          status: 'pending' | 'active' | 'suspended' | 'expired'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          first_name: string
          last_name: string
          member_type: 'professional' | 'student' | 'institutional'
          organization?: string | null
          country?: string | null
          status?: 'pending' | 'active' | 'suspended' | 'expired'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          first_name?: string
          last_name?: string
          member_type?: 'professional' | 'student' | 'institutional'
          organization?: string | null
          country?: string | null
          status?: 'pending' | 'active' | 'suspended' | 'expired'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          type: 'news' | 'document'
          category: string | null
          title: string
          slug: string
          excerpt: string | null
          body: string | null
          cover_image_url: string | null
          file_url: string | null
          file_size: number | null
          author_id: string | null
          status: 'draft' | 'published' | 'archived'
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'news' | 'document'
          category?: string | null
          title: string
          slug: string
          excerpt?: string | null
          body?: string | null
          cover_image_url?: string | null
          file_url?: string | null
          file_size?: number | null
          author_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'news' | 'document'
          category?: string | null
          title?: string
          slug?: string
          excerpt?: string | null
          body?: string | null
          cover_image_url?: string | null
          file_url?: string | null
          file_size?: number | null
          author_id?: string | null
          status?: 'draft' | 'published' | 'archived'
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          sender_name: string
          recipient_type: 'individual' | 'group' | 'broadcast'
          recipient_ids: string[]
          group_type: 'professional' | 'student' | 'institutional' | null
          subject: string
          body: string
          allow_reply: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          sender_name: string
          recipient_type: 'individual' | 'group' | 'broadcast'
          recipient_ids?: string[]
          group_type?: 'professional' | 'student' | 'institutional' | null
          subject: string
          body: string
          allow_reply?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          sender_name?: string
          recipient_type?: 'individual' | 'group' | 'broadcast'
          recipient_ids?: string[]
          group_type?: 'professional' | 'student' | 'institutional' | null
          subject?: string
          body?: string
          allow_reply?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      message_receipts: {
        Row: {
          id: string
          message_id: string
          member_id: string
          read_at: string | null
          read_status: 'unread' | 'read'
        }
        Insert: {
          id?: string
          message_id: string
          member_id: string
          read_at?: string | null
          read_status?: 'unread' | 'read'
        }
        Update: {
          id?: string
          message_id?: string
          member_id?: string
          read_at?: string | null
          read_status?: 'unread' | 'read'
        }
      }
      message_replies: {
        Row: {
          id: string
          message_id: string
          member_id: string
          member_name: string
          body: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          member_id: string
          member_name: string
          body: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          member_id?: string
          member_name?: string
          body?: string
          created_at?: string
        }
      }
      broadcasts: {
        Row: {
          id: string
          type: 'news' | 'document' | 'custom'
          content_id: string | null
          subject: string
          body: string
          recipient_type: 'all' | 'professional' | 'student' | 'institutional'
          total_recipients: number
          sent_count: number
          failed_count: number
          pending_count: number
          status: 'draft' | 'sending' | 'completed' | 'failed'
          created_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          type: 'news' | 'document' | 'custom'
          content_id?: string | null
          subject: string
          body: string
          recipient_type: 'all' | 'professional' | 'student' | 'institutional'
          total_recipients?: number
          sent_count?: number
          failed_count?: number
          pending_count?: number
          status?: 'draft' | 'sending' | 'completed' | 'failed'
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          type?: 'news' | 'document' | 'custom'
          content_id?: string | null
          subject?: string
          body?: string
          recipient_type?: 'all' | 'professional' | 'student' | 'institutional'
          total_recipients?: number
          sent_count?: number
          failed_count?: number
          pending_count?: number
          status?: 'draft' | 'sending' | 'completed' | 'failed'
          created_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
      }
      broadcast_recipients: {
        Row: {
          id: string
          broadcast_id: string
          member_id: string
          email: string
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          error: string | null
          retry_count: number
        }
        Insert: {
          id?: string
          broadcast_id: string
          member_id: string
          email: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          error?: string | null
          retry_count?: number
        }
        Update: {
          id?: string
          broadcast_id?: string
          member_id?: string
          email?: string
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          error?: string | null
          retry_count?: number
        }
      }
      activity_logs: {
        Row: {
          id: string
          actor_id: string | null
          actor_name: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          actor_name?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          actor_name?: string | null
          action?: string
          resource_type?: string | null
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
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
  }
}
