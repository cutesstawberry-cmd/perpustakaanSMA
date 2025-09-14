import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'
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

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (emailOrMemberId: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  createUser: (email: string, password: string, userData: Partial<Profile>) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,

  signIn: async (emailOrMemberId: string, password: string) => {
    try {
      set({ loading: true })
      console.log('Auth store: Attempting sign in with:', emailOrMemberId)
      
      // Check if it's an email (admin) or member_id (user)
      if (emailOrMemberId.includes('@')) {
        // Admin login with email
        console.log('Auth store: Admin login with email:', emailOrMemberId)
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrMemberId,
          password,
        })

        console.log('Auth store: Sign in response:', { data, error })

        if (error) {
          console.error('Auth store: Sign in error:', error)
          throw error
        }

        if (data.user && data.session) {
          console.log('Auth store: Sign in successful, setting user and session')
          set({ user: data.user, session: data.session })
          await get().fetchProfile()
          toast.success('Successfully signed in!')
        } else {
          console.error('Auth store: No user or session in response')
          throw new Error('No user or session returned')
        }
      } else {
        // User login with member_id - simple validation
        console.log('Auth store: User login with member ID:', emailOrMemberId)
        
        // Check user credentials
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('member_id', emailOrMemberId)
          .single()

        if (error || !profile) {
          throw new Error('Invalid member ID or password')
        }

        // Check password (in production, use proper hashing)
        if (password !== profile.password) {
          throw new Error('Invalid member ID or password')
        }

        // Create a mock user object for consistency
        const mockUser = {
          id: profile.id,
          email: `${emailOrMemberId}@library.local`,
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: profile.created_at,
        }

        const mockSession = {
          access_token: 'mock_token',
          refresh_token: 'mock_refresh_token',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer',
          user: mockUser,
        }

        set({ user: mockUser, session: mockSession, profile })
        
        // Save member session to localStorage for persistence
        localStorage.setItem('memberSession', JSON.stringify({
          user: mockUser,
          session: mockSession
        }))
        
        toast.success('Successfully signed in!')
      }
    } catch (error: any) {
      console.error('Auth store: Sign in failed:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    try {
      const { user } = get()
      
      // Only call Supabase signOut for admin users
      if (user && user.email && !user.email.includes('@library.local')) {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      }
      
      set({ user: null, profile: null, session: null })
      localStorage.removeItem('memberSession')
      toast.success('Successfully signed out!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out')
    }
  },

  fetchProfile: async () => {
    try {
      const { user } = get()
      if (!user) {
        console.log('No user found, skipping profile fetch')
        return
      }

      console.log('Fetching profile for user:', user.id)

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile exists, create default profile
        console.log('No profile found, creating default profile')
        
        // All users created directly in Supabase Auth are admins
        // Users created by admin through the app are members
        const defaultRole = 'admin' // Supabase Auth users are admins
        console.log(`Creating profile with role: ${defaultRole}`)
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.email || 'User',
            role: defaultRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
          return
        }

        // Fetch the newly created profile
        ({ data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single())
      }

      if (error) {
        console.error('Error fetching profile:', error)
        // Don't throw error, just log it and continue
        return
      }

      if (data) {
        console.log('Profile fetched successfully:', data)
        set({ profile: data })
      } else {
        console.log('No profile data returned')
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error.message)
      // Don't throw error to prevent app crash
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      const { user } = get()
      if (!user) throw new Error('No user found')

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      set({ profile: data })
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  },

  createUser: async (email: string, password: string, userData: Partial<Profile>) => {
    try {
      const { profile } = get()
      if (!profile || profile.role !== 'admin') {
        throw new Error('Only admins can create users')
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
      })

      if (authError) throw authError

      if (!authData.user) throw new Error('Failed to create user')

      // Create profile for the new user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: userData.full_name || email,
          role: userData.role || 'member',
          member_id: userData.member_id,
          phone: userData.phone,
          address: userData.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) {
        // If profile creation fails, we should clean up the auth user
        // Note: This requires admin privileges
        console.error('Profile creation failed:', profileError)
        throw new Error('Failed to create user profile')
      }

      toast.success('User created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
      throw error
    }
  },

  initialize: async () => {
    try {
      set({ loading: true })
      
      // First try to restore member session from localStorage
      const savedMemberSession = localStorage.getItem('memberSession')
      if (savedMemberSession) {
        try {
          const memberData = JSON.parse(savedMemberSession)
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', memberData.user.id)
            .single()
          
          if (!error && profile) {
            set({ 
              user: memberData.user, 
              session: memberData.session, 
              profile 
            })
            console.log('Member session restored from localStorage')
            return
          }
        } catch (e) {
          console.error('Failed to restore member session:', e)
          localStorage.removeItem('memberSession')
        }
      }
      
      // Try Supabase Auth session (for admin users)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        set({ user: session.user, session })
        await get().fetchProfile()
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          set({ user: session.user, session })
          await get().fetchProfile()
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, session: null })
          localStorage.removeItem('memberSession')
        }
      })
    } catch (error: any) {
      console.error('Auth initialization error:', error.message)
    } finally {
      set({ loading: false })
    }
  }
}))