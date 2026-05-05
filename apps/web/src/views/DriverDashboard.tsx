// Driver entry point — redirects to schedule
import { Navigate } from 'react-router-dom'
export default function DriverDashboard() {
  return <Navigate to="/driver/schedule" replace />
}
