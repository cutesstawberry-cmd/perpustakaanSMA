import React from 'react'
import { ConfigProvider } from 'antd'
import { theme } from 'antd'
import { useTheme } from './ui/theme-provider'

const AntdThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme: currentTheme } = useTheme()

  const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const antdTheme = {
    token: {
      colorPrimary: '#1890ff',
    },
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  }

  return (
    <ConfigProvider theme={antdTheme}>
      {children}
    </ConfigProvider>
  )
}

export default AntdThemeProvider