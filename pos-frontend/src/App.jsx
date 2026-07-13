import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UsersManagement from './pages/UsersManagement';
import ProductsManagement from './pages/ProductsManagement';
import Pos from './pages/Pos';
import SettingsPage from './pages/SettingsPage';
import ShiftPage from './pages/Shifts/ShiftPage';
import ReturnPage from './pages/Returns/ReturnPage';
import PermissionsPage from './pages/Permissions/PermissionsPage';
import Dashboard from './pages/Dashboard';
import AccountPage from './pages/AccountPage';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>

          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Cashier + Admin common layout */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'cashier']} />}>
            <Route element={<Layout />}>

              {/* POS — cashier only */}
              <Route
                path="/pos"
                element={<ProtectedRoute allowedRoles={['cashier']} />}
              >
                <Route index element={<Pos />} />
              </Route>

              {/* Shift management — cashier only */}
              <Route
                path="/shifts"
                element={<ProtectedRoute allowedRoles={['cashier']} />}
              >
                <Route index element={<ShiftPage />} />
              </Route> 

              {/* Returns — shared between cashier and admin (UC-03) */}
              <Route path="/returns" element={<ReturnPage />} />
              <Route path="/account" element={<AccountPage />} />

              {/* Admin only */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/users" element={<UsersManagement />} />
                <Route path="/products" element={<ProductsManagement />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/permissions" element={<PermissionsPage />} />
                <Route path="/dashboard" element={<Dashboard />} />


              </Route>

            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
