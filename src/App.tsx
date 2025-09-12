import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/ui/theme-provider'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginForm } from './components/auth/LoginForm'
import { Dashboard } from './pages/Dashboard'
import { BooksPage } from './pages/BooksPage'
import { BorrowingsPage } from './pages/BorrowingsPage'
import { AdminBooksPage } from './pages/admin/AdminBooksPage'
import { AdminBorrowingsPage } from './pages/admin/AdminBorrowingsPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'
import { useAuthStore } from './stores/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="library-ui-theme">
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route 
                path="/login" 
                element={!user ? <LoginForm /> : <Navigate to="/" replace />} 
              />
              <Route path="/" element={<Layout />}>
                <Route 
                  index 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="books" 
                  element={
                    <ProtectedRoute>
                      <BooksPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="borrowings" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                      <BorrowingsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="my-borrowings"
                  element={
                    <ProtectedRoute allowedRoles={['member']}>
                      <BorrowingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/books"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                      <AdminBooksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/borrowings"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                      <AdminBorrowingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
              </Route>
            </Routes>
          </div>
        </Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App