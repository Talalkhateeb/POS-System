import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand navbar-light bg-light border-bottom px-3">
      <span className="navbar-brand mb-0 h6">POS System</span>
      <div className="navbar-nav me-auto">
        {user.role === 'admin' && (
          <>
            <Link className="nav-link" to="/dashboard">لوحة التحكم</Link>
            <Link className="nav-link" to="/users">إدارة المستخدمين</Link>
            <Link className="nav-link" to="/products">إدارة المنتجات</Link>
            <Link className="nav-link" to="/settings">الإعدادات</Link>
          </>
        )}
        {user.role === 'cashier' && (
          <>
            <Link className="nav-link" to="/shift">الوردية</Link>
            <Link className="nav-link" to="/pos">شاشة البيع</Link>
          </>
        )}
      </div>
      <div className="d-flex align-items-center">
        <span className="me-3 text-muted small">{user.name} ({user.role})</span>
        <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </div>
    </nav>
  );
}