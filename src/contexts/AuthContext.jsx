import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Create API instance
  const createApiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      credentials: 'include', // Important for cookies
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
      const data = await response.json();

      // Handle token refresh if needed
      if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
        const refreshSuccess = await handleTokenRefresh();
        if (refreshSuccess) {
          // Retry original request with new token
          const newToken = localStorage.getItem('authToken');
          defaultOptions.headers.Authorization = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, defaultOptions);
          return await retryResponse.json();
        } else {
          // Refresh failed, logout user
          logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  // Handle token refresh
  const handleTokenRefresh = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('authToken', data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');

      if (token && userData) {
        try {
          setIsLoading(true);
          // Verify token is still valid by fetching user profile
          const response = await createApiRequest('/auth/me');
          
          if (response.success) {
            setUser(response.user);
            setIsAuthenticated(true);
            // Update stored user data
            localStorage.setItem('userData', JSON.stringify(response.user));
          } else {
            // Token invalid, clear storage
            logout();
          }
        } catch (error) {
          console.error('Auth check error:', error);
          logout();
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Attempting login for:', credentials.email);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for refresh token cookie
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      console.log('📥 Login response:', data);

      if (response.ok && data.success) {
        setUser(data.user);
        setIsAuthenticated(true);
        setError(null);
        
        // Store tokens and user data
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        toast.success(`Welcome back, ${data.user.name}!`);
        return { success: true };
      } else {
        const errorMessage = data.message || 'Login failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage = err.message || 'Network error. Please check your connection.';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Attempting registration for:', userData.email);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for refresh token cookie
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('📥 Registration response:', data);

      if (response.ok && data.success) {
        // Registration successful, user is automatically logged in
        setUser(data.user);
        setIsAuthenticated(true);
        setError(null);
        
        // Store tokens and user data
        localStorage.setItem('authToken', data.accessToken);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        toast.success('Registration successful! Welcome to Import AI.');
        return { success: true, message: 'Registration successful', autoLogin: true };
      } else {
        const errorMessage = data.message || 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      const errorMessage = err.message || 'Network error. Please check your connection.';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to clear refresh token
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      toast.success('Logged out successfully');
    }
  };

  // Helper function to update user profile
  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);
      const data = await createApiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      if (data.success) {
        setUser(data.user);
        localStorage.setItem('userData', JSON.stringify(data.user));
        toast.success('Profile updated successfully');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to change password
  const changePassword = async (passwordData) => {
    try {
      setIsLoading(true);
      const data = await createApiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });

      if (data.success) {
        toast.success('Password changed successfully');
        return { success: true };
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to change password';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper properties
  const isAdmin = user?.role === 'Admin';
  const isReader = user?.role === 'Reader';

  // API instance for components to use
  const api = {
    get: (endpoint) => createApiRequest(endpoint, { method: 'GET' }),
    post: (endpoint, data) => createApiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    put: (endpoint, data) => createApiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (endpoint) => createApiRequest(endpoint, { method: 'DELETE' }),
  };

  const value = {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,
    
    // Helper booleans
    isAdmin,
    isReader,
    
    // Methods
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    
    // API instance for other components
    api,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};