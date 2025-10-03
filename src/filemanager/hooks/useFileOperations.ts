'use client'

import { useState, useCallback } from 'react'
import { useFileManager } from '@/filemanager/contexts/FileManagerContext'
import { FileItem, FileOperationResult } from '@/filemanager/types/fileManager'
import { toast } from 'sonner'

export function useFileOperations() {
  const { state, dispatch } = useFileManager()
  const [isLoading, setIsLoading] = useState(false)

  const fetchFiles = useCallback(async (path: string = state.currentPath): Promise<FileOperationResult> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/filemanager?path=${encodeURIComponent(path)}&search=${encodeURIComponent(state.searchQuery)}&sortBy=${state.sortBy}&sortOrder=${state.sortOrder}`)
      const result = await response.json()
      
      if (result.success) {
        // Convert date strings back to Date objects
        const filesWithDates = result.data.map((file: any) => ({
          ...file,
          lastModified: new Date(file.lastModified)
        }))
        dispatch({ type: 'SET_FILES', payload: filesWithDates })
        return { success: true, data: filesWithDates }
      } else {
        throw new Error(result.error || 'Failed to fetch files')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to fetch files: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [state.searchQuery, state.sortBy, state.sortOrder, dispatch])

  const uploadFiles = async (files: File[], path: string = state.currentPath): Promise<FileOperationResult> => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })
      formData.append('filePath', path)

      const response = await fetch('/api/filemanager/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Files uploaded successfully')
        await fetchFiles(path)
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to upload files')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to upload files: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const createFolder = async (folderName: string, path: string = state.currentPath): Promise<FileOperationResult> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/filemanager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_folder',
          filePath: path,
          newName: folderName,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Folder created successfully')
        await fetchFiles(path)
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to create folder')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to create folder: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFiles = async (files: FileItem[], path: string = state.currentPath): Promise<FileOperationResult> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/filemanager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          files,
          filePath: path,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Files deleted successfully')
        await fetchFiles(path)
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to delete files')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to delete files: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const renameFile = async (file: FileItem, newName: string, path: string = state.currentPath): Promise<FileOperationResult> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/filemanager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rename',
          files: [file],
          filePath: path,
          newName,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('File renamed successfully')
        await fetchFiles(path)
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to rename file')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to rename file: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const downloadFiles = async (files: FileItem[], downloadAsZip: boolean = false): Promise<FileOperationResult> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/filemanager/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          downloadAsZip,
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        if (downloadAsZip && files.length > 1) {
          // For ZIP downloads, create a ZIP file on the client side
          const zip = new JSZip()
          
          // Add files to ZIP
          for (const file of files) {
            const fileResponse = await fetch(`/api/filemanager?path=${encodeURIComponent(file.path)}`)
            const fileResult = await fileResponse.json()
            
            if (fileResult.success) {
              // For files, we need to get the actual content
              const content = await fetch(fileResult.data[0].path).then(res => res.blob())
              zip.file(file.name, content)
            }
          }
          
          // Generate and download ZIP
          const zipContent = await zip.generateAsync({ type: 'blob' })
          const url = URL.createObjectURL(zipContent)
          const a = document.createElement('a')
          a.href = url
          a.download = `files_${Date.now()}.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toast.success('Files downloaded as ZIP')
        } else {
          // Single file download
          const fileData = result.data
          const buffer = Buffer.from(fileData.buffer, 'base64')
          const blob = new Blob([buffer], { type: fileData.mimeType })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileData.fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          toast.success('File downloaded successfully')
        }
        
        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to download files')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to download files: ${errorMessage}`)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    fetchFiles,
    uploadFiles,
    createFolder,
    deleteFiles,
    renameFile,
    downloadFiles,
  }
}