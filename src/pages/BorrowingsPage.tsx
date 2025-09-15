import { useEffect, useState } from 'react'
import { Card, Button, Input, Tag, Avatar, Space, Row, Col, Alert, Empty } from 'antd'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { useAuthStore } from '@/stores/authStore'
import { 
  MagnifyingGlass,
  Clock,
  CheckCircle,
  Warning,
  Calendar,
  Book,
  CalendarX
} from '@phosphor-icons/react'
import { format, isAfter } from 'date-fns'
import { id } from 'date-fns/locale'

const { Search } = Input

export function BorrowingsPage() {
  const { profile } = useAuthStore()
  const { borrowings, loading, fetchBorrowings, updateOverdueBorrowings } = useBorrowingStore()

  const isMember = profile?.role === 'member'
  const userId = isMember ? profile?.id : undefined
  const overdueBorrowings = borrowings.filter(b => b.status === 'overdue' || (b.status === 'active' && isAfter(new Date(), new Date(b.due_date))))
  const hasOverdue = overdueBorrowings.length > 0 && isMember
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'overdue' | 'returned' | 'pending_return'>('all')

  useEffect(() => {
    fetchBorrowings(userId)
    updateOverdueBorrowings()
  }, [fetchBorrowings, updateOverdueBorrowings, userId])

  const filteredBorrowings = borrowings.filter(borrowing => {
    const title = borrowing.books?.title?.toLowerCase() || ''
    const author = borrowing.books?.author?.toLowerCase() || ''
    const fullName = borrowing.profiles?.full_name?.toLowerCase() || ''
    const memberId = borrowing.profiles?.member_id?.toLowerCase() || ''

    const matchesSearch =
      title.includes(searchTerm.toLowerCase()) ||
      author.includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase()) ||
      memberId.includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === 'all' || borrowing.status === filterStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === 'returned') {
      return (
        <Tag color="success" icon={<CheckCircle size={14} weight="fill" />}>
          Dikembalikan
        </Tag>
      )
    }

    if (status === 'pending_return') {
      return (
        <Tag color="warning" icon={<Clock size={14} weight="fill" />}>
          Menunggu Pengembalian
        </Tag>
      )
    }

    if (status === 'overdue' || (status === 'active' && isAfter(new Date(), new Date(dueDate)))) {
      return (
        <Tag color="error" icon={<Warning size={14} weight="fill" />}>
          Terlambat
        </Tag>
      )
    }

    return (
      <Tag color="processing" icon={<Clock size={14} weight="fill" />}>
        Aktif
      </Tag>
    )
  }

  const getStatusText = (status: string) => {
    const statusMap = {
      'all': 'Semua',
      'active': 'Aktif',
      'overdue': 'Terlambat',
      'returned': 'Dikembalikan',
      'pending_return': 'Menunggu Pengembalian'
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const handleMemberReturn = async (borrowingId: string) => {
    if (window.confirm('Ajukan pengembalian buku ini? Persetujuan admin diperlukan.')) {
      try {
        await useBorrowingStore.getState().requestReturn(borrowingId)
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const handleAdminReturn = async (borrowingId: string) => {
    if (window.confirm('Kembalikan buku ini? Ini akan menyelesaikan proses peminjaman.')) {
      try {
        await useBorrowingStore.getState().returnBook(borrowingId)
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: id })
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isMember ? 'Peminjaman Saya' : 'Semua Peminjaman'}
              </h1>
              <p className="text-gray-600 text-lg">
                {isMember ? 'Lacak buku-buku yang Anda pinjam' : 'Kelola semua peminjaman perpustakaan'}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Book size={20} className="text-blue-600" weight="duotone" />
                <span className="text-sm font-medium text-blue-800">
                  {filteredBorrowings.length} Peminjaman
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Alert */}
        {hasOverdue && (
          <Alert
            type="error"
            showIcon
            icon={<Warning size={20} weight="fill" />}
            message="Peringatan Buku Terlambat!"
            description={
              <div>
                <p className="mb-2">
                  Anda memiliki {overdueBorrowings.length} buku yang terlambat dikembalikan. 
                  Harap kembalikan sesegera mungkin untuk menghindari denda.
                </p>
                <Button
                  type="link"
                  size="small"
                  onClick={() => setFilterStatus('overdue')}
                  className="p-0 h-auto text-red-600 hover:text-red-700"
                >
                  {overdueBorrowings.length === 1 ? 'Lihat Buku Terlambat' : 'Lihat Buku-buku Terlambat'}
                </Button>
              </div>
            }
            className="mb-6"
          />
        )}

        {/* Search and Filters */}
        <Card className="mb-6 shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={16}>
              <Search
                placeholder={isMember ? "Cari buku Anda..." : "Cari buku atau anggota..."}
                prefix={<MagnifyingGlass size={16} className="text-gray-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="large"
                className="w-full"
              />
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Space wrap className="w-full justify-end">
                {(['all', 'active', 'overdue', 'returned', 'pending_return'] as const).map((status) => (
                  <Button
                    key={status}
                    type={filterStatus === status ? 'primary' : 'default'}
                    size="middle"
                    onClick={() => setFilterStatus(status)}
                    className={`${filterStatus === status ? 'shadow-md' : ''}`}
                  >
                    {getStatusText(status)}
                  </Button>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} loading className="shadow-sm">
                <div className="h-32"></div>
              </Card>
            ))}
          </div>
        ) : filteredBorrowings.length === 0 ? (
          <Card className="shadow-sm">
            <Empty
              image={<CalendarX size={64} className="text-gray-400 mx-auto" weight="duotone" />}
              imageStyle={{ height: 80 }}
              description={
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada peminjaman ditemukan
                  </h3>
                  <p className="text-gray-500">
                    {isMember 
                      ? "Anda belum meminjam buku apapun." 
                      : "Tidak ada catatan peminjaman yang sesuai dengan kriteria Anda."
                    }
                  </p>
                </div>
              }
              className="py-12"
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBorrowings.map((borrowing) => (
              <Card 
                key={borrowing.id} 
                className="shadow-sm hover:shadow-md transition-shadow duration-200"
                bodyStyle={{ padding: '24px' }}
              >
                <Row gutter={[24, 16]} align="middle">
                  {/* Book Cover */}
                  <Col xs={4} sm={3} md={2}>
                    <div className="w-full aspect-[3/4] bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg flex items-center justify-center shadow-sm border border-blue-200">
                      {borrowing.books?.cover_url ? (
                        <img
                          src={borrowing.books.cover_url}
                          alt={borrowing.books?.title || 'Sampul buku'}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Book size={24} className="text-blue-600" weight="duotone" />
                      )}
                    </div>
                  </Col>

                  {/* Book Info */}
                  <Col xs={20} sm={21} md={14}>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                        {borrowing.books?.title || 'Judul Tidak Diketahui'}
                      </h3>
                      <p className="text-gray-600 font-medium">
                        oleh {borrowing.books?.author || 'Penulis Tidak Diketahui'}
                      </p>

                      {!isMember && (
                        <div className="flex items-center space-x-3 mt-3">
                          <Avatar 
                            size="small" 
                            src={borrowing.profiles?.avatar_url}
                            className="border-2 border-blue-200"
                          >
                            {getInitials(borrowing.profiles?.full_name ?? 'Tidak Diketahui')}
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {borrowing.profiles?.full_name || 'Pengguna Tidak Diketahui'}
                            </span>
                            {borrowing.profiles?.member_id && (
                              <span className="text-sm text-gray-500">
                                ID: {borrowing.profiles.member_id}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Col>

                  {/* Status and Actions */}
                  <Col xs={24} md={8}>
                    <div className="flex flex-col space-y-3 md:items-end">
                      <div className="flex items-center space-x-3">
                        {getStatusBadge(borrowing.status, borrowing.due_date)}
                        
                        {borrowing.status === 'active' && isMember && (
                          <Button
                            type="primary"
                            ghost
                            size="small"
                            onClick={() => handleMemberReturn(borrowing.id)}
                            icon={<Clock size={14} />}
                          >
                            Ajukan Pengembalian
                          </Button>
                        )}
                        
                        {borrowing.status === 'pending_return' && isMember && (
                          <Tag color="gold" className="px-3 py-1">
                            Menunggu Persetujuan
                          </Tag>
                        )}
                        
                        {borrowing.status === 'active' && !isMember && (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleAdminReturn(borrowing.id)}
                            icon={<CheckCircle size={14} weight="fill" />}
                          >
                            Kembalikan Buku
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Borrowing Details */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Row gutter={[24, 12]} className="text-sm">
                    <Col xs={12} md={6}>
                      <div className="space-y-1">
                        <span className="text-gray-500 block font-medium">Tanggal Pinjam:</span>
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-blue-600" />
                          <span className="font-semibold text-gray-900">
                            {formatDate(borrowing.borrow_date)}
                          </span>
                        </div>
                      </div>
                    </Col>

                    <Col xs={12} md={6}>
                      <div className="space-y-1">
                        <span className="text-gray-500 block font-medium">Batas Kembali:</span>
                        <div className="flex items-center space-x-2">
                          <CalendarX size={14} className={`${
                            isAfter(new Date(), new Date(borrowing.due_date)) && borrowing.status !== 'returned'
                              ? 'text-red-600'
                              : 'text-orange-600'
                          }`} />
                          <span className={`font-semibold ${
                            isAfter(new Date(), new Date(borrowing.due_date)) && borrowing.status !== 'returned'
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}>
                            {formatDate(borrowing.due_date)}
                          </span>
                        </div>
                      </div>
                    </Col>

                    {borrowing.return_date && (
                      <Col xs={12} md={6}>
                        <div className="space-y-1">
                          <span className="text-gray-500 block font-medium">Dikembalikan:</span>
                          <div className="flex items-center space-x-2">
                            <CheckCircle size={14} className="text-green-600" weight="fill" />
                            <span className="font-semibold text-green-600">
                              {formatDate(borrowing.return_date)}
                            </span>
                          </div>
                        </div>
                      </Col>
                    )}

                    {(borrowing.fine_amount && borrowing.fine_amount > 0) && (
                      <Col xs={12} md={6}>
                        <div className="space-y-1">
                          <span className="text-gray-500 block font-medium">Denda:</span>
                          <div className="flex items-center space-x-2">
                            <Warning size={14} className="text-red-600" weight="fill" />
                            <span className="font-semibold text-red-600">
                              Rp {borrowing.fine_amount.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </Col>
                    )}
                  </Row>

                  {/* Days calculation */}
                  {borrowing.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      {isAfter(new Date(), new Date(borrowing.due_date)) ? (
                        <div className="flex items-center space-x-2 text-red-600">
                          <Warning size={14} weight="fill" />
                          <span className="text-sm font-medium">
                            Terlambat {Math.ceil((new Date().getTime() - new Date(borrowing.due_date).getTime()) / (1000 * 60 * 60 * 24))} hari
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Clock size={14} />
                          <span className="text-sm font-medium">
                            Sisa {Math.ceil((new Date(borrowing.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} hari
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}