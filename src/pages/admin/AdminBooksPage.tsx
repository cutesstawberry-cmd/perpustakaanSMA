import React, { useEffect, useState } from 'react'
import { Button, Input, Card, Badge, Modal, Table, Space } from 'antd'
import { useBookStore } from '@/stores/bookStore'
import { useAuthStore } from '@/stores/authStore'
import { BookForm } from '@/components/books/BookForm'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import toast from 'react-hot-toast'

export function AdminBooksPage() {
  const { profile } = useAuthStore()
  const { books, loading, filters, fetchBooks, setFilters, deleteBook } = useBookStore()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks, filters])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value })
  }

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await deleteBook(bookId)
      } catch (error) {
        // Error handled in store
      }
    }
  }

  if (!profile || !['admin', 'librarian'].includes(profile.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manage Books
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Admin panel for book management
          </p>
        </div>

        <Button type="primary" onClick={() => setIsAddModalOpen(true)}>
          <PlusOutlined />
          Add Book
        </Button>

        <Modal
          title="Add New Book"
          open={isAddModalOpen}
          onCancel={() => setIsAddModalOpen(false)}
          footer={null}
          width={800}
        >
          <BookForm
            onSuccess={() => {
              setIsAddModalOpen(false)
              fetchBooks()
            }}
          />
        </Modal>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search books by title or author..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={handleSearch}
          style={{ width: 300 }}
        />
      </div>

      <Card title={`Books (${books.length})`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table
            dataSource={books}
            rowKey="id"
            columns={[
              {
                title: 'Title',
                dataIndex: 'title',
                key: 'title',
                sorter: true,
              },
              {
                title: 'Author',
                dataIndex: 'author',
                key: 'author',
                sorter: true,
              },
              {
                title: 'Genre',
                dataIndex: 'genre',
                key: 'genre',
                render: (genre) => genre || '-',
              },
              {
                title: 'Copies',
                key: 'copies',
                render: (_, book) => `${book.available_copies}/${book.total_copies}`,
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, book) => (
                  <Badge status={book.available_copies > 0 ? 'success' : 'default'}>
                    {book.available_copies > 0 ? 'Available' : 'Borrowed'}
                  </Badge>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, book) => (
                  <Space>
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setSelectedBook(book)
                        setIsDetailModalOpen(true)
                      }}
                    />
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setSelectedBook(book)
                        setIsEditModalOpen(true)
                      }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteBook(book.id)}
                    />
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Card>

      {/* Book Details Modal */}
      <Modal
        title="Book Details"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {selectedBook && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{selectedBook.title}</h3>
              <p className="text-muted-foreground">by {selectedBook.author}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedBook.isbn && (
                <div>
                  <span className="font-medium">ISBN:</span> {selectedBook.isbn}
                </div>
              )}
              {selectedBook.genre && (
                <div>
                  <span className="font-medium">Genre:</span> {selectedBook.genre}
                </div>
              )}
              {selectedBook.publication_year && (
                <div>
                  <span className="font-medium">Year:</span> {selectedBook.publication_year}
                </div>
              )}
              <div>
                <span className="font-medium">Copies:</span> {selectedBook.available_copies}/{selectedBook.total_copies}
              </div>
            </div>

            {selectedBook.description && (
              <div>
                <span className="font-medium">Description:</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedBook.description}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        title="Edit Book"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={800}
      >
        {selectedBook && (
          <BookForm
            book={selectedBook}
            onSuccess={() => {
              setIsEditModalOpen(false)
              setSelectedBook(null)
              fetchBooks()
            }}
          />
        )}
      </Modal>
    </div>
  )
}