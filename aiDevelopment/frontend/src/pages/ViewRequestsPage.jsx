import React, { useEffect, useState } from 'react';
import Header from '../components/common/Header';
import { requestsAPI } from '../services/api';
import "./ViewRequestPage.css";
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import CommonPopup from '../components/common/CommonPopup';

const ViewRequests = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'info' });
  const pageSize = 15; // number of records per page

  useEffect(() => {
    fetchRequests();
  }, []);

  // Adjust pagination if current page becomes invalid after cancellation
  useEffect(() => {
    const totalPages = Math.ceil(requests.length / pageSize);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [requests.length, currentPage, pageSize]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getMyRequests({limit: 100});

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

  // Pagination logic (client-side)
  const indexOfLast = currentPage * pageSize;
  const indexOfFirst = indexOfLast - pageSize;
  const currentRequests = requests.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(requests.length / pageSize);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "pending":
        return "status-pending";
      default:
        return "status-default";
    }
  };

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

  // Handle cancel request
  const handleCancelRequest = async (requestId) => {
    try {
      setCancelingId(requestId);
      const response = await requestsAPI.cancel(requestId);

      if (response.data.success) {
        // Remove the canceled request from the list
        setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
        setPopup({
          isOpen: true,
          message: response.data.message || 'Request cancelled successfully',
          type: 'success'
        });
      } else {
        setPopup({
          isOpen: true,
          message: response.data.message || 'Failed to cancel request',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      setPopup({
        isOpen: true,
        message: error.response?.data?.message || 'Failed to cancel request. Please try again.',
        type: 'error'
      });
    } finally {
      setCancelingId(null);
    }
  };

  const closePopup = () => {
    setPopup({ isOpen: false, message: '', type: 'info' });
  };

  return (
    <div className="view-requests-page">
      <Header />

      <div className="browse-equipment-container">
        <div className="page-header">
          <div>
            <h1>My Equipment Requests</h1>
            <p></p>
          </div>
          <button className="btn-back" onClick={() => navigate(getDashboardPath())}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
      
      <div className="card">
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : currentRequests.length === 0 ? (
          <p className="no-requests-text">No requests found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Requested Date</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.equipment_name}</td>
                    <td>{req.quantity}</td>
                    <td>{formatDate(req.request_date)}</td>
                    <td>{req.purpose || "-"}</td>
                    <td className={`status ${getStatusClass(req.status)}`}>
                      {req.status}
                    </td>
                    <td>
                      {req.status && req.status.toLowerCase() === 'pending' && (
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={cancelingId === req.id}
                        >
                          {cancelingId === req.id ? 'Canceling...' : 'Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={currentPage === index + 1 ? "active-page" : ""}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Success/Error Popup */}
      <CommonPopup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
        buttonText="OK"
      />
    </div>
  );
};

export default ViewRequests;
