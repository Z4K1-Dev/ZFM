'use client'

import { useState, useEffect } from 'react'
import { useFileManager } from '@/filemanager/contexts/FileManagerContext'
import { useFileOperations } from '@/filemanager/hooks/useFileOperations'
import { FileItem } from '@/filemanager/types/fileManager'
import { formatFileSize } from '@/filemanager/utils/fileUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Folder, 
  File, 
  Image, 
  FileText, 
  Music, 
  Video, 
  Archive, 
  Code,
  MoreVertical,
  Download,
  Trash2,
  Copy,
  Eye
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBar } from './StatusBar'

export function FileBrowser() {
  const { state, dispatch } = useFileManager()
  const { fetchFiles, renameFile, isLoading } = useFileOperations()
  const [files, setFiles] = useState<FileItem[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [editingFile, setEditingFile] = useState<FileItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch files when path changes
    const loadFiles = async () => {
      const result = await fetchFiles(state.currentPath)
      if (result.success) {
        setFiles(result.data)
      }
    }
    loadFiles()
  }, [state.currentPath, fetchFiles])

  useEffect(() => {
    // Filter and sort files based on state
    let filtered = [...files]

    // Apply search filter
    if (state.searchQuery) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    }

    // Apply hidden files filter
    if (!state.showHiddenFiles) {
      filtered = filtered.filter(file => !file.name.startsWith('.'))
    }

    // Sort files
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (state.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = (a.size || 0) - (b.size || 0)
          break
        case 'lastModified':
          comparison = a.lastModified.getTime() - b.lastModified.getTime()
          break
        case 'type':
          comparison = (a.extension || '').localeCompare(b.extension || '')
          break
      }

      return state.sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredFiles(filtered)
  }, [files, state.searchQuery, state.sortBy, state.sortOrder, state.showHiddenFiles])

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) {
      return <Folder className="w-6 h-6 text-blue-400" />
    }

    switch (file.extension?.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="w-6 h-6 text-green-400" aria-hidden="true" alt="" />
      case 'txt':
      case 'md':
      case 'log':
        return <FileText className="w-6 h-6 text-gray-400" />
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="w-6 h-6 text-purple-400" />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Video className="w-6 h-6 text-red-400" />
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="w-6 h-6 text-yellow-400" />
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'cpp':
        return <Code className="w-6 h-6 text-orange-400" />
      default:
        return <File className="w-6 h-6 text-gray-400" />
    }
  }

  const handleFileClick = (file: FileItem, event: React.MouseEvent) => {
    if (event.ctrlKey) {
      // Toggle selection with Ctrl+Click
      dispatch({ type: 'TOGGLE_FILE_SELECTION', payload: file })
    } else if (event.shiftKey && state.selectedFiles.length > 0) {
      // Range selection with Shift+Click
      const lastSelected = state.selectedFiles[state.selectedFiles.length - 1]
      const startIndex = files.findIndex(f => f.id === lastSelected.id)
      const endIndex = files.findIndex(f => f.id === file.id)
      const range = files.slice(
        Math.min(startIndex, endIndex),
        Math.max(startIndex, endIndex) + 1
      )
      dispatch({ type: 'SET_SELECTED_FILES', payload: range })
    } else {
      // Single selection
      dispatch({ type: 'SET_SELECTED_FILES', payload: [file] })
    }
  }

  const handleIconClick = (file: FileItem, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent triggering the file click
    
    if (file.isDirectory) {
      // Navigate to directory only when clicking the icon
      dispatch({ type: 'SET_CURRENT_PATH', payload: file.path })
    }
  }

  const handleNameDoubleClick = (file: FileItem) => {
    setEditingFile(file)
    setEditName(file.name)
    setEditingId(file.id)
  }

  const handleNameEdit = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingFile && editName.trim()) {
      try {
        console.log('Attempting to rename:', editingFile.name, 'to:', editName)
        const result = await renameFile(editingFile, editName.trim())
        console.log('Rename result:', result)
        if (result.success) {
          // Clear the editing state immediately
          setEditingFile(null)
          setEditName('')
          setEditingId(null)
        }
      } catch (error) {
        console.error('Rename failed:', error)
      }
    } else if (e.key === 'Escape') {
      setEditingFile(null)
      setEditName('')
      setEditingId(null)
    }
  }

  const handleNameBlur = () => {
    // Only cancel if we're not in the middle of a successful rename
    if (editingFile && !editName.trim()) {
      setEditingFile(null)
      setEditName('')
      setEditingId(null)
    }
  }

  const getFileContextMenu = (file: FileItem) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => console.log('Open:', file.path)}>
            <Eye className="w-4 h-4 mr-2" />
            Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Download:', file.path)}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Copy:', file.path)}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Delete:', file.path)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderTableView = () => (
    <div className="p-2">
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b">
          <div className="flex items-center p-2 text-xs font-medium text-gray-700">
            <div className="w-8 flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={state.selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    dispatch({ type: 'SET_SELECTED_FILES', payload: filteredFiles })
                  } else {
                    dispatch({ type: 'RESET_SELECTION' })
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0 ml-2">Name</div>
            <div className="w-32 ml-4">Date</div>
            <div className="w-24 ml-4">Size</div>
            <div className="w-20 ml-4">Action</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y max-h-[calc(100vh-200px)] overflow-y-auto">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-center p-2 cursor-pointer transition-colors ${
                state.selectedFiles.some(f => f.id === file.id)
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={(e) => handleFileClick(file, e)}
            >
              {/* Checkbox */}
              <div className="w-8 flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={state.selectedFiles.some(f => f.id === file.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'TOGGLE_FILE_SELECTION', payload: file })
                  }}
                />
              </div>

              {/* File/Folder Name with Icon */}
              <div className="flex-1 min-w-0 ml-2 flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                      onClick={(e) => handleIconClick(file, e)}
                    >
                      {getFileIcon(file)}
                    </div>
                  </TooltipTrigger>
                  {file.isDirectory && (
                    <TooltipContent>
                      <p>Click to open directory</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                {editingId === file.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={handleNameEdit}
                    onBlur={handleNameBlur}
                    autoFocus
                    className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                ) : (
                  <span 
                    className="text-sm truncate cursor-pointer select-none"
                    onDoubleClick={() => handleNameDoubleClick(file)}
                  >
                    {file.name}
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="w-32 ml-4 text-xs text-gray-600">
                {formatDate(file.lastModified).split(' ')[0]}
              </div>

              {/* Size */}
              <div className="w-24 ml-4 text-xs text-gray-600">
                {file.isDirectory ? '-' : formatFileSize(file.size)}
              </div>

              {/* Action */}
              <div className="w-20 ml-4 flex items-center justify-center space-x-1 flex-shrink-0">
                {getFileContextMenu(file)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredFiles.map((file) => (
          <Card
            key={file.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              state.selectedFiles.some(f => f.id === file.id)
                ? 'ring-2 ring-blue-500'
                : ''
            }`}
            onClick={(e) => handleFileClick(file, e)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handleIconClick(file, e)}
                    >
                      {getFileIcon(file)}
                    </div>
                  </TooltipTrigger>
                  {file.isDirectory && (
                    <TooltipContent>
                      <p>Click to open directory</p>
                    </TooltipContent>
                  )}
                </Tooltip>
                <div className="flex-1 min-w-0">
                  {editingId === file.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={handleNameEdit}
                      onBlur={handleNameBlur}
                      autoFocus
                      className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div 
                      className="font-medium text-sm truncate cursor-pointer select-none"
                      onDoubleClick={() => handleNameDoubleClick(file)}
                    >
                      {file.name}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    {file.isDirectory ? 'Folder' : file.extension?.toUpperCase() || 'File'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(file.lastModified)}
                  </div>
                </div>
              </div>
              {getFileContextMenu(file)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const renderCompactView = () => (
    <div className="p-2">
      <div className="space-y-1">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={`flex items-center p-2 rounded border cursor-pointer transition-colors ${
              state.selectedFiles.some(f => f.id === file.id)
                ? 'bg-blue-100 border-blue-300'
                : 'hover:bg-gray-100 border-gray-200'
            }`}
            onClick={(e) => handleFileClick(file, e)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => handleIconClick(file, e)}
                >
                  {getFileIcon(file)}
                </div>
              </TooltipTrigger>
              {file.isDirectory && (
                <TooltipContent>
                  <p>Click to open directory</p>
                </TooltipContent>
              )}
            </Tooltip>
            <div className="flex-1 min-w-0 ml-2">
              {editingId === file.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleNameEdit}
                  onBlur={handleNameBlur}
                  autoFocus
                  className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <div 
                  className="font-medium text-sm truncate cursor-pointer select-none"
                  onDoubleClick={() => handleNameDoubleClick(file)}
                >
                  {file.name}
                </div>
              )}
              <div className="text-xs text-gray-500 ml-2">
                {file.isDirectory ? 'Folder' : file.extension?.toUpperCase() || 'File'} • {formatFileSize(file.size)} • {formatDate(file.lastModified).split(' ')[0]}
              </div>
            </div>
            {getFileContextMenu(file)}
          </div>
        ))}
      </div>
    </div>
  )

  const formatDate = (date: Date) => {
    try {
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-hidden">
          {state.viewMode === 'table' && renderTableView()}
          {state.viewMode === 'grid' && renderGridView()}
          {state.viewMode === 'compact' && renderCompactView()}
        </div>
        <StatusBar filteredFilesCount={filteredFiles.length} />
      </div>
    </TooltipProvider>
  )
}