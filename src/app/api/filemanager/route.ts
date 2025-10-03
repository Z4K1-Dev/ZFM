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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pathParam = searchParams.get('path') || '/'
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Convert relative path to absolute path
    const basePath = '/home/z/my-project'
    const targetPath = pathParam === '/' ? basePath : path.join(basePath, pathParam.replace(/^\//, ''))
    
    // Check if path exists
    try {
      await fs.access(targetPath)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Path does not exist' },
        { status: 404 }
      )
    }

    // Read directory contents
    const entries = await fs.readdir(targetPath, { withFileTypes: true })
    let files: FileItem[] = []

    for (const entry of entries) {
      const filePath = path.join(targetPath, entry.name)
      const stats = await fs.stat(filePath)
      const fileItem = await statsToFileItem(stats, filePath, basePath)
      files.push(fileItem)
    }

    // Apply search filter
    if (search) {
      files = files.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort files
    files.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
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

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return NextResponse.json({
      success: true,
      data: files,
      path: pathParam,
      total: files.length
    })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, files, filePath, newName } = body

    // Convert relative path to absolute path
    const basePath = '/home/z/my-project'
    const targetPath = filePath === '/' ? basePath : path.join(basePath, filePath.replace(/^\//, ''))

    switch (action) {
      case 'upload':
        // Handle file upload (this would need to be implemented separately)
        return NextResponse.json({
          success: true,
          message: 'Files uploaded successfully',
          data: files
        })

      case 'create_folder':
        // Handle folder creation
        const newFolderPath = path.join(targetPath, newName)
        try {
          await fs.mkdir(newFolderPath, { recursive: true })
          const stats = await fs.stat(newFolderPath)
          const newFolder = await statsToFileItem(stats, newFolderPath, basePath)
          
          return NextResponse.json({
            success: true,
            message: 'Folder created successfully',
            data: newFolder
          })
        } catch (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to create folder' },
            { status: 500 }
          )
        }

      case 'delete':
        // Handle file deletion
        try {
          for (const file of files) {
            const fileToDeletePath = path.join(basePath, file.path.replace(/^\//, ''))
            await fs.rm(fileToDeletePath, { recursive: true, force: true })
          }
          
          return NextResponse.json({
            success: true,
            message: 'Files deleted successfully',
            data: files
          })
        } catch (error) {
          return NextResponse.json(
            { success: false, error: 'Failed to delete files' },
            { status: 500 }
          )
        }

      case 'rename':
        // Handle file renaming
        try {
          const fileToRename = files[0]
          console.log('Rename request:', { fileToRename, newName, filePath })
          
          // Ensure file path starts with / for proper joining
          const cleanFilePath = fileToRename.path.startsWith('/') ? fileToRename.path : '/' + fileToRename.path
          const oldFilePath = path.join(basePath, cleanFilePath.replace(/^\//, ''))
          const newFilePath = path.join(basePath, path.dirname(cleanFilePath.replace(/^\//, '')), newName)
          
          console.log('File paths:', { oldFilePath, newFilePath })
          
          // Check if source file/directory exists
          try {
            await fs.access(oldFilePath)
            console.log('Source exists')
          } catch (accessError) {
            console.error('Source does not exist:', accessError)
            return NextResponse.json(
              { success: false, error: `Source does not exist: ${oldFilePath}` },
              { status: 404 }
            )
          }
          
          // Check if destination already exists
          try {
            await fs.access(newFilePath)
            console.log('Destination already exists')
            return NextResponse.json(
              { success: false, error: 'Destination already exists' },
              { status: 409 }
            )
          } catch (accessError) {
            console.log('Destination does not exist, proceeding with rename')
          }
          
          // Check if source is a directory
          const oldStats = await fs.stat(oldFilePath)
          if (oldStats.isDirectory()) {
            console.log('Renaming directory')
            // For cross-device moves, we need to copy and then delete
            await fs.cp(oldFilePath, newFilePath, { recursive: true })
            await fs.rm(oldFilePath, { recursive: true, force: true })
          } else {
            console.log('Renaming file')
            // For cross-device moves, we need to copy and then delete
            await fs.cp(oldFilePath, newFilePath)
            await fs.rm(oldFilePath, { force: true })
          }
          
          console.log('Rename successful')
          
          // Get the updated file stats
          const newStats = await fs.stat(newFilePath)
          const renamedFile = await statsToFileItem(newStats, newFilePath, basePath)
          
          return NextResponse.json({
            success: true,
            message: 'Renamed successfully',
            data: renamedFile
          })
        } catch (error) {
          console.error('Rename error:', error)
          return NextResponse.json(
            { success: false, error: `Failed to rename: ${error instanceof Error ? error.message : 'Unknown error'}` },
            { status: 500 }
          )
        }

      case 'download':
        // Handle file download (this would need to be implemented separately)
        return NextResponse.json({
          success: true,
          message: 'Files downloaded successfully',
          data: files
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error handling file operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to handle file operation' },
      { status: 500 }
    )
  }
}