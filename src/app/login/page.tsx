'use client'

import { useState } from 'react'
import { login } from './actions'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await login(formData)
    } catch (e: unknown) {
      // redirect throws - if it's a redirect error, let it pass
      const msg = e instanceof Error ? e.message : String(e)
      if (!msg.includes('NEXT_REDIRECT')) {
        setError('Codici non validi. Riprova.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img src="/logo.jpg" alt="AI2 Logo" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accesso Piattaforma</h1>
          <p className="mt-2 text-sm text-slate-500">Inserisci le tue credenziali per continuare</p>
        </div>

        <form action={handleLogin} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-center text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Codice 1
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="text"
                required
                autoComplete="off"
                className="block w-full rounded-md border border-slate-300 bg-white py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] sm:text-sm px-3 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Codice 2
            </label>
            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="block w-full rounded-md border border-slate-300 bg-white py-2 text-slate-900 shadow-sm focus:ring-2 focus:ring-[#D32F2F] focus:border-[#D32F2F] sm:text-sm px-3 pr-10 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-[#D32F2F] px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b02727] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D32F2F] transition-colors"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
