import React, { useEffect, useState } from 'react';
import { equipmentAPI } from '../services/api';
import './AvailableEquipment.css';
import RequestEquipmentModal from './RequestEquipmentModal';

const AvailableEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all'); // 'all', 'available', 'unavailable'

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Predefined categories
  const categories = [
    'Sports Kits',
    'Lab Equipment',
    'Cameras',
    'Musical Instruments',
    'Project Materials'
  ];

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Fetch all equipment
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await equipmentAPI.getAll({ limit: 100 }); // Get all equipment
      if (response.data.success) {
        setEquipment(response.data.data);
        setFilteredEquipment(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch equipment:', err);
      setError('Failed to load equipment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...equipment];

    // Search filter (name or description)
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter === 'available') {
      filtered = filtered.filter(item => item.available_quantity > 0);
    } else if (availabilityFilter === 'unavailable') {
      filtered = filtered.filter(item => item.available_quantity === 0);
    }

    setFilteredEquipment(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [searchQuery, categoryFilter, availabilityFilter, equipment]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
  };

  // Handle availability filter change
  const handleAvailabilityChange = (e) => {
    setAvailabilityFilter(e.target.value);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setAvailabilityFilter('all');
    setCurrentPage(1); // Reset to page 1
  };

  // Handle request button click
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

  // Get condition badge color
  const getConditionClass = (condition) => {
    switch(condition) {
      case 'Excellent': return 'condition-excellent';
      case 'Good': return 'condition-good';
      case 'Fair': return 'condition-fair';
      case 'Poor': return 'condition-poor';
      case 'Needs Repair': return 'condition-needs-repair';
      default: return '';
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add pages around current page
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="available-equipment">

      {successMessage && (
        <div className="success-toast">
          {successMessage}
        </div>
      )}

      {/* Search and Filters */}
      <div className="equipment-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search equipment by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <span className="search-icon"></span>
        </div>

        <div className="filter-controls">
          <select
            value={categoryFilter}
            onChange={handleCategoryChange}
            className="filter-select"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={handleAvailabilityChange}
            className="filter-select"
          >
            <option value="all">All Items</option>
            <option value="available">Available Only</option>
            <option value="unavailable">Out of Stock</option>
          </select>

          {(searchQuery || categoryFilter || availabilityFilter !== 'all') && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              ✕ Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="results-info">
          {filteredEquipment.length > 0 ? (
            <>
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredEquipment.length)} of {filteredEquipment.length} {filteredEquipment.length === 1 ? 'item' : 'items'}
              </span>
              {totalPages > 1 && (
                <span className="page-indicator"> • Page {currentPage} of {totalPages}</span>
              )}
            </>
          ) : (
            <span>0 items found</span>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading equipment...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={fetchEquipment} className="retry-btn">Try Again</button>
        </div>
      )}

      {/* Equipment Grid */}
      {!loading && !error && (
        <>
          {filteredEquipment.length === 0 ? (
            <div className="empty-state">
              <h3>No equipment found</h3>
              <p>Try adjusting your search or filters</p>
              {(searchQuery || categoryFilter || availabilityFilter !== 'all') && (
                <button className="clear-filters-btn" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="equipment-grid">
                {currentEquipment.map((item) => (
                  <div key={item.id} className="equipment-card">
                    <h3 className="equipment-name">{item.name}</h3>
                    
                    <p className="equipment-category">{item.category}</p>
                    
                    {item.description && (
                      <p className="equipment-description">{item.description}</p>
                    )}
                    
                    <div className="equipment-details">
                      <div className="detail-item">
                        <span className="detail-label">Condition:</span>
                        <span className={`condition-badge ${getConditionClass(item.condition)}`}>
                          {item.condition}
                        </span>
                      </div>
                      
                      <div className="detail-item">
                        <span className="detail-label">Total:</span>
                        <span className="detail-value">{item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="availability-section">
                      {item.available_quantity > 0 ? (
                        <p className="availability-text available">
                          <strong>{item.available_quantity} available</strong>
                        </p>
                      ) : (
                        <p className="availability-text unavailable">
                          <strong>Out of Stock</strong>
                        </p>
                      )}
                    </div>
                    
                    <button
                      className={`request-btn ${item.available_quantity === 0 ? 'disabled' : ''}`}
                      onClick={() => handleRequest(item)}
                      disabled={item.available_quantity === 0}
                    >
                      {item.available_quantity > 0 ? 'Request' : 'Unavailable'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    « Previous
                  </button>
                  
                  <div className="pagination-numbers">
                    {getPageNumbers().map((pageNum, index) => (
                      pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          key={pageNum}
                          className={`pagination-number ${pageNum === currentPage ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
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
            </>
          )}
        </>
      )}

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

export default AvailableEquipment;