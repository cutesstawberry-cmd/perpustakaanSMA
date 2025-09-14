import { useEffect, useState } from 'react'
import { Card, Button, Input, Tag, Avatar } from 'antd'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { useAuthStore } from '@/stores/authStore'
import { Search, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { format, isAfter } from 'date-fns'

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
      return <Tag color="green" icon={<CheckCircle className="w-3 h-3 mr-1" />}>Returned</Tag>
    }

    if (status === 'pending_return') {
      return <Tag color="gold" icon={<Clock className="w-3 h-3 mr-1" />}>Pending Return</Tag>
    }

    if (status === 'overdue' || (status === 'active' && isAfter(new Date(), new Date(dueDate)))) {
      return <Tag color="red" icon={<AlertTriangle className="w-3 h-3 mr-1" />}>Overdue</Tag>
    }

    return <Tag color="blue" icon={<Clock className="w-3 h-3 mr-1" />}>Active</Tag>
  }

  const handleMemberReturn = async (borrowingId: string) => {
    if (window.confirm('Request to return this book? Admin approval is required.')) {
      try {
        await useBorrowingStore.getState().requestReturn(borrowingId)
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const handleAdminReturn = async (borrowingId: string) => {
    if (window.confirm('Return this book? This will complete the borrowing process.')) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isMember ? 'My Borrowings' : 'All Borrowings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isMember ? 'Track your borrowed books' : 'Manage all library borrowings'}
        </p>
      </div>

      {hasOverdue && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Overdue Books Alert!</h3>
              <p className="text-red-700 dark:text-red-300 text-sm">
                You have {overdueBorrowings.length} overdue book(s). Please return them as soon as possible to avoid fines.
              </p>
              {overdueBorrowings.length === 1 ? (
                <Button
                  type="link"
                  onClick={() => setFilterStatus('overdue')}
                  className="mt-1 p-0 text-red-600 dark:text-red-400"
                >
                  View Overdue Book
                </Button>
              ) : (
                <Button
                  type="link"
                  onClick={() => setFilterStatus('overdue')}
                  className="mt-1 p-0 text-red-600 dark:text-red-400"
                >
                  View Overdue Books
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Input
            placeholder={isMember ? "Search your books..." : "Search books or members..."}
            prefix={<Search className="text-gray-400 h-4 w-4" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'active', 'overdue', 'returned', 'pending_return'] as const).map((status) => (
            <Button
              key={status}
              type={filterStatus === status ? 'primary' : 'default'}
              size="small"
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : filteredBorrowings.length === 0 ? (
        <Card>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No borrowings found</h3>
              <p className="text-gray-500">
                {isMember ? "You haven't borrowed any books yet." : "No borrowing records match your criteria."}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBorrowings.map((borrowing) => (
            <Card key={borrowing.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    {borrowing.books?.cover_url ? (
                      <img
                        src={borrowing.books.cover_url}
                        alt={borrowing.books?.title || 'Book cover'}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Calendar className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold">{borrowing.books?.title || 'Unknown Title'}</h3>
                    <p className="text-sm text-gray-500">
                      by {borrowing.books?.author || 'Unknown Author'}
                    </p>

                    {!isMember && (
                      <div className="flex items-center mt-2 space-x-2">
                        <Avatar size="small" src={borrowing.profiles?.avatar_url}>
                          {getInitials(borrowing.profiles?.full_name ?? 'Unknown')}
                        </Avatar>
                        <span className="text-sm">
                          {borrowing.profiles?.full_name || 'Unknown User'}
                          {borrowing.profiles?.member_id && (
                            <span className="text-gray-500 ml-1">
                              (ID: {borrowing.profiles.member_id})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(borrowing.status, borrowing.due_date)}
                  {borrowing.status === 'active' && isMember && (
                    <Button
                      size="small"
                      onClick={() => handleMemberReturn(borrowing.id)}
                    >
                      Request Return
                    </Button>
                  )}
                  {borrowing.status === 'pending_return' && isMember && (
                    <Tag color="gold">Return Requested</Tag>
                  )}
                  {borrowing.status === 'active' && !isMember && (
                    <Button
                      size="small"
                      onClick={() => handleAdminReturn(borrowing.id)}
                    >
                      Return Book
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Borrowed:</span>
                    <p className="font-medium">
                      {format(new Date(borrowing.borrow_date), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Due Date:</span>
                    <p className={`font-medium ${
                      isAfter(new Date(), new Date(borrowing.due_date)) && borrowing.status !== 'returned'
                        ? 'text-red-600'
                        : ''
                    }`}>
                      {format(new Date(borrowing.due_date), 'MMM dd, yyyy')}
                    </p>
                  </div>

                  {borrowing.return_date && (
                    <div>
                      <span className="text-gray-500">Returned:</span>
                      <p className="font-medium text-green-600">
                        {format(new Date(borrowing.return_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {(borrowing.fine_amount && borrowing.fine_amount > 0) && (
                    <div>
                      <span className="text-gray-500">Fine:</span>
                      <p className="font-medium text-red-600">
                        ${borrowing.fine_amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}