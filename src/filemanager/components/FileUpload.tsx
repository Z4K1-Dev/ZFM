'use client'

import { useState, useRef, useCallback } from 'react'
import { useFileManager } from '@/filemanager/contexts/FileManagerContext'
import { useFileOperations } from '@/filemanager/hooks/useFileOperations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle,
  Upload as UploadIcon
} from 'lucide-react'
import { toast } from 'sonner'

interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export function FileUpload() {
  const { state, dispatch } = useFileManager()
  const { uploadFiles } = useFileOperations()
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }))
    
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const uploadSelectedFiles = async () => {
    if (files.length === 0) return

    const filesToUpload = files.filter(f => f.status === 'pending')
    if (filesToUpload.length === 0) return

    // Update status to uploading
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' } : f
    ))

    try {
      // Simulate progress updates
      const progressIntervals = filesToUpload.map((uploadFile, index) => {
        return setInterval(() => {
          setFiles(prev => prev.map((f, i) => {
            if (i === files.findIndex(uf => uf.file === uploadFile.file)) {
              const newProgress = Math.min((f.progress || 0) + 10, 90)
              return { ...f, progress: newProgress }
            }
            return f
          }))
        }, 200)
      })

      // Actual upload
      const fileObjects = filesToUpload.map(f => f.file)
      const result = await uploadFiles(fileObjects, state.currentPath)

      // Clear intervals
      progressIntervals.forEach(interval => clearInterval(interval))

      if (result.success) {
        setFiles(prev => prev.map(f => 
          filesToUpload.some(uf => uf.file === f.file) 
            ? { ...f, status: 'completed', progress: 100 }
            : f
        ))
        toast.success(`Successfully uploaded ${filesToUpload.length} file(s)`)
        
        // Clear completed files after delay
        setTimeout(() => {
          setFiles(prev => prev.filter(f => f.status !== 'completed'))
        }, 2000)
      } else {
        setFiles(prev => prev.map(f => 
          filesToUpload.some(uf => uf.file === f.file) 
            ? { ...f, status: 'error', error: result.error }
            : f
        ))
        toast.error(`Upload failed: ${result.error}`)
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        filesToUpload.some(uf => uf.file === f.file) 
          ? { ...f, status: 'error', error: 'Upload failed' }
          : f
      ))
      toast.error('Upload failed')
    }
  }

  const clearAll = () => {
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-4 h-4 text-gray-400" />
      case 'uploading':
        return <UploadIcon className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'uploading':
        return 'Uploading'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center space-y-2"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                Click to select files or drag and drop
              </span>
              <span className="text-xs text-gray-400">
                Multiple files supported
              </span>
            </label>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Selected Files ({files.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={clearAll}>
                  <X className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((uploadFile, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {getStatusIcon(uploadFile.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {uploadFile.file.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            uploadFile.status === 'completed' ? 'bg-green-100 text-green-800' :
                            uploadFile.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusText(uploadFile.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(uploadFile.file.size)}
                          </span>
                        </div>
                      </div>
                      
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-1">
                          <Progress value={uploadFile.progress} className="w-full" />
                          <span className="text-xs text-gray-500 mt-1">
                            {uploadFile.progress}%
                          </span>
                        </div>
                      )}
                      
                      {uploadFile.status === 'error' && (
                        <span className="text-xs text-red-500">
                          {uploadFile.error}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={uploadSelectedFiles}
              disabled={files.length === 0 || files.every(f => f.status !== 'pending')}
            >
              Upload {files.filter(f => f.status === 'pending').length} files
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}