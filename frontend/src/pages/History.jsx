import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { detectionService } from '../services/detectionService';
import { Calendar, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page) => {
    try {
      setLoading(true);
      const response = await detectionService.getDetectionHistory(page, 10);
      setHistory(response.history);
      setTotalPages(response.pages);
      setTotal(response.total);
    } catch (error) {
      addToast(error.message || 'Failed to fetch history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'severity-low';
      case 'medium':
        return 'severity-medium';
      case 'high':
        return 'severity-high';
      default:
        return 'healthy';
    }
  };

  const HistoryCard = ({ detection }) => (
    <div className="bg-white rounded-lg shadow-md p-6 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {detection.disease_detected ? (
            <AlertTriangle className="h-8 w-8 text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {detection.disease_detected ? 'Disease Detected' : 'Healthy Plant'}
            </h3>
            <p className="text-sm text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(detection.timestamp)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">Confidence</p>
          <p className="text-lg font-semibold text-gray-900">
            {(detection.confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {detection.disease_detected && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Disease Type</p>
              <p className="text-gray-900 capitalize">
                {detection.disease_type?.replace(/_/g, ' ') || 'Unknown'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Severity</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(detection.severity_level)}`}>
                {detection.severity_level || 'Unknown'}
              </span>
            </div>
          </div>

          {detection.treatment_recommendation && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 mb-1">Treatment Recommendation</p>
              <p className="text-sm text-blue-800">{detection.treatment_recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const Pagination = () => (
    <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow-md">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * 10, total)}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              const isCurrentPage = page === currentPage;
              
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    isCurrentPage
                      ? 'z-10 bg-green-50 border-green-500 text-green-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Detection History</h1>
        <p className="text-gray-600">
          Review your previous plant disease detections
        </p>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{total}</p>
            <p className="text-gray-600">Total Scans</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {history.filter(h => !h.disease_detected).length}
            </p>
            <p className="text-gray-600">Healthy Plants</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {history.filter(h => h.disease_detected).length}
            </p>
            <p className="text-gray-600">Diseased Plants</p>
          </div>
        </div>
      </div>

      {/* History List */}
      {history.length > 0 ? (
        <div className="space-y-4">
          {history.map((detection) => (
            <HistoryCard key={detection.id} detection={detection} />
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && <Pagination />}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No detection history</h3>
          <p className="text-gray-600 mb-4">
            You haven't performed any disease detections yet.
          </p>
          <a
            href="/detection"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Start Your First Detection
          </a>
        </div>
      )}
    </div>
  );
};

export default History;