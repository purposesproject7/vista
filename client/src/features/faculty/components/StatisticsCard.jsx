// src/features/faculty/components/StatisticsCard.jsx - VIT Theme
import React from 'react';

const StatisticsCard = ({ active, deadlinePassed, past }) => {
  const totalActive = active?.length || 0;
  const totalExpired = deadlinePassed?.length || 0;
  const totalCompleted = past?.length || 0;

  const stats = [
    { label: 'Active Reviews', value: totalActive, color: 'text-blue-700', bg: 'bg-gradient-to-br from-blue-50 to-blue-100', border: 'border-blue-300', icon: '📝' },
    { label: 'Pending (Expired)', value: totalExpired, color: 'text-orange-700', bg: 'bg-gradient-to-br from-orange-50 to-orange-100', border: 'border-orange-300', icon: '⏰' },
    { label: 'Completed', value: totalCompleted, color: 'text-green-700', bg: 'bg-gradient-to-br from-green-50 to-green-100', border: 'border-green-300', icon: '✅' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={`${stat.bg} border-2 ${stat.border} rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <div className="text-5xl opacity-50">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCard;
