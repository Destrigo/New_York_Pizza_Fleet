import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/components/Toast'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'

// Views
import Login from '@/views/Login'
import NotFound from '@/views/NotFound'
import Unauthorized from '@/views/Unauthorized'
import Profile from '@/views/Profile'
import Notifications from '@/views/Notifications'

// Role dashboards
import ManagerDashboard from '@/views/ManagerDashboard'
import SupervisorDashboard from '@/views/SupervisorDashboard'
import HubDashboard from '@/views/HubDashboard'
// Features
import FaultForm from '@/views/FaultForm'
import FaultDetail from '@/views/FaultDetail'
import HubQueue from '@/views/HubQueue'
import HubVehicles from '@/views/HubVehicles'
import HubSchedule from '@/views/HubSchedule'
import DriverSchedule from '@/views/DriverSchedule'
import VehicleHistory from '@/views/VehicleHistory'

// Admin
import AdminUsers from '@/views/admin/Users'
import AdminLocations from '@/views/admin/Locations'
import AdminVehicles from '@/views/admin/Vehicles'
import AdminReserves from '@/views/admin/Reserves'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'manager')    return <Navigate to="/dashboard" replace />
  if (user.role === 'supervisor') return <Navigate to="/supervisor" replace />
  if (user.role === 'mechanic')   return <Navigate to="/hub" replace />
  if (user.role === 'driver')     return <Navigate to="/driver/schedule" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />

          {/* Manager */}
          <Route element={<ProtectedRoute roles={['manager']} />}>
            <Route path="/dashboard" element={<ManagerDashboard />} />
            <Route path="/report" element={<FaultForm />} />
          </Route>

          {/* Supervisor */}
          <Route element={<ProtectedRoute roles={['supervisor']} />}>
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/locations" element={<AdminLocations />} />
            <Route path="/admin/vehicles" element={<AdminVehicles />} />
            <Route path="/admin/reserves" element={<AdminReserves />} />
          </Route>

          {/* Hub (mechanic + supervisor) */}
          <Route element={<ProtectedRoute roles={['mechanic', 'supervisor']} />}>
            <Route path="/hub" element={<HubDashboard />} />
            <Route path="/hub/queue" element={<HubQueue />} />
            <Route path="/hub/vehicles" element={<HubVehicles />} />
            <Route path="/hub/schedule" element={<HubSchedule />} />
          </Route>

          {/* Driver */}
          <Route element={<ProtectedRoute roles={['driver']} />}>
            <Route path="/driver/schedule" element={<DriverSchedule />} />
          </Route>

          {/* Shared */}
          <Route element={<ProtectedRoute roles={['manager', 'mechanic', 'supervisor', 'driver']} />}>
            <Route path="/faults/:id" element={<FaultDetail />} />
            <Route path="/vehicles/:id" element={<VehicleHistory />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </ToastProvider>
  )
}
