import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import Header from '../components/common/Header';
import './StudentDashboard.css';
import { equipmentAPI } from '../services/api';
import RequestEquipmentModal from './RequestEquipmentModal';
import { requestsAPI } from '../services/api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [successMessage, setSuccessMessage] = useState();

  const [myRequests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userData = getUser();
    if (userData && userData.role === 'Student') {
      setUser(userData);
      fetchEquipment();
      fetchRequests();
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleRequest = (item) => {
    setSelectedEquipment(item);
    setShowRequestModal(true);
  };

  // Handle successful request - SHOWS SUCCESS MESSAGE
  const handleRequestSuccess = (message) => {
    setSuccessMessage(message);
    fetchEquipment(); // Refresh to update quantities
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Fetch only 4 equipment items for dashboard preview
  const fetchEquipment = async () => {
    try {
      setLoadingEquipment(true);
      const response = await equipmentAPI.getAll({ limit: 4 });
      if (response.data.success) {
        setEquipment(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getMyRequests({ limit: 4 });
      if (response.data.success) {
        setRequests(response.data.data || []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="student-dashboard">

      {successMessage && (
        <div className="success-toast">
          {successMessage}
        </div>
      )}

      <Header />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Student Dashboard</h1>
            <p>Welcome back, {user.full_name}!</p>
          </div>
          {/* <button
            className="btn-primary"
            onClick={() => navigate('/student/browse-equipment')}
          >
            Browse Equipment
          </button> */}
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <h3>{myRequests.length}</h3>
              <p>My All Requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{myRequests.filter(r => r.status === 'Approved').length}</h3>
              <p>Approved Requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{myRequests.filter(r => r.status === 'Pending').length}</h3>
              <p>Pending Requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <h3>{myRequests.filter(r => r.status === 'Denied').length}</h3>
              <p>Rejected Requests</p>
            </div>
          </div>
        </div>

        {/* Available Equipment */}
        <div className="section">
          <div className="section-header">
            <h2>Available Equipment</h2>
            <button
              className="btn-link"
              onClick={() => navigate('/student/browse-equipment')}
            >
              Browse All →
            </button>
          </div>

          <div className="equipment-grid">
            {equipment.map((item) => (
              <div key={item.id} className="equipment-card">
                <h3>{item.name}</h3>
                <p className="equipment-category">{item.category}</p>
                <p className="equipment-availability">
                  {item.available_quantity} available
                </p>
                <button
                  className={`request-btn ${item.available_quantity === 0 ? 'disabled' : ''}`}
                  onClick={() => handleRequest(item)}
                    disabled={item.available_quantity === 0}>
                  {item.available_quantity > 0 ? 'Request' : 'Unavailable'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Requests */}
        <div className="section">
          <div className="section-header">
            <h2>My Requests</h2>
            <button
              className="btn-link"
              onClick={() => navigate('/student/requests')}
            >
              View All →
            </button>
          </div>

          <div className="requests-list">
            {myRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.equipment_name}</h3>
                  <span
                    className={`status-badge statues-${request.status.toLowerCase().replace(' ', '-')}`}
                  >
                    {request.status}
                  </span>
                </div>
                <div className="request-details">
                  <div className="detail-item">
                    <span className="label">Quantity</span>
                    <span>{request.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Request Date:</span>
                    <span>{formatDate(request.request_date)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Due Date:</span>
                    <span>{request.return_date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button
              className="action-button"
              onClick={() => navigate('/student/browse-equipment')}
            >
              <span>Browse Equipment</span>
            </button>
            <button
              className="action-button"
              onClick={() => navigate('/student/requests')}
            >
              <span>My Requests</span>
            </button>
            <button
              className="action-button"
              onClick={() => navigate('/profile')}
            >
              <span>My Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedEquipment && (
        <RequestEquipmentModal
          equipment={selectedEquipment}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedEquipment(null);
          }}
          onSuccess={handleRequestSuccess}
        />
      )}

    </div>
  );
};

export default StudentDashboard;