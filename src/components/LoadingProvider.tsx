'use client'

import React, { createContext, useContext, useState } from 'react'

interface LoadingContextType {
  setLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ setLoading: setIsLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200">
          <div className="flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-10 h-10 border-[4px] border-slate-100 border-t-[#D32F2F] rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}
