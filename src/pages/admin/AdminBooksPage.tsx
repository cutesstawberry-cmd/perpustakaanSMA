import React, { useEffect, useState } from 'react'
import { Button, Input, Card, Badge, Modal, Table, Space, Popconfirm } from 'antd'
import { useBookStore } from '@/stores/bookStore'
import { useAuthStore } from '@/stores/authStore'
import { BookForm } from '@/components/books/BookForm'
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import toast from 'react-hot-toast'

export function AdminBooksPage() {
  const { profile } = useAuthStore()
  const { books, loading, filters, fetchBooks, setFilters, deleteBook, bulkDeleteBooks } = useBookStore()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [loadingBulk, setLoadingBulk] = useState(false)

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

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) return
    
    try {
      setLoadingBulk(true)
      await bulkDeleteBooks(selectedRowKeys as string[])
      setSelectedRowKeys([])
    } catch (error) {
      // Error handled in store
    } finally {
      setLoadingBulk(false)
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
    getCheckboxProps: (record: any) => ({
      name: record.title,
    }),
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
            Kelola Buku
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Panel admin untuk manajemen buku
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {selectedRowKeys.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedRowKeys.length} dipilih
              </span>
              <Popconfirm
                title="Hapus Buku Terpilih"
                description={`Apakah Anda yakin ingin menghapus ${selectedRowKeys.length} buku yang dipilih?`}
                onConfirm={handleBulkDelete}
                okText="Ya, Hapus"
                cancelText="Batal"
                okType="danger"
              >
                <Button 
                  danger 
                  loading={loadingBulk}
                  icon={<DeleteOutlined />}
                >
                  Hapus Terpilih
                </Button>
              </Popconfirm>
            </div>
          )}
          <Button type="primary" onClick={() => setIsAddModalOpen(true)}>
            <PlusOutlined />
            Tambah Buku
          </Button>
        </div>

        <Modal
          title="Tambah Buku Baru"
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

      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Cari buku berdasarkan judul atau penulis..."
          prefix={<SearchOutlined />}
          value={filters.search}
          onChange={handleSearch}
          style={{ width: 300 }}
        />
        {selectedRowKeys.length > 0 && (
          <Button 
            type="link" 
            onClick={() => setSelectedRowKeys([])}
            className="text-gray-500"
          >
            Batalkan pilihan
          </Button>
        )}
      </div>

      <Card title={`Buku (${books.length})`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table
            dataSource={books}
            rowKey="id"
            rowSelection={rowSelection}
            columns={[
              {
                title: 'Judul',
                dataIndex: 'title',
                key: 'title',
                sorter: true,
                ellipsis: true,
              },
              {
                title: 'Penulis',
                dataIndex: 'author',
                key: 'author',
                sorter: true,
                ellipsis: true,
              },
              {
                title: 'Genre',
                dataIndex: 'genre',
                key: 'genre',
                render: (genre) => genre || '-',
                ellipsis: true,
              },
              {
                title: 'Eksemplar',
                key: 'copies',
                render: (_, book) => `${book.available_copies}/${book.total_copies}`,
                width: 100,
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, book) => (
                  <Badge status={book.available_copies > 0 ? 'success' : 'default'}>
                    {book.available_copies > 0 ? 'Tersedia' : 'Dipinjam'}
                  </Badge>
                ),
                width: 100,
              },
              {
                title: 'Aksi',
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
                      title="Lihat Detail"
                    />
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setSelectedBook(book)
                        setIsEditModalOpen(true)
                      }}
                      title="Edit Buku"
                    />
                    <Popconfirm
                      title="Hapus Buku"
                      description="Apakah Anda yakin ingin menghapus buku ini?"
                      onConfirm={() => handleDeleteBook(book.id)}
                      okText="Ya, Hapus"
                      cancelText="Batal"
                      okType="danger"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        title="Hapus Buku"
                      />
                    </Popconfirm>
                  </Space>
                ),
                width: 120,
              },
            ]}
          />
        )}
      </Card>

      {/* Book Details Modal */}
      <Modal
        title="Detail Buku"
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
        title="Edit Buku"
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