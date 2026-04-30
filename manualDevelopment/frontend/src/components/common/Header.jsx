import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getUser } from '../../utils/auth';
import Button from './Button';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="header-title">School Equipment Lending Portal</h1>
        {user && (
          <div className="header-actions">
            <span className="header-user">
              Role: <strong>{user.role}</strong>
            </span>
            <Button variant="danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
