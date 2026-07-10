import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">
        نظام نقاط البيع
      </Link>

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto">
          {user.role === 'cashier' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/pos">
                  البيع
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/shifts">
                  الصندوق
                </Link>
              </li>
            </>
          )}

          <li className="nav-item">
            <Link className="nav-link" to="/returns">
              الإرجاع
            </Link>
          </li>

          {user.role === 'admin' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/products">
                  المنتجات
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/users">
                  المستخدمين
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/permissions">
                  الصلاحيات
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/settings">
                  الإعدادات
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="d-flex align-items-center text-light">
          <span className="me-3">
            {user.name} <span className="badge bg-secondary">{user.role === 'admin' ? 'مدير' : 'كاشير'}</span>
          </span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            تسجيل خروج
          </button>
        </div>
      </div>
    </nav>
  );
}