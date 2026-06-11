import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transaction from './pages/Transaction'
import Menu from './pages/Menu'
import Tables from './pages/Tables'
import Reports from './pages/Reports'
import Users from './pages/Users'
import CustomerOrder from './pages/CustomerOrder'
import KitchenDisplay from './pages/KitchenDisplay'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/order" element={
          <ProtectedRoute allowedRoles={['Customer', 'Cashier', 'Admin']}>
            <CustomerOrder />
          </ProtectedRoute>
        } />

        <Route path="/kitchen" element={
          <ProtectedRoute allowedRoles={['Kitchen', 'Admin', 'Cashier']}>
            <KitchenDisplay />
          </ProtectedRoute>
        } />

        {/* FIX: Dinagdag ang Supervisor at Manager para hindi mag-redirect loop */}
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'Manager']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/menu" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Menu />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['Admin', 'Supervisor', 'Manager']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <Users />
          </ProtectedRoute>
        } />

        {/* Cashier + Admin */}
        <Route path="/transaction" element={
          <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
            <Transaction />
          </ProtectedRoute>
        } />
        <Route path="/tables" element={
          <ProtectedRoute allowedRoles={['Admin', 'Cashier']}>
            <Tables />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App