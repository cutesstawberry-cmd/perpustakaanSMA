import React, { useState } from 'react'
import { Button, Input, Form, InputNumber } from 'antd'
import { useBookStore } from '@/stores/bookStore'

interface BookFormData {
  title: string
  author: string
  isbn?: string
  genre?: string
  publication_year?: number
  description?: string
  cover_url?: string
  total_copies: number
  available_copies: number
}

interface BookFormProps {
  book?: any
  onSuccess: () => void
}

export function BookForm({ book, onSuccess }: BookFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { addBook, updateBook } = useBookStore()
  const [form] = Form.useForm()
  const isEditing = !!book

  const onSubmit = async (values: BookFormData) => {
    try {
      setIsLoading(true)
      
      // Process data
      const processedData = {
        ...values,
        publication_year: values.publication_year || null,
        isbn: values.isbn || null,
        genre: values.genre || null,
        description: values.description || null,
        cover_url: values.cover_url || null,
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
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={book ? {
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        genre: book.genre || '',
        publication_year: book.publication_year,
        description: book.description || '',
        cover_url: book.cover_url || '',
        total_copies: book.total_copies,
        available_copies: book.available_copies,
      } : {
        total_copies: 1,
        available_copies: 1,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please enter book title' }]}
        >
          <Input disabled={isLoading} />
        </Form.Item>

        <Form.Item
          label="Author"
          name="author"
          rules={[{ required: true, message: 'Please enter author name' }]}
        >
          <Input disabled={isLoading} />
        </Form.Item>

        <Form.Item
          label="ISBN"
          name="isbn"
        >
          <Input disabled={isLoading} />
        </Form.Item>

        <Form.Item
          label="Genre"
          name="genre"
        >
          <Input disabled={isLoading} />
        </Form.Item>

        <Form.Item
          label="Publication Year"
          name="publication_year"
        >
          <InputNumber 
            style={{ width: '100%' }}
            disabled={isLoading}
            min={1000}
            max={new Date().getFullYear()}
          />
        </Form.Item>

        <Form.Item
          label="Cover Image URL"
          name="cover_url"
        >
          <Input disabled={isLoading} />
        </Form.Item>

        <Form.Item
          label="Total Copies"
          name="total_copies"
          rules={[
            { required: true, message: 'Please enter total copies' },
            { type: 'number', min: 1, message: 'Must have at least 1 copy' }
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }}
            disabled={isLoading}
            min={1}
          />
        </Form.Item>

        <Form.Item
          label="Available Copies"
          name="available_copies"
          rules={[
            { required: true, message: 'Please enter available copies' },
            { type: 'number', min: 0, message: 'Available copies cannot be negative' }
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }}
            disabled={isLoading}
            min={0}
          />
        </Form.Item>
      </div>

      <Form.Item
        label="Description"
        name="description"
      >
        <Input.TextArea rows={4} disabled={isLoading} />
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {isEditing ? 'Update Book' : 'Add Book'}
        </Button>
      </div>
    </Form>
  )
}