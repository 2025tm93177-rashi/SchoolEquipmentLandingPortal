import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import Header from '../components/common/Header';
import AvailableEquipment from './AvailableEquipment';
import './BrowseEquipment.css';

const BrowseEquipment = () => {
  const navigate = useNavigate();
  const user = getUser();

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (!user) return '/dashboard';
    switch(user.role) {
      case 'Admin': return '/admin/dashboard';
      case 'Teacher': return '/teacher/dashboard';
      case 'Student': return '/student/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <div className="browse-equipment-page">
      <Header />
      
      <div className="browse-equipment-container">
        <div className="page-header">
          <div>
            <h1>Browse Equipment</h1>
            <p>Search and request equipment for your needs</p>
          </div>
          <button className="btn-back" onClick={() => navigate(getDashboardPath())}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Available Equipment Component */}
        <AvailableEquipment />
      </div>
    </div>
  );
};

export default BrowseEquipment;
