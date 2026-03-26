'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Download, FileText, Table2, Receipt, Menu, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Sidebar } from '@/components/layout/sidebar'
import { reportsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Reports</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in space-y-6">
          {/* Period Picker */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex gap-3">
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-text-muted">Viewing reports for <span className="text-text-secondary font-medium">{periodLabel}</span></p>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PDF Statement */}
            <div className="rounded-xl bg-surface border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-light" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Account Statement</p>
                  <p className="text-xs text-text-muted">PDF format</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                A complete account statement showing all transactions, balances, and summaries for the selected period.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleDownload('statement')}
                loading={downloadingStatement}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>

            {/* CSV Transactions */}
            <div className="rounded-xl bg-surface border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Transaction Export</p>
                  <p className="text-xs text-text-muted">CSV format</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                Export all transactions as a spreadsheet-compatible CSV file for further analysis or accounting purposes.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleDownload('csv')}
                loading={downloadingCsv}
              >
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
            </div>

            {/* Tax Summary */}
            <div className="rounded-xl bg-surface border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Tax Summary</p>
                  <p className="text-xs text-text-muted">Income & fees</p>
                </div>
              </div>

              {taxLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : taxError ? (
                <div className="flex items-center gap-2 text-text-muted">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-xs">No data for this period</p>
                </div>
              ) : taxSummary ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1.5 border-b border-border">
                    <span className="text-xs text-text-secondary">Gross Income</span>
                    <span className="text-sm font-semibold text-text-primary">
                      {formatCurrency(taxSummary.grossIncome, taxSummary.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border">
                    <span className="text-xs text-text-secondary">Total Fees</span>
                    <span className="text-sm font-medium text-error">
                      - {formatCurrency(taxSummary.totalFees, taxSummary.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs font-semibold text-text-primary">Net Income</span>
                    <span className="text-sm font-bold text-success">
                      {formatCurrency(taxSummary.netIncome, taxSummary.currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted">No transactions in this period.</p>
              )}
            </div>
          </div>

          {/* Info note */}
          <div className="rounded-xl bg-surface-2 border border-border p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              Reports are generated based on your completed transactions and may take a moment to process.
              For tax purposes, always consult with a qualified accountant. All amounts are shown in your base currency.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
