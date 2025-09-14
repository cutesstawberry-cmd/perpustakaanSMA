import { useEffect, useState } from 'react'
import { Button, Input, Card, Badge, Modal, Table, Space, Select } from 'antd'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { useAuthStore } from '@/stores/authStore'
import { SearchOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { format } from 'date-fns'

const { Option } = Select

export function AdminBorrowingsPage() {
  const { profile } = useAuthStore()
  const { borrowings, loading, fetchBorrowings } = useBorrowingStore()
  const [selectedBorrowing, setSelectedBorrowing] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('')

  useEffect(() => {
    fetchBorrowings()
  }, [fetchBorrowings])

  const handleApproveReturn = async (borrowingId: string) => {
    if (window.confirm('Approve this return? This will update the status to returned and calculate any fine.')) {
      try {
        await useBorrowingStore.getState().approveReturn(borrowingId)
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'processing'
      case 'returned': return 'success'
      case 'overdue': return 'error'
      case 'pending_return': return 'warning'
      default: return 'default'
    }
  }

  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    )
  }

  const filteredBorrowings = borrowings.filter(borrowing => {
    const matchesStatus = !statusFilter || borrowing.status === statusFilter
    const matchesUser = !userFilter ||
      borrowing.profiles?.full_name?.toLowerCase().includes(userFilter.toLowerCase()) ||
      borrowing.profiles?.member_id?.toLowerCase().includes(userFilter.toLowerCase())
    return matchesStatus && matchesUser
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Borrowings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Admin panel for borrowing management
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Search by user name or member ID..."
          prefix={<SearchOutlined />}
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          allowClear
        >
          <Option value="active">Active</Option>
          <Option value="returned">Returned</Option>
          <Option value="overdue">Overdue</Option>
          <Option value="pending_return">Pending Return</Option>
        </Select>
      </div>

      <Card title={`Borrowings (${filteredBorrowings.length})`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table
            dataSource={filteredBorrowings}
            rowKey="id"
            columns={[
              {
                title: 'Book',
                dataIndex: 'books',
                key: 'book',
                render: (books) => books?.title || 'N/A',
              },
              {
                title: 'User',
                dataIndex: 'profiles',
                key: 'user',
                render: (profiles) => profiles?.full_name || profiles?.member_id || 'N/A',
              },
              {
                title: 'Borrow Date',
                dataIndex: 'borrow_date',
                key: 'borrow_date',
                render: (date) => format(new Date(date), 'MMM dd, yyyy'),
                sorter: true,
              },
              {
                title: 'Due Date',
                dataIndex: 'due_date',
                key: 'due_date',
                render: (date) => format(new Date(date), 'MMM dd, yyyy'),
                sorter: true,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Badge status={getStatusColor(status)} text={status.charAt(0).toUpperCase() + status.slice(1)} />
                ),
              },
              {
                title: 'Fine',
                dataIndex: 'fine_amount',
                key: 'fine',
                render: (fine) => fine > 0 ? `$${fine.toFixed(2)}` : '-',
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, borrowing) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedBorrowing(borrowing)
                        setIsDetailModalOpen(true)
                      }}
                    />
                    {borrowing.status === 'active' && (
                      <Button
                        type="text"
                        icon={<CheckCircleOutlined />}
                        style={{ color: 'green' }}
                        onClick={() => handleApproveReturn(borrowing.id)}
                      >
                        Return
                      </Button>
                    )}
                    {borrowing.status === 'pending_return' && (
                      <Button
                        type="text"
                        icon={<CheckCircleOutlined />}
                        style={{ color: 'green' }}
                        onClick={() => handleApproveReturn(borrowing.id)}
                      >
                        Approve Return
                      </Button>
                    )}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Borrowing Details Modal */}
      <Modal
        title="Borrowing Details"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedBorrowing && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{selectedBorrowing.books?.title || 'N/A'}</h3>
              <p className="text-muted-foreground">by {selectedBorrowing.books?.author || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">User:</span> {selectedBorrowing.profiles?.full_name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Member ID:</span> {selectedBorrowing.profiles?.member_id || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Borrow Date:</span> {format(new Date(selectedBorrowing.borrow_date), 'MMM dd, yyyy')}
              </div>
              <div>
                <span className="font-medium">Due Date:</span> {format(new Date(selectedBorrowing.due_date), 'MMM dd, yyyy')}
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge status={getStatusColor(selectedBorrowing.status)} text={selectedBorrowing.status.charAt(0).toUpperCase() + selectedBorrowing.status.slice(1)} />
              </div>
              <div>
                <span className="font-medium">Fine:</span> {selectedBorrowing.fine_amount > 0 ? `$${selectedBorrowing.fine_amount.toFixed(2)}` : 'None'}
              </div>
            </div>

            {selectedBorrowing.return_date && (
              <div>
                <span className="font-medium">Return Date:</span> {format(new Date(selectedBorrowing.return_date), 'MMM dd, yyyy')}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}