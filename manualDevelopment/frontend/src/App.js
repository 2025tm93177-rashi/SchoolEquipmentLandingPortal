import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageUsers from './pages/ManageUsers';
import ManageEquipment from './pages/ManageEquipment';
import ProfilePage from './pages/ProfilePage';
import BrowseEquipment from './pages/BrowseEquipment';
import ViewRequest from './pages/ViewRequestsPage';
import PendingRequests from './pages/PendingRequests';
import PlaceholderPage from './components/common/PlaceholderPage';
import { isAuthenticated, getUserRole } from './utils/auth';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  const userRole = getUserRole();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Role Router */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ManageUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/equipment" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <ManageEquipment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/all-requests" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <PendingRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <PlaceholderPage 
                  title="Reports & Analytics" 
                  description="View system reports and analytics"
                  backPath="/admin/dashboard"
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/activity" 
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <PlaceholderPage 
                  title="Activity Log" 
                  description="View all system activity"
                  backPath="/admin/dashboard"
                />
              </ProtectedRoute>
            } 
          />

          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/browse-equipment" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <BrowseEquipment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/requests" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                {/*<PlaceholderPage 
                  title="My Requests" 
                  description="View and manage your equipment requests"
                  backPath="/student/dashboard"
                /> */}
                <ViewRequest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/request/:id" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <PlaceholderPage 
                  title="Request Details" 
                  description="View request details"
                  backPath="/student/requests"
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/equipment/:id" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <PlaceholderPage 
                  title="Equipment Details" 
                  description="View equipment details and request"
                  backPath="/student/browse-equipment"
                />
              </ProtectedRoute>
            } 
          />

          {/* Teacher Routes */}
          <Route 
            path="/teacher/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/browse-equipment" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <BrowseEquipment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/requests" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                {/*<PlaceholderPage 
                  title="My Requests" 
                  description="View and manage your equipment requests"
                  backPath="/teacher/dashboard"
                /> */}
                <ViewRequest />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/all-requests" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <PendingRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/request/:id" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <PlaceholderPage 
                  title="Request Details" 
                  description="View request details"
                  backPath="/teacher/requests"
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/approval/:id" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <PlaceholderPage 
                  title="Approval Details" 
                  description="Review and approve/decline this request"
                  backPath="/teacher/all-requests"
                />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/equipment/:id" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <PlaceholderPage 
                  title="Equipment Details" 
                  description="View equipment details and request"
                  backPath="/teacher/browse-equipment"
                />
              </ProtectedRoute>
            } 
          />

          {/* Common Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route - Redirect to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* 404 Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
