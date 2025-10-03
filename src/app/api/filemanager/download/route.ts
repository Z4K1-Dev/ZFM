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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { files, downloadAsZip } = body

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    const basePath = '/home/z/my-project'

    if (downloadAsZip && files.length > 1) {
      // For multiple files, return file paths for client-side ZIP handling
      const filePaths = files.map((file: FileItem) => ({
        name: file.name,
        path: path.join(basePath, file.path.replace(/^\//, '')),
        mimeType: file.mimeType
      }))

      return NextResponse.json({
        success: true,
        message: 'Ready to create ZIP archive',
        data: {
          files: filePaths,
          totalFiles: files.length
        }
      })
    } else {
      // Single file download
      if (files.length !== 1) {
        return NextResponse.json(
          { success: false, error: 'Single file download requires exactly one file' },
          { status: 400 }
        )
      }

      const file = files[0]
      const filePath = path.join(basePath, file.path.replace(/^\//, ''))
      
      try {
        const stats = await fs.stat(filePath)
        const fileBuffer = await fs.readFile(filePath)
        
        return NextResponse.json({
          success: true,
          message: 'File downloaded successfully',
          data: {
            fileName: file.name,
            buffer: fileBuffer.toString('base64'),
            size: stats.size,
            mimeType: file.mimeType || 'application/octet-stream'
          }
        })
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to read file' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('Error handling file download:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to download files' },
      { status: 500 }
    )
  }
}