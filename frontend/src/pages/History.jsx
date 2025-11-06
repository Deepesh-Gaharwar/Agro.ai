import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Leaf, Target, Shield, Droplet, Eye, Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useToast } from "../contexts/useToast";
import { detectionService } from '../services/detectionService';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedCards, setExpandedCards] = useState(new Set());

  const { addToast } = useToast();

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page) => {
    setLoading(true);
    try {
      const response = await detectionService.getDetectionHistory(page, 10);
      setHistory(response.history || []);
      setTotalPages(response.pages || 1);
      setTotal(response.total || 0);
    } catch (error) {
      addToast(error.message || 'Failed to fetch history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'moderate':
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const parseTreatmentRecommendation = (text) => {
    if (!text) return null;

    const sections = {
      diseaseName: '',
      cause: '',
      symptoms: '',
      treatment: [],
      prevention: []
    };

    const nameMatch = text.match(/\*\*Disease Name:\*\*\s*([^\*]+)/);
    if (nameMatch) sections.diseaseName = nameMatch[1].trim();

    const causeMatch = text.match(/\*\*Cause:\*\*\s*(.*?)\s*\*\*Symptoms:/s);
    if (causeMatch) sections.cause = causeMatch[1].trim();

    const symptomsMatch = text.match(/\*\*Symptoms:\*\*\s*(.*?)\s*\*\*Cure/s);
    if (symptomsMatch) sections.symptoms = symptomsMatch[1].trim();

    const treatmentMatch = text.match(/\*\*Cure \(Treatment\):\*\*(.*?)\*\*Prevention:/s);
    if (treatmentMatch) {
      const treatmentText = treatmentMatch[1];
      const bullets = treatmentText.split('*').filter(item => item.trim() && !item.includes('**'));
      sections.treatment = bullets.map(item => item.replace(/\*\*/g, '').trim()).filter(Boolean);
    }

    const preventionMatch = text.match(/\*\*Prevention:\*\*(.*?)$/s);
    if (preventionMatch) {
      const preventionText = preventionMatch[1];
      const bullets = preventionText.split('*').filter(item => item.trim() && !item.includes('**'));
      sections.prevention = bullets.map(item => item.replace(/\*\*/g, '').trim()).filter(Boolean);
    }

    return sections;
  };

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const HistoryCard = ({ detection }) => {
    const isExpanded = expandedCards.has(detection.id || detection._id);
    const parsedData = parseTreatmentRecommendation(detection.treatment_recommendation);

    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        {/* Card Header */}
        <div className={`p-6 border-b-2 ${detection.disease_detected ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-100' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${detection.disease_detected ? 'bg-red-100' : 'bg-green-100'}`}>
                {detection.disease_detected ? (
                  <AlertTriangle className="h-7 w-7 text-red-600" />
                ) : (
                  <CheckCircle className="h-7 w-7 text-green-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-xl font-bold mb-2 ${detection.disease_detected ? 'text-red-900' : 'text-green-900'}`}>
                  {detection.disease_detected ? 'Disease Detected' : 'Healthy Plant'}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{formatDate(detection.timestamp)}</span>
                </div>
              </div>
            </div>

            <div className="text-right ml-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Confidence</p>
              <div className="flex items-center gap-2">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${detection.confidence >= 0.8 ? 'bg-green-100' : detection.confidence >= 0.6 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <Activity className={`h-6 w-6 ${detection.confidence >= 0.8 ? 'text-green-600' : detection.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(detection.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {detection.disease_detected && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-4 w-4 text-blue-600" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Disease Type</p>
                </div>
                <p className="text-base font-bold text-gray-900 capitalize">
                  {detection.disease_type?.replace(/_/g, ' ') || 'Unknown'}
                </p>
              </div>
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  {detection.severity_level?.toLowerCase() === 'high' ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  )}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Severity Level</p>
                </div>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold border-2 ${getSeverityColor(detection.severity_level)}`}>
                  {detection.severity_level || 'Unknown'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Treatment Details */}
        {detection.disease_detected && parsedData && (
          <div className="p-6 space-y-6">
            {/* Disease Name */}
            {parsedData.diseaseName && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-blue-900">Disease Information</h4>
                </div>
                <p className="text-sm text-blue-900 leading-relaxed ml-13">{parsedData.diseaseName}</p>
              </div>
            )}

            {/* Cause Section */}
            {parsedData.cause && (
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5 border border-orange-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-orange-900">Root Cause</h4>
                </div>
                <p className="text-sm text-orange-900 leading-relaxed ml-13">{parsedData.cause}</p>
              </div>
            )}

            {/* Symptoms */}
            {parsedData.symptoms && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-purple-900">Observable Symptoms</h4>
                </div>
                <p className="text-sm text-purple-900 leading-relaxed ml-13">{parsedData.symptoms}</p>
              </div>
            )}

            {/* Treatment Section */}
            {parsedData.treatment.length > 0 && (
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-teal-900">Treatment Protocol</h4>
                </div>
                <div className="ml-13 space-y-3">
                  {parsedData.treatment.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                      <span className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-teal-900 leading-relaxed flex-1">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prevention Section */}
            {parsedData.prevention.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Droplet className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-green-900">Prevention Methods</h4>
                  </div>
                  {parsedData.prevention.length > 3 && (
                    <button
                      onClick={() => toggleCard(detection.id || detection._id)}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {isExpanded ? 'Show Less' : 'Show All'}
                    </button>
                  )}
                </div>
                <div className={`ml-13 space-y-3 transition-all duration-300 ${isExpanded ? '' : 'max-h-60 overflow-hidden'}`}>
                  {parsedData.prevention.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 bg-white/50 rounded-lg p-3">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-sm text-green-900 leading-relaxed flex-1">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const Pagination = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-700">
          Showing <span className="font-bold text-green-600">{Math.min((currentPage - 1) * 10 + 1, total)}</span> to{' '}
          <span className="font-bold text-green-600">{Math.min(currentPage * 10, total)}</span> of{' '}
          <span className="font-bold text-green-600">{total}</span> results
        </p>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = i + 1;
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg border-2 font-semibold transition-all ${
                  isCurrent
                    ? 'bg-green-600 border-green-600 text-white shadow-lg scale-110'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Detection History</h1>
          <p className="text-lg text-gray-600">Review your previous plant disease detections</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{total}</p>
            <p className="text-blue-100 font-medium">Total Scans</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">
              {history.filter((h) => !h.disease_detected).length}
            </p>
            <p className="text-green-100 font-medium">Healthy Plants</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">
              {history.filter((h) => h.disease_detected).length}
            </p>
            <p className="text-red-100 font-medium">Diseased Plants</p>
          </div>
        </div>

        {/* History Cards */}
        {history.length > 0 ? (
          <div className="space-y-6">
            {history.map((detection) => (
              <HistoryCard key={detection.id || detection._id} detection={detection} />
            ))}
            {totalPages > 1 && <Pagination />}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Detection History</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't performed any disease detections yet. Start your first scan to build your history.
            </p>
            <a
              href="/detection"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg"
            >
              <Leaf className="h-5 w-5 mr-2" />
              Start Your First Detection
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;