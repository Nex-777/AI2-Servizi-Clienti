'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Dashboard from '@/components/Dashboard'
import FoglioPresenze from '@/components/FoglioPresenze'

interface FoglioSummary {
  id: string
  azienda: string
  anno: number
  mese: number
  status: string
}

export default function ClientPage({ 
  userEmail,
  fogli, 
  selectedFoglioData,
  profile,
  cantieri,
  additionalSedi
}: { 
  userEmail: string
  fogli: FoglioSummary[]
  selectedFoglioData: any
  profile: any
  cantieri: any[]
  additionalSedi: any[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const handleSelectFoglio = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('id', id)
    router.push(`/?${params.toString()}`)
  }

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('id')
    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : '/')
  }

  if (selectedId && selectedFoglioData) {
    return (
      <FoglioPresenze
        foglioId={selectedFoglioData.id}
        azienda={profile?.ragione_sociale || selectedFoglioData.azienda}
        sede={selectedFoglioData.sede}
        anno={selectedFoglioData.anno}
        mese={selectedFoglioData.mese}
        status={selectedFoglioData.status}
        dipendenti={selectedFoglioData.dipendenti}
        cantieri={cantieri}
        additionalSedi={additionalSedi}
        profile={profile}
        cigFasi={selectedFoglioData.cigFasi || []}
        onBack={handleBack}
      />
    )

  }

  return (
    <Dashboard 
      userEmail={userEmail} 
      fogli={fogli} 
      onSelectFoglio={handleSelectFoglio} 
      profile={profile}
      cantieri={cantieri}
      additionalSedi={additionalSedi}
    />
  )
}
