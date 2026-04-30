import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import Header from '../components/common/Header';
import { usersAPI } from '../services/api';
import './ManageUsers.css';
import CommonPopup from '../components/common/CommonPopup';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;
  
  // Filter state
  const [roleFilter, setRoleFilter] = useState(''); // '', 'Student', 'Teacher', 'Admin'
  
  // Confirmation popup state
  const [confirmPopup, setConfirmPopup] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    department: '',
    role: 'Student',
    password: ''
  });

  // Check if user is admin
  useEffect(() => {
    const userData = getUser();
    if (userData && userData.role === 'Admin') {
      setUser(userData);
      fetchUsers();
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Fetch users when page or filter changes
  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [currentPage, roleFilter]);

  // Fetch all users with pagination and filter
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: usersPerPage
      };
      
      // Add role filter if selected
      if (roleFilter) {
        params.role = roleFilter;
      }
      
      const response = await usersAPI.getAll(params);
      if (response.data.success) {
        setUsers(response.data.data);
        
        // Set pagination info
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages);
          setTotalUsers(response.data.pagination.total);
        }
      }
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle role filter change
  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  // Open Add User Modal
  const handleAddUser = () => {
    setModalMode('add');
    setFormData({
      email: '',
      full_name: '',
      phone: '',
      department: '',
      role: 'Student',
      password: ''
    });
    setError('');
    setShowModal(true);
  };

  // Open Edit User Modal
  const handleEditUser = (userToEdit) => {
    setModalMode('edit');
    setSelectedUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      full_name: userToEdit.full_name,
      phone: userToEdit.phone || '',
      department: userToEdit.department || '',
      role: userToEdit.role,
      password: '' // Don't show password
    });
    setError('');
    setShowModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      if (modalMode === 'add') {
        // Create new user - prepare data
        const userData = {
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          role: formData.role,
          password: formData.password
        };

        // Add optional fields only if they have values
        if (formData.phone && formData.phone.trim()) {
          userData.phone = formData.phone.trim();
        }
        if (formData.department && formData.department.trim()) {
          userData.department = formData.department.trim();
        }

        const response = await usersAPI.create(userData);
        if (response.data.success) {
          setSuccessMessage('User created successfully!');
          setShowModal(false);
          setCurrentPage(1); // Reset to first page
          fetchUsers(); // Refresh user list
        }
      } else {
        // Update existing user - only send fields that can be updated
        const updateData = {
          full_name: formData.full_name.trim()
        };

        // Add optional fields only if they have values
        if (formData.phone && formData.phone.trim()) {
          updateData.phone = formData.phone.trim();
        }
        if (formData.department && formData.department.trim()) {
          updateData.department = formData.department.trim();
        }

        const response = await usersAPI.update(selectedUser.id, updateData);
        if (response.data.success) {
          setSuccessMessage('User updated successfully!');
          setShowModal(false);
          fetchUsers(); // Refresh user list
        }
      }

      // Clear success message after 2.5 seconds
      setTimeout(() => setSuccessMessage(''), 2500);
    } catch (err) {
      console.error('Error:', err);
      if (err.response && err.response.data) {
        // Handle validation errors array
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          const errorMessages = err.response.data.errors.map(e => e.message).join(', ');
          setError(errorMessages);
        } else {
          setError(err.response.data.message || 'Operation failed');
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  // Delete user
  const handleDeleteUser = async (userId, userName) => {
    const deleteUser = async () => {
      setConfirmPopup({ isOpen: false, message: "", onConfirm: null });
      try {
        const response = await usersAPI.delete(userId);
        if (response.data.success) {
          setSuccessMessage('User deleted successfully!');
          fetchUsers(); // Refresh user list
          setTimeout(() => setSuccessMessage(''), 2500);
        }
      } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.message || 'Delete failed');
        } else {
          setError('Failed to delete user');
        }
        setTimeout(() => setError(''), 3000);
      }
    };

    setConfirmPopup({
      isOpen: true,
      message: `Are you sure you want to delete ${userName}?`,
      onConfirm: deleteUser,
    });
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setSelectedUser(null);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="manage-users-page">
      <Header />
      
      <div className="manage-users-container">
        <div className="page-header">
          <div>
            <h1>Manage Users</h1>
            <p>Add, edit, and manage user accounts</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Success Message Toast */}
        {successMessage && (
          <div className="success-toast">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && !showModal && (
          <div className="alert alert-error">
             {error}
          </div>
        )}

        {/* Add User Button */}
        <div className="actions-bar">
          <div className="actions-left">
            <button className="btn-primary" onClick={handleAddUser}>
              + Add New User
            </button>
            
            {/* Role Filter */}
            <div className="filter-group">
              <label htmlFor="roleFilter">Filter by Role:</label>
              <select 
                id="roleFilter"
                value={roleFilter} 
                onChange={handleRoleFilterChange}
                className="filter-select"
              >
                <option value="">All Users</option>
                <option value="Student">Students</option>
                <option value="Teacher">Teachers</option>
                <option value="Admin">Admins</option>
              </select>
            </div>
          </div>
          
          {totalUsers > 0 && (
            <div className="user-count">
              Showing {users.length} of {totalUsers} users
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem, index) => (
                  <tr key={userItem.id}>
                    <td>{(currentPage - 1) * usersPerPage + index + 1}</td>
                    <td>{userItem.full_name}</td>
                    <td>{userItem.email}</td>
                    <td>{userItem.phone || '-'}</td>
                    <td>{userItem.department || '-'}</td>
                    <td>
                      <span className={`role-badge role-${userItem.role.toLowerCase()}`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${userItem.status.toLowerCase().replace(' ', '-')}`}>
                        {userItem.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditUser(userItem)}
                          title="Edit User"
                        >
                           Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser(userItem.id, userItem.full_name)}
                          title="Delete User"
                          disabled={userItem.id === user.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {/* Pagination */}
          {!loading && users.length > 0 && totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                « Previous
              </button>
              
              <div className="pagination-info">
                {/* Show page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next »
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New User' : 'Edit User'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>

            {error && (
              <div className="alert alert-error">
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✗ Error:</div>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Full Name */}
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={modalMode === 'edit'}
                    placeholder="user@school.edu"
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Please enter a valid email address"
                  />
                  {modalMode === 'edit' && (
                    <small style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      Email cannot be changed
                    </small>
                  )}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Department */}
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Enter department"
                  />
                </div>

                {/* Role */}
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    disabled={modalMode === 'edit'}
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Password (only for add mode) */}
                {modalMode === 'add' && (
                  <div className="form-group">
                    <label>Password *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                      placeholder="Minimum 6 characters"
                      title="Password must be at least 6 characters long"
                    />
                    <small style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Minimum 6 characters required
                    </small>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Popup */}
      <CommonPopup
        message={confirmPopup.message}
        isOpen={confirmPopup.isOpen}
        onClose={() => setConfirmPopup({ ...confirmPopup, isOpen: false })}
        type="warning"
        confirm={true}
        onConfirm={confirmPopup.onConfirm || (() => {})}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default ManageUsers;
