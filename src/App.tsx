import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './routes/Login'
import SignupPartner from './routes/SignupPartner'
import SignupSalesRep from './routes/SignupSalesRep'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleLanding from './routes/RoleLanding'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup/partner" element={<SignupPartner />} />
          <Route path="/signup/sales-rep" element={<SignupSalesRep />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleLanding />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
