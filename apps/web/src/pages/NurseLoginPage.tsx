import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Stethoscope, Globe } from 'lucide-react'

const NURSE_ACCESS_KEY = 'swiftycare:nurseAccess'

function NurseLoginPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  const expectedPasscode = useMemo(() => {
    const envPasscode = import.meta.env.VITE_NURSE_PASSCODE
    return (typeof envPasscode === 'string' && envPasscode.trim()) || 'nurse'
  }, [])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he'
    i18n.changeLanguage(newLang)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passcode.trim() !== expectedPasscode) {
      setError(t('nurseLogin.invalidCode', 'Invalid access code.'))
      return
    }

    localStorage.setItem(NURSE_ACCESS_KEY, 'true')
    navigate('/nurse', { replace: true })
  }

  return (
    <div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      dir={i18n.language === 'he' ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle */}
      <div className={`absolute top-6 ${i18n.language === 'he' ? 'left-6' : 'right-6'} z-10`}>
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={String(i18n.language === 'he' ? t('language.switchToEnglish') : t('language.switchToHebrew'))}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/90 hover:bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <Globe className="h-4 w-4" />
          <span>{i18n.language === 'he' ? 'EN' : 'עִבְרִית'}</span>
        </button>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Stethoscope className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('nurseLogin.title', 'Nurse Access')}
            </h1>
            <p className="text-gray-600">
              {t('nurseLogin.subtitle', 'Enter your access code to continue.')}
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
                placeholder={t('nurseLogin.passcodePlaceholder', 'Access code')}
                aria-label={t('nurseLogin.passcodePlaceholder', 'Access code')}
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              {t('nurseLogin.continue', 'Continue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default NurseLoginPage
