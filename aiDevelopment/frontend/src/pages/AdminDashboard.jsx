import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import Header from '../components/common/Header';
import './AdminDashboard.css';
import { equipmentAPI } from '../services/api';
import { usersAPI } from '../services/api';
import { requestsAPI } from '../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const userData = getUser();
    if (userData && userData.role === 'Admin') {
      setUser(userData);
      fetchEquipment();
      fetchUsers();
      fetchPendingRequests();
      fetchAllRequests();
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Fetch all equipment
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const response = await equipmentAPI.getAll({ limit: 100 }); // Get all equipment
        if (response.data.success) {
          setEquipment(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch equipment:', err);
      } finally {
        setLoading(false);
      }
    };

  const fetchUsers = async () => {
      try {
        setLoading(true);
        const params = {}
        
        const response = await usersAPI.getAll(params);
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  const fetchPendingRequests = async () => {
      try {
        setLoading(true);
        const params = { status: "Pending" };
  
        const response = await requestsAPI.getAll(params);
        if (response.data.success) {
          // Filter to show only Student requests for Teachers
          const allRequests = response.data.data || [];
          setPendingApprovals(allRequests); // Show only first 4 on dashboard
        } else {
          setPendingApprovals([]);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        setPendingApprovals([]);
      } finally {
        setLoading(false);
      }
    };

  const fetchAllRequests = async () => {
      try {
        setLoading(true);
        const params = {};
        const response = await requestsAPI.getAll(params);
          if (response.data.success) {
            setRequests(response.data.data || []);
          } else {
            setRequests([]);
          }
        }
       catch (error) {
        console.error("Error fetching pending requests:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

  if (!user) return <div>Loading...</div>;

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove users',
      icon: '',
      path: '/admin/users',
      color: '#4CAF50'
    },
    {
      title: 'Manage Equipment',
      description: 'Add, edit, or remove equipment',
      icon: '',
      path: '/admin/equipment',
      color: '#2196F3'
    },
    {
      title: 'View All Requests',
      description: 'Review borrowing requests',
      icon: '',
      path: '/admin/all-requests',
      color: '#FF9800'
    }
  ];

  return (
    <div className="admin-dashboard">
      <Header />
      
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user.full_name}!</p>
          </div>
          <button className="btn-primary" onClick={() => navigate('/profile')}>
            View Profile
          </button>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div>
            <div className="stats-grid">
              <div className="stat-card" style={{ borderLeftColor: '#4CAF50' }}>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p>{users.length}</p>
                </div>
              </div>

              <div className="stat-card" style={{ borderLeftColor: '#2196f3' }}>
                <div className="stat-content">
                  <h3>{equipment.length}</h3>
                  <p>Total Equipment</p>                  
                </div>
              </div>

              <div className="stat-card" style={{ borderLeftColor: '#FF9800' }}>
                <div className="stat-content">
                  <h3>{requests.length}</h3>
                  <p>Total Requests</p>         
                </div>
              </div>

              <div className="stat-card" style={{ borderLeftColor: '#f44336' }}>
                <div className="stat-content">
                  <h3>{pendingApprovals.length}</h3>
                  <p>Pending Approvals</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <div 
                key={index} 
                className="action-card"
                onClick={() => navigate(action.path)}
              >
                <h3>{action.title}</h3>
                <p>{action.description}</p>
                <button className="action-btn">Go →</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;