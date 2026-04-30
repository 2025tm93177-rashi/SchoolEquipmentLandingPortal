import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import Header from '../components/common/Header';
import { usersAPI } from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const userData = getUser();
    if (userData) {
      setUser(userData);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open change password modal
  const handleOpenPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccessMessage('');
    setShowPasswordModal(true);
  };

  // Close password modal
  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);
      const response = await usersAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data.success) {
        setSuccessMessage('Password changed successfully!');
        setTimeout(() => {
          setSuccessMessage('');
          setShowPasswordModal(false);
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
        }, 2500);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Failed to change password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  // Get role badge color
  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'Admin': return 'role-badge-admin';
      case 'Teacher': return 'role-badge-teacher';
      case 'Student': return 'role-badge-student';
      default: return '';
    }
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    switch(user.role) {
      case 'Admin': return '/admin/dashboard';
      case 'Teacher': return '/teacher/dashboard';
      case 'Student': return '/student/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-container">
        <div className="page-header">
          <div>
            <h1>My Profile</h1>
            <p>View and manage your account information</p>
          </div>
          <button className="btn-back" onClick={() => navigate(getDashboardPath())}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Success Message Toast */}
        {successMessage && !showPasswordModal && (
          <div className="success-toast">
            {successMessage}
          </div>
        )}

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-header-section">
            <div className="profile-avatar">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <h2>{user.full_name}</h2>
              <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="profile-details">
            <h3>Account Information</h3>
            
            <div className="detail-grid">
              <div className="detail-item">
                <label>Full Name</label>
                <div className="detail-value">{user.full_name}</div>
              </div>

              <div className="detail-item">
                <label>Email Address</label>
                <div className="detail-value">{user.email}</div>
              </div>

              <div className="detail-item">
                <label>Phone Number</label>
                <div className="detail-value">{user.phone || 'Not provided'}</div>
              </div>

              <div className="detail-item">
                <label>Department</label>
                <div className="detail-value">{user.department || 'Not provided'}</div>
              </div>

              <div className="detail-item">
                <label>Role</label>
                <div className="detail-value">{user.role}</div>
              </div>

              <div className="detail-item">
                <label>Account Status</label>
                <div className="detail-value">
                  <span className={`status-badge status-${user.status.toLowerCase().replace(' ', '-')}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="btn-primary"
              onClick={handleOpenPasswordModal}
            >
               Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={handleClosePasswordModal}>×</button>
            </div>

            {error && (
              <div className="alert alert-error">
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✗ Error:</div>
                <div>{error}</div>
              </div>
            )}

            {successMessage && (
              <div className="success-toast">
                {successMessage}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group-full">
                <label>Current Password *</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Enter your current password"
                  disabled={loading}
                />
              </div>

              <div className="form-group-full">
                <label>New Password *</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                  placeholder="Enter new password (minimum 6 characters)"
                  disabled={loading}
                />
                <small style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                  Password must be at least 6 characters long
                </small>
              </div>

              <div className="form-group-full">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength="6"
                  placeholder="Re-enter new password"
                  disabled={loading}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleClosePasswordModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
