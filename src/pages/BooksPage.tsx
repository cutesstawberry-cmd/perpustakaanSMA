import React, { useEffect, useState } from 'react'
import { Button, Input, Card, Modal, Space, Badge, message, Popconfirm } from 'antd'
import { useBookStore } from '@/stores/bookStore'
import { useAuthStore } from '@/stores/authStore'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { BookForm } from '@/components/books/BookForm'
import { SearchOutlined, PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons'

export function BooksPage() {
  const { profile } = useAuthStore()
  const { books, loading, filters, fetchBooks, setFilters, deleteBook } = useBookStore()
  const { borrowBook } = useBorrowingStore()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks, filters])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value })
  }

  const handleBorrowBook = async (bookId: string) => {
    if (!profile?.id) {
      message.error('Please log in to borrow books')
      return
    }

    try {
      await borrowBook(bookId, profile.id, 14) // 14 days to return
      message.success('Book borrowed successfully!')
      await fetchBooks() // Refresh books to update availability
    } catch (error: any) {
      message.error(error.message || 'Failed to borrow book')
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBook(bookId)
      message.success('Book deleted successfully!')
    } catch (error: any) {
      message.error(error.message || 'Failed to delete book')
    }
  }

  const canManageBooks = profile?.role === 'admin' || profile?.role === 'librarian'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOutlined />
            Books Catalog
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and manage library books
          </p>
        </div>
        
        {canManageBooks && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddDialogOpen(true)}
            size="large"
          >
            Add Book
          </Button>
        )}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search books by title or author..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={handleSearch}
          size="large"
          style={{ maxWidth: 400 }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} loading={true} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <BookOutlined className="text-6xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.search ? 'Try adjusting your search terms' : 'No books available in the library'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card
              key={book.id}
              hoverable
              cover={
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOutlined className="text-6xl text-gray-400" />
                  )}
                </div>
              }
              actions={[
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => {
                    setSelectedBook(book)
                    setIsDetailDialogOpen(true)
                  }}
                  title="View Details"
                />,
                ...(profile?.role === 'member' && book.available_copies > 0 ? [
                  <Button
                    type="primary"
                    onClick={() => handleBorrowBook(book.id)}
                  >
                    Borrow
                  </Button>
                ] : []),
                ...(canManageBooks ? [
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setSelectedBook(book)
                      setIsEditDialogOpen(true)
                    }}
                    title="Edit Book"
                  />,
                  <Popconfirm
                    title="Delete Book"
                    description="Are you sure you want to delete this book?"
                    onConfirm={() => handleDeleteBook(book.id)}
                    okText="Yes, Delete"
                    cancelText="Cancel"
                    okType="danger"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      title="Delete Book"
                    />
                  </Popconfirm>
                ] : [])
              ]}
            >
              <Card.Meta
                title={
                  <div className="line-clamp-2" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {book.title}
                  </div>
                }
                description={
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">by {book.author}</p>
                    <div className="flex justify-between items-center">
                      <Badge 
                        color={book.available_copies > 0 ? 'green' : 'red'}
                        text={book.available_copies > 0 ? 'Available' : 'Borrowed'}
                      />
                      <span className="text-xs text-gray-500">
                        {book.available_copies}/{book.total_copies} copies
                      </span>
                    </div>
                    {book.genre && (
                      <Badge color="blue" text={book.genre} />
                    )}
                  </div>
                }
              />
            </Card>
          ))}
        </div>
      )}

      {/* Book Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <BookOutlined />
            Book Details
          </div>
        }
        open={isDetailDialogOpen}
        onCancel={() => setIsDetailDialogOpen(false)}
        footer={null}
        width={800}
      >
        {selectedBook && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              {selectedBook.cover_url ? (
                <img
                  src={selectedBook.cover_url}
                  alt={selectedBook.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOutlined className="text-6xl text-gray-400" />
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{selectedBook.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">by {selectedBook.author}</p>
              </div>
              
              <div className="space-y-2">
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
                  <span className="font-medium">Availability:</span> {selectedBook.available_copies}/{selectedBook.total_copies} copies
                </div>
              </div>
              
              {selectedBook.description && (
                <div>
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedBook.description}
                  </p>
                </div>
              )}
              
              {selectedBook.qr_code && (
                <div>
                  <span className="font-medium">QR Code:</span>
                  <div className="mt-2">
                    <img 
                      src={selectedBook.qr_code} 
                      alt="QR Code" 
                      className="w-24 h-24"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Book Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <PlusOutlined />
            Add New Book
          </div>
        }
        open={isAddDialogOpen}
        onCancel={() => setIsAddDialogOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <BookForm
          onSuccess={() => {
            setIsAddDialogOpen(false)
            fetchBooks()
          }}
        />
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EditOutlined />
            Edit Book
          </div>
        }
        open={isEditDialogOpen}
        onCancel={() => {
          setIsEditDialogOpen(false)
          setSelectedBook(null)
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedBook && (
          <BookForm
            book={selectedBook}
            onSuccess={() => {
              setIsEditDialogOpen(false)
              setSelectedBook(null)
              fetchBooks()
            }}
          />
        )}
      </Modal>
    </div>
  )
}