import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/change-password', {
        new_password: newPassword,
        new_password_confirmation: confirm,
      });
      updateUser({ must_change_password: false });
      navigate(user.role === 'admin' ? '/dashboard' : '/pos');
    } catch (err) {
      setError(err.response?.data?.message || t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="w-100" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit} className="p-4 border rounded shadow-sm bg-white">
          <h4 className="mb-3 text-center">{t('changePasswordTitle')}</h4>
          {error && <div className="alert alert-danger py-2">{error || t('errorOccurred')}</div>}
          <div className="mb-3">
            <label className="form-label">{t('newPassword')}</label>
            <div className="input-group">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowNewPassword((value) => !value)}
              >
                {showNewPassword ? t('passwordToggleHide') : t('passwordToggleShow')}
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">{t('confirmPassword')}</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirmPassword((value) => !value)}
              >
                {showConfirmPassword ? t('passwordToggleHide') : t('passwordToggleShow')}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? t('saving') : t('savePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}