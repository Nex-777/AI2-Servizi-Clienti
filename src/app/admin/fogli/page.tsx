import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { ArrowLeft, FileText, CheckCircle, Clock, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export default async function FogliPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/')

  const admin = createAdminClient()
  const { data: fogli } = await admin
    .from('fogli_presenza')
    .select('*, profiles!fogli_presenza_client_id_fkey(email)')
    .order('uploaded_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#D32F2F]" />
                Fogli Presenze
              </h1>
              <p className="text-sm text-slate-500">Tutti i fogli caricati per i clienti</p>
            </div>
          </div>
          <Link
            href="/admin/upload"
            className="flex items-center gap-2 rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b02727] transition-colors"
          >
            + Nuovo Caricamento
          </Link>
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Azienda</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Periodo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Caricato il</th>
                <th className="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fogli?.map((f: Record<string, unknown>) => {
                const client = f.profiles as { email?: string } | null
                const email = client?.email ? String(client.email).replace('@gis-internal.com', '') : '—'
                const mese = MESI[Number(f.mese)] || `Mese ${f.mese}`
                const confermato = f.status === 'confermato'
                return (
                  <tr key={String(f.id)} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{String(f.azienda)}</td>
                    <td className="px-6 py-4 text-slate-600">{email}</td>
                    <td className="px-6 py-4 text-slate-600">{mese} {String(f.anno)}</td>
                    <td className="px-6 py-4">
                      {confermato ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> Confermato
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Clock className="h-3 w-3" /> Bozza
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(String(f.uploaded_at)).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Link
                        href={`/admin/fogli/${f.id}`}
                        className="p-2 text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-lg transition-colors"
                        title="Visualizza"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(!fogli || fogli.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Nessun foglio caricato. <Link href="/admin/upload" className="text-[#D32F2F] underline">Carica il primo</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
