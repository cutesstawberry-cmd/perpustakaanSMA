import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface Book {
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

interface BookFilters {
  search: string
  genre: string
  author: string
  available: boolean
}

interface BookState {
  books: Book[]
  loading: boolean
  filters: BookFilters
  pagination: {
    page: number
    limit: number
    total: number
  }
  fetchBooks: () => Promise<void>
  addBook: (book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'qr_code'>) => Promise<void>
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>
  deleteBook: (id: string) => Promise<void>
  setFilters: (filters: Partial<BookFilters>) => void
  setPagination: (pagination: Partial<BookState['pagination']>) => void
  generateQRCode: (bookId: string) => Promise<void>
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  loading: false,
  filters: {
    search: '',
    genre: '',
    author: '',
    available: false
  },
  pagination: {
    page: 1,
    limit: 12,
    total: 0
  },

  fetchBooks: async () => {
    try {
      set({ loading: true })
      const { filters, pagination } = get()
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(
          (pagination.page - 1) * pagination.limit,
          pagination.page * pagination.limit - 1
        )

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,author.ilike.%${filters.search}%`)
      }
      if (filters.genre) {
        query = query.eq('genre', filters.genre)
      }
      if (filters.author) {
        query = query.ilike('author', `%${filters.author}%`)
      }
      if (filters.available) {
        query = query.gt('available_copies', 0)
      }

      const { data, error, count } = await query

      if (error) throw error

      set({ 
        books: data || [],
        pagination: { ...pagination, total: count || 0 }
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch books')
    } finally {
      set({ loading: false })
    }
  },

  addBook: async (book) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert(book)
        .select()
        .single()

      if (error) throw error

      // Generate QR code
      if (data) {
        await get().generateQRCode(data.id)
        await get().fetchBooks()
        toast.success('Book added successfully!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add book')
      throw error
    }
  },

  updateBook: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set(state => ({
        books: state.books.map(book => 
          book.id === id ? { ...book, ...data } : book
        )
      }))

      toast.success('Book updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update book')
      throw error
    }
  },

  deleteBook: async (id) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        books: state.books.filter(book => book.id !== id)
      }))

      toast.success('Book deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete book')
      throw error
    }
  },

  generateQRCode: async (bookId: string) => {
    try {
      const qrCodeData = await QRCode.toDataURL(`BOOK:${bookId}`)
      
      const { error } = await supabase
        .from('books')
        .update({ qr_code: qrCodeData })
        .eq('id', bookId)

      if (error) throw error
    } catch (error: any) {
      console.error('Failed to generate QR code:', error.message)
    }
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 }
    }))
  },

  setPagination: (newPagination) => {
    set(state => ({
      pagination: { ...state.pagination, ...newPagination }
    }))
  }
}))