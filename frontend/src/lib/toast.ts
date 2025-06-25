import { toast as sonnerToast } from 'sonner'

// Utility functions for consistent toast usage across the app
export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
    })
  },
  
  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
    })
  },
  
  info: (message: string, description?: string) => {
    return sonnerToast.info(message, {
      description,
    })
  },
  
  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
    })
  },
  
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description,
    })
  },
  
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },
  
  dismiss: (id?: string | number) => {
    return sonnerToast.dismiss(id)
  },
}

export default toast