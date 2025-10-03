'use client'

import { useFileManager } from '@/filemanager/contexts/FileManagerContext'
import { Button } from '@/components/ui/button'
import { 
  Home,
  Folder,
  File,
  Settings,
  Info
} from 'lucide-react'

export function Sidebar() {
  const { state, dispatch } = useFileManager()

  const handleNavigateHome = () => {
    dispatch({ type: 'SET_CURRENT_PATH', payload: '/' })
  }

  const handleNavigateTo = (path: string) => {
    dispatch({ type: 'SET_CURRENT_PATH', payload: path })
  }

  const breadcrumbItems = state.currentPath.split('/').filter(item => item !== '')
  const breadcrumbPaths = breadcrumbItems.reduce((acc, item, index) => {
    const path = '/' + breadcrumbItems.slice(0, index + 1).join('/')
    acc.push({ name: item, path })
    return acc
  }, [] as Array<{ name: string; path: string }>)

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Button
          variant={state.currentPath === '/' ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={handleNavigateHome}
        >
          <Home className="w-4 h-4 mr-2" />
          Home
        </Button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-2">Navigation</h3>
        <div className="space-y-1">
          {breadcrumbPaths.map((item, index) => (
            <Button
              key={item.path}
              variant={state.currentPath === item.path ? 'default' : 'ghost'}
              className="w-full justify-start text-xs"
              onClick={() => handleNavigateTo(item.path)}
            >
              <Folder className="w-3 h-3 mr-2" />
              {item.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground px-2">Quick Actions</h3>
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start text-xs">
            <File className="w-3 h-3 mr-2" />
            Upload Files
          </Button>
          <Button variant="ghost" className="w-full justify-start text-xs">
            <Settings className="w-3 h-3 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Info className="w-3 h-3" />
            <span>File Manager</span>
          </div>
          <div className="mt-1">
            {state.selectedFiles.length} selected
          </div>
        </div>
      </div>
    </div>
  )
}