'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, CheckCircle2, Clock, AlertTriangle, XCircle, Upload, FileText, Menu } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sidebar } from '@/components/layout/sidebar'
import { kycApi } from '@/lib/api'
import { fileToBase64, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { KycProfile } from '@/types'
import { useToast } from '@/hooks/use-toast'

const profileSchema = z.object({
  legalName: z.string().min(2, 'Legal name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  region: z.string().min(2, 'State/Region is required'),
  postalCode: z.string().optional(),
  countryCode: z.string().min(2, 'Country is required'),
  bvn: z.string().optional(),
  nin: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

const statusConfig = {
  NOT_STARTED: {
    icon: Shield,
    label: 'Not Started',
    description: 'Complete your KYC to unlock full features',
    className: 'bg-surface-2 border-border text-text-secondary',
    iconColor: 'text-text-muted',
  },
  PENDING: {
    icon: Clock,
    label: 'Pending Review',
    description: 'Your documents are being reviewed. This typically takes 1-2 business days.',
    className: 'bg-warning/10 border-warning/20 text-warning',
    iconColor: 'text-warning',
  },
  UNDER_REVIEW: {
    icon: Clock,
    label: 'Under Review',
    description: 'Our team is actively reviewing your submission.',
    className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    iconColor: 'text-blue-400',
  },
  APPROVED: {
    icon: CheckCircle2,
    label: 'Approved',
    description: 'Your identity has been verified. You have full access.',
    className: 'bg-success/10 border-success/20 text-success',
    iconColor: 'text-success',
  },
  REJECTED: {
    icon: XCircle,
    label: 'Rejected',
    description: 'Your application was rejected. Please review and resubmit.',
    className: 'bg-error/10 border-error/20 text-error',
    iconColor: 'text-error',
  },
}

const documentTypes = [
  { value: 'NATIONAL_ID', label: 'National ID Card' },
  { value: 'PASSPORT', label: 'International Passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'UTILITY_BILL', label: 'Utility Bill (Proof of Address)' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
]

export default function KycPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [docType, setDocType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [countryCode, setCountryCode] = useState('NG')
  
  const [personalInfo, setPersonalInfo] = useState<ProfileFormData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: kycData, isLoading } = useQuery({
    queryKey: ['kyc-profile'],
    queryFn: () => kycApi.getProfile(),
  })

  const profile = kycData?.profile
  const documents = kycData?.documents

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      legalName: profile?.legalName || '',
      dateOfBirth: profile?.dateOfBirth || '',
      address: profile?.addressLine1 || '',
      city: profile?.city || '',
      region: profile?.region || '',
      postalCode: profile?.postalCode || '',
      bvn: '',
      nin: '',
    },
  })

  
  const handleSavePersonalInfo = (data: ProfileFormData) => {
    setPersonalInfo({ ...data, countryCode } as ProfileFormData)
    toast({ title: 'Info saved', description: 'Now upload an identity document below.' })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !docType) {
      toast({ title: 'Error', description: 'Please select a document type first.', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const base64 = await fileToBase64(file)
      await kycApi.uploadDocument({
        documentType: docType,
        contentBase64: base64,
        fileName: file.name,
        contentType: file.type,
        
        ...(personalInfo && {
          legalName: personalInfo.legalName,
          dateOfBirth: personalInfo.dateOfBirth,
          addressLine1: personalInfo.address,
          city: personalInfo.city,
          region: personalInfo.region,
          postalCode: personalInfo.postalCode,
          bvn: personalInfo.bvn,
          nin: personalInfo.nin,
        }),
      })
      queryClient.invalidateQueries({ queryKey: ['kyc-profile'] })
      toast({ title: 'Document uploaded', description: `${file.name} has been uploaded successfully.` })
      setDocType('')
    } catch {
      toast({ title: 'Upload failed', description: 'Failed to upload document. Please try again.', variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const status = profile?.status || 'NOT_STARTED'
  const config = statusConfig[status as keyof typeof statusConfig]
  const StatusIcon = config.icon
  const canSubmit = status === 'NOT_STARTED' || status === 'REJECTED'

  const steps = [
    { label: 'Personal Info', done: !!profile?.legalName },
    { label: 'Identity Documents', done: (documents?.length || 0) > 0 },
    { label: 'Under Review', done: ['UNDER_REVIEW', 'APPROVED'].includes(status) },
    { label: 'Approved', done: status === 'APPROVED' },
  ]

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/*
        |---------------------------------------------------------------------------------
        | Header
        |---------------------------------------------------------------------------------
        */}
        <header className="sticky top-0 z-30 flex items-center gap-4 h-16 px-6 bg-background/80 backdrop-blur-md border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-text-primary">KYC Verification</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 animate-fade-in space-y-6">
          {/*
          |---------------------------------------------------------------------------------
          | Status Banner
          |---------------------------------------------------------------------------------
          */}
          <div className={cn('rounded-xl border p-5 flex items-start gap-4', config.className)}>
            <StatusIcon className={cn('w-6 h-6 shrink-0 mt-0.5', config.iconColor)} />
            <div>
              <p className="font-semibold">{config.label}</p>
              <p className="text-sm opacity-80 mt-0.5">{config.description}</p>
              {profile?.rejectionReason && (
                <p className="text-sm mt-2 font-medium">Reason: {profile.rejectionReason}</p>
              )}
            </div>
          </div>

          {/*
          |---------------------------------------------------------------------------------
          | Progress steps
          |---------------------------------------------------------------------------------
          */}
          <div className="rounded-xl bg-surface border border-border p-5">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Verification Progress</h3>
            <div className="flex items-center gap-0">
              {steps.map((step, idx) => (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                        step.done
                          ? 'bg-success border-success'
                          : idx === steps.findIndex((s) => !s.done)
                          ? 'border-accent bg-accent/10'
                          : 'border-border bg-surface-2'
                      )}
                    >
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-text-muted">{idx + 1}</span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1.5 text-center max-w-[80px]">{step.label}</p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-1 mb-5 transition-all',
                        steps[idx + 1].done ? 'bg-success' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/*
          |---------------------------------------------------------------------------------
          | Form
          |---------------------------------------------------------------------------------
          */}
          {canSubmit && (
            <div className="rounded-xl bg-surface border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-5">
                Personal Information
              </h3>

              <form onSubmit={handleSubmit(handleSavePersonalInfo)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="legalName">Legal Full Name *</Label>
                    <Input
                      id="legalName"
                      placeholder="As on government ID"
                      {...register('legalName')}
                      className={errors.legalName ? 'border-error' : ''}
                    />
                    {errors.legalName && <p className="text-xs text-error">{errors.legalName.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register('dateOfBirth')}
                      className={errors.dateOfBirth ? 'border-error' : ''}
                    />
                    {errors.dateOfBirth && <p className="text-xs text-error">{errors.dateOfBirth.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Home Address *</Label>
                  <Input
                    id="address"
                    placeholder="Street address"
                    {...register('address')}
                    className={errors.address ? 'border-error' : ''}
                  />
                  {errors.address && <p className="text-xs text-error">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" placeholder="Lagos" {...register('city')} className={errors.city ? 'border-error' : ''} />
                    {errors.city && <p className="text-xs text-error">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="region">State *</Label>
                    <Input id="region" placeholder="Lagos State" {...register('region')} className={errors.region ? 'border-error' : ''} />
                    {errors.region && <p className="text-xs text-error">{errors.region.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" placeholder="100001" {...register('postalCode')} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Country *</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                      <SelectItem value="GH">🇬🇭 Ghana</SelectItem>
                      <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <Label htmlFor="bvn">BVN <span className="text-text-muted">(Nigeria)</span></Label>
                    <Input id="bvn" placeholder="22222222222" maxLength={11} {...register('bvn')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nin">NIN <span className="text-text-muted">(Nigeria)</span></Label>
                    <Input id="nin" placeholder="12345678901" maxLength={11} {...register('nin')} />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {personalInfo ? 'Update Personal Info' : 'Save Personal Info'}
                </Button>
              </form>
            </div>
          )}

          {/*
          |---------------------------------------------------------------------------------
          | Document Upload
          |---------------------------------------------------------------------------------
          */}
          {canSubmit && (
            <div className="rounded-xl bg-surface border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Upload Documents
              </h3>

              <div className="flex gap-3 mb-4">
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  disabled={!docType}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              <p className="text-xs text-text-muted">
                Accepted formats: JPG, PNG, PDF. Max size: 5MB.
              </p>
            </div>
          )}

          {/*
          |---------------------------------------------------------------------------------
          | Submitted Documents
          |---------------------------------------------------------------------------------
          */}
          {documents && documents.length > 0 && (
            <div className="rounded-xl bg-surface border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
                Submitted Documents
              </h3>
              <div className="space-y-2">
                {documents.map((doc: import('@/types').KycDocument) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-text-muted" />
                      <div>
                        <p className="text-sm text-text-primary">
                          {documentTypes.find((d) => d.value === doc.documentType)?.label || doc.documentType}
                        </p>
                        <p className="text-xs text-text-muted">{formatDate(doc.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-medium px-2.5 py-0.5 rounded-full border',
                        doc.status === 'APPROVED'
                          ? 'bg-success/10 text-success border-success/20'
                          : doc.status === 'REJECTED'
                          ? 'bg-error/10 text-error border-error/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      )}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
