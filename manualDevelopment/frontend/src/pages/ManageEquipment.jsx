import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../utils/auth';
import Header from '../components/common/Header';
import { equipmentAPI } from '../services/api';
import './ManageEquipment.css';

const ManageEquipment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEquipment, setTotalEquipment] = useState(0);
  const itemsPerPage = 10;
  
  // Filter state
  const [categoryFilter, setCategoryFilter] = useState(''); // '', 'Sports Kits', 'Lab Equipment', etc.
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    condition: 'Good',
    quantity: 1,
    available_quantity: 1,
    description: ''
  });

  // Check if user is admin
  useEffect(() => {
    const userData = getUser();
    if (userData && userData.role === 'Admin') {
      setUser(userData);
      fetchEquipment();
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Fetch equipment when page or filter changes
  useEffect(() => {
    if (user) {
      fetchEquipment();
    }
  }, [currentPage, categoryFilter]);

  // Fetch all equipment with pagination and filter
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      // Add category filter if selected
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      
      const response = await equipmentAPI.getAll(params);
      if (response.data.success) {
        setEquipment(response.data.data);
        
        // Set pagination info
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages);
          setTotalEquipment(response.data.pagination.total);
        }
      }
    } catch (err) {
      setError('Failed to fetch equipment');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  // Open Add Equipment Modal
  const handleAddEquipment = () => {
    setModalMode('add');
    setFormData({
      name: '',
      category: '',
      condition: 'Good',
      quantity: 1,
      available_quantity: 1,
      description: ''
    });
    setError('');
    setShowModal(true);
  };

  // Open Edit Equipment Modal
  const handleEditEquipment = (item) => {
    setModalMode('edit');
    setSelectedEquipment(item);
    setFormData({
      name: item.name,
      category: item.category,
      condition: item.condition,
      quantity: item.quantity,
      available_quantity: item.available_quantity,
      description: item.description || ''
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
        // Create new equipment
        const equipmentData = {
          name: formData.name.trim(),
          category: formData.category.trim(),
          condition: formData.condition,
          quantity: parseInt(formData.quantity),
          available_quantity: parseInt(formData.available_quantity)
        };

        // Add optional fields only if they have values
        if (formData.description && formData.description.trim()) {
          equipmentData.description = formData.description.trim();
        }

        const response = await equipmentAPI.create(equipmentData);
        if (response.data.success) {
          setSuccessMessage('Equipment created successfully!');
          setShowModal(false);
          setCurrentPage(1); // Reset to first page
          fetchEquipment(); // Refresh list
        }
      } else {
        // Update existing equipment
        const updateData = {
          name: formData.name.trim(),
          category: formData.category.trim(),
          condition: formData.condition,
          quantity: parseInt(formData.quantity),
          available_quantity: parseInt(formData.available_quantity)
        };

        // Add optional fields only if they have values
        if (formData.description && formData.description.trim()) {
          updateData.description = formData.description.trim();
        }

        const response = await equipmentAPI.update(selectedEquipment.id, updateData);
        if (response.data.success) {
          setSuccessMessage('Equipment updated successfully!');
          setShowModal(false);
          fetchEquipment(); // Refresh list
        }
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
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

  // Delete equipment
  const handleDeleteEquipment = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const response = await equipmentAPI.delete(id);
        if (response.data.success) {
          setSuccessMessage('Equipment deleted successfully!');
          fetchEquipment(); // Refresh list
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } catch (err) {
        if (err.response && err.response.data) {
          setError(err.response.data.message || 'Delete failed');
        } else {
          setError('Failed to delete equipment');
        }
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    setSelectedEquipment(null);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="manage-equipment-page">
      <Header />
      
      <div className="manage-equipment-container">
        <div className="page-header">
          <div>
            <h1>Manage Equipment</h1>
            <p>Add, edit, and manage equipment inventory</p>
          </div>
          <button className="btn-back" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success">
             {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && !showModal && (
          <div className="alert alert-error">
             {error}
          </div>
        )}

        {/* Add Equipment Button & Filter */}
        <div className="actions-bar">
          <div className="actions-left">
            <button className="btn-primary" onClick={handleAddEquipment}>
              + Add New Equipment
            </button>
            
            {/* Category Filter */}
            <div className="filter-group">
              <label htmlFor="categoryFilter">Filter by Category:</label>
              <select 
                id="categoryFilter"
                value={categoryFilter} 
                onChange={handleCategoryFilterChange}
                className="filter-select"
              >
                <option value="">All Categories</option>
                <option value="Sports Kits">Sports Kits</option>
                <option value="Lab Equipment">Lab Equipment</option>
                <option value="Cameras">Cameras</option>
                <option value="Musical Instruments">Musical Instruments</option>
                <option value="Project Materials">Project Materials</option>
              </select>
            </div>
          </div>
          
          {totalEquipment > 0 && (
            <div className="item-count">
              Showing {equipment.length} of {totalEquipment} items
            </div>
          )}
        </div>

        {/* Equipment Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">Loading equipment...</div>
          ) : equipment.length === 0 ? (
            <div className="empty-state">
              <p>No equipment found</p>
            </div>
          ) : (
            <table className="equipment-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Condition</th>
                  <th>Quantity</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map((item, index) => (
                  <tr key={item.id}>
                    <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="equipment-name">
                      <div className="name-cell">
                        <strong>{item.name}</strong>
                        {item.description && (
                          <small className="description">{item.description}</small>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span className={`condition-badge condition-${item.condition.toLowerCase().replace(' ', '-')}`}>
                        {item.condition}
                      </span>
                    </td>
                    <td className="quantity-cell">{item.quantity}</td>
                    <td className="available-cell">
                      <span className={item.available_quantity > 0 ? 'available-yes' : 'available-no'}>
                        {item.available_quantity}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEditEquipment(item)}
                          title="Edit Equipment"
                        >
                           Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteEquipment(item.id, item.name)}
                          title="Delete Equipment"
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
          {!loading && equipment.length > 0 && totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                « Previous
              </button>
              
              <div className="pagination-info">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
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

      {/* Add/Edit Equipment Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Equipment' : 'Edit Equipment'}</h2>
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
                {/* Name */}
                <div className="form-group full-width">
                  <label>Equipment Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter equipment name"
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Sports Kits">Sports Kits</option>
                    <option value="Lab Equipment">Lab Equipment</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Musical Instruments">Musical Instruments</option>
                    <option value="Project Materials">Project Materials</option>
                  </select>
                </div>

                {/* Condition */}
                <div className="form-group">
                  <label>Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Needs Repair">Needs Repair</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="form-group">
                  <label>Total Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                {/* Available Quantity */}
                <div className="form-group">
                  <label>Available Quantity *</label>
                  <input
                    type="number"
                    name="available_quantity"
                    value={formData.available_quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max={formData.quantity}
                    placeholder="0"
                  />
                  <small style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    Cannot exceed total quantity
                  </small>
                </div>

                {/* Description */}
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Optional description or specifications"
                    maxLength="500"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Create Equipment' : 'Update Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEquipment;