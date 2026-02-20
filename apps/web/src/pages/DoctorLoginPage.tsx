import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield } from 'lucide-react'

const DOCTOR_ACCESS_KEY = 'swiftycare:doctorAccess'

function DoctorLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const { t, i18n } = useTranslation()

  const expectedPasscode = useMemo(() => {
    const envPasscode = import.meta.env.VITE_DOCTOR_PASSCODE
    return (typeof envPasscode === 'string' && envPasscode.trim()) || 'swiftycare'
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.trim() !== expectedPasscode) {
      setError(t('doctorLogin.invalidCode', 'Invalid access code.'))
      return
    }

    localStorage.setItem(DOCTOR_ACCESS_KEY, 'true')
    navigate('/doctor', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('doctorLogin.title', 'Doctor Access')}
            </h1>
            <p className="text-gray-600">
              {t('doctorLogin.subtitle', 'Enter your access code to continue.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value)
                  setError('')
                }}
                placeholder={t('doctorLogin.passcodePlaceholder', 'Access code')}
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              {t('doctorLogin.continue', 'Continue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default DoctorLoginPage
