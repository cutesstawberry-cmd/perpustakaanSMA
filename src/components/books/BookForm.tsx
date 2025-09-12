import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useBookStore } from '@/stores/bookStore'
import { Loader2 } from 'lucide-react'

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().optional(),
  genre: z.string().optional(),
  publication_year: z.number().optional(),
  description: z.string().optional(),
  cover_url: z.string().url().optional().or(z.literal('')),
  total_copies: z.number().min(1, 'Must have at least 1 copy'),
  available_copies: z.number().min(0, 'Available copies cannot be negative'),
})

type BookFormData = z.infer<typeof bookSchema>

interface BookFormProps {
  book?: any
  onSuccess: () => void
}

export function BookForm({ book, onSuccess }: BookFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addBook, updateBook } = useBookStore()
  const isEditing = !!book

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: book ? {
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      genre: book.genre || '',
      publication_year: book.publication_year || undefined,
      description: book.description || '',
      cover_url: book.cover_url || '',
      total_copies: book.total_copies,
      available_copies: book.available_copies,
    } : {
      total_copies: 1,
      available_copies: 1,
    }
  })

  const totalCopies = watch('total_copies')

  const onSubmit = async (data: BookFormData) => {
    try {
      setIsLoading(true)
      
      // Convert string numbers to actual numbers
      const processedData = {
        ...data,
        publication_year: data.publication_year || null,
        total_copies: Number(data.total_copies),
        available_copies: Number(data.available_copies),
        isbn: data.isbn || null,
        genre: data.genre || null,
        description: data.description || null,
        cover_url: data.cover_url || null,
      }

      if (isEditing) {
        await updateBook(book.id, processedData)
      } else {
        await addBook(processedData)
      }
      
      onSuccess()
    } catch (error) {
      // Error handling is done in the store
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register('title')}
            disabled={isLoading}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="author">Author *</Label>
          <Input
            id="author"
            {...register('author')}
            disabled={isLoading}
          />
          {errors.author && (
            <p className="text-sm text-red-600">{errors.author.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            {...register('isbn')}
            disabled={isLoading}
          />
          {errors.isbn && (
            <p className="text-sm text-red-600">{errors.isbn.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Input
            id="genre"
            {...register('genre')}
            disabled={isLoading}
          />
          {errors.genre && (
            <p className="text-sm text-red-600">{errors.genre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="publication_year">Publication Year</Label>
          <Input
            id="publication_year"
            type="number"
            {...register('publication_year', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.publication_year && (
            <p className="text-sm text-red-600">{errors.publication_year.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cover_url">Cover Image URL</Label>
          <Input
            id="cover_url"
            type="url"
            {...register('cover_url')}
            disabled={isLoading}
          />
          {errors.cover_url && (
            <p className="text-sm text-red-600">{errors.cover_url.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_copies">Total Copies *</Label>
          <Input
            id="total_copies"
            type="number"
            min="1"
            {...register('total_copies', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.total_copies && (
            <p className="text-sm text-red-600">{errors.total_copies.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="available_copies">Available Copies *</Label>
          <Input
            id="available_copies"
            type="number"
            min="0"
            max={totalCopies}
            {...register('available_copies', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.available_copies && (
            <p className="text-sm text-red-600">{errors.available_copies.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={4}
          {...register('description')}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Book' : 'Add Book'}
        </Button>
      </div>
    </form>
  )
}