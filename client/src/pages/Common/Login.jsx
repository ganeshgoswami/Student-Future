import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

export const Login = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    const res = await login(data.email, data.password);
    setSubmitting(false);

    if (res.success) {
      toast.success("Welcome back to StudentFuture!");
      // Check user role to determine routing
      const storedToken = localStorage.getItem('token');
      // Fetch user from context (it updates on login)
      // Since context user state resolves immediately in authContext:
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="container d-flex align-items-center justify-content-center py-5" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="card glass-card p-4 mx-auto" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 className="text-center mb-4 fw-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Candidate Login</h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
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

          <div className="mb-4">
            <div className="d-flex justify-content-between">
              <label className="form-label small text-white-50">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: '#8c52ff' }}>Forgot Password?</Link>
            </div>
            <input 
              type="password" 
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••" 
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }}
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 mb-3" 
            disabled={submitting}
            style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-muted small mt-2">
          New candidate? <Link to="/register" style={{ color: '#8c52ff' }}>Register Account</Link>
        </p>
      </div>
    </div>
  );
};
