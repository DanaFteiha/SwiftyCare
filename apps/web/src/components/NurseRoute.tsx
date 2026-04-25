import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

interface NurseRouteProps {
  children: ReactNode
}

const NURSE_ACCESS_KEY = 'swiftycare:nurseAccess'

function hasNurseAccess() {
  return localStorage.getItem(NURSE_ACCESS_KEY) === 'true'
}

function NurseRoute({ children }: NurseRouteProps) {
  const location = useLocation()

  if (!hasNurseAccess()) {
    return <Navigate to="/nurse/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default NurseRoute
