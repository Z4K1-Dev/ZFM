export function formatFileSize(bytes?: number): string {
  if (!bytes) return '-'
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

export function formatDate(date: Date): string {
  try {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  } catch (error) {
    return 'Invalid date'
  }
}