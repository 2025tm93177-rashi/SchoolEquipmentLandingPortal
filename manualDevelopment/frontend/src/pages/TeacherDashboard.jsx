import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import Header from "../components/common/Header";
import { equipmentAPI } from "../services/api";
import "./TeacherDashboard.css";
import RequestEquipmentModal from "./RequestEquipmentModal";
import { requestsAPI } from "../services/api";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);

  // Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [myRequests, setMyRequests] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]); // Changed from selectedRequest
  const [loading, setLoading] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState(null); // Only for rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const userData = getUser();
    if (userData && userData.role === "Teacher") {
      setUser(userData);
      fetchEquipment();
      fetchMyRequests();
      fetchPendingRequests();
    } else {
      navigate("/dashboard");
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
    fetchMyRequests(); // Refresh my requests
    setTimeout(() => setSuccessMessage(""), 5000);
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
      console.error("Failed to fetch equipment:", err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  // Fetch teacher's own requests
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await requestsAPI.getMyRequests({ limit: 4 });
      if (response.data.success) {
        setMyRequests(response.data.data || []);
      } else {
        setMyRequests([]);
      }
    } catch (error) {
      console.error("Error fetching my requests:", error);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending requests from students (for approval)
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const params = { status: "Pending" };

      const response = await requestsAPI.getAll(params);
      if (response.data.success) {
        // Filter to show only Student requests for Teachers
        const allRequests = response.data.data || [];
        const studentRequests = allRequests.filter(
          (req) => req.requester_role === "Student"
        );
        setPendingApprovals(studentRequests.slice(0, 4)); // Show only first 4 on dashboard
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

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this request?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await requestsAPI.approve(id, { notes: "" });
      if (response.data.success) {
        alert("Request approved successfully!");
        fetchPendingRequests();
      } else {
        alert(response.data.message || "Failed to approve request.");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.response?.data?.message || "Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      const response = await requestsAPI.deny(selectedRequest.id, {
        denial_reason: rejectionReason,
      });

      if (response.data.success) {
        alert("Request rejected successfully!");
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason("");
        fetchPendingRequests();
      } else {
        alert(response.data.message || "Failed to reject request.");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.message || "Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="teacher-dashboard">
      {successMessage && <div className="success-toast">{successMessage}</div>}

      <Header />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Teacher Dashboard</h1>
            <p>Welcome back, {user.full_name}!</p>
          </div>
          {/* <button
            className="btn-primary"
            onClick={() => navigate("/teacher/browse-equipment")}
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
              <h3>
                {myRequests.filter((r) => r.status === "Approved").length}
              </h3>
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

        {/* Pending Approvals - Only show if there are pending requests */}
        {pendingApprovals.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2>Student Requests - Pending Your Approval</h2>
              <button
                className="btn-link"
                onClick={() => navigate("/teacher/all-requests")}
              >
                View All →
              </button>
            </div>

            <div className="approvals-list">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="approval-card">
                  <div className="approval-header">
                    <div>
                      <h3>{approval.requester_name}</h3>
                      <p className="equipment-name">{approval.equipment_name}</p>
                    </div>
                    <span className="status-badge pending">Pending</span>
                  </div>
                  <div className="approval-details">
                    <div className="detail-item">
                      <span className="label">Request Date:</span>
                      <span>{formatDate(approval.request_date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Required Date:</span>
                      <span>{formatDate(approval.required_date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Return Date:</span>
                      <span>{formatDate(approval.return_date)}</span>
                    </div>
                  </div>
                  <div className="approval-actions">
                    <button
                      className="btn-success-small"
                      onClick={() => handleApprove(approval.id)}
                      disabled={actionLoading}
                    >
                      Approve
                    </button>
                    <button
                      className="btn-danger-small"
                      onClick={() => handleRejectClick(approval)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Equipment */}
        <div className="section">
          <div className="section-header">
            <h2>Available Equipment</h2>
            <button
              className="btn-link"
              onClick={() => navigate("/teacher/browse-equipment")}
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
                  className={`request-btn ${
                    item.available_quantity === 0 ? "disabled" : ""
                  }`}
                  onClick={() => handleRequest(item)}
                  disabled={item.available_quantity === 0}
                >
                  {item.available_quantity > 0 ? "Request" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Requests */}
        <div className="section">
          <div className="section-header">
            <h2>My Equipment Requests</h2>
            <button
              className="btn-link"
              onClick={() => navigate("/teacher/requests")}
            >
              View All →
            </button>
          </div>

          <div className="requests-list">
            {myRequests.length > 0 ? (
              myRequests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <h3>{request.equipment_name}</h3>
                    <span className={`status-badge statues-${request.status.toLowerCase()}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="request-details">
                    <div className="detail-item">
                      <span className="label">Quantity:</span>
                      <span>{request.quantity}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Request Date:</span>
                      <span>{formatDate(request.request_date)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Return Date:</span>
                      <span>{formatDate(request.return_date)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No equipment requests yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button
              className="action-button"
              onClick={() => navigate("/teacher/browse-equipment")}
            >
              <span>Browse Equipment</span>
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/teacher/all-requests")}
            >
              <span>Approve Requests</span>
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/teacher/requests")}
            >
              <span>My Requests</span>
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/profile")}
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

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Reject Request</h2>
            {selectedRequest && (
              <div className="modal-info">
                <p><strong>Student:</strong> {selectedRequest.requester_name}</p>
                <p><strong>Equipment:</strong> {selectedRequest.equipment_name}</p>
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
    </div>
  );
};

export default TeacherDashboard;