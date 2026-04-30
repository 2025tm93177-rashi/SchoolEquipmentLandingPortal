import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';
import LoginForm from '../components/auth/LoginForm';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-page-header">
        <h1 className="page-title">School Equipment Lending Portal</h1>
      </div>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
