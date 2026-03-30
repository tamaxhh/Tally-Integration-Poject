import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useApi } from '../contexts/ApiContext';

const Dashboard = () => {
  const { getLedgers, getVouchers, connectionStatus, loading, error } = useApi();
  const [stats, setStats] = useState({
    totalLedgers: 0,
    totalVouchers: 0,
    connectionStatus: 'disconnected'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ledgersResponse, vouchersResponse] = await Promise.all([
          getLedgers(),
          getVouchers()
        ]);

        setStats({
          totalLedgers: ledgersResponse?.data?.length || 0,
          totalVouchers: vouchersResponse?.data?.length || 0,
          connectionStatus: connectionStatus
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };

    if (connectionStatus === 'connected') {
      fetchDashboardData();
    }
  }, [connectionStatus, getLedgers, getVouchers]);

  const statCards = [
    {
      title: 'Total Ledgers',
      value: stats.totalLedgers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      trend: null
    },
    {
      title: 'Total Vouchers',
      value: stats.totalVouchers,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      trend: null
    },
    {
      title: 'Connection Status',
      value: connectionStatus === 'connected' ? 'Connected' : 'Disconnected',
      icon: connectionStatus === 'connected' ? CheckCircle : AlertCircle,
      color: connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600',
      bgColor: connectionStatus === 'connected' ? 'bg-green-100' : 'bg-red-100',
      trend: null
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your Tally integration</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              {stat.trend && (
                <div className="mt-4 flex items-center space-x-1">
                  {stat.trend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(stat.trend)}% from last period
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="btn btn-primary">
            <FileText className="h-4 w-4 mr-2" />
            View All Ledgers
          </button>
          <button className="btn btn-secondary">
            <DollarSign className="h-4 w-4 mr-2" />
            View Vouchers
          </button>
          <button className="btn btn-secondary">
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Reports
          </button>
          <button className="btn btn-secondary">
            <Activity className="h-4 w-4 mr-2" />
            Test Connection
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No recent activity to display</p>
          <p className="text-sm mt-2">Activity will appear here as you interact with Tally</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
