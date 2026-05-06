import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { ArrowLeft, UserPlus, Trash2, ShieldCheck, Mail } from 'lucide-react'
import Link from 'next/link'
import { createClientAccount, deleteClientAccount } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Security Check (Normal client to verify own role)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/')
  }

  // Use ADMIN client to bypass RLS for the list
  const admin = createAdminClient()
  const { data: clients, error: clientsError } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('updated_at', { ascending: false })

  console.log('--- ADMIN CLIENTS FETCH ---')
  console.log('User ID:', user.id)
  console.log('Clients count:', clients?.length || 0)
  if (clientsError) console.error('Fetch error:', clientsError)
  if (clients) console.log('First client:', clients[0]?.email)

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-[#D32F2F]" />
                Anagrafica Clienti
              </h1>
              <p className="text-sm text-slate-500">Gestisci gli accessi e i profili dei tuoi clienti</p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* CREATE FORM */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#D32F2F]" />
                Nuovo Cliente
              </h2>
              <form action={createClientAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Codice 1</label>
                  <input 
                    name="codice1" 
                    type="text" 
                    required 
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
                    placeholder="Es. mario_rossi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Codice 2</label>
                  <input 
                    name="codice2" 
                    type="text" 
                    required 
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
                    placeholder="Min. 6 caratteri"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Numero Ditta
                    <span className="ml-1 text-xs text-slate-400">(per auto-detect CSV)</span>
                  </label>
                  <input 
                    name="numero_ditta" 
                    type="text" 
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none font-mono"
                    placeholder="Es. 000099"
                    maxLength={10}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b02727] transition-colors"
                >
                  Crea Account
                </button>
              </form>
            </div>
          </div>

          {/* CLIENT LIST */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Codice 1</th>
                      <th className="px-6 py-4">N° Ditta</th>
                      <th className="px-6 py-4 text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients?.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-900">
                              {client.email?.replace('@gis-internal.com', '')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {client.numero_ditta ? (
                            <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                              {client.numero_ditta}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={async () => {
                            'use server'
                            await deleteClientAccount(client.id)
                          }}>
                            <button 
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {(!clients || clients.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                          Nessun cliente registrato
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
