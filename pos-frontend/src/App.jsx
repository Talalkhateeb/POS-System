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

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/dashboard" element={<div className="p-4">Admin Dashboard (placeholder)</div>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'cashier']} />}>
            <Route path="/pos" element={<div className="p-4">POS Screen (placeholder)</div>} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;