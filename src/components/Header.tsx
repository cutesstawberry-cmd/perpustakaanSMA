import React from 'react'
import { Button, Avatar, Dropdown, MenuProps } from 'antd'
import { useTheme } from '@/components/ui/theme-provider'
import { useAuthStore } from '@/stores/authStore'
import { Moon, Sun, LogOut, User, Settings, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { profile, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name || name.trim() === '') return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'user',
      label: (
        <div>
          <div style={{ fontWeight: 'medium' }}>{profile?.full_name || 'User'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {profile?.role && profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </div>
          {profile?.member_id && (
            <div style={{ fontSize: '12px', color: '#666' }}>ID: {profile.member_id}</div>
          )}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'profile',
      icon: <User />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <Settings />,
      label: 'Settings',
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogOut />,
      label: 'Log out',
      onClick: handleSignOut,
    },
  ]

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <Button
          type="text"
          size="small"
          icon={<Menu />}
          onClick={onMenuClick}
          className="mr-4 lg:hidden"
          style={{ border: 'none', boxShadow: 'none' }}
        />

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {profile?.role === 'admin' && 'Admin Dashboard'}
          {profile?.role === 'librarian' && 'Librarian Panel'}
          {profile?.role === 'member' && 'Member Portal'}
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button
          type="text"
          size="small"
          icon={theme === 'dark' ? <Sun /> : <Moon />}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ border: 'none', boxShadow: 'none' }}
        />

        <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
          <Button type="text" shape="circle" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
            <Avatar src={profile?.avatar_url} size={32}>
              {getInitials(profile?.full_name)}
            </Avatar>
          </Button>
        </Dropdown>
      </div>
    </header>
  )
}