'use client'

import { useState } from 'react'
import { Download, FileText, Table2, BarChart3, Menu, AlertCircle, Calendar, ArrowRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { NButton } from '@/components/ui/NButton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { reportsApi } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 3 }, (_, i) => currentYear - i)
const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

export default function ReportsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)
  const { toast } = useToast()

  const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`

  const { data: taxSummary, isLoading: taxLoading, error: taxError } = useQuery({
    queryKey: ['tax-summary', yearMonth],
    queryFn: () => reportsApi.getTaxSummary(yearMonth),
  })

  const handleDownload = async (type: 'statement' | 'csv') => {
    const setter = type === 'statement' ? setDownloadingStatement : setDownloadingCsv
    setter(true)
    try {
      const blob =
        type === 'statement'
          ? await reportsApi.getStatement(yearMonth)
          : await reportsApi.getTransactionsCsv(yearMonth)

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        type === 'statement'
          ? `nera-statement-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.pdf`
          : `nera-transactions-${selectedYear}-${String(selectedMonth).padStart(2, '0')}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: 'Download started', description: `Your ${type === 'statement' ? 'statement' : 'CSV'} is downloading.` })
    } catch {
      toast({
        title: 'Download failed',
        description: 'Unable to generate report for this period. Try a different month.',
        variant: 'destructive',
      })
    } finally {
      setter(false)
    }
  }

  const periodLabel = `${months.find((m) => m.value === selectedMonth)?.label} ${selectedYear}`

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-ink">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/*
        |---------------------------------------------------------------------------------
        | Header
        |---------------------------------------------------------------------------------
        */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-8 bg-white/80 backdrop-blur-xl border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button
               onClick={() => setSidebarOpen(true)}
               className="lg:hidden p-2 rounded-xl text-ink-hint hover:text-ink hover:bg-surface transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-ink tracking-tight">Financial Intelligence</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface rounded-xl border border-border">
             <Calendar size={14} className="text-primary" />
             <span className="text-[10px] font-bold text-ink-hint uppercase tracking-widest">{periodLabel}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 max-w-7xl mx-auto w-full relative">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
             <div>
                <h2 className="text-display text-4xl mb-3 tracking-tight">Archived performance.</h2>
                <p className="text-ink-muted text-sm max-w-[400px]">
                   Generate comprehensive audit trails, tax summaries, and electronic records of your global capital movements.
                </p>
             </div>

             {/*
             |---------------------------------------------------------------------------------
             | Period Picker
             |---------------------------------------------------------------------------------
             */}
             <div className="flex items-center gap-3 p-2 bg-white rounded-2xl shadow-sm border border-border">
                <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                  <SelectTrigger className="w-36 h-12 rounded-xl border-none bg-surface/50 font-bold focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={String(m.value)} className="font-bold">{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                  <SelectTrigger className="w-28 h-12 rounded-xl border-none bg-surface/50 font-bold focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)} className="font-bold">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
          </div>

          {/*
          |---------------------------------------------------------------------------------
          | Report Cards
          |---------------------------------------------------------------------------------
          */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/*
            |---------------------------------------------------------------------------------
            | PDF Statement
            |---------------------------------------------------------------------------------
            */}
            <div className="nera-card p-10 bg-white group hover:border-primary/30 transition-all duration-500">
               <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-8 border border-border group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                  <FileText className="w-6 h-6 text-primary" />
               </div>
               <h3 className="font-display font-bold text-xl text-ink mb-2">Audit Statement</h3>
               <p className="text-xs text-ink-hint font-bold uppercase tracking-widest mb-6">PDF DOCUMENT</p>
               <p className="text-sm text-ink-muted leading-relaxed mb-10">
                  Comprehensive audit trail of all transactions and ledger movements in high-fidelity PDF format.
               </p>
               <NButton
                variant="outline"
                className="w-full h-14 rounded-xl font-bold uppercase tracking-widest text-[11px] group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                onClick={() => handleDownload('statement')}
                loading={downloadingStatement}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </NButton>
            </div>

            {/*
            |---------------------------------------------------------------------------------
            | CSV Transactions
            |---------------------------------------------------------------------------------
            */}
            <div className="nera-card p-10 bg-white group hover:border-success/30 transition-all duration-500">
               <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-8 border border-border group-hover:bg-success/5 group-hover:border-success/20 transition-all">
                  <Table2 className="w-6 h-6 text-success" />
               </div>
               <h3 className="font-display font-bold text-xl text-ink mb-2">Spreadsheet Raw</h3>
               <p className="text-xs text-ink-hint font-bold uppercase tracking-widest mb-6">CSV DATASET</p>
               <p className="text-sm text-ink-muted leading-relaxed mb-10">
                 Native CSV export compatible with professional accounting software like Xero, Quickbooks, or Excel.
               </p>
               <NButton
                variant="outline"
                className="w-full h-14 rounded-xl font-bold uppercase tracking-widest text-[11px] group-hover:bg-success group-hover:text-white transition-all shadow-sm"
                onClick={() => handleDownload('csv')}
                loading={downloadingCsv}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </NButton>
            </div>

            {/*
            |---------------------------------------------------------------------------------
            | Tax Summary
            |---------------------------------------------------------------------------------
            */}
            <div className="nera-card p-10 bg-navy text-white shadow-2xl shadow-navy/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 border border-white/10">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2 tracking-tight">Fiscal Overview</h3>
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest mb-8 italic">PRE-ADJUSTMENT SUMMARY</p>
                  
                  {taxLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full bg-white/5 rounded-xl" />
                      <Skeleton className="h-10 w-full bg-white/5 rounded-xl" />
                    </div>
                  ) : taxError ? (
                    <div className="bg-white/5 rounded-2xl p-6 text-center">
                       <p className="text-xs font-bold text-white/40 uppercase tracking-widest">No spectral data found</p>
                    </div>
                  ) : taxSummary ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-4 border-b border-white/10">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Network Gross</span>
                        <span className="font-display font-bold text-white tracking-widest tabular-nums">
                          {formatCurrency(taxSummary.grossIncome, taxSummary.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-white/10">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Aggregated Fees</span>
                        <span className="font-display font-bold text-red-400 tracking-widest tabular-nums">
                          - {formatCurrency(taxSummary.totalFees, taxSummary.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-6">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Net Liquid</span>
                        <span className="text-2xl font-display font-bold text-white tracking-tighter tabular-nums">
                          {formatCurrency(taxSummary.netIncome, taxSummary.currency)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-2xl p-6 text-center">
                       <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Inert period / Zero activity</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

          {/*
          |---------------------------------------------------------------------------------
          | Compliance note
          |---------------------------------------------------------------------------------
          */}
          <div className="nera-card p-8 bg-surface/50 border-border relative z-10 flex items-start gap-5">
             <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 shadow-sm">
                <AlertCircle className="w-5 h-5 text-primary" />
             </div>
             <div>
                <h4 className="text-[11px] font-bold text-ink uppercase tracking-widest mb-1">Fiscal Compliance Advisory</h4>
                <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
                   These reports are derived from your authenticated ledger data. Nera does not provide certified legal tax counsel. For final fiscal submissions, consult with your jurisdiction's professional accounting network.
                </p>
             </div>
          </div>
        </main>
      </div>
    </div>
  )
}
