'use client'

import { useState } from 'react'
import { FileBrowser } from './FileBrowser'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { useFileManager } from '@/filemanager/contexts/FileManagerContext'

export function FileManager() {
  const { state } = useFileManager()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">File Manager</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {state.currentPath === '/' ? 'Root' : state.currentPath}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform duration-200 ease-in-out lg:transition-none`}>
          <Sidebar />
        </aside>

        {/* File Browser */}
        <main className="flex-1 flex flex-col">
          <Toolbar />
          <FileBrowser />
        </main>
      </div>
    </div>
  )
}