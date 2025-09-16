import { useState, useEffect } from 'react'
import { Form, Input, Select, Button, Card, message, DatePicker, Space } from 'antd'
import { useUserStore } from '@/stores/userStore'
import { useBookStore } from '@/stores/bookStore'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { SearchOutlined, BookOutlined, UserOutlined } from '@ant-design/icons'
import { addDays } from 'date-fns'
import dayjs from 'dayjs'

const { Option } = Select

interface BorrowingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function BorrowingForm({ onSuccess, onCancel }: BorrowingFormProps) {
  const [form] = Form.useForm()
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [userSearch, setUserSearch] = useState('')
  const [bookSearch, setBookSearch] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { users, fetchUsers } = useUserStore()
  const { books, fetchBooks } = useBookStore()
  const { createBorrowingForUser } = useBorrowingStore()

  useEffect(() => {
    fetchUsers()
    fetchBooks()
  }, [fetchUsers, fetchBooks])

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.role === 'member' && (
      user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.member_id?.toLowerCase().includes(userSearch.toLowerCase())
    )
  )

  // Filter available books based on search
  const availableBooks = books.filter(book => 
    book.available_copies > 0 && (
      book.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      book.author.toLowerCase().includes(bookSearch.toLowerCase())
    )
  )

  const handleSubmit = async (values: any) => {
    if (!selectedUser || !selectedBook) {
      message.error('Please select both user and book')
      return
    }

    try {
      setLoading(true)
      
      const dueDate = values.due_date ? values.due_date.toISOString() : addDays(new Date(), 14).toISOString()
      
      await createBorrowingForUser(
        selectedBook.id,
        selectedUser.id,
        dueDate
      )
      
      message.success('Book borrowing created successfully!')
      form.resetFields()
      setSelectedUser(null)
      setSelectedBook(null)
      setUserSearch('')
      setBookSearch('')
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to create borrowing')
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    setSelectedUser(user)
    form.setFieldsValue({ user_id: userId })
  }

  const handleBookSelect = (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    setSelectedBook(book)
    form.setFieldsValue({ book_id: bookId })
  }

  return (
    <Card title="Create New Borrowing" className="w-full">
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This allows admin/librarian to create borrowings on behalf of users who don't have access to their phones or internet.
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{
          due_date: dayjs().add(14, 'days')
        }}
      >
        {/* User Selection */}
        <Form.Item
          label="Select User"
          name="user_id"
          rules={[{ required: true, message: 'Please select a user' }]}
        >
          <div className="space-y-2">
            <Input
              placeholder="Search by name or member ID..."
              prefix={<SearchOutlined />}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Select user"
              value={selectedUser?.id}
              onChange={handleUserSelect}
              style={{ width: '100%' }}
              showSearch
              filterOption={false}
              notFoundContent={userSearch ? 'No users found' : 'Start typing to search users'}
            >
              {filteredUsers.map(user => (
                <Option key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <UserOutlined />
                    <div>
                      <div className="font-medium">{user.full_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">ID: {user.member_id}</div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
            {selectedUser && (
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700">
                  <strong>Selected:</strong> {selectedUser.full_name} ({selectedUser.member_id})
                </p>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Book Selection */}
        <Form.Item
          label="Select Book"
          name="book_id"
          rules={[{ required: true, message: 'Please select a book' }]}
        >
          <div className="space-y-2">
            <Input
              placeholder="Search by title or author..."
              prefix={<SearchOutlined />}
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              allowClear
            />
            <Select
              placeholder="Select book"
              value={selectedBook?.id}
              onChange={handleBookSelect}
              style={{ width: '100%' }}
              showSearch
              filterOption={false}
              notFoundContent={bookSearch ? 'No available books found' : 'Start typing to search books'}
            >
              {availableBooks.map(book => (
                <Option key={book.id} value={book.id}>
                  <div className="flex items-center gap-2">
                    <BookOutlined />
                    <div>
                      <div className="font-medium">{book.title}</div>
                      <div className="text-xs text-gray-500">
                        by {book.author} • Available: {book.available_copies}/{book.total_copies}
                      </div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
            {selectedBook && (
              <div className="p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-700">
                  <strong>Selected:</strong> {selectedBook.title} by {selectedBook.author}
                </p>
                <p className="text-xs text-gray-600">
                  Available copies: {selectedBook.available_copies}/{selectedBook.total_copies}
                </p>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Due Date */}
        <Form.Item
          label="Due Date"
          name="due_date"
          rules={[{ required: true, message: 'Please select due date' }]}
          extra="Default is 14 days from today"
        >
          <DatePicker
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        {/* Action Buttons */}
        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button onClick={onCancel} size="large">
                Cancel
              </Button>
            )}
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              size="large"
              disabled={!selectedUser || !selectedBook}
            >
              Create Borrowing
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Card>
  )
}