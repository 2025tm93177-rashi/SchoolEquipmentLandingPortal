const express = require('express');
const router = express.Router();
const { db, dbRun, dbGet, dbAll } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get pending requests with pagination (Teachers and Admins)
router.get('/pending', authenticateToken, authorizeRoles(['teacher', 'admin']), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const offset = (page - 1) * limit;

  // Count total pending requests
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM borrow_requests 
    WHERE status = 'pending'
  `;

  db.get(countQuery, [], (err, countResult) => {
    if (err) {
      return res.status(500).json({ message: 'Error counting requests', error: err.message });
    }

    const totalRequests = countResult.total;
    const totalPages = Math.ceil(totalRequests / limit);

    // Get paginated requests with user and equipment details
    const query = `
      SELECT 
        br.id,
        br.user_id,
        br.equipment_id,
        br.requested_date,
        br.expected_return_date,
        br.purpose,
        br.status,
        br.created_at,
        u.name as student_name,
        u.email as student_email,
        e.name as equipment_name,
        e.category as equipment_category,
        e.quantity as equipment_quantity
      FROM borrow_requests br
      JOIN users u ON br.user_id = u.id
      JOIN equipment e ON br.equipment_id = e.id
      WHERE br.status = 'pending'
      ORDER BY br.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(query, [limit, offset], (err, requests) => {
      if (err) {
        return res.status(500).json({ message: 'Error fetching requests', error: err.message });
      }

      res.json({
        requests,
        pagination: {
          currentPage: page,
          totalPages,
          totalRequests,
          requestsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    });
  });
});

// Create a new equipment request (Students & Teachers)
router.post('/', authenticateToken, authorizeRoles(['Student', 'Teacher']), async (req, res) => {
  try {
    const { equipment_id, quantity, required_date, return_date, purpose } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!equipment_id || !quantity || !required_date || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Equipment, quantity, required date, and purpose are required'
      });
    }

    // Check if equipment exists and has sufficient quantity
    const equipment = await dbGet(
      'SELECT id, name, available_quantity FROM equipment WHERE id = ?',
      [equipment_id]
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    if (equipment.available_quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Only ${equipment.available_quantity} available`
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0'
      });
    }

    // Check for duplicate pending request
    const existingRequest = await dbGet(
      `SELECT id FROM equipment_requests 
       WHERE user_id = ? AND equipment_id = ? AND status = 'Pending'`,
      [user_id, equipment_id]
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this equipment'
      });
    }

    // Create the request
    await dbRun(
      `INSERT INTO equipment_requests 
       (user_id, equipment_id, quantity, required_date, return_date, purpose, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [user_id, equipment_id, quantity, required_date, return_date || null, purpose]
    );

    res.status(201).json({
      success: true,
      message: 'Equipment request submitted successfully'
    });

  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create request'
    });
  }
});

