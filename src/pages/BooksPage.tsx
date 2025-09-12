import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useBookStore } from '@/stores/bookStore'
import { useAuthStore } from '@/stores/authStore'
import { useBorrowingStore } from '@/stores/borrowingStore'
import { BookForm } from '@/components/books/BookForm'
import { Search, Plus, Eye, Edit, Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

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
      toast.error('Please log in to borrow books')
      return
    }

    try {
      await borrowBook(bookId, profile.id)
      await fetchBooks() // Refresh books to update availability
    } catch (error) {
      // Error handled in store
    }
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

  const canManageBooks = profile?.role === 'admin' || profile?.role === 'librarian'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Books Catalog
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and manage library books
          </p>
        </div>
        
        {canManageBooks && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
              </DialogHeader>
              <BookForm
                onSuccess={() => {
                  setIsAddDialogOpen(false)
                  fetchBooks()
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search books by title or author..."
            className="pl-10"
            value={filters.search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-t-lg"></div>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-b-lg space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-16 w-16 text-gray-400" />
                )}
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">by {book.author}</p>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant={book.available_copies > 0 ? 'default' : 'secondary'}>
                    {book.available_copies > 0 ? 'Available' : 'Borrowed'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {book.available_copies}/{book.total_copies} copies
                  </span>
                </div>
                
                {book.genre && (
                  <Badge variant="outline" className="text-xs">
                    {book.genre}
                  </Badge>
                )}
              </CardContent>
              
              <CardFooter className="pt-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBook(book)
                    setIsDetailDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                
                {profile?.role === 'member' && book.available_copies > 0 && (
                  <Button
                    size="sm"
                    onClick={() => handleBorrowBook(book.id)}
                    className="flex-1"
                  >
                    Borrow
                  </Button>
                )}
                
                {canManageBooks && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBook(book)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Book Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book Details</DialogTitle>
          </DialogHeader>
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
                  <BookOpen className="h-24 w-24 text-gray-400" />
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{selectedBook.title}</h3>
                  <p className="text-muted-foreground">by {selectedBook.author}</p>
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
                    <p className="mt-1 text-sm text-muted-foreground">
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
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}