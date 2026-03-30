import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings as SettingsIcon, Server, Key, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';
import { settingsFormSchema, connectionTestSchema, validateField } from '../utils/validation';

const Settings = () => {
  const { checkConnection, connectionStatus, loading } = useApi();
  const [testResult, setTestResult] = useState(null);
  const [connectionTestData, setConnectionTestData] = useState({
    tallyUrl: 'localhost:9000'
  });
  const [connectionTestErrors, setConnectionTestErrors] = useState({});

  // API Settings form
  const {
    register: registerApi,
    handleSubmit: handleApiSubmit,
    formState: { errors: apiErrors },
    reset: resetApiForm
  } = useForm({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
      apiKey: 'dev-key-local-only',
      timeout: 10000
    }
  });

  // Connection test form
  const {
    register: registerConnection,
    handleSubmit: handleConnectionSubmit,
    formState: { errors: connectionFormErrors },
    watch: watchConnection
  } = useForm({
    resolver: zodResolver(connectionTestSchema),
    defaultValues: {
      tallyUrl: 'localhost:9000'
    }
  });

  const watchedConnectionData = watchConnection();

  const handleTestConnection = async (data) => {
    setTestResult(null);
    setConnectionTestErrors({});
    
    try {
      // Test the connection with the provided data
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTestResult({ success: true, message: result.message || 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: result.message || 'Connection failed' });
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    }
  };

  const handleApiSettingsSave = (data) => {
    // Here you would typically save the settings to localStorage or backend
    console.log('Saving API settings:', data);
    // For now, just show a success message
    setTestResult({ success: true, message: 'API settings saved successfully!' });
  };

  const handleConnectionFieldChange = (fieldName, value) => {
    setConnectionTestData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Real-time validation
    const validation = validateField(connectionTestSchema, fieldName, value);
    setConnectionTestErrors(prev => ({
      ...prev,
      [fieldName]: validation.success ? null : validation.error
    }));
  };

  const getErrorMessage = (error) => {
    return error?.message || 'Invalid input';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your Tally integration settings</p>
      </div>

      {/* Connection Status */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2" />
          Connection Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {connectionStatus === 'connected' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  Status: {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-gray-600">
                  {connectionStatus === 'connected' 
                    ? 'Successfully connected to Tally API' 
                    : 'Unable to connect to Tally API'}
                </p>
              </div>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={loading}
              className="btn btn-secondary flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`flex items-center space-x-2 ${
                testResult.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Key className="h-5 w-5 mr-2" />
          API Configuration
        </h2>
        <form onSubmit={handleApiSubmit(handleApiSettingsSave)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Base URL
            </label>
            <input
              type="text"
              {...registerApi('baseUrl')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                apiErrors.baseUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="http://localhost:3000/api/v1"
            />
            {apiErrors.baseUrl && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(apiErrors.baseUrl)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Base URL for the Tally API endpoints
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              {...registerApi('apiKey')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                apiErrors.apiKey ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Your API key"
            />
            {apiErrors.apiKey && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(apiErrors.apiKey)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Authentication key for API access
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Timeout (ms)
            </label>
            <input
              type="number"
              {...registerApi('timeout')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                apiErrors.timeout ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="10000"
            />
            {apiErrors.timeout && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(apiErrors.timeout)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Maximum time to wait for API responses (in milliseconds)
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Tally Connection Test */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Tally Connection</h2>
        <form onSubmit={handleConnectionSubmit(handleTestConnection)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tally URL
            </label>
            <input
              type="text"
              {...registerConnection('tallyUrl')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                connectionFormErrors.tallyUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="localhost:9000"
            />
            {connectionFormErrors.tallyUrl && (
              <p className="text-red-500 text-sm mt-1">{getErrorMessage(connectionFormErrors.tallyUrl)}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Tally server URL in format host:port
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-secondary flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>
        </form>
      </div>

      {/* Tally Configuration */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tally Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tally Host
              </label>
              <input
                type="text"
                defaultValue="localhost"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Tally server hostname or IP address
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tally Port
              </label>
              <input
                type="text"
                defaultValue="9000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Tally server port number
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Configuration Note
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Tally configuration settings are managed through environment variables 
                  in the backend. Contact your administrator to modify these settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Info */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <SettingsIcon className="h-5 w-5 mr-2" />
          Application Information
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Application Name</span>
            <span className="text-sm text-gray-900">Tally Integration Dashboard</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Version</span>
            <span className="text-sm text-gray-900">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Frontend Framework</span>
            <span className="text-sm text-gray-900">React 18</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Backend API</span>
            <span className="text-sm text-gray-900">Node.js + Fastify</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
