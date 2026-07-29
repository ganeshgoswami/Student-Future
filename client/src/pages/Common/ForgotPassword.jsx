import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../services/api';

export const ForgotPassword = () => {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: data.email });
      setSubmitting(false);
      if (res.data && res.data.success) {
        setDone(true);
        toast.success("Password reset code generated!");
      }
    } catch (err) {
      setSubmitting(false);
      toast.error(err.response?.data?.error || "Failed to request password reset.");
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center py-5" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="card glass-card p-4 mx-auto" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 className="text-center mb-2 fw-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Recover Password</h2>
        
        {done ? (
          <div className="text-center py-4">
            <div className="fs-1 mb-3">✉️</div>
            <h4 className="h6 text-white mb-3">Reset Code Generated</h4>
            <p className="text-muted small mb-4">
              Since SMTP email is offline in this local demo sandbox environment, the password reset link has been printed to the **server backend console terminal logs**. Please copy the link from there to complete resetting your password.
            </p>
            <Link to="/login" className="btn btn-primary w-100" style={{ backgroundColor: '#8c52ff', border: 'none' }}>Return to Login</Link>
          </div>
        ) : (
          <>
            <p className="text-center text-muted small mb-4">Enter your registered email address. We will generate a verification reset link in the server log.</p>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="form-label small text-white-50">Email Address</label>
                <input 
                  type="email" 
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="e.g. alice@gmail.com" 
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }}
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Provide a valid email address' }
                  })}
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-100 mb-3" 
                disabled={submitting}
                style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}
              >
                {submitting ? 'Generating link...' : 'Request Reset Link'}
              </button>
            </form>
            <div className="text-center mt-2">
              <Link to="/login" style={{ fontSize: '0.85rem', color: '#8c52ff' }}>Return to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
