import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { X } from 'lucide-react'
import {
  BookOpen,
  BarChart3,
  Library,
  History,
  Book,
  FileText,
  UserCog
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
    roles: ['admin', 'librarian', 'member']
  },
  {
    name: 'Books Catalog',
    href: '/books',
    icon: BookOpen,
    roles: ['admin', 'librarian', 'member']
  },
  {
    name: 'My Borrowings',
    href: '/my-borrowings',
    icon: History,
    roles: ['member']
  },
  {
    name: 'All Borrowings',
    href: '/borrowings',
    icon: Library,
    roles: ['admin', 'librarian']
  },
  {
    name: 'Books Management',
    href: '/admin/books',
    icon: Book,
    roles: ['admin', 'librarian']
  },
  {
    name: 'Borrowings Management',
    href: '/admin/borrowings',
    icon: FileText,
    roles: ['admin', 'librarian']
  },
  {
    name: 'Users Management',
    href: '/admin/users',
    icon: UserCog,
    roles: ['admin']
  },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const location = useLocation()
  const { profile } = useAuthStore()

  const filteredNavigation = navigation.filter(item => {
    return profile?.role && item.roles.includes(profile.role)
  })

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <Library className="h-8 w-8 text-blue-600" />
        <span className="ml-2 text-xl font-semibold text-gray-900 dark:text-white">
          LibraryMS
        </span>
      </div>
      
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Mobile close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
      >
        <X className="h-6 w-6" />
      </button>
    </div>
    </>
  )
}