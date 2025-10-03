export interface FileItem {
  id: string
  name: string
  path: string
  isDirectory: boolean
  lastModified: Date
  size: number
  extension?: string
  mimeType?: string
}

export interface FileOperationResult {
  success: boolean
  data?: any
  error?: string
}