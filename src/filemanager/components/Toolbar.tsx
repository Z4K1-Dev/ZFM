'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFileManager } from '@/filemanager/contexts/FileManagerContext'
import { useFileOperations } from '@/filemanager/hooks/useFileOperations'
import { FileUpload } from './FileUpload'
import { 
  Search,
  Plus,
  Upload,
  Trash2,
  Download,
  Grid,
  List,
  LayoutList,
  Home,
  ArrowLeft,
  ArrowUp
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Toolbar() {
  const { state, dispatch } = useFileManager()
  const { createFolder, deleteFiles, downloadFiles, isLoading } = useFileOperations()

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:')
    if (folderName) {
      await createFolder(folderName)
    }
  }

  const handleDelete = async () => {
    if (state.selectedFiles.length > 0) {
      if (confirm(`Delete ${state.selectedFiles.length} item(s)?`)) {
        await deleteFiles(state.selectedFiles)
      }
    }
  }

  const handleDownload = async () => {
    if (state.selectedFiles.length > 0) {
      const downloadAsZip = state.selectedFiles.length > 1
      await downloadFiles(state.selectedFiles, downloadAsZip)
    }
  }

  const handleNavigateHome = () => {
    dispatch({ type: 'SET_CURRENT_PATH', payload: '/' })
  }

  const handleNavigateUp = () => {
    const parentPath = state.currentPath.split('/').slice(0, -1).join('/') || '/'
    dispatch({ type: 'SET_CURRENT_PATH', payload: parentPath })
  }

  const handleSearch = (value: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value })
  }

  const handleSort = (sortBy: 'name' | 'size' | 'lastModified' | 'type') => {
    const newSortOrder = state.sortBy === sortBy && state.sortOrder === 'desc' ? 'asc' : 'desc'
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder: newSortOrder } })
  }

  const handleViewMode = (mode: 'table' | 'grid' | 'compact') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode })
  }

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Navigation and Search */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateUp}
              disabled={state.currentPath === '/'}
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateHome}
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSort('name')}>
                Name {state.sortBy === 'name' && (state.sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('size')}>
                Size {state.sortBy === 'size' && (state.sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('lastModified')}>
                Date {state.sortBy === 'lastModified' && (state.sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('type')}>
                Type {state.sortBy === 'type' && (state.sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {state.viewMode === 'table' && <List className="w-4 h-4" />}
                {state.viewMode === 'grid' && <Grid className="w-4 h-4" />}
                {state.viewMode === 'compact' && <LayoutList className="w-4 h-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleViewMode('table')}>
                Table View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewMode('grid')}>
                Grid View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewMode('compact')}>
                Compact View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Action buttons */}
          <FileUpload />
          <Button variant="ghost" size="sm" onClick={handleCreateFolder}>
            <Plus className="w-4 h-4 mr-2" />
            New Folder
          </Button>

          {state.selectedFiles.length > 0 && (
            <>
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isLoading}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete ({state.selectedFiles.length})
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownload} disabled={isLoading}>
                <Download className="w-4 h-4 mr-2" />
                {state.selectedFiles.length > 1 ? 'Download ZIP' : 'Download'}
              </Button>
            </>
          )}

          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}