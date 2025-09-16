import React from 'react'
import { Navigate } from 'react-router-dom'

interface SimpleProtectedRouteProps {
  children: React.ReactNode
}

export function SimpleProtectedRoute({ children }: SimpleProtectedRouteProps) {
  // Very simple check - just return children for now
  // This bypasses all authentication checks temporarily
  return <>{children}</>
}