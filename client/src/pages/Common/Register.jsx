import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

export const Register = () => {
  const { register: authRegister } = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const password = watch('password', '');

  const onSubmit = async (data) => {
    setSubmitting(true);
    const formData = new FormData();
    
    // Append text inputs
    Object.keys(data).forEach(key => {
      if (key === 'profilePhoto') {
        if (data.profilePhoto && data.profilePhoto[0]) {
          formData.append('profilePhoto', data.profilePhoto[0]);
        }
      } else {
        formData.append(key, data[key]);
      }
    });

    const res = await authRegister(formData);
    setSubmitting(false);

    if (res.success) {
      toast.success("Account registered successfully!");
      navigate('/dashboard');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="container py-5 d-flex align-items-center justify-content-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
      <div className="card glass-card p-4 my-4 mx-auto" style={{ maxWidth: '680px', width: '100%' }}>
        <h2 className="text-center mb-2 fw-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Candidate Registration</h2>
        <p className="text-center text-muted small mb-4">Complete all fields to set up your examination profile.</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1: Credentials */}
          <h4 className="text-primary h6 mb-3 border-bottom pb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>1. Account Credentials</h4>
          
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small text-white-50">First Name *</label>
              <input type="text" className={`form-control ${errors.firstName ? 'is-invalid' : ''}`} placeholder="e.g. Alice" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('firstName', { required: 'First name is required' })} />
              {errors.firstName && <div className="invalid-feedback">{errors.firstName.message}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small text-white-50">Last Name *</label>
              <input type="text" className={`form-control ${errors.lastName ? 'is-invalid' : ''}`} placeholder="e.g. Vance" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('lastName', { required: 'Last name is required' })} />
              {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small text-white-50">Email Address *</label>
              <input type="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} placeholder="e.g. alice@gmail.com" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' } })} />
              {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small text-white-50">Mobile Number *</label>
              <input type="text" className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`} placeholder="e.g. 9876543210" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('mobileNumber', { required: 'Mobile number is required' })} />
              {errors.mobileNumber && <div className="invalid-feedback">{errors.mobileNumber.message}</div>}
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label small text-white-50">Password *</label>
              <input type="password" className={`form-control ${errors.password ? 'is-invalid' : ''}`} placeholder="Min 6 characters" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })} />
              {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small text-white-50">Confirm Password *</label>
              <input type="password" className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`} placeholder="Re-enter password" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('confirmPassword', { required: 'Confirm password is required', validate: value => value === password || 'Passwords do not match' })} />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
            </div>
          </div>

          {/* Section 2: Personal Profile */}
          <h4 className="text-primary h6 mb-3 border-bottom pb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>2. Personal Demographics</h4>
          
          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label className="form-label small text-white-50">Date of Birth *</label>
              <input type="date" className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`} style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('dateOfBirth', { required: 'Date of birth is required' })} />
              {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label small text-white-50">Gender *</label>
              <select className={`form-select ${errors.gender ? 'is-invalid' : ''}`} style={{ backgroundColor: '#161226', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('gender', { required: 'Gender is required' })}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <div className="invalid-feedback">{errors.gender.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label small text-white-50">Profile Photo</label>
              <input type="file" className="form-control" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} accept="image/*" {...register('profilePhoto')} />
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label small text-white-50">Country *</label>
              <input type="text" className={`form-control ${errors.country ? 'is-invalid' : ''}`} placeholder="e.g. United States" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('country', { required: 'Country is required' })} />
              {errors.country && <div className="invalid-feedback">{errors.country.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label small text-white-50">State *</label>
              <input type="text" className={`form-control ${errors.state ? 'is-invalid' : ''}`} placeholder="e.g. California" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('state', { required: 'State is required' })} />
              {errors.state && <div className="invalid-feedback">{errors.state.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label small text-white-50">City *</label>
              <input type="text" className={`form-control ${errors.city ? 'is-invalid' : ''}`} placeholder="e.g. Los Angeles" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('city', { required: 'City is required' })} />
              {errors.city && <div className="invalid-feedback">{errors.city.message}</div>}
            </div>
          </div>

          {/* Section 3: Education */}
          <h4 className="text-primary h6 mb-3 border-bottom pb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>3. Academic Background</h4>
          
          <div className="row g-3 mb-4">
            <div className="col-md-5">
              <label className="form-label small text-white-50">Highest Qualification *</label>
              <input type="text" className={`form-control ${errors.qualification ? 'is-invalid' : ''}`} placeholder="e.g. B.Tech / B.Sc" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('qualification', { required: 'Qualification is required' })} />
              {errors.qualification && <div className="invalid-feedback">{errors.qualification.message}</div>}
            </div>
            <div className="col-md-5">
              <label className="form-label small text-white-50">College/University Name *</label>
              <input type="text" className={`form-control ${errors.college ? 'is-invalid' : ''}`} placeholder="e.g. Cornell University" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('college', { required: 'College is required' })} />
              {errors.college && <div className="invalid-feedback">{errors.college.message}</div>}
            </div>
            <div className="col-md-2">
              <label className="form-label small text-white-50">Passing Year *</label>
              <input type="number" className={`form-control ${errors.passingYear ? 'is-invalid' : ''}`} placeholder="2024" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(140,82,255,0.15)', color: '#fff' }} {...register('passingYear', { required: 'Passing year is required', min: { value: 1950, message: 'Invalid Year' } })} />
              {errors.passingYear && <div className="invalid-feedback">{errors.passingYear.message}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-100 mb-3" disabled={submitting} style={{ backgroundColor: '#8c52ff', border: 'none', boxShadow: '0 4px 14px rgba(140, 82, 255, 0.4)' }}>
            {submitting ? 'Registering Account...' : 'Submit and Create Profile'}
          </button>
        </form>

        <p className="text-center text-muted small mt-2">
          Already registered? <Link to="/login" style={{ color: '#8c52ff' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};
