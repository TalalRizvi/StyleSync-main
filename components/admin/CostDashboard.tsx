import React, { useState, useEffect } from 'react';
import { getCostStats, clearCostHistory, type CostRecord } from '../../services/costTracking';

const CostDashboard: React.FC = () => {
  const [stats, setStats] = useState(getCostStats());
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    // Refresh stats every 5 seconds
    const interval = setInterval(() => {
      setStats(getCostStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClearHistory = () => {
    if (showConfirmClear) {
      clearCostHistory();
      setStats(getCostStats());
      setShowConfirmClear(false);
    } else {
      setShowConfirmClear(true);
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Calculate projections
  const avgDailyCost = stats.cost30d / 30;
  const projections = {
    '1k': avgDailyCost * 30 * (1000 / stats.totalTryOns || 1),
    '10k': avgDailyCost * 30 * (10000 / stats.totalTryOns || 1),
    '100k': avgDailyCost * 30 * (100000 / stats.totalTryOns || 1),
    '1M': avgDailyCost * 30 * (1000000 / stats.totalTryOns || 1),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text">Cost Analytics Dashboard</h2>
        <button
          onClick={handleClearHistory}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            showConfirmClear
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showConfirmClear ? 'Confirm Clear' : 'Clear History'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Total Cost (All Time)</p>
          <p className="text-2xl font-bold text-text">{formatCurrency(stats.totalCost)}</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Total Try-Ons</p>
          <p className="text-2xl font-bold text-text">{formatNumber(stats.totalTryOns)}</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Average Cost per Try-On</p>
          <p className="text-2xl font-bold text-text">{formatCurrency(stats.avgCost)}</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Total Tokens Used</p>
          <p className="text-2xl font-bold text-text">{formatNumber(stats.totalTokens)}</p>
        </div>
      </div>

      {/* Time Period Costs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Last 24 Hours</p>
          <p className="text-2xl font-bold text-text">{formatCurrency(stats.cost24h)}</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Last 7 Days</p>
          <p className="text-2xl font-bold text-text">{formatCurrency(stats.cost7d)}</p>
        </div>
        <div className="bg-card rounded-lg p-6 border border-border">
          <p className="text-sm text-muted mb-1">Last 30 Days</p>
          <p className="text-2xl font-bold text-text">{formatCurrency(stats.cost30d)}</p>
        </div>
      </div>

      {/* Cost by Model */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-text mb-4">Cost Breakdown by Model</h3>
        <div className="space-y-3">
          {Object.entries(stats.costByModel).map(([model, data]) => (
            <div key={model} className="flex justify-between items-center">
              <div>
                <p className="font-medium text-text">{model}</p>
                <p className="text-sm text-muted">{formatNumber(data.count)} try-ons</p>
              </div>
              <p className="text-lg font-bold text-text">{formatCurrency(data.totalCost)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Projections */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-semibold text-text mb-4">Monthly Cost Projections</h3>
        <p className="text-sm text-muted mb-4">
          Based on average daily cost from last 30 days
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted mb-1">1K try-ons/month</p>
            <p className="text-xl font-bold text-text">{formatCurrency(projections['1k'])}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">10K try-ons/month</p>
            <p className="text-xl font-bold text-text">{formatCurrency(projections['10k'])}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">100K try-ons/month</p>
            <p className="text-xl font-bold text-text">{formatCurrency(projections['100k'])}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">1M try-ons/month</p>
            <p className="text-xl font-bold text-text">{formatCurrency(projections['1M'])}</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> Costs are currently stored in browser localStorage. For production, 
          implement backend storage in Cloudflare D1 database for persistent tracking across devices.
        </p>
      </div>
    </div>
  );
};

export default CostDashboard;
