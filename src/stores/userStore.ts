import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Profile {
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

interface UserState {
  users: Profile[]
  loading: boolean
  fetchUsers: () => Promise<void>
  updateUserRole: (userId: string, role: Profile['role']) => Promise<void>
  updateUser: (userId: string, updates: Partial<Profile>) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,

  fetchUsers: async () => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ users: data || [] })
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users')
    } finally {
      set({ loading: false })
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, ...data } : user
        )
      }))

      toast.success('User role updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user role')
      throw error
    }
  },

  updateUser: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      set(state => ({
        users: state.users.map(user =>
          user.id === userId ? { ...user, ...data } : user
        )
      }))

      toast.success('User updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user')
      throw error
    }
  },

  deleteUser: async (userId) => {
    try {
      // First delete from profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Note: Deleting from auth.users requires admin privileges and is not directly supported
      // The user would need to be deleted through Supabase Auth admin API

      set(state => ({
        users: state.users.filter(user => user.id !== userId)
      }))

      toast.success('User deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
      throw error
    }
  }
}))