// Get user's own requests (Students & Teachers)
router.get('/my-requests', authenticateToken, authorizeRoles(['Student', 'Teacher']), async (req, res) => {
  try {
    const user_id = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        er.id,
        er.quantity,
        er.request_date,
        er.required_date,
        er.return_date,
        er.purpose,
        er.status,
        er.denial_reason,
        er.notes,
        er.approved_date,
        e.name as equipment_name,
        e.category as equipment_category,
        e.condition as equipment_condition,
        u.full_name as approved_by_name
      FROM equipment_requests er
      JOIN equipment e ON er.equipment_id = e.id
      LEFT JOIN users u ON er.approved_by = u.id
      WHERE er.user_id = ?
    `;

    const params = [user_id];

    if (status) {
      query += ' AND er.status = ?';
      params.push(status);
    }

    query += ' ORDER BY er.request_date DESC';

    const requests = await dbAll(query, params);

    res.json({
      success: true,
      data: requests || []
    });

  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// Get all requests (Teachers & Admins)
router.get('/all', authenticateToken, authorizeRoles(['Teacher', 'Admin']), async (req, res) => {
  try {
    const { status, user_id, equipment_id } = req.query;

    let query = `
      SELECT 
        er.id,
        er.user_id,
        er.equipment_id,
        er.quantity,
        er.request_date,
        er.required_date,
        er.return_date,
        er.purpose,
        er.status,
        er.denial_reason,
        er.notes,
        er.approved_date,
        u.full_name as requester_name,
        u.email as requester_email,
        u.role as requester_role,
        e.name as equipment_name,
        e.category as equipment_category,
        e.available_quantity as equipment_available,
        approver.full_name as approved_by_name
      FROM equipment_requests er
      JOIN users u ON er.user_id = u.id
      JOIN equipment e ON er.equipment_id = e.id
      LEFT JOIN users approver ON er.approved_by = approver.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND er.status = ?';
      params.push(status);
    }

    if (user_id) {
      query += ' AND er.user_id = ?';
      params.push(user_id);
    }

    if (equipment_id) {
      query += ' AND er.equipment_id = ?';
      params.push(equipment_id);
    }

    query += ' ORDER BY er.request_date DESC';

    const requests = await dbAll(query, params);

    res.json({
      success: true,
      data: requests || []
    });

  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// Approve request (Teachers & Admins)
router.put('/:id/approve', authenticateToken, authorizeRoles(['Teacher', 'Admin']), async (req, res) => {
  try {
    const request_id = req.params.id;
    const { notes } = req.body;
    const approver_id = req.user.id;

    // Get request details
    const request = await dbGet(
      `SELECT er.*, e.available_quantity 
       FROM equipment_requests er
       JOIN equipment e ON er.equipment_id = e.id
       WHERE er.id = ?`,
      [request_id]
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Check if sufficient quantity available
    if (request.available_quantity < request.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient equipment quantity available'
      });
    }

    // Update request status
    await dbRun(
      `UPDATE equipment_requests 
       SET status = 'Approved', 
           approved_by = ?, 
           approved_date = datetime('now'),
           notes = ?
       WHERE id = ?`,
      [approver_id, notes || null, request_id]
    );

    // Update equipment available quantity
    await dbRun(
      'UPDATE equipment SET available_quantity = available_quantity - ? WHERE id = ?',
      [request.quantity, request.equipment_id]
    );

    res.json({
      success: true,
      message: 'Request approved successfully'
    });

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve request'
    });
  }
});

// Deny request (Teachers & Admins)
router.put('/:id/deny', authenticateToken, authorizeRoles(['Teacher', 'Admin']), async (req, res) => {
  try {
    const request_id = req.params.id;
    const { denial_reason } = req.body;
    const approver_id = req.user.id;

    if (!denial_reason) {
      return res.status(400).json({
        success: false,
        message: 'Denial reason is required'
      });
    }

    // Get request details
    const request = await dbGet(
      'SELECT status FROM equipment_requests WHERE id = ?',
      [request_id]
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`
      });
    }

    // Update request status
    await dbRun(
      `UPDATE equipment_requests 
       SET status = 'Denied', 
           approved_by = ?, 
           approved_date = datetime('now'),
           denial_reason = ?
       WHERE id = ?`,
      [approver_id, denial_reason, request_id]
    );

    res.json({
      success: true,
      message: 'Request denied successfully'
    });

  } catch (error) {
    console.error('Error denying request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deny request'
    });
  }
});

// Cancel request (Request owner only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const request_id = req.params.id;
    const user_id = req.user.id;

    // Get request details
    const request = await dbGet(
      'SELECT user_id, status FROM equipment_requests WHERE id = ?',
      [request_id]
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Check ownership
    if (request.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own requests'
      });
    }

    // Only pending requests can be cancelled
    if (request.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending requests can be cancelled'
      });
    }

    // Delete the request
    await dbRun('DELETE FROM equipment_requests WHERE id = ?', [request_id]);

    res.json({
      success: true,
      message: 'Request cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel request'
    });
  }
});

// Get request statistics (Teachers & Admins)
router.get('/statistics', authenticateToken, authorizeRoles(['Teacher', 'Admin']), async (req, res) => {
  try {
    const stats = await dbGet(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Denied' THEN 1 ELSE 0 END) as denied,
        SUM(CASE WHEN status = 'Returned' THEN 1 ELSE 0 END) as returned
      FROM equipment_requests
    `);

    res.json({
      success: true,
      data: stats || { total_requests: 0, pending: 0, approved: 0, denied: 0, returned: 0 }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;