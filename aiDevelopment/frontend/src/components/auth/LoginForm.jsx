import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { setToken, setUser } from '../../utils/auth';
import Input from '../common/Input';
import Button from '../common/Button';
import './LoginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      
      if (response.data.success) {
        const { user, token } = response.data.data;
        
        // Save token and user to localStorage
        setToken(token);
        setUser(user);

        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="form-title">Login</h2>
        
        {errorMessage && (
          <div className="alert alert-error">
            {errorMessage}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="your.email@school.edu"
          required
          error={errors.email}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
          error={errors.password}
        />

        <Button 
          type="submit" 
          fullWidth 
          loading={loading}
          disabled={loading}
        >
          Login
        </Button>

        <p className="form-note">
          Note: Contact admin to create your account
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
