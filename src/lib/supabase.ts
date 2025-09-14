import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not defined')
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not defined')
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for admin operations (user creation, etc.)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Client for member users (uses service role for database access)
export const supabaseMember = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'librarian' | 'member'
          member_id: string | null
          phone: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'librarian' | 'member'
          member_id?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'librarian' | 'member'
          member_id?: string | null
          phone?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      books: {
        Row: {
          id: string
          title: string
          author: string
          isbn: string | null
          genre: string | null
          publication_year: number | null
          description: string | null
          cover_url: string | null
          total_copies: number
          available_copies: number
          qr_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          author: string
          isbn?: string | null
          genre?: string | null
          publication_year?: number | null
          description?: string | null
          cover_url?: string | null
          total_copies?: number
          available_copies?: number
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          author?: string
          isbn?: string | null
          genre?: string | null
          publication_year?: number | null
          description?: string | null
          cover_url?: string | null
          total_copies?: number
          available_copies?: number
          qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      borrowings: {
        Row: {
          id: string
          user_id: string
          book_id: string
          borrow_date: string
          due_date: string
          return_date: string | null
          status: 'active' | 'returned' | 'overdue' | 'pending_return'
          fine_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          borrow_date?: string
          due_date: string
          return_date?: string | null
          status?: 'active' | 'returned' | 'overdue' | 'pending_return'
          fine_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          borrow_date?: string
          due_date?: string
          return_date?: string | null
          status?: 'active' | 'returned' | 'overdue' | 'pending_return'
          fine_amount?: number
          created_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          user_id: string
          book_id: string
          reserved_date: string
          status: 'active' | 'fulfilled' | 'cancelled' | 'expired'
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          reserved_date?: string
          status?: 'active' | 'fulfilled' | 'cancelled' | 'expired'
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          reserved_date?: string
          status?: 'active' | 'fulfilled' | 'cancelled' | 'expired'
          expires_at?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          book_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          book_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          book_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
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