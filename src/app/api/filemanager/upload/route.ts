import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as path from 'path'

interface FileItem {
  id: string
  name: string
  path: string
  isDirectory: boolean
  lastModified: Date
  size: number
  extension?: string
  mimeType?: string
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()
  return ext ? ext.toLowerCase() : ''
}

// Helper function to get MIME type
function getMimeType(filename: string): string {
  const ext = getFileExtension(filename)
  switch (ext) {
    case 'txt': return 'text/plain'
    case 'md': return 'text/markdown'
    case 'pdf': return 'application/pdf'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'gif': return 'image/gif'
    case 'svg': return 'image/svg+xml'
    case 'mp3': return 'audio/mpeg'
    case 'wav': return 'audio/wav'
    case 'flac': return 'audio/flac'
    case 'mp4': return 'video/mp4'
    case 'avi': return 'video/x-msvideo'
    case 'mov': return 'video/quicktime'
    case 'zip': return 'application/zip'
    case 'rar': return 'application/x-rar-compressed'
    case '7z': return 'application/x-7z-compressed'
    case 'js': return 'application/javascript'
    case 'ts': return 'application/typescript'
    case 'py': return 'text/x-python'
    case 'java': return 'text/x-java-source'
    case 'cpp': return 'text/x-c++src'
    case 'css': return 'text/css'
    case 'html':
    case 'htm': return 'text/html'
    case 'json': return 'application/json'
    default: return 'application/octet-stream'
  }
}

// Helper function to convert stats to FileItem
async function statsToFileItem(stats: fs.Stats, filePath: string, basePath: string): Promise<FileItem> {
  const relativePath = path.relative(basePath, filePath)
  const isDirectory = stats.isDirectory()
  const name = path.basename(filePath)
  
  return {
    id: stats.ino.toString(),
    name,
    path: relativePath === '.' ? '/' : `/${relativePath.replace(/\\/g, '/')}`,
    isDirectory,
    lastModified: stats.mtime,
    size: isDirectory ? 0 : stats.size,
    extension: !isDirectory ? getFileExtension(name) : undefined,
    mimeType: !isDirectory ? getMimeType(name) : undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const filePath = formData.get('filePath') as string || '/'

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    // Convert relative path to absolute path
    const basePath = '/home/z/my-project'
    const targetPath = filePath === '/' ? basePath : path.join(basePath, filePath.replace(/^\//, ''))
    
    // Check if target directory exists
    try {
      await fs.access(targetPath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Target directory does not exist' },
        { status: 404 }
      )
    }

    const uploadedFiles = []

    for (const file of files) {
      try {
        const fileName = file.name
        const fileExtension = getFileExtension(fileName)
        const mimeType = getMimeType(fileName)
        
        // Sanitize filename to prevent directory traversal
        const safeFileName = path.basename(fileName)
        const uploadPath = path.join(targetPath, safeFileName)
        
        // Convert file buffer to Buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        
        // Write file to disk
        await fs.writeFile(uploadPath, fileBuffer)
        
        // Get file stats
        const stats = await fs.stat(uploadPath)
        const uploadedFile = await statsToFileItem(stats, uploadPath, basePath)
        
        uploadedFiles.push({
          ...uploadedFile,
          originalName: fileName,
          mimeType
        })
        
      } catch (error) {
        console.error('Error uploading file:', file.name, error)
        // Continue with other files even if one fails
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files were successfully uploaded' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      data: uploadedFiles,
      total: uploadedFiles.length
    })

  } catch (error) {
    console.error('Error handling file upload:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}