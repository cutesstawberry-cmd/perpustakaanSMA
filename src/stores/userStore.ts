import { create } from 'zustand'
import { supabase, supabaseAdmin } from '@/lib/supabase'
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
  createUser: (memberId: string, password: string, userData: Partial<Profile>) => Promise<void>
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
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      set(state => ({
        users: state.users.filter(user => user.id !== userId)
      }))

      toast.success('User deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
      throw error
    }
  },

  createUser: async (memberId, password, userData) => {
    try {
      console.log('Creating user with member ID:', memberId)
      console.log('User data:', userData)
      
      // Generate a unique UUID for the user
      const userId = crypto.randomUUID()
      
      // Create profile directly in profiles table
      // Users created by admin are members by default (unless specified otherwise)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          full_name: userData.full_name || memberId,
          role: userData.role || 'member', // Default to member for admin-created users
          member_id: memberId,
          phone: userData.phone,
          address: userData.address,
          // Store password in a simple way (in production, use proper hashing)
          password: password, // This will be stored as plain text for demo
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation failed:', profileError)
        throw new Error('Failed to create user profile: ' + profileError.message)
      }

      console.log('Profile created successfully:', profileData)

      // Refresh users list
      await get().fetchUsers()
      toast.success('User created successfully!')
    } catch (error: any) {
      console.error('User creation failed:', error)
      toast.error(error.message || 'Failed to create user')
      throw error
    }
  }
}))