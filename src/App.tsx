import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './routes/Login'
import SignupSalesRep from './routes/SignupSalesRep'
import ProtectedRoute from './routes/ProtectedRoute'
import SuperAdminRoute from './routes/SuperAdminRoute'
import RoleLanding from './routes/RoleLanding'
import AdminPartners from './routes/AdminPartners'
import AdminSalesReps from './routes/AdminSalesReps'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup/sales-rep" element={<SignupSalesRep />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<RoleLanding />} />
              <Route element={<SuperAdminRoute />}>
                <Route path="/admin/partners" element={<AdminPartners />} />
                <Route path="/admin/sales-reps" element={<AdminSalesReps />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
