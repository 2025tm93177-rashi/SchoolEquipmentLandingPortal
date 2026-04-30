/**
 * Save authentication token to localStorage
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Get authentication token from localStorage
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Remove authentication token from localStorage
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Save user data to localStorage
 */
export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Get user data from localStorage
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Remove user data from localStorage
 */
export const removeUser = () => {
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Logout user (clear all auth data)
 */
export const logout = () => {
  removeToken();
  removeUser();
};

/**
 * Get user role
 */
export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};

/**
 * Check if user is admin
 */
export const isAdmin = () => {
  return getUserRole() === 'Admin';
};

/**
 * Check if user is student
 */
export const isStudent = () => {
  return getUserRole() === 'Student';
};

/**
 * Check if user is teacher
 */
export const isTeacher = () => {
  return getUserRole() === 'Teacher';
};
