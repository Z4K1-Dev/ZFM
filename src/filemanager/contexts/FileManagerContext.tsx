'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import { FileItem } from '@/filemanager/types/fileManager'

interface FileManagerState {
  currentPath: string
  selectedFiles: FileItem[]
  sortBy: 'name' | 'size' | 'lastModified' | 'type'
  sortOrder: 'asc' | 'desc'
  searchQuery: string
  showHiddenFiles: boolean
  viewMode: 'table' | 'grid' | 'compact'
}

type FileManagerAction =
  | { type: 'SET_CURRENT_PATH'; payload: string }
  | { type: 'SET_SELECTED_FILES'; payload: FileItem[] }
  | { type: 'TOGGLE_FILE_SELECTION'; payload: FileItem }
  | { type: 'RESET_SELECTION' }
  | { type: 'SET_SORT'; payload: { sortBy: 'name' | 'size' | 'lastModified' | 'type'; sortOrder: 'asc' | 'desc' } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'TOGGLE_HIDDEN_FILES' }
  | { type: 'SET_VIEW_MODE'; payload: 'table' | 'grid' | 'compact' }
  | { type: 'SET_FILES'; payload: FileItem[] }

const initialState: FileManagerState = {
  currentPath: '/',
  selectedFiles: [],
  sortBy: 'type',
  sortOrder: 'asc',
  searchQuery: '',
  showHiddenFiles: false,
  viewMode: 'table'
}

function fileManagerReducer(state: FileManagerState, action: FileManagerAction): FileManagerState {
  switch (action.type) {
    case 'SET_CURRENT_PATH':
      return { ...state, currentPath: action.payload }
    
    case 'SET_SELECTED_FILES':
      return { ...state, selectedFiles: action.payload }
    
    case 'TOGGLE_FILE_SELECTION':
      const isSelected = state.selectedFiles.some(f => f.id === action.payload.id)
      if (isSelected) {
        return { ...state, selectedFiles: state.selectedFiles.filter(f => f.id !== action.payload.id) }
      } else {
        return { ...state, selectedFiles: [...state.selectedFiles, action.payload] }
      }
    
    case 'RESET_SELECTION':
      return { ...state, selectedFiles: [] }
    
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder }
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    
    case 'TOGGLE_HIDDEN_FILES':
      return { ...state, showHiddenFiles: !state.showHiddenFiles }
    
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    
    case 'SET_FILES':
      return { ...state, selectedFiles: [] } // Clear selection when files are updated
    
    default:
      return state
  }
}

interface FileManagerContextType {
  state: FileManagerState
  dispatch: React.Dispatch<FileManagerAction>
}

const FileManagerContext = createContext<FileManagerContextType | undefined>(undefined)

export function FileManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(fileManagerReducer, initialState)

  return (
    <FileManagerContext.Provider value={{ state, dispatch }}>
      {children}
    </FileManagerContext.Provider>
  )
}

export function useFileManager() {
  const context = useContext(FileManagerContext)
  if (context === undefined) {
    throw new Error('useFileManager must be used within a FileManagerProvider')
  }
  return context
}