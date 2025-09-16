import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './components/ui/theme-provider'
import AntdThemeProvider from './components/AntdThemeProvider'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginForm } from './components/auth/LoginForm'
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const BooksPage = lazy(() => import('./pages/BooksPage').then(module => ({ default: module.BooksPage })))
const BorrowingsPage = lazy(() => import('./pages/BorrowingsPage').then(module => ({ default: module.BorrowingsPage })))
const AdminBooksPage = lazy(() => import('./pages/admin/AdminBooksPage').then(module => ({ default: module.AdminBooksPage })))
const AdminBorrowingsPage = lazy(() => import('./pages/admin/AdminBorrowingsPage').then(module => ({ default: module.AdminBorrowingsPage })))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage').then(module => ({ default: module.AdminUsersPage })))
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

  const LoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="library-ui-theme">
        <AntdThemeProvider>
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
                        <Suspense fallback={<LoadingFallback />}>
                          <Dashboard />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="books"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<LoadingFallback />}>
                          <BooksPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="borrowings"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                        <Suspense fallback={<LoadingFallback />}>
                          <BorrowingsPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="my-borrowings"
                    element={
                      <ProtectedRoute allowedRoles={['member']}>
                        <Suspense fallback={<LoadingFallback />}>
                          <BorrowingsPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/books"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                        <Suspense fallback={<LoadingFallback />}>
                          <AdminBooksPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/borrowings"
                    element={
                      <ProtectedRoute allowedRoles={['admin', 'librarian']}>
                        <Suspense fallback={<LoadingFallback />}>
                          <AdminBorrowingsPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/users"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Suspense fallback={<LoadingFallback />}>
                          <AdminUsersPage />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </div>
          </Router>
        </AntdThemeProvider>
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