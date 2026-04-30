import React, { useState } from 'react';
import { requestsAPI } from '../services/api';
import './RequestEquipmentModal.css';

const RequestModal = ({ equipment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    quantity: 1,
    required_date: '',
    return_date: '',
    purpose: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.quantity > equipment.available_quantity) {
      setError(`Only ${equipment.available_quantity} available`);
      setLoading(false);
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be greater than 0');
      setLoading(false);
      return;
    }

    if (!formData.required_date) {
      setError('Required date is mandatory');
      setLoading(false);
      return;
    }

    if (!formData.purpose.trim()) {
      setError('Purpose is required');
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        equipment_id: equipment.id,
        ...formData
      };

      await requestsAPI.create(requestData);
      onSuccess('Request submitted successfully!');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Equipment</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="equipment-info">
            <h3>{equipment.name}</h3>
            <p className="category">{equipment.category}</p>
            <p className="availability">
              <strong>{equipment.available_quantity}</strong> available
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="quantity">
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max={equipment.available_quantity}
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              <small>Max: {equipment.available_quantity}</small>
            </div>

            <div className="form-group">
              <label htmlFor="required_date">
                Required Date <span className="required">*</span>
              </label>
              <input
                type="date"
                id="required_date"
                name="required_date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.required_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="return_date">
                Expected Return Date (Optional)
              </label>
              <input
                type="date"
                id="return_date"
                name="return_date"
                min={formData.required_date || new Date().toISOString().split('T')[0]}
                value={formData.return_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="purpose">
                Purpose <span className="required">*</span>
              </label>
              <textarea
                id="purpose"
                name="purpose"
                rows="4"
                placeholder="Describe the purpose for requesting this equipment..."
                value={formData.purpose}
                onChange={handleChange}
                required
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestModal;