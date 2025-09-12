import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { addDays, isAfter, differenceInDays } from 'date-fns'

interface Borrowing {
  id: string
  user_id: string
  book_id: string
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'active' | 'returned' | 'overdue'
  fine_amount: number
  created_at: string
  books?: {
    title: string
    author: string
    cover_url: string | null
  }
  profiles?: {
    full_name: string | null
    member_id: string | null
  }
}

interface BorrowingState {
  borrowings: Borrowing[]
  loading: boolean
  fetchBorrowings: (userId?: string) => Promise<void>
  borrowBook: (bookId: string, userId: string, daysToReturn: number) => Promise<void>
  returnBook: (borrowingId: string) => Promise<void>
  calculateFine: (dueDate: string) => number
  updateOverdueBorrowings: () => Promise<void>
}

export const useBorrowingStore = create<BorrowingState>((set, get) => ({
  borrowings: [],
  loading: false,

  fetchBorrowings: async (userId) => {
    try {
      set({ loading: true })
      let query = supabase
        .from('borrowings')
        .select(`
          *,
          books (title, author, cover_url),
          profiles (full_name, member_id)
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ borrowings: data || [] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch borrowings')
    } finally {
      set({ loading: false })
    }
  },

  borrowBook: async (bookId, userId, daysToReturn = 14) => {
    try {
      // Check if book is available
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('available_copies, total_copies')
        .eq('id', bookId)
        .single()

      if (bookError) throw bookError
      if (!book || book.available_copies <= 0) {
        throw new Error('Book is not available for borrowing')
      }

      const borrowDate = new Date().toISOString()
      const dueDate = addDays(new Date(), daysToReturn).toISOString()

      // Create borrowing record
      const { data: borrowing, error: borrowingError } = await supabase
        .from('borrowings')
        .insert({
          user_id: userId,
          book_id: bookId,
          borrow_date: borrowDate,
          due_date: dueDate,
          status: 'active'
        })
        .select()
        .single()

      if (borrowingError) throw borrowingError

      // Update book availability
      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          available_copies: book.available_copies - 1 
        })
        .eq('id', bookId)

      if (updateError) throw updateError

      await get().fetchBorrowings(userId)
      toast.success('Book borrowed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to borrow book')
      throw error
    }
  },

  returnBook: async (borrowingId) => {
    try {
      // Get borrowing details
      const { data: borrowing, error: borrowingError } = await supabase
        .from('borrowings')
        .select('*, books (id, available_copies)')
        .eq('id', borrowingId)
        .single()

      if (borrowingError) throw borrowingError
      if (!borrowing) throw new Error('Borrowing record not found')

      const returnDate = new Date().toISOString()
      const fine = get().calculateFine(borrowing.due_date)

      // Update borrowing record
      const { error: updateBorrowingError } = await supabase
        .from('borrowings')
        .update({
          return_date: returnDate,
          status: 'returned',
          fine_amount: fine
        })
        .eq('id', borrowingId)

      if (updateBorrowingError) throw updateBorrowingError

      // Update book availability
      const { error: updateBookError } = await supabase
        .from('books')
        .update({ 
          available_copies: (borrowing.books?.available_copies || 0) + 1 
        })
        .eq('id', borrowing.book_id)

      if (updateBookError) throw updateBookError

      await get().fetchBorrowings()
      
      if (fine > 0) {
        toast.success(`Book returned with fine: $${fine.toFixed(2)}`)
      } else {
        toast.success('Book returned successfully!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to return book')
      throw error
    }
  },

  calculateFine: (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    
    if (isAfter(now, due)) {
      const overdueDays = differenceInDays(now, due)
      return overdueDays * 0.5 // $0.50 per day fine
    }
    
    return 0
  },

  updateOverdueBorrowings: async () => {
    try {
      const { data: overdueBorrowings, error } = await supabase
        .from('borrowings')
        .select('id, due_date, fine_amount')
        .eq('status', 'active')
        .lt('due_date', new Date().toISOString())

      if (error) throw error

      if (overdueBorrowings && overdueBorrowings.length > 0) {
        const updates = overdueBorrowings.map(borrowing => ({
          id: borrowing.id,
          status: 'overdue' as const,
          fine_amount: get().calculateFine(borrowing.due_date)
        }))

        for (const update of updates) {
          await supabase
            .from('borrowings')
            .update({ status: update.status, fine_amount: update.fine_amount })
            .eq('id', update.id)
        }
      }
    } catch (error: any) {
      console.error('Failed to update overdue borrowings:', error.message)
    }
  }
}))