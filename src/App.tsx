import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { BgmProvider } from './context/BgmContext'
import { InstallPromptProvider } from './context/InstallPromptContext'
import { PushNavigationListener } from './components/PushNavigationListener'
import { UpdatePrompt } from './components/UpdatePrompt'
import { InstallPrompt } from './components/InstallPrompt'
import Login from './routes/Login'
import Setup from './routes/Setup'
import SignupSalesRep from './routes/SignupSalesRep'
import SignupPartner from './routes/SignupPartner'
import ProtectedRoute from './routes/ProtectedRoute'
import SuperAdminRoute from './routes/SuperAdminRoute'
import RoleLanding from './routes/RoleLanding'
import AdminHome from './routes/AdminHome'
import AdminAccounts from './routes/AdminAccounts'
import AdminProducts from './routes/AdminProducts'
import AdminProductForm from './routes/AdminProductForm'
import AdminPartners from './routes/AdminPartners'
import AdminSalesReps from './routes/AdminSalesReps'
import AdminStats from './routes/AdminStats'
import Stats from './routes/Stats'
import Gallery from './routes/Gallery'
import Products from './routes/Products'
import ProductDetail from './routes/ProductDetail'
import OrderNew from './routes/OrderNew'
import Orders from './routes/Orders'
import OrderDetail from './routes/OrderDetail'
import Notices from './routes/Notices'
import NoticeDetail from './routes/NoticeDetail'
import AdminNotices from './routes/AdminNotices'
import AdminInvite from './routes/AdminInvite'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <BgmProvider>
            <InstallPromptProvider>
              <PushNavigationListener />
              <UpdatePrompt />
              <InstallPrompt />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/signup/sales-rep" element={<SignupSalesRep />} />
                <Route path="/signup/partner" element={<SignupPartner />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<RoleLanding />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/orders/new" element={<OrderNew />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/notices" element={<Notices />} />
                  <Route path="/notices/:id" element={<NoticeDetail />} />
                  <Route element={<SuperAdminRoute />}>
                    <Route path="/admin" element={<AdminHome />} />
                    <Route path="/admin/accounts" element={<AdminAccounts />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/products/new" element={<AdminProductForm />} />
                    <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
                    <Route path="/admin/partners" element={<AdminPartners />} />
                    <Route path="/admin/sales-reps" element={<AdminSalesReps />} />
                    <Route path="/admin/stats" element={<AdminStats />} />
                    <Route path="/admin/notices" element={<AdminNotices />} />
                    <Route path="/admin/invite" element={<AdminInvite />} />
                  </Route>
                </Route>
              </Routes>
            </InstallPromptProvider>
          </BgmProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
