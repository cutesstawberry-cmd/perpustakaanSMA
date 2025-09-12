import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useBookStore } from '@/stores/bookStore'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { supabase } from '@/lib/supabase'
import { BookOpen, Users, Library, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

interface DashboardStats {
  totalBooks: number
  availableBooks: number
  totalUsers: number
  activeBorrowings: number
  overdueBorrowings: number
  totalBorrowingsToday: number
}

export function Dashboard() {
  const { profile } = useAuthStore()
  const { books } = useBookStore()
  const { borrowings } = useBorrowingStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    availableBooks: 0,
    totalUsers: 0,
    activeBorrowings: 0,
    overdueBorrowings: 0,
    totalBorrowingsToday: 0
  })

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch books stats
      const { data: booksData } = await supabase
        .from('books')
        .select('total_copies, available_copies')

      // Fetch users count (only for admin/librarian)
      let usersCount = 0
      if (profile?.role === 'admin' || profile?.role === 'librarian') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        usersCount = count || 0
      }

      // Fetch borrowings stats
      const { data: borrowingsData } = await supabase
        .from('borrowings')
        .select('status, created_at, due_date')

      const today = new Date().toISOString().split('T')[0]
      
      const activeBorrowings = borrowingsData?.filter(b => b.status === 'active').length || 0
      const overdueBorrowings = borrowingsData?.filter(b => 
        b.status === 'overdue' || 
        (b.status === 'active' && new Date(b.due_date) < new Date())
      ).length || 0
      const todayBorrowings = borrowingsData?.filter(b => 
        b.created_at.startsWith(today)
      ).length || 0

      setStats({
        totalBooks: booksData?.reduce((sum, book) => sum + book.total_copies, 0) || 0,
        availableBooks: booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0,
        totalUsers: usersCount,
        activeBorrowings,
        overdueBorrowings,
        totalBorrowingsToday: todayBorrowings
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const renderAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Books</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBooks}</div>
          <p className="text-xs text-muted-foreground">
            {stats.availableBooks} available
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Registered members
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Borrowings</CardTitle>
          <Library className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeBorrowings}</div>
          <p className="text-xs text-muted-foreground">
            Currently borrowed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdueBorrowings}</div>
          <p className="text-xs text-muted-foreground">
            Need attention
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
          <CardDescription>
            Overview of today's library activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">
                {stats.totalBorrowingsToday} books borrowed today
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMemberDashboard = () => {
    const userBorrowings = borrowings.filter(b => b.user_id === profile?.id)
    const activeBorrowings = userBorrowings.filter(b => b.status === 'active')
    const overdueBorrowings = userBorrowings.filter(b => 
      b.status === 'overdue' || 
      (b.status === 'active' && new Date(b.due_date) < new Date())
    )

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Borrowed</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBorrowings.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently with you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueBorrowings.length}</div>
            <p className="text-xs text-muted-foreground">
              Please return soon
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBorrowings.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        {activeBorrowings.length > 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Your Current Books</CardTitle>
              <CardDescription>
                Books currently borrowed by you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeBorrowings.slice(0, 5).map((borrowing) => (
                  <div key={borrowing.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{borrowing.books?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(borrowing.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {new Date(borrowing.due_date) < new Date() ? (
                        <span className="text-xs text-red-600 font-medium">Overdue</span>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {profile?.full_name || 'User'}!
        </p>
      </div>

      {profile?.role === 'member' ? renderMemberDashboard() : renderAdminDashboard()}
    </div>
  )
}