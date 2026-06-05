import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Globe } from 'lucide-react'
import { login } from '@/lib/auth'

// Sign-in for the patient-intake kiosk / registration station. Any staff role
// (intake, nurse, doctor, admin) is permitted to operate intake.
function IntakeLoginPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he'
    i18n.changeLanguage(newLang)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await login(username.trim(), password)
      navigate('/', { replace: true })
    } catch {
      setError(t('intakeLogin.invalidCode', 'Invalid username or password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
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

      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('intakeLogin.title', 'Registration Station')}
            </h1>
            <p className="text-gray-600">
              {t('intakeLogin.subtitle', 'Sign in to register patients.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                placeholder={t('intakeLogin.usernamePlaceholder', 'Username')}
              />
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder={t('intakeLogin.passwordPlaceholder', 'Password')}
              />
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting || !username || !password} className="w-full bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? t('intakeLogin.signingIn', 'Signing in…') : t('intakeLogin.continue', 'Continue')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default IntakeLoginPage
