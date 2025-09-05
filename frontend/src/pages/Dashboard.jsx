import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/useToast';
import { detectionService } from '../services/detectionService';
import { Camera, History, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const userStats = await detectionService.getUserStats();
      setStats(userStats);
    } catch (error) {
      addToast(error.message || 'Failed to fetch statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-md p-6 card-hover">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon, to, color }) => (
    <Link to={to} className="block">
      <div className="bg-white rounded-lg shadow-md p-6 card-hover border-l-4" style={{ borderLeftColor: color }}>
        <div className="flex items-center">
          <div className={`p-3 rounded-full`} style={{ backgroundColor: `${color}20`, color: color }}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg text-white p-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-green-100 text-lg">
          Monitor your crop health with AI-powered disease detection
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Scans"
          value={stats?.total_detections || 0}
          icon={<BarChart3 className="h-6 w-6 text-white" />}
          color="bg-blue-500"
          description="Images analyzed"
        />
        
        <StatCard
          title="Healthy Plants"
          value={stats?.healthy_detections || 0}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="bg-green-500"
          description="No diseases detected"
        />
        
        <StatCard
          title="Diseased Plants"
          value={stats?.diseased_detections || 0}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          color="bg-red-500"
          description="Diseases found"
        />
        
        <StatCard
          title="Detection Rate"
          value={`${(stats?.detection_rate || 0).toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-purple-500"
          description="Disease detection rate"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuickActionCard
            title="New Detection"
            description="Upload an image to detect plant diseases"
            icon={<Camera className="h-6 w-6" />}
            to="/detection"
            color="#10b981"
          />
          
          <QuickActionCard
            title="View History"
            description="Review your previous disease detections"
            icon={<History className="h-6 w-6" />}
            to="/history"
            color="#3b82f6"
          />
        </div>
      </div>

      {/* Health Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Health Overview</h2>
        
        {stats?.total_detections > 0 ? (
          <div className="space-y-4">
            {/* Health Status Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-500"
                style={{ 
                  width: `${((stats?.healthy_detections || 0) / (stats?.total_detections || 1)) * 100}%` 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>Healthy: {stats?.healthy_detections || 0}</span>
              <span>Diseased: {stats?.diseased_detections || 0}</span>
            </div>
            
            <div className="mt-4">
              <p className="text-gray-700">
                {stats?.detection_rate > 50 
                  ? "⚠️ High disease detection rate. Consider reviewing your crop management practices."
                  : "✅ Good crop health status. Keep up the excellent care!"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scans yet</h3>
            <p className="text-gray-600 mb-4">
              Start by uploading your first plant image for disease detection
            </p>
            <Link
              to="/detection"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Detection
            </Link>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">💡 Tips for Better Detection</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-800">Image Quality</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Use good lighting conditions</li>
              <li>• Focus on affected leaf areas</li>
              <li>• Avoid blurry or dark images</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-800">Best Practices</h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Take multiple angles if unsure</li>
              <li>• Regular monitoring helps early detection</li>
              <li>• Follow treatment recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;