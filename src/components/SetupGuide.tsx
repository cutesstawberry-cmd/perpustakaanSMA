import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from 'antd'
import { Database, Settings, BookOpen, Users } from 'lucide-react'

export function SetupGuide() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    return null // Don't show if properly configured
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Library Management System
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Setup required to get started
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Configuration Required
            </CardTitle>
            <CardDescription>
              This application requires Supabase configuration to function properly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Missing Environment Variables:
              </h3>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                {!supabaseUrl && <li>• VITE_SUPABASE_URL</li>}
                {!supabaseAnonKey && <li>• VITE_SUPABASE_ANON_KEY</li>}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Setup Instructions:
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                <li>Create a Supabase project at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com</a></li>
                <li>Get your project URL and anon key from the project settings</li>
                <li>Create a <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env.local</code> file in the project root</li>
                <li>Add the following variables:</li>
              </ol>
              
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <pre className="text-xs text-gray-800 dark:text-gray-200">
{`VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here`}
                </pre>
              </div>
              
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside" start="5">
                <li>Run the database migrations from the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">supabase/migrations/</code> folder</li>
                <li>Restart the development server</li>
              </ol>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="primary" 
                icon={<Settings className="w-4 h-4" />}
                onClick={() => window.open('https://supabase.com', '_blank')}
              >
                Open Supabase
              </Button>
              <Button 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Need help? Check the <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">SETUP.md</code> file for detailed instructions.</p>
        </div>
      </div>
    </div>
  )
}