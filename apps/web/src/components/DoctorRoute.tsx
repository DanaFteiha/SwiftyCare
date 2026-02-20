import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface DoctorRouteProps {
  children: ReactNode
}

const DOCTOR_ACCESS_KEY = 'swiftycare:doctorAccess'

function hasDoctorAccess() {
  return localStorage.getItem(DOCTOR_ACCESS_KEY) === 'true'
}

function DoctorRoute({ children }: DoctorRouteProps) {
  const location = useLocation()

  if (!hasDoctorAccess()) {
    return <Navigate to="/doctor/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default DoctorRoute
