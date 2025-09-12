import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
          status: 'active' | 'returned' | 'overdue'
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
          status?: 'active' | 'returned' | 'overdue'
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
          status?: 'active' | 'returned' | 'overdue'
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