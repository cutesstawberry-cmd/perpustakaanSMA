// Error handling utilities
export function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return null
  }

  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'number') {
    return data
  }

  if (typeof data === 'boolean') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }

  if (typeof data === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      try {
        sanitized[key] = sanitizeData(value)
      } catch (error) {
        console.warn(`Failed to sanitize field ${key}:`, error)
        sanitized[key] = null
      }
    }
    return sanitized
  }

  // For any other type, convert to string
  try {
    return String(data)
  } catch (error) {
    console.warn('Failed to convert data to string:', error)
    return null
  }
}

export function validateProfile(profile: any): boolean {
  if (!profile || typeof profile !== 'object') {
    return false
  }

  // Check required fields
  if (!profile.id || typeof profile.id !== 'string') {
    console.error('Invalid profile: missing or invalid id')
    return false
  }

  if (!profile.role || !['admin', 'librarian', 'member'].includes(profile.role)) {
    console.error('Invalid profile: missing or invalid role')
    return false
  }

  return true
}

export function logError(error: any, context: string = 'Unknown') {
  console.error(`[${context}] Error:`, {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    name: error?.name,
    context
  })
}

export function safeLocalStorageGet(key: string): any {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      return null;
    }
    
    // Validate that it's a valid JSON string
    if (typeof item !== 'string' || item.trim() === '') {
      console.warn(`Invalid localStorage data for key: ${key}`);
      localStorage.removeItem(key);
      return null;
    }
    
    return JSON.parse(item);
  } catch (error) {
    logError(error, `localStorage get ${key}`);
    localStorage.removeItem(key);
    return null;
  }
}

export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return true;
    }
    
    const jsonString = JSON.stringify(value);
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    logError(error, `localStorage set ${key}`);
    return false;
  }
}

export function safeLocalStorageRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    logError(error, `localStorage remove ${key}`);
    return false;
  }
}