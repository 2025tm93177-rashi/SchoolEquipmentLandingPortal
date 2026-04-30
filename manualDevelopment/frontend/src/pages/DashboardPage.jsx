import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, getUser } from '../utils/auth';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Get user data and redirect based on role
    const userData = getUser();
    
    if (userData) {
      switch(userData.role) {
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        case 'Student':
          navigate('/student/dashboard');
          break;
        case 'Teacher':
          navigate('/teacher/dashboard');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return null;
};

export default DashboardPage;
