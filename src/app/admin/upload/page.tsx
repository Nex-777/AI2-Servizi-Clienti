'use client'

import { useState, useTransition } from 'react'
import { UploadCloud, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { uploadMultipleCsv, UploadResult } from './actions'

export default function UploadPage() {
  const [results, setResults] = useState<UploadResult[] | null>(null)
  const [pending, startUpload] = useTransition()
  const [fileCount, setFileCount] = useState(0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startUpload(() =>
      uploadMultipleCsv(fd).then(r => {
        setResults(r)
        form.reset()
        setFileCount(0)
      })
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex items-center gap-4 border-b border-slate-200 pb-6">
          <Link href="/" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-6 w-6 text-[#D32F2F]" />
              Caricamento CSV
            </h1>
            <p className="text-sm text-slate-500">
              Trascina più file CSV — il cliente viene rilevato automaticamente dal nome file
            </p>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drop zone */}
            <div>
              <label
                htmlFor="csv_files"
                className="group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[#D32F2F] hover:bg-red-50/30 transition-colors"
              >
                <UploadCloud className="h-10 w-10 text-slate-300 group-hover:text-[#D32F2F] mb-3 transition-colors" />
                <span className="text-sm font-semibold text-slate-600">
                  {fileCount > 0 ? `${fileCount} file selezionati` : 'Clicca o trascina qui i file CSV'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Format consigliato: PRE... (N° ditta, anno, mese)
                </span>
                <input
                  id="csv_files"
                  name="csv_files"
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={e => setFileCount(e.target.files?.length || 0)}
                />
              </label>
              <p className="mt-2 text-xs text-slate-400">
                Il sistema legge automaticamente <strong>N° ditta</strong>, <strong>anno</strong> e <strong>mese</strong> dal nome file e associa al cliente corretto.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={pending || fileCount === 0}
                className="flex-1 rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b02727] disabled:opacity-40 transition-colors"
              >
                {pending ? 'Caricamento...' : `Carica ${fileCount > 0 ? fileCount + ' file' : ''}`}
              </button>
              <Link
                href="/admin/fogli"
                className="flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Lista Fogli
              </Link>
            </div>
          </form>
        </div>

        {/* Results */}
        {results && (
          <div className="mt-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Risultati caricamento</h2>
            {results.map((r, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 flex items-start gap-3 ${
                  r.status === 'ok' ? 'border-emerald-200 bg-emerald-50' :
                  r.status === 'no_client' ? 'border-amber-200 bg-amber-50' :
                  'border-red-200 bg-red-50'
                }`}
              >
                {r.status === 'ok' && <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />}
                {r.status === 'no_client' && <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />}
                {r.status === 'error' && <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.filename}</p>
                  {r.azienda && <p className="text-xs text-slate-600">Azienda: {r.azienda} · Cliente: {r.cliente}</p>}
                  <p className={`text-xs mt-0.5 ${
                    r.status === 'ok' ? 'text-emerald-700' :
                    r.status === 'no_client' ? 'text-amber-700' : 'text-red-700'
                  }`}>{r.message}</p>
                  {r.status === 'no_client' && (
                    <Link href="/admin/clients" className="text-xs text-amber-800 underline mt-1 inline-block">
                      → Registra il cliente con questo N° ditta
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
