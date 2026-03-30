import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, RefreshCw, BookOpen, Eye } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';
import { ledgerSearchSchema } from '../utils/validation';

const Ledgers = () => {
  const { getLedgers, loading, error } = useApi();
  const [ledgers, setLedgers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLedgers, setFilteredLedgers] = useState([]);

  // Form for ledger search
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
    watch: watchSearch,
    setValue: setSearchValue
  } = useForm({
    resolver: zodResolver(ledgerSearchSchema),
    defaultValues: {
      company: '',
      search: '',
      parent: '',
      bypassCache: false
    }
  });

  const watchedSearchData = watchSearch();

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        // Use form data for API call
        const response = await getLedgers(watchedSearchData);
        setLedgers(response?.data || []);
        setFilteredLedgers(response?.data || []);
      } catch (err) {
        console.error('Failed to fetch ledgers:', err);
      }
    };

    fetchLedgers();
  }, [getLedgers, watchedSearchData]);

  useEffect(() => {
    const filtered = ledgers.filter(ledger =>
      typeof ledger === 'string' 
        ? ledger.toLowerCase().includes(searchTerm.toLowerCase())
        : JSON.stringify(ledger).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLedgers(filtered);
  }, [searchTerm, ledgers]);

  const handleSearch = async (data) => {
    try {
      const response = await getLedgers(data);
      setLedgers(response?.data || []);
      setFilteredLedgers(response?.data || []);
    } catch (err) {
      console.error('Failed to search ledgers:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await getLedgers(watchedSearchData);
      setLedgers(response?.data || []);
      setFilteredLedgers(response?.data || []);
    } catch (err) {
      console.error('Failed to refresh ledgers:', err);
    }
  };

  if (loading && ledgers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ledgers</h1>
          <p className="text-gray-600 mt-2">Manage and view all account ledgers</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary flex items-center"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search and Filter Form */}
      <div className="card">
        <form onSubmit={handleSearchSubmit(handleSearch)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                {...registerSearch('company')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  searchErrors.company ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Company name"
              />
              {searchErrors.company && (
                <p className="text-red-500 text-sm mt-1">{searchErrors.company.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Term
              </label>
              <input
                type="text"
                {...registerSearch('search')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  searchErrors.search ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Search in ledger names"
              />
              {searchErrors.search && (
                <p className="text-red-500 text-sm mt-1">{searchErrors.search.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Group
              </label>
              <input
                type="text"
                {...registerSearch('parent')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  searchErrors.parent ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Parent group name"
              />
              {searchErrors.parent && (
                <p className="text-red-500 text-sm mt-1">{searchErrors.parent.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...registerSearch('bypassCache')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Bypass Cache</span>
            </label>
            
            <div className="space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                Search Ledgers
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Search Bar */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Quick search in results..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="text-red-600">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{ledgers.length}</p>
            <p className="text-sm text-gray-600">Total Ledgers</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{filteredLedgers.length}</p>
            <p className="text-sm text-gray-600">Filtered Results</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {searchTerm ? filteredLedgers.length : ledgers.length}
            </p>
            <p className="text-sm text-gray-600">Showing</p>
          </div>
        </div>
      </div>

      {/* Ledgers List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Ledger Accounts
        </h2>
        
        {filteredLedgers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>
              {searchTerm ? 'No ledgers found matching your search' : 'No ledgers available'}
            </p>
            <p className="text-sm mt-2">
              {searchTerm ? 'Try adjusting your search terms' : 'Check your Tally connection'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ledger Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLedgers.map((ledger, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ledger}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary-600 hover:text-primary-900 flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledgers;
