import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../services/api';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfileImage = () => {
    if (user?.profilePhoto) {
      if (user.profilePhoto.startsWith('http')) {
        return user.profilePhoto;
      }
      return `${API_BASE_URL}${user.profilePhoto}`;
    }
    const seed = user ? `${user.firstName}_${user.lastName}` : 'default';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark border-bottom" style={{ backgroundColor: 'rgba(13, 10, 22, 0.75)', backdropFilter: 'blur(16px)', borderColor: 'rgba(140, 82, 255, 0.15)', zIndex: 1050 }}>
      <div className="container-fluid px-4">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span style={{ fontSize: '1.5rem' }}>⚡</span>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>Student<span style={{ color: '#8c52ff' }}>Future</span></span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">Dashboard</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/leaderboard">Leaderboard</Link>
                </li>
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <li className="nav-item">
                    <Link className="nav-link text-warning fw-bold" to="/admin">Admin Panel</Link>
                  </li>
                )}
              </>
            )}
          </ul>
          
          <div className="d-flex align-items-center">
            {isAuthenticated ? (
              <div className="dropdown text-end">
                <a href="#" className="d-block link-light text-decoration-none dropdown-toggle d-flex align-items-center gap-2" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                  <img src={getProfileImage()} alt="mdo" width="36" height="36" className="rounded-circle border" style={{ objectFit: 'cover', borderColor: 'rgba(140, 82, 255, 0.5)' }} />
                  <span className="d-none d-sm-inline text-white-50">{user.firstName}</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end text-small shadow" aria-labelledby="dropdownUser" style={{ backgroundColor: '#161226', border: '1px solid rgba(140, 82, 255, 0.15)' }}>
                  <li><Link className="dropdown-item text-light hover-primary" to="/dashboard">My Dashboard</Link></li>
                  <li><Link className="dropdown-item text-light hover-primary" to="/dashboard?profile=true">View Profile</Link></li>
                  <li><hr className="dropdown-divider bg-secondary" /></li>
                  <li><button className="dropdown-item text-danger fw-bold" onClick={handleLogout}>Sign Out</button></li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light btn-sm px-3">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm px-3" style={{ backgroundColor: '#8c52ff', border: 'none' }}>Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
