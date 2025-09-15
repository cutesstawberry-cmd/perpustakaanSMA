import { useEffect, useState } from 'react'
import { Button, Input, Card, Modal, message, Popconfirm, Row, Col, Typography, Tag, Empty, Skeleton, Pagination } from 'antd'
import { useBookStore } from '@/stores/bookStore'
import { useAuthStore } from '@/stores/authStore'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { BookForm } from '@/components/books/BookForm'
import { 
  MagnifyingGlass,
  Plus,
  Eye,
  PencilSimple,
  Trash,
  Book,
  BookOpen,
  QrCode,
  Calendar,
  Tag as TagIcon,
  Stack,
  User,
  CheckCircle
} from '@phosphor-icons/react'

const { Search } = Input
const { Title, Paragraph, Text } = Typography
const { Meta } = Card

export function BooksPage() {
  const { profile } = useAuthStore()
  const { books, loading, filters, pagination, fetchBooks, setFilters, setPagination, deleteBook } = useBookStore()
  const { borrowBook } = useBorrowingStore()
  const [selectedBook, setSelectedBook] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks, filters, pagination.page, pagination.limit])

  // Set responsive pagination limit and track mobile state
  useEffect(() => {
    const updatePaginationLimit = () => {
      const isMobileView = window.innerWidth < 768
      const isTablet = window.innerWidth < 1024
      
      setIsMobile(isMobileView)
      
      let newLimit = 12 // Default desktop
      if (isMobileView) {
        newLimit = 8 // Mobile: 8 books per page
      } else if (isTablet) {
        newLimit = 10 // Tablet: 10 books per page
      }
      
      if (pagination.limit !== newLimit) {
        setPagination({ page: 1, limit: newLimit })
      }
    }

    updatePaginationLimit()
    window.addEventListener('resize', updatePaginationLimit)
    return () => window.removeEventListener('resize', updatePaginationLimit)
  }, [pagination.limit, setPagination])

  const handlePageChange = (page: number) => {
    setPagination({ page })
  }

  const handleSearch = (value: string) => {
    setFilters({ search: value })
  }

  const handleBorrowBook = async (bookId: string) => {
    if (!profile?.id) {
      message.error('Silakan masuk untuk meminjam buku')
      return
    }

    try {
      await borrowBook(bookId, profile.id, 14) // 14 hari untuk mengembalikan
      message.success('Buku berhasil dipinjam!')
      await fetchBooks() // Refresh buku untuk memperbarui ketersediaan
    } catch (error: any) {
      message.error(error.message || 'Gagal meminjam buku')
    }
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      await deleteBook(bookId)
      message.success('Buku berhasil dihapus!')
    } catch (error: any) {
      message.error(error.message || 'Gagal menghapus buku')
    }
  }

  const canManageBooks = profile?.role === 'admin' || profile?.role === 'librarian'

  const getAvailabilityStatus = (availableCopies: number) => {
    if (availableCopies > 5) {
      return { color: 'success', text: 'Tersedia', status: 'available', bgColor: 'bg-green-50', textColor: 'text-green-700', dotColor: 'bg-green-500' }
    } else if (availableCopies > 0) {
      return { color: 'warning', text: 'Terbatas', status: 'limited', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', dotColor: 'bg-yellow-500' }
    } else {
      return { color: 'error', text: 'Habis', status: 'unavailable', bgColor: 'bg-red-50', textColor: 'text-red-700', dotColor: 'bg-red-500' }
    }
  }

  const availableCount = books.filter(b => b.available_copies > 5).length
  const limitedCount = books.filter(b => b.available_copies > 0 && b.available_copies <= 5).length
  const unavailableCount = books.filter(b => b.available_copies === 0).length

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-900">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header dengan spacing yang lebih rapat */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <BookOpen size={28} className="text-white" weight="duotone" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  Katalog Buku
                </h1>
                <p className="text-gray-600 text-base sm:text-lg">
                  Jelajahi dan kelola koleksi buku perpustakaan
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <Stack size={18} className="text-blue-600" />
                <span className="font-semibold text-gray-700 text-sm">
                  {books.length} Buku
                </span>
              </div>
              {canManageBooks && (
                <Button
                  type="primary"
                  icon={<Plus size={16} weight="bold" />}
                  onClick={() => setIsAddDialogOpen(true)}
                  size="large"
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  <span className="hidden sm:inline">Tambah Buku</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search dan Stats Bar */}
        <Card className="mb-6 shadow-sm border-0">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="w-full lg:w-1/2 xl:w-2/5">
              <Search
                placeholder="Cari buku berdasarkan judul atau penulis..."
                prefix={<MagnifyingGlass size={16} className="text-gray-400" />}
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                size="large"
                allowClear
                className="w-full"
              />
            </div>
            <div className="w-full lg:w-auto">
              <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <Text className="text-xs font-semibold text-green-700">
                    Tersedia: {availableCount}
                  </Text>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <Text className="text-xs font-semibold text-yellow-700">
                    Terbatas: {limitedCount}
                  </Text>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <Text className="text-xs font-semibold text-red-700">
                    Habis: {unavailableCount}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Books Grid dengan spacing yang lebih rapat */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
            {[...Array(10)].map((_, i) => (
              <Card key={i} className="shadow-sm border-0">
                <Skeleton.Image className="!w-full !h-48" />
                <div className="pt-4">
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              </Card>
            ))}
          </div>
        ) : books.length === 0 ? (
          <Card className="shadow-sm border-0">
            <Empty
              image={<BookOpen size={64} className="text-gray-400 mx-auto" weight="duotone" />}
              imageStyle={{ height: 80 }}
              description={
                <div className="text-center py-8">
                  <Title level={4} className="!text-gray-900 !mb-2">
                    Tidak ada buku ditemukan
                  </Title>
                  <Paragraph className="!text-gray-500 !mb-0">
                    {filters.search ? 'Coba sesuaikan kata kunci pencarian Anda' : 'Belum ada buku yang tersedia di perpustakaan'}
                  </Paragraph>
                </div>
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
            {books.map((book) => {
              const availability = getAvailabilityStatus(book.available_copies)
              
              return (
                <Card
                  key={book.id}
                  hoverable
                  className="shadow-sm hover:shadow-xl transition-all duration-300 border-0 group"
                  cover={
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center overflow-hidden">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <Book size={48} className="text-blue-400" weight="duotone" />
                      )}
                      <div className="absolute top-2 right-2">
                        <div className={`${availability.bgColor} ${availability.textColor} px-2 py-1 rounded-full border shadow-sm`}>
                          <Text className="text-xs font-bold">
                            {availability.text}
                          </Text>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    </div>
                  }
                  actions={[
                    <Button
                      type="text"
                      icon={<Eye size={16} />}
                      onClick={() => {
                        setSelectedBook(book)
                        setIsDetailDialogOpen(true)
                      }}
                      title="Lihat Detail"
                      className="hover:text-blue-600 hover:bg-blue-50"
                    />,
                    ...(profile?.role === 'member' && book.available_copies > 0 ? [
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleBorrowBook(book.id)}
                        className="hover:scale-105 transition-transform shadow-sm"
                      >
                        Pinjam
                      </Button>
                    ] : []),
                    ...(canManageBooks ? [
                      <Button
                        type="text"
                        icon={<PencilSimple size={16} />}
                        onClick={() => {
                          setSelectedBook(book)
                          setIsEditDialogOpen(true)
                        }}
                        title="Edit Buku"
                        className="hover:text-green-600 hover:bg-green-50"
                      />,
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
                          icon={<Trash size={16} />}
                          title="Hapus Buku"
                          className="hover:bg-red-50"
                        />
                      </Popconfirm>
                    ] : [])
                  ]}
                >
                  <Meta
                    title={
                      <div 
                        className="line-clamp-2 text-gray-900 font-bold text-sm leading-tight mb-2" 
                        style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '2.25rem'
                        }}
                        title={book.title}
                      >
                        {book.title}
                      </div>
                    }
                    description={
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-blue-600" />
                          </div>
                          <Text className="text-xs text-gray-600 truncate font-medium">
                            {book.author || 'Penulis tidak diketahui'}
                          </Text>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${availability.dotColor}`}></div>
                            <Text className="text-xs font-semibold text-gray-700">
                              {book.available_copies}/{book.total_copies} tersedia
                            </Text>
                          </div>
                          {book.available_copies > 0 && profile?.role === 'member' && (
                            <CheckCircle size={14} className="text-green-500" weight="fill" />
                          )}
                        </div>
                        
                        {book.genre && (
                          <div className="flex items-center space-x-1">
                            <TagIcon size={10} className="text-blue-500" />
                            <Tag className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                              {book.genre}
                            </Tag>
                          </div>
                        )}
                      </div>
                    }
                  />
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && books.length > 0 && pagination.total > pagination.limit && (
          <div className="mt-8 flex justify-center">
            <Pagination
              current={pagination.page}
              total={pagination.total}
              pageSize={pagination.limit}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper={!isMobile} // Only show quick jumper on desktop
              showTotal={(total, range) => {
                if (isMobile) {
                  // Mobile: compact format
                  return `${range[0]}-${range[1]} dari ${total}`
                } else {
                  // Desktop: detailed format
                  return `Menampilkan ${range[0]}-${range[1]} dari ${total} buku`
                }
              }}
              className="[&_.ant-pagination-item]:border-gray-300 [&_.ant-pagination-item-active]:border-blue-500 [&_.ant-pagination-item-active]:bg-blue-50 [&_.ant-pagination-item]:hover:border-blue-400"
              size={isMobile ? 'small' : 'default'}
              responsive={true}
            />
          </div>
        )}

        {/* Book Details Modal dengan design yang lebih baik */}
        <Modal
          title={
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Eye size={22} className="text-blue-600" weight="duotone" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Detail Buku</span>
                <p className="text-sm text-gray-500 mt-0.5">Informasi lengkap buku</p>
              </div>
            </div>
          }
          open={isDetailDialogOpen}
          onCancel={() => setIsDetailDialogOpen(false)}
          footer={null}
          width={1000}
          className="book-detail-modal"
        >
          {selectedBook && (
            <div className="mt-6">
              <Row gutter={[32, 24]}>
                <Col xs={24} md={8}>
                  <div className="sticky top-6">
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden border border-gray-100">
                      {selectedBook.cover_url ? (
                        <img
                          src={selectedBook.cover_url}
                          alt={selectedBook.title}
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <Book size={80} className="text-blue-400" weight="duotone" />
                      )}
                    </div>
                    
                    {profile?.role === 'member' && selectedBook.available_copies > 0 && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<BookOpen size={20} />}
                        onClick={() => {
                          handleBorrowBook(selectedBook.id)
                          setIsDetailDialogOpen(false)
                        }}
                        className="w-full mt-4 h-12 shadow-lg hover:shadow-xl transition-shadow"
                      >
                        Pinjam Buku Ini
                      </Button>
                    )}
                  </div>
                </Col>
                
                <Col xs={24} md={16}>
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <Title level={2} className="!mb-3 !text-gray-900">
                        {selectedBook.title}
                      </Title>
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                          <User size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <Text className="text-base font-semibold text-gray-700">
                            {selectedBook.author || 'Penulis tidak diketahui'}
                          </Text>
                          <Text className="text-sm text-gray-500 block">Penulis</Text>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`${getAvailabilityStatus(selectedBook.available_copies).bgColor} ${getAvailabilityStatus(selectedBook.available_copies).textColor} px-4 py-2 rounded-full border font-semibold`}>
                          {getAvailabilityStatus(selectedBook.available_copies).text}
                        </div>
                        <Text className="text-sm text-gray-500">
                          {selectedBook.available_copies}/{selectedBook.total_copies} eksemplar tersedia
                        </Text>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <Title level={4} className="!mb-4 flex items-center space-x-2">
                        <Book size={20} className="text-blue-600" />
                        <span>Informasi Buku</span>
                      </Title>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedBook.isbn && (
                          <div className="space-y-2">
                            <Text className="font-semibold text-gray-700 text-sm">ISBN:</Text>
                            <Text className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg font-mono text-sm">
                              {selectedBook.isbn}
                            </Text>
                          </div>
                        )}
                        
                        {selectedBook.genre && (
                          <div className="space-y-2">
                            <Text className="font-semibold text-gray-700 text-sm">Genre:</Text>
                            <Tag color="blue" className="mt-1 px-3 py-1">
                              {selectedBook.genre}
                            </Tag>
                          </div>
                        )}
                        
                        {selectedBook.publication_year && (
                          <div className="space-y-2">
                            <Text className="font-semibold text-gray-700 text-sm">Tahun Terbit:</Text>
                            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                              <Calendar size={16} className="text-gray-500" />
                              <Text className="text-gray-600 font-semibold">
                                {selectedBook.publication_year}
                              </Text>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Text className="font-semibold text-gray-700 text-sm">Status Ketersediaan:</Text>
                          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${
                              selectedBook.available_copies > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                            <Text className="text-gray-600 font-semibold">
                              {selectedBook.available_copies > 0 ? 'Tersedia untuk dipinjam' : 'Sedang dipinjam semua'}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedBook.description && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <Title level={4} className="!mb-4">Deskripsi</Title>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                          <Paragraph className="!mb-0 text-gray-700 leading-relaxed">
                            {selectedBook.description}
                          </Paragraph>
                        </div>
                      </div>
                    )}
                    
                    {selectedBook.qr_code && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <Title level={4} className="!mb-4 flex items-center space-x-2">
                          <QrCode size={20} className="text-blue-600" />
                          <span>Kode QR</span>
                        </Title>
                        <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                          <img 
                            src={selectedBook.qr_code} 
                            alt="QR Code" 
                            className="w-24 h-24 border border-gray-200 rounded-lg shadow-sm"
                          />
                          <div>
                            <Text className="text-sm text-gray-600">
                              Scan kode QR ini untuk akses cepat ke informasi buku
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>

        {/* Add Book Modal */}
        <Modal
          title={
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-green-50 rounded-xl">
                <Plus size={22} className="text-green-600" weight="duotone" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Tambah Buku Baru</span>
                <p className="text-sm text-gray-500 mt-0.5">Menambahkan buku ke koleksi perpustakaan</p>
              </div>
            </div>
          }
          open={isAddDialogOpen}
          onCancel={() => setIsAddDialogOpen(false)}
          footer={null}
          width={1000}
          destroyOnClose
        >
          <div className="mt-6">
            <BookForm
              onSuccess={() => {
                setIsAddDialogOpen(false)
                fetchBooks()
              }}
            />
          </div>
        </Modal>

        {/* Edit Book Modal */}
        <Modal
          title={
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
              <div className="p-2.5 bg-orange-50 rounded-xl">
                <PencilSimple size={22} className="text-orange-600" weight="duotone" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Edit Buku</span>
                <p className="text-sm text-gray-500 mt-0.5">Mengubah informasi buku</p>
              </div>
            </div>
          }
          open={isEditDialogOpen}
          onCancel={() => {
            setIsEditDialogOpen(false)
            setSelectedBook(null)
          }}
          footer={null}
          width={1000}
          destroyOnClose
        >
          {selectedBook && (
            <div className="mt-6">
              <BookForm
                book={selectedBook}
                onSuccess={() => {
                  setIsEditDialogOpen(false)
                  setSelectedBook(null)
                  fetchBooks()
                }}
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}