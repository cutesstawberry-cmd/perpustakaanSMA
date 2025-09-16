import { create } from 'zustand'
import { supabase, supabaseMember } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import toast from 'react-hot-toast'
import { addDays, isAfter, differenceInDays } from 'date-fns'

interface Borrowing {
  id: string
  user_id: string
  book_id: string
  borrow_date: string
  due_date: string
  return_date: string | null
  status: 'active' | 'returned' | 'overdue' | 'pending_return'
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
    avatar_url: string | null
  }
}

interface BorrowingState {
  borrowings: Borrowing[]
  loading: boolean
  fetchBorrowings: (userId?: string) => Promise<void>
  borrowBook: (bookId: string, userId: string, daysToReturn: number) => Promise<void>
  createBorrowingForUser: (bookId: string, userId: string, dueDate: string) => Promise<void>
  requestReturn: (borrowingId: string) => Promise<void>
  approveReturn: (borrowingId: string) => Promise<void>
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
      
      // Use appropriate client based on user role
      const { profile } = useAuthStore.getState()
      const client = profile?.role === 'member' ? supabaseMember : supabase
      
      let query = client
        .from('borrowings')
        .select(`
          *,
          books (title, author, cover_url)
        `)
        .order('created_at', { ascending: false })

      if (userId) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query

      if (error) throw error

      // For members, we need to fetch profile data separately since RLS might block the join
      if (profile?.role === 'member' && data) {
        // Add profile data manually for member users
        const borrowingsWithProfiles = data.map(borrowing => ({
          ...borrowing,
          profiles: {
            full_name: profile.full_name,
            member_id: profile.member_id,
            avatar_url: profile?.avatar_url || null
          }
        }))
        set({ borrowings: borrowingsWithProfiles })
      } else {
        // For admin/librarian, try to get profiles data with separate query if needed
        if (data && data.length > 0) {
          try {
            const profileQuery = client
              .from('profiles')
              .select('id, full_name, member_id, avatar_url')
              .in('id', data.map(b => b.user_id))
            
            const { data: profiles } = await profileQuery
            
            const borrowingsWithProfiles = data.map(borrowing => {
              const userProfile = profiles?.find(p => p.id === borrowing.user_id)
              return {
                ...borrowing,
                profiles: userProfile ? {
                  full_name: userProfile.full_name,
                  member_id: userProfile.member_id,
                  avatar_url: userProfile.avatar_url
                } : null
              }
            })
            
            set({ borrowings: borrowingsWithProfiles })
          } catch (profileError) {
            console.warn('Could not fetch profile data:', profileError)
            set({ borrowings: data })
          }
        } else {
          set({ borrowings: data || [] })
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch borrowings')
    } finally {
      set({ loading: false })
    }
  },

  borrowBook: async (bookId, userId, daysToReturn = 14) => {
    try {
      // Use appropriate client based on user role
      const { profile } = useAuthStore.getState()
      const client = profile?.role === 'member' ? supabaseMember : supabase
      
      console.log('Borrowing book with:', { bookId, userId, profile: profile?.role })
      
      // Check if book is available using the database function
      const { data: isAvailable, error: availError } = await client
        .rpc('is_book_available', { p_book_id: bookId })
  
      if (availError) {
        console.error('Error checking book availability:', availError)
        throw availError
      }
      
      if (!isAvailable) {
        throw new Error('Book is not available for borrowing')
      }
  
      // Also check available_copies for UI consistency (optional but informative)
      const { data: book, error: bookError } = await client
        .from('books')
        .select('available_copies, total_copies')
        .eq('id', bookId)
        .single()
  
      if (bookError) {
        console.error('Error fetching book details:', bookError)
        // Still proceed if RPC succeeded, but log warning
      }
      
      if (book && book.available_copies <= 0) {
        console.warn('Book available_copies is 0, but RPC says available. Possible sync issue.')
      }

      const borrowDate = new Date().toISOString()
      const dueDate = addDays(new Date(), daysToReturn).toISOString()

      console.log('Creating borrowing record with:', {
        user_id: userId,
        book_id: bookId,
        borrow_date: borrowDate,
        due_date: dueDate
      })

      // Create borrowing record
      const { error: borrowingError } = await client
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

      if (borrowingError) {
        console.error('Error creating borrowing:', borrowingError)
        throw borrowingError
      }
      
      // Decrement available copies
      const { data: currentBook, error: fetchBookError } = await client
        .from('books')
        .select('available_copies')
        .eq('id', bookId)
        .single()
      
      if (fetchBookError) {
        console.error('Could not fetch book for update:', fetchBookError)
      } else if (currentBook && currentBook.available_copies > 0) {
        const { error: updateError } = await client
          .from('books')
          .update({ available_copies: currentBook.available_copies - 1 })
          .eq('id', bookId)
        if (updateError) {
          console.error('Failed to decrement available copies:', updateError)
        }
      }
      
      await get().fetchBorrowings(userId)
      toast.success('Book borrowed successfully!')
    } catch (error: any) {
      console.error('Failed to borrow book:', error)
      toast.error(error.message || 'Failed to borrow book')
      throw error
    }
  },

