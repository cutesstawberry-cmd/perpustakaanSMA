import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { supabase } from '@/lib/supabase'
import { 
  BookOpen, 
  Users, 
  Books, 
  Warning, 
  TrendUp,
  Clock,
  CheckCircle,
  XCircle 
} from '@phosphor-icons/react'

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
  const { borrowings, fetchBorrowings, loading: storeLoading } = useBorrowingStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    availableBooks: 0,
    totalUsers: 0,
    activeBorrowings: 0,
    overdueBorrowings: 0,
    totalBorrowingsToday: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    
    if (profile?.role === 'member' && profile?.id) {
      fetchBorrowings(profile.id)
    }
  }, [profile?.id])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor, valueColor, useStoreLoading = false }: {
    title: string
    value: number | string
    subtitle: string
    icon: any
    iconBg?: string
    iconColor?: string
    valueColor?: string
    useStoreLoading?: boolean
  }) => (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-800/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
        <CardTitle className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 tracking-wide uppercase truncate flex-1 mr-2">
          {title}
        </CardTitle>
        <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${iconBg || 'bg-blue-50 dark:bg-blue-900/20'} flex-shrink-0`}>
          <Icon
            size={16}
            className={`${iconColor || 'text-blue-600 dark:text-blue-400'} sm:w-5 sm:h-5`}
            weight="duotone"
          />
        </div>
      </CardHeader>
      <CardContent className="pb-3 sm:pb-4">
        <div className={`text-2xl sm:text-3xl font-bold mb-1 ${valueColor || 'text-gray-900 dark:text-white'} break-words`}>
          {(useStoreLoading ? storeLoading : loading) ? (
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-6 sm:h-8 w-12 sm:w-16 rounded"></div>
          ) : (
            value
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium break-words leading-tight">
          {subtitle}
        </p>
      </CardContent>
      <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 transform translate-x-6 -translate-y-6 sm:translate-x-8 sm:-translate-y-8 opacity-5">
        <Icon size={60} className={`${iconColor || 'text-blue-600 dark:text-blue-400'} sm:w-20 sm:h-20`} />
      </div>
    </Card>
  )

  const renderAdminDashboard = () => (
    <div className="space-y-6 sm:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Buku"
          value={stats.totalBooks}
          subtitle={`${stats.availableBooks} tersedia`}
          icon={BookOpen}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        
        <StatCard
          title="Total Pengguna"
          value={stats.totalUsers}
          subtitle="Anggota terdaftar"
          icon={Users}
          iconBg="bg-green-50 dark:bg-green-900/20"
          iconColor="text-green-600 dark:text-green-400"
        />
        
        <StatCard
          title="Peminjaman Aktif"
          value={stats.activeBorrowings}
          subtitle="Sedang dipinjam"
          icon={Books}
          iconBg="bg-purple-50 dark:bg-purple-900/20"
          iconColor="text-purple-600 dark:text-purple-400"
        />
        
        <StatCard
          title="Buku Terlambat"
          value={stats.overdueBorrowings}
          subtitle="Perlu perhatian"
          icon={Warning}
          iconBg="bg-red-50 dark:bg-red-900/20"
          iconColor="text-red-600 dark:text-red-400"
          valueColor="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Activity Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex-shrink-0">
              <TrendUp size={20} className="text-indigo-600 dark:text-indigo-400 sm:w-6 sm:h-6" weight="duotone" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                Aktivitas Hari Ini
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                Ringkasan aktivitas perpustakaan hari ini
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-3 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-sm w-full sm:w-auto">
              <div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <BookOpen size={16} className="text-green-600 dark:text-green-400 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-5 sm:h-6 w-6 sm:w-8 rounded"></div>
                  ) : (
                    stats.totalBorrowingsToday
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                  Buku dipinjam hari ini
                </div>
              </div>
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
      <div className="space-y-6 sm:space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Buku Dipinjam"
            value={activeBorrowings.length}
            subtitle="Sedang dengan Anda"
            icon={Books}
            iconBg="bg-blue-50 dark:bg-blue-900/20"
            iconColor="text-blue-600 dark:text-blue-400"
            useStoreLoading={true}
          />
          
          <StatCard
            title="Buku Terlambat"
            value={overdueBorrowings.length}
            subtitle="Harap segera dikembalikan"
            icon={Warning}
            iconBg="bg-red-50 dark:bg-red-900/20"
            iconColor="text-red-600 dark:text-red-400"
            valueColor="text-red-600 dark:text-red-400"
            useStoreLoading={true}
          />
          
          <StatCard
            title="Total Dipinjam"
            value={userBorrowings.length}
            subtitle="Sepanjang waktu"
            icon={Clock}
            iconBg="bg-gray-50 dark:bg-gray-700"
            iconColor="text-gray-600 dark:text-gray-400"
            useStoreLoading={true}
          />
        </div>

        {/* Current Books */}
        {activeBorrowings.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <BookOpen size={20} className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" weight="duotone" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                    Buku Anda Saat Ini
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                    Buku yang sedang Anda pinjam
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {activeBorrowings.slice(0, 5).map((borrowing, index) => (
                  <div 
                    key={borrowing.id} 
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md hover:bg-white dark:hover:bg-gray-800 space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-12 sm:w-12 sm:h-16 bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm flex items-center justify-center border border-blue-200 dark:border-blue-700">
                          <BookOpen size={16} className="text-blue-600 dark:text-blue-400 sm:w-5 sm:h-5" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                          {borrowing.books?.title || 'Buku Tidak Diketahui'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1 mt-1">
                          <Clock size={12} className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                          <span className="truncate">Jatuh tempo: {new Date(borrowing.due_date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end space-x-2 sm:space-x-0 sm:space-y-1">
                      {new Date(borrowing.due_date) < new Date() ? (
                        <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                          <XCircle size={12} weight="fill" className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                          <span className="text-xs font-bold">Terlambat</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                          <CheckCircle size={12} weight="fill" className="flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                          <span className="text-xs font-bold">Aktif</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {Math.ceil((new Date(borrowing.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} hari tersisa
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No books message */}
        {activeBorrowings.length === 0 && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/10">
            <CardContent className="py-8 sm:py-12">
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <BookOpen size={24} className="text-blue-600 dark:text-blue-400 sm:w-8 sm:h-8" weight="duotone" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Belum Ada Buku Dipinjam
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm mx-auto px-4">
                  Jelajahi koleksi kami dan pinjam buku favorit Anda berikutnya!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 truncate">
                Dashboard
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                Selamat datang kembali, <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {profile?.full_name || 'Pengguna'}
                </span>! 👋
              </p>
            </div>
            <div className="flex-shrink-0">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2 flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        {profile?.role === 'member' ? renderMemberDashboard() : renderAdminDashboard()}
      </div>
    </div>
  )
}