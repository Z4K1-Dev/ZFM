'use client'

import { useFileManager } from '@/filemanager/contexts/FileManagerContext'
import { FileItem } from '@/filemanager/types/fileManager'
import { formatFileSize } from '@/filemanager/utils/fileUtils'
import { 
  FileText,
  Folder,
  HardDrive
} from 'lucide-react'

interface StatusBarProps {
  filteredFilesCount: number
}

export function StatusBar({ filteredFilesCount }: StatusBarProps) {
  const { state } = useFileManager()

  const calculateStats = () => {
    const totalFiles = state.selectedFiles.length
    const totalFolders = state.selectedFiles.filter(f => f.isDirectory).length
    const totalSize = state.selectedFiles
      .filter(f => !f.isDirectory)
      .reduce((sum, file) => sum + (file.size || 0), 0)

    return {
      totalFiles,
      totalFolders,
      totalSize
    }
  }

  const stats = calculateStats()

  return (
    <div className="border-t bg-background px-4 py-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <HardDrive className="w-3 h-3" />
            <span>{state.currentPath}</span>
          </div>
          
          {state.selectedFiles.length > 0 && (
            <>
              <div className="flex items-center space-x-1">
                <Folder className="w-3 h-3" />
                <span>{stats.totalFolders} folders</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>{stats.totalFiles} files</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Size: {formatFileSize(stats.totalSize)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span>{filteredFilesCount} items</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>Sort: {state.sortBy} {state.sortOrder === 'asc' ? '↑' : '↓'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>View: {state.viewMode}</span>
          </div>
        </div>
      </div>
    </div>
  )
}