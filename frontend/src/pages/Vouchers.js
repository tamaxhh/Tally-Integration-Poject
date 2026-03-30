import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, RefreshCw, FileText, Calendar, DollarSign } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';
import { voucherSearchSchema, validateField } from '../utils/validation';

const Vouchers = () => {
  const { getVouchers, loading, error } = useApi();
  const [vouchers, setVouchers] = useState([]);
  const [filteredVouchers, setFilteredVouchers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Form for voucher search with date range
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
    watch: watchSearch,
    setValue: setSearchValue,
    trigger: triggerValidation
  } = useForm({
    resolver: zodResolver(voucherSearchSchema),
    defaultValues: {
      company: '',
      voucherType: '',
      fromDate: new Date().toISOString().split('T')[0], // Today's date
      toDate: new Date().toISOString().split('T')[0], // Today's date
      page: 1,
      limit: 50
    }
  });

  const watchedSearchData = watchSearch();

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        // Use form data for API call
        const response = await getVouchers(watchedSearchData);
        setVouchers(response?.data || []);
        setFilteredVouchers(response?.data || []);
      } catch (err) {
        console.error('Failed to fetch vouchers:', err);
      }
    };

    // Only fetch if we have valid date range
    if (watchedSearchData.fromDate && watchedSearchData.toDate) {
      fetchVouchers();
    }
  }, [getVouchers, watchedSearchData]);

  useEffect(() => {
    const filtered = vouchers.filter(voucher =>
      typeof voucher === 'string' 
        ? voucher.toLowerCase().includes(searchTerm.toLowerCase())
        : JSON.stringify(voucher).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVouchers(filtered);
  }, [searchTerm, vouchers]);

  const handleSearch = async (data) => {
    try {
      const response = await getVouchers(data);
      setVouchers(response?.data || []);
      setFilteredVouchers(response?.data || []);
    } catch (err) {
      console.error('Failed to search vouchers:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      const response = await getVouchers(watchedSearchData);
      setVouchers(response?.data || []);
      setFilteredVouchers(response?.data || []);
    } catch (err) {
      console.error('Failed to refresh vouchers:', err);
    }
  };

  const handleFieldChange = async (fieldName, value) => {
    setSearchValue(fieldName, value);
    // Trigger validation for the field
    await triggerValidation(fieldName);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getVoucherType = (voucher) => {
    if (typeof voucher === 'string') {
      return voucher;
    }
    return voucher?.type || voucher?.NAME || 'Unknown';
  };

  const getVoucherDate = (voucher) => {
    if (typeof voucher === 'string') {
      return 'N/A';
    }
    return voucher?.date || voucher?.DATE || formatDate(voucher?.DATE);
  };

  const getVoucherAmount = (voucher) => {
    if (typeof voucher === 'string') {
      return 'N/A';
    }
    return voucher?.amount || voucher?.AMOUNT || 'N/A';
  };

  if (loading && vouchers.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-gray-600 mt-2">View and manage all transaction vouchers</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Voucher Type
              </label>
              <select
                {...registerSearch('voucherType')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  searchErrors.voucherType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">All Types</option>
                <option value="Sales">Sales</option>
                <option value="Purchase">Purchase</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
                <option value="Contra">Contra</option>
                <option value="Journal">Journal</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
              </select>
              {searchErrors.voucherType && (
                <p className="text-red-500 text-sm mt-1">{searchErrors.voucherType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                {...registerSearch('fromDate')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  searchErrors.fromDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {searchErrors.fromDate && (
                <p className="text-red-500 text-sm mt-1">{searchErrors.fromDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                {...registerSearch('toDate')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  searchErrors.toDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {searchErrors.toDate && (
                <p className="text-red-500 text-sm mt-1">{searchErrors.toDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              Search Vouchers
            </button>
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
            <p className="text-2xl font-bold text-primary-600">{vouchers.length}</p>
            <p className="text-sm text-gray-600">Total Vouchers</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{filteredVouchers.length}</p>
            <p className="text-sm text-gray-600">Filtered Results</p>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {searchTerm ? filteredVouchers.length : vouchers.length}
            </p>
            <p className="text-sm text-gray-600">Showing</p>
          </div>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Transaction Vouchers
        </h2>
        
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>
              {searchTerm ? 'No vouchers found matching your search' : 'No vouchers available'}
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
                    Voucher Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVouchers.map((voucher, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getVoucherType(voucher)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {getVoucherDate(voucher)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {getVoucherAmount(voucher)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-primary-600 hover:text-primary-900">
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

export default Vouchers;
