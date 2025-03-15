import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './NavBar.css';

const NavBar: React.FC = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span onClick={() => navigate('/home')} className="navbar-logo">
          PixelArt
        </span>
      </div>

      <div className="navbar-menu">
        <div className="navbar-item" onClick={() => navigate('/home')}>
          Home
        </div>
        <div className="navbar-item" onClick={() => navigate('/create-board')}>
          Create Board
        </div>
        <div className="navbar-item" onClick={() => navigate('/profile')}>
          Profile
        </div>
        {isAdmin && (
          <div className="navbar-item" onClick={() => navigate('/admin')}>
            Admin
          </div>
        )}
        <div className="navbar-item navbar-logout" onClick={handleLogout}>
          Logout
        </div>
      </div>
    </nav>
  );
};

export default NavBar;