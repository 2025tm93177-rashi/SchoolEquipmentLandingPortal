import React, { useEffect, useState } from "react";
import { requestsAPI } from '../services/api';
import Header from '../components/common/Header';
import "./PendingRequests.css";
import { getUser } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import CommonPopup from '../components/common/CommonPopup';

const PendingRequests = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [requests, setRequests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const pageSize = 15;
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Popup state
  const [popup, setPopup] = useState({
    isOpen: false,
    message: "",
    type: "info",
    buttonText: "OK",
  });

  // Confirmation popup state
  const [confirmPopup, setConfirmPopup] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch all requests (no status filter)
      // Teachers only see requests from Students
      // Admins see all requests
      const params = {}; // No status filter - get all requests
      
      if (user?.role === 'Teacher') {
        // Backend should filter by requester_role, but since your backend doesn't have this filter,
        // we'll filter on the frontend after getting all requests
        const response = await requestsAPI.getAll(params);
        if (response.data.success) {
          // Filter to show only Student requests for Teachers
          const allRequests = response.data.data || [];
          const studentRequests = allRequests.filter(req => req.requester_role === 'Student');
          setRequests(studentRequests);
        } else {
          setRequests([]);
        }
      } else {
        // Admin sees all requests
        const response = await requestsAPI.getAll(params);
        if (response.data.success) {
          setRequests(response.data.data || []);
        } else {
          setRequests([]);
        }
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    const approveRequest = async () => {
      setConfirmPopup({ isOpen: false, message: "", onConfirm: null });
      try {
        setActionLoading(true);
        const response = await requestsAPI.approve(id, { notes: '' });
        if (response.data.success) {
          setPopup({
            isOpen: true,
            message: "Request approved successfully!",
            type: "success",
            buttonText: "OK",
          });
          fetchPendingRequests();
        } else {
          setPopup({
            isOpen: true,
            message: response.data.message || "Failed to approve request.",
            type: "error",
            buttonText: "OK",
          });
        }
      } catch (error) {
        console.error("Error approving request:", error);
        setPopup({
          isOpen: true,
          message: error.response?.data?.message || "Failed to approve request.",
          type: "error",
          buttonText: "OK",
        });
      } finally {
        setActionLoading(false);
      }
    };

    setConfirmPopup({
      isOpen: true,
      message: 'Are you sure you want to approve this request?',
      onConfirm: approveRequest,
    });
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      setPopup({
        isOpen: true,
        message: 'Please provide a rejection reason',
        type: "warning",
        buttonText: "OK",
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await requestsAPI.deny(selectedRequest.id, { 
        denial_reason: rejectionReason 
      });
      
      if (response.data.success) {
        setPopup({
          isOpen: true,
          message: "Request rejected successfully!",
          type: "success",
          buttonText: "OK",
        });
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        fetchPendingRequests();
      } else {
        setPopup({
          isOpen: true,
          message: response.data.message || "Failed to reject request.",
          type: "error",
          buttonText: "OK",
        });
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      setPopup({
        isOpen: true,
        message: error.response?.data?.message || "Failed to reject request.",
        type: "error",
        buttonText: "OK",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  // Pagination logic
  const indexOfLast = currentPage * pageSize;
  const indexOfFirst = indexOfLast - pageSize;
  const currentRequests = requests.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(requests.length / pageSize);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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

  return (
    <div className="pending-requests-page">
      <Header />
      <div className="pending-requests-container">
        <div className="page-header">
          <div>
            <h1>Equipment Requests</h1>
            <p>View and manage all equipment requests</p>
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
                  <th>Return Date</th>
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
                    <td>{formatDate(req.return_date)}</td>
                    <td>{req.purpose || "-"}</td>
                    <td className={`status-${req.status.toLowerCase()}`}>{req.status}</td>
                    <td>
                      {req.status === 'Pending' ? (
                        <>
                          <button
                            className="btn-approve"
                            onClick={() => handleApprove(req.id)}
                            disabled={actionLoading}
                          >
                            Approve
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleRejectClick(req)}
                            disabled={actionLoading}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="no-action">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Request</h2>
            {selectedRequest && (
              <div className="modal-info">
                <p><strong>Item:</strong> {selectedRequest.equipment_name}</p>
                <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
              </div>
            )}
            <form onSubmit={handleRejectSubmit}>
              <div className="form-group">
                <label htmlFor="rejectionReason">
                  Rejection Reason <span className="required">*</span>
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="4"
                  placeholder="Please provide a reason for rejection..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-reject"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Common Popup */}
      <CommonPopup
        message={popup.message}
        isOpen={popup.isOpen}
        onClose={() => setPopup({ ...popup, isOpen: false })}
        type={popup.type}
        buttonText={popup.buttonText}
      />

      {/* Confirmation Popup */}
      <CommonPopup
        message={confirmPopup.message}
        isOpen={confirmPopup.isOpen}
        onClose={() => setConfirmPopup({ ...confirmPopup, isOpen: false })}
        type="warning"
        confirm={true}
        onConfirm={confirmPopup.onConfirm || (() => {})}
        confirmText="Approve"
        cancelText="Cancel"
      />
    </div>
  );
};

export default PendingRequests;