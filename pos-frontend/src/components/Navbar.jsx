import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">
        {t('appName')}
      </Link>

      <div className="collapse navbar-collapse">
        <ul className="navbar-nav me-auto">
          {user.role === 'cashier' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/pos">{t('sale')}</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/shifts">{t('shifts')}</Link>
              </li>
            </>
          )}

          <li className="nav-item">
            <Link className="nav-link" to="/returns">{t('returns')}</Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link" to="/account">{t('account')}</Link>
          </li>

          {user.role === 'admin' && (
            <>
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">{t('dashboard')}</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/products">{t('products')}</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/users">{t('users')}</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/permissions">{t('permissions')}</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/settings">{t('settings')}</Link>
              </li>
            </>
          )}
        </ul>

        <div className="d-flex align-items-center text-light">
          <span className="me-3">
            {user.name} <span className="badge bg-secondary">{user.role === 'admin' ? t('admin') : t('cashier')}</span>
          </span>
          <button className="btn btn-outline-light btn-sm me-2" type="button" onClick={toggleLanguage}>
            {t('languageName')}
          </button>
          <button className="btn btn-outline-light btn-sm" type="button" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );
}
