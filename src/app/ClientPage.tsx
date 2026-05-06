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
  selectedFoglioData 
}: { 
  userEmail: string
  fogli: FoglioSummary[]
  selectedFoglioData: any
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get('id')

  const handleSelectFoglio = (id: string) => {
    router.push(`/?id=${id}`)
  }

  const handleBack = () => {
    router.push('/')
  }

  if (selectedId && selectedFoglioData) {
    return (
      <FoglioPresenze
        foglioId={selectedFoglioData.id}
        azienda={selectedFoglioData.azienda}
        sede={selectedFoglioData.sede}
        anno={selectedFoglioData.anno}
        mese={selectedFoglioData.mese}
        status={selectedFoglioData.status}
        dipendenti={selectedFoglioData.dipendenti}
        onBack={handleBack}
      />
    )
  }

  return (
    <Dashboard 
      userEmail={userEmail} 
      fogli={fogli} 
      onSelectFoglio={handleSelectFoglio} 
    />
  )
}
