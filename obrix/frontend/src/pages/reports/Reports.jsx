/** Reports page — list of saved comparison reports. Phase 8 adds PDF export. */

import { useEffect, useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import reportService from '@/services/reportService'

export default function Reports() {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    reportService.list()
      .then(({ data }) => setReports(data.results || data))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Reports</h1>
          <p className="text-white/40 text-sm mt-1">
            Comparison reports and exports (Phase 8)
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <Card className="text-center py-20">
          <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No reports yet.</p>
          <p className="text-white/20 text-xs mt-1">
            Multi-location comparison reports will be available in Phase 8.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="flex items-center gap-4">
              <FileText className="w-5 h-5 text-brand-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-white/30">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