  createBorrowingForUser: async (bookId, userId, dueDate) => {
    try {
      // This function is specifically for admin/librarian to create borrowings on behalf of users
      const { profile } = useAuthStore.getState()
      
      if (!['admin', 'librarian'].includes(profile?.role || '')) {
        throw new Error('Only admins and librarians can create borrowings for users')
      }
      
      console.log('Admin creating borrowing for user:', { bookId, userId, dueDate, admin: profile?.role })
      
      // Check if book is available using the database function
      const { data: isAvailable, error: availError } = await supabase
        .rpc('is_book_available', { p_book_id: bookId })
  
      if (availError) {
        console.error('Error checking book availability:', availError)
        throw availError
      }
      
      if (!isAvailable) {
        throw new Error('Book is not available for borrowing')
      }

      // Verify user exists and is a member
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, member_id, role')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        throw new Error('User not found')
      }

      if (user.role !== 'member') {
        throw new Error('Can only create borrowings for member users')
      }

      const borrowDate = new Date().toISOString()

      console.log('Creating borrowing record for user:', {
        user_id: userId,
        book_id: bookId,
        borrow_date: borrowDate,
        due_date: dueDate,
        user_name: user.full_name,
        member_id: user.member_id
      })

      // Create borrowing record
      const { error: borrowingError } = await supabase
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

      if (borrowingError) {
        console.error('Error creating borrowing:', borrowingError)
        throw borrowingError
      }
      
      // Decrement available copies
      const { data: currentBook, error: fetchBookError } = await supabase
        .from('books')
        .select('available_copies')
        .eq('id', bookId)
        .single()
      
      if (fetchBookError) {
        console.error('Could not fetch book for update:', fetchBookError)
      } else if (currentBook && currentBook.available_copies > 0) {
        const { error: updateError } = await supabase
          .from('books')
          .update({ available_copies: currentBook.available_copies - 1 })
          .eq('id', bookId)
        if (updateError) {
          console.error('Failed to decrement available copies:', updateError)
        }
      }
      
      // Refresh borrowings list for admin view
      await get().fetchBorrowings()
      toast.success(`Book borrowed successfully for ${user.full_name || user.member_id}!`)
    } catch (error: any) {
      console.error('Failed to create borrowing for user:', error)
      toast.error(error.message || 'Failed to create borrowing for user')
      throw error
    }
  },

  requestReturn: async (borrowingId) => {
    try {
      const { profile } = useAuthStore.getState()
      const client = profile?.role === 'member' ? supabaseMember : supabase

      // Get borrowing to verify ownership
      const { data: borrowing, error: borrowingError } = await client
        .from('borrowings')
        .select('id, status, user_id')
        .eq('id', borrowingId)
        .single()

      if (borrowingError) throw borrowingError
      if (!borrowing) throw new Error('Borrowing record not found')
      if (borrowing.status !== 'active') throw new Error('Only active borrowings can be returned')
      if (borrowing.user_id !== profile?.id) throw new Error('You can only request return for your own borrowings')

      const { error: updateError } = await client
        .from('borrowings')
        .update({ status: 'pending_return' })
        .eq('id', borrowingId)

      if (updateError) throw updateError

      await get().fetchBorrowings(profile?.id)
      toast.success('Return request submitted! Waiting for admin approval.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to request return')
      throw error
    }
  },

  approveReturn: async (borrowingId) => {
    try {
      const { profile } = useAuthStore.getState()
      if (!['admin', 'librarian'].includes(profile?.role || '')) {
        throw new Error('Only admins and librarians can approve returns')
      }

      // Get borrowing details
      const { data: borrowing, error: borrowingError } = await supabase
        .from('borrowings')
        .select('*, books (id, available_copies, total_copies)')
        .eq('id', borrowingId)
        .single()

      if (borrowingError) throw borrowingError
      if (!borrowing) throw new Error('Borrowing record not found')
      if (borrowing.status !== 'pending_return') throw new Error('Only pending returns can be approved')

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
      
      // Increment available copies
      const newAvailableCopies = borrowing.books.available_copies + 1
      const totalCopies = borrowing.books.total_copies || 999 // fallback large number
      const finalAvailable = Math.min(newAvailableCopies, totalCopies)
      
      const { error: bookUpdateError } = await supabase
        .from('books')
        .update({ available_copies: finalAvailable })
        .eq('id', borrowing.book_id)
      
      if (bookUpdateError) {
        console.error('Failed to increment available copies on return:', bookUpdateError)
      }
      
      await get().fetchBorrowings()
      
      if (fine > 0) {
        toast.success(`Book returned with fine: $${fine.toFixed(2)}`)
      } else {
        toast.success('Book returned successfully!')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve return')
      throw error
    }
  },

  returnBook: async (borrowingId) => {
    // Backward compatibility - for admin direct returns (treat as approve)
    await get().approveReturn(borrowingId)
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