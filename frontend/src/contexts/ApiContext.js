import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'dev-key-local-only'
    },
    // Important: Allow credentials for CORS
    withCredentials: false
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      setLoading(true);
      setError(null);
      return config;
    },
    (error) => {
      setLoading(false);
      setError(error.message);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      setLoading(false);
      return response;
    },
    (error) => {
      setLoading(false);
      setError(error.response?.data?.message || error.message);
      return Promise.reject(error);
    }
  );

  // API Methods
  const apiMethods = {
    // Health check - use the live endpoint at root level (not under /api/v1)
    checkConnection: async () => {
      try {
        // Use absolute URL for health check since it's at root level
        const healthApi = axios.create({
          baseURL: API_BASE_URL.replace('/api/v1', ''), // Remove /api/v1 prefix
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'dev-key-local-only'
          },
          withCredentials: false
        });
        
        const response = await healthApi.get('/live');
        setConnectionStatus('connected');
        return response.data;
      } catch (error) {
        setConnectionStatus('disconnected');
        throw error;
      }
    },

    // Ledgers
    getLedgers: async () => {
      const response = await api.get('/ledgers');
      return response.data;
    },

    // Vouchers
    getVouchers: async (params = {}) => {
      // Set default date range if not provided
      const today = new Date().toISOString().split('T')[0];
      const queryParams = {
        fromDate: params.fromDate || today,
        toDate: params.toDate || today,
        ...params
      };
      
      const response = await api.get('/vouchers', { params: queryParams });
      return response.data;
    },

    // Reports
    getTrialBalance: async (startDate, endDate) => {
      const response = await api.get('/reports/trial-balance', {
        params: { startDate, endDate }
      });
      return response.data;
    },

    getProfitLoss: async (startDate, endDate) => {
      const response = await api.get('/reports/profit-loss', {
        params: { startDate, endDate }
      });
      return response.data;
    },

    getBalanceSheet: async (startDate, endDate) => {
      const response = await api.get('/reports/balance-sheet', {
        params: { startDate, endDate }
      });
      return response.data;
    }
  };

  // Check connection on mount
  useEffect(() => {
    apiMethods.checkConnection().catch(() => {
      // Initial connection check failed
    });
  }, []);

  const value = {
    ...apiMethods,
    loading,
    error,
    connectionStatus,
    api
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};
