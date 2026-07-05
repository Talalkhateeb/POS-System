import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import UsersManagement from './pages/UsersManagement';
// import Dashboard from './pages/Dashboard';
// import Pos from './pages/Pos';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route element={<ProtectedRoute allowedRoles={['admin', 'cashier']} />}>
            <Route element={<Layout />}>
              {/* <Route path="/pos" element={<Pos />} /> */}

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                {/* <Route path="/dashboard" element={<Dashboard />} /> */}
                <Route path="/users" element={<UsersManagement />} />
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