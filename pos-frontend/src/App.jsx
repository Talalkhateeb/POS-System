import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UsersManagement from './pages/UsersManagement';
import ProductsManagement from './pages/ProductsManagement';
import Pos from './pages/Pos';
import SettingsPage from './pages/SettingsPage';
import Shift from './pages/Shift';
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />


          {/* Cashier + Admin common layout */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'cashier']} />}>
            <Route element={<Layout />}>

              {/* POS only for cashier */}
              <Route 
                path="/pos" 
                element={
                  <ProtectedRoute allowedRoles={['cashier']} />
                }
              >
                <Route index element={<Pos />} />
                <Route 
              path="/shift" 
              element={
               <ProtectedRoute allowedRoles={['cashier']} />
              }
                >
                <Route index element={<Shift />} />
              </Route>
              </Route>


              {/* Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/users" element={<UsersManagement />} />
                <Route path="/products" element={<ProductsManagement />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

            </Route>
          </Route>


          <Route path="/" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;