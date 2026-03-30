import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Download, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { useApi } from '../contexts/ApiContext';
import { reportFormSchema } from '../utils/validation';

const Reports = () => {
  const { getTrialBalance, getProfitLoss, getBalanceSheet, loading, error } = useApi();
  const [selectedReport, setSelectedReport] = useState('trial-balance');
  const [reportData, setReportData] = useState(null);

  // Form for report generation
  const {
    register: registerReport,
    handleSubmit: handleReportSubmit,
    formState: { errors: reportErrors },
    watch: watchReport,
    setValue: setReportValue
  } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      company: '',
      fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
      toDate: new Date().toISOString().split('T')[0] // Today
    }
  });

  const watchedReportData = watchReport();

  const reportTypes = [
    {
      id: 'trial-balance',
      name: 'Trial Balance',
      description: 'Summary of all ledger balances',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 'profit-loss',
      name: 'Profit & Loss',
      description: 'Income and expense statement',
      icon: TrendingDown,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      description: 'Assets, liabilities and equity',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const handleGenerateReport = async (data) => {
    try {
      let response;
      switch (selectedReport) {
        case 'trial-balance':
          response = await getTrialBalance(data.fromDate, data.toDate, data.company);
          break;
        case 'profit-loss':
          response = await getProfitLoss(data.fromDate, data.toDate, data.company);
          break;
        case 'balance-sheet':
          response = await getBalanceSheet(data.fromDate, data.toDate, data.company);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setReportData(response?.data || null);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setReportData(null);
    }
  };

  const renderReportContent = () => {
    if (!reportData) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No report data available</p>
          <p className="text-sm mt-2">Generate a report to see the results</p>
        </div>
      );
    }

    // Simple JSON view for now - can be enhanced with proper formatting
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Report Data</h3>
        <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
          {JSON.stringify(reportData, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Generate and view financial reports</p>
      </div>

      {/* Report Type Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedReport === report.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`inline-flex p-3 rounded-full ${report.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Selection */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Date Range
        </h2>
        <form onSubmit={handleReportSubmit(handleGenerateReport)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                {...registerReport('company')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  reportErrors.company ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Company name (optional)"
              />
              {reportErrors.company && (
                <p className="text-red-500 text-sm mt-1">{reportErrors.company.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                {...registerReport('fromDate')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  reportErrors.fromDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {reportErrors.fromDate && (
                <p className="text-red-500 text-sm mt-1">{reportErrors.fromDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                {...registerReport('toDate')}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  reportErrors.toDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {reportErrors.toDate && (
                <p className="text-red-500 text-sm mt-1">{reportErrors.toDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {/* Report Display */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {reportTypes.find(r => r.id === selectedReport)?.name} Report
        </h2>
        {renderReportContent()}
      </div>
    </div>
  );
};

export default Reports;
