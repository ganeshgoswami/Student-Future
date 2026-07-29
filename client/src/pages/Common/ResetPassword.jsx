import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [token, setToken] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password', '');

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) {
      setToken(t);
    } else {
      toast.error('Reset token missing from URL parameters.');
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Cannot reset: reset token is missing.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.post('/auth/reset-password', { token, password: data.password });
      setSubmitting(false);
      if (res.data && res.data.success) {
        toast.success('Password changed successfully! You can now log in.');
        navigate('/login');
      }
    } catch (err) {
      setSubmitting(false);
      toast.error(err.response?.data?.error || 'Failed to reset password. Token may have expired.');
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center py-5" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="card glass-card p-4 mx-auto" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 className="text-center mb-2 fw-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Reset Password</h2>
        <p className="text-center text-muted small mb-4">Enter and confirm your new account password.</p>

        {!token ? (
          <div className="alert alert-danger text-center small">
            Invalid reset URL. Please make sure the entire link (including parameters) was copied correctly from the server logs.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="form-label small text-white-50">New Password *</label>
              <input 
                type="password" 
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Min 6 characters" 
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }}
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
              />
              {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label small text-white-50">Confirm New Password *</label>
              <input 
                type="password" 
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Re-enter password" 
                style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }}
                {...register('confirmPassword', { required: 'Confirm password is required', validate: value => value === password || 'Passwords do not match' })}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-100 mb-3" 
              disabled={submitting}
              style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}
            >
              {submitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="text-center mt-2">
          <Link to="/login" style={{ fontSize: '0.85rem', color: '#8c52ff' }}>Return to Sign In</Link>
        </div>
      </div>
    </div>
  );
};
