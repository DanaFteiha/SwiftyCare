import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, User, ArrowRight, Globe, MapPin, CreditCard } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { setPatientCaseToken } from '@/lib/auth'

interface FormData {
  hospital: string
  fullName: string
  nationalId: string
}

interface FormErrors {
  hospital?: string
  fullName?: string
  nationalId?: string
  form?: string
}

// Israeli national ID (ת.ז.) — same algorithm as the backend validator
function isValidIsraeliId(id: string): boolean {
  if (!/^\d{9}$/.test(id)) return false
  let total = 0
  for (let i = 0; i < 9; i++) {
    let step = parseInt(id[i] ?? '0') * (i % 2 === 0 ? 1 : 2)
    if (step > 9) step -= 9
    total += step
  }
  return total % 10 === 0
}

function ScanPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  
  // List of major Israeli hospitals — labels pulled from i18n (en/he)
  const hospitals = [
    { key: 'hadassahEinKerem' },
    { key: 'hadassahMountScopus' },
    { key: 'ichilov' },
    { key: 'sheba' },
    { key: 'rambam' },
    { key: 'soroka' },
    { key: 'kaplan' },
    { key: 'assafHarofeh' },
    { key: 'shaareZedek' },
    { key: 'billinson' },
    { key: 'meir' },
    { key: 'hillelYaffe' },
    { key: 'nahariya' },
  ]

  const [formData, setFormData] = useState<FormData>({
    hospital: '',
    fullName: '',
    nationalId: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he'
    i18n.changeLanguage(newLang)
  }

  const validateNationalId = (id: string): string | undefined => {
    const cleaned = id.trim()
    if (!cleaned) return t('form.nationalIdRequired', 'National ID is required')
    if (!/^\d+$/.test(cleaned)) return t('form.nationalIdInvalid', 'National ID must contain only digits')
    if (cleaned.length !== 9) return t('form.nationalIdLength', 'National ID must be exactly 9 digits')
    if (!isValidIsraeliId(cleaned)) return t('form.nationalIdChecksum', 'This ID number is not valid — please check and try again')
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    if (!formData.hospital.trim()) {
      newErrors.hospital = t('form.hospitalRequired', 'Hospital selection is required')
    }
    if (!formData.fullName.trim()) {
      newErrors.fullName = t('form.fullNameRequired', 'Full name is required')
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = t('form.fullNameMinLength', 'Name must be at least 2 characters')
    }
    const idError = validateNationalId(formData.nationalId)
    if (idError) newErrors.nationalId = idError
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isFormValid = (): boolean => {
    if (!formData.hospital.trim() || !formData.fullName.trim() || formData.fullName.trim().length < 2) return false
    return validateNationalId(formData.nationalId) === undefined
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await apiFetch('/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: formData.fullName.trim(),
          nationalId: formData.nationalId.trim(),
          hospital: formData.hospital.trim(),
          status: 'open'
        })
      })

      if (!response.ok) {
        let errorPayload: any = null
        try {
          errorPayload = await response.json()
        } catch {
          errorPayload = null
        }

        throw {
          status: response.status,
          message: errorPayload?.message || errorPayload?.error || null
        }
      }

      const data = await response.json()
      const createdCase = data.case ?? data
      const caseId = createdCase._id
      // Store the case-scoped token so the patient can submit the questionnaire
      // for this case without staff credentials.
      if (data.patientCaseToken && caseId) {
        setPatientCaseToken(caseId, data.patientCaseToken)
      }
      navigate(`/patient/questionnaire/${caseId}`)
    } catch (error) {
      console.error('Error creating case:', error)
      if (error instanceof DOMException && error.name === 'AbortError') {
        setErrors(prev => ({ ...prev, form: t('form.timeoutError', 'The server is taking too long to respond. Please try again in a moment.') }))
        return
      }
      const err = error as { status?: number; message?: string }
      if (err?.status === 400 || err?.status === 409) {
        const serverMsg = err.message ?? ''
        // "Could not create case" is our duplicate-key generic message
        const isDuplicate =
          serverMsg.toLowerCase().includes('already') ||
          serverMsg.toLowerCase().includes('could not create') ||
          serverMsg.toLowerCase().includes('verify')
        if (isDuplicate) {
          setErrors(prev => ({
            ...prev,
            form: t(
              'form.duplicateCaseError',
              'A case for this ID already exists in the system. If you have already registered today, please ask a staff member for your questionnaire link.'
            ),
          }))
        } else {
          // Backend checksum / format rejection (shouldn't normally reach here
          // since the frontend validates first, but handle it gracefully)
          setErrors(prev => ({
            ...prev,
            nationalId: t('form.nationalIdChecksum', 'This ID number is not valid — please check and try again'),
          }))
        }
      } else {
        setErrors(prev => ({ ...prev, form: t('form.submitError', 'Something went wrong. Please try again.') }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (field === 'nationalId') {
      const cleaned = value.trim()
      // Validate in real-time once the user has typed 9 digits
      if (cleaned.length >= 9) {
        const idError = validateNationalId(cleaned)
        setErrors(prev => ({ ...prev, nationalId: idError, form: undefined }))
      } else {
        // Clear error while still typing
        setErrors(prev => ({ ...prev, nationalId: undefined, form: undefined }))
      }
    } else {
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className={`absolute top-6 ${i18n.language === 'he' ? 'left-6' : 'right-6'} z-10`}>
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={String(i18n.language === 'he' ? t('language.switchToEnglish') : t('language.switchToHebrew'))}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Globe className="h-4 w-4" />
          <span>{i18n.language === 'he' ? 'EN' : 'עִבְרִית'}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Header Section */}
            <div className="text-center mb-8">
              {/* SwiftyCare Logo/Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full shadow-lg flex items-center justify-center">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {t('welcome.title', 'Welcome to SwiftyCare')}
              </h1>
              
              {/* Subtitle */}
              <p className="text-gray-600 leading-relaxed text-base">
                {t('welcome.description', 'Please enter your details to begin the registration process')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Hospital Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.hospital', 'Hospital')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className={`absolute ${i18n.language === 'he' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400`} />
                  <select
                    value={formData.hospital}
                    onChange={(e) => handleInputChange('hospital', e.target.value)}
                    className={`w-full ${i18n.language === 'he' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-2 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer bg-white shadow-sm ${
                      errors.hospital ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                    }`}
                  >
                    <option value="">{t('form.hospitalPlaceholder', 'Select Hospital')}</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital.key} value={hospital.key}>
                        {t(`hospitals.${hospital.key}`)}
                      </option>
                    ))}
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className={`absolute inset-y-0 ${i18n.language === 'he' ? 'left-0' : 'right-0'} flex items-center ${i18n.language === 'he' ? 'pl-3' : 'pr-3'} pointer-events-none`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.hospital && (
                  <p className="text-sm text-red-600 mt-1">{errors.hospital}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.fullName', 'Full Name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className={`absolute ${i18n.language === 'he' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400`} />
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder={t('form.fullNamePlaceholder', 'Enter your full name')}
                    className={`${i18n.language === 'he' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-2 border-2 rounded-xl transition-all duration-200 bg-white shadow-sm ${
                      errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* National ID */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('form.nationalId', 'National ID')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className={`absolute ${i18n.language === 'he' ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400`} />
                  <Input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => handleInputChange('nationalId', e.target.value)}
                    placeholder={t('form.nationalIdPlaceholder', 'Enter your National ID')}
                    className={`${i18n.language === 'he' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-2 border-2 rounded-xl transition-all duration-200 bg-white shadow-sm ${
                      errors.nationalId ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.nationalId && (
                  <p className="text-sm text-red-600 mt-1">{errors.nationalId}</p>
                )}
              </div>

              {/* Form-level error (network / server errors) */}
              {errors.form && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {errors.form}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('form.submitButtonLoading', 'Creating case...')}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span>{t('form.submitButton', 'Start Questionnaire')}</span>
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500 font-medium">
            {t('footer.copyright', '© Swifty Medical 2025. All rights reserved.')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ScanPage