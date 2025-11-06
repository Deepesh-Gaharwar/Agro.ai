import React, { useState, useRef } from 'react';
import { useToast } from '../contexts/useToast';
import { detectionService } from '../services/detectionService';
import { Camera, Upload, X, AlertTriangle, CheckCircle, Loader, Leaf, Activity, ClipboardList, Lightbulb } from 'lucide-react';

const Detection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
    } else {
      addToast('Please select a valid image file', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleImageSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const detectDisease = async () => {
    if (!selectedImage) {
      addToast('Please select an image first', 'error');
      return;
    }

    setDetecting(true);
    try {
      const detectionResult = await detectionService.detectDisease(selectedImage);
      setResult(detectionResult);

      if (detectionResult.disease_detected) {
        addToast('Disease detected! Check the results below.', 'warning');
      } else {
        addToast('Great! No disease detected in this plant.', 'success');
      }
    } catch (error) {
      addToast(error.message || 'Detection failed', 'error');
    } finally {
      setDetecting(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'high':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const parseMarkdown = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n(\d+\.)/g, '</p><p class="mb-2 ml-4">$1')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Disease Detection</h1>
          <p className="text-lg text-gray-600">Upload an image of your plant to detect diseases using AI</p>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Plant Image</h2>
          </div>

          {!imagePreview ? (
            <div
              className="border-3 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-green-400 hover:bg-green-50/50"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your image here</h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <p className="text-sm text-gray-500">Supports JPG, PNG, and other image formats</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative inline-block w-full">
                <img 
                  src={imagePreview} 
                  alt="Selected plant" 
                  className="w-full max-w-2xl mx-auto rounded-2xl shadow-md border border-gray-200" 
                />
                <button
                  onClick={clearImage}
                  className="absolute top-4 right-4 bg-red-500 text-white rounded-xl p-2 hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium shadow-md"
                >
                  <Upload className="h-5 w-5 mr-2" /> Choose Different Image
                </button>

                <button
                  onClick={detectDisease}
                  disabled={detecting}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md"
                >
                  {detecting ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Activity className="h-5 w-5 mr-2" /> Detect Disease
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detection Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${result.disease_detected ? 'bg-red-100' : 'bg-green-100'}`}>
                {result.disease_detected ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Detection Results</h2>
            </div>

            <div className="space-y-6">
              {/* Detection Summary Card */}
              <div className={`rounded-xl p-6 border-2 ${result.disease_detected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-start gap-4">
                  {result.disease_detected ? (
                    <AlertTriangle className="h-12 w-12 text-red-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-2 ${result.disease_detected ? 'text-red-900' : 'text-green-900'}`}>
                      {result.disease_detected ? 'Disease Detected' : 'Plant is Healthy'}
                    </h3>
                    <p className={`text-lg ${result.disease_detected ? 'text-red-700' : 'text-green-700'}`}>
                      Confidence Level: <span className="font-semibold">{(result.confidence * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Disease Info Grid */}
              {result.disease_detected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">Disease Type</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {result.disease_type?.replace(/_/g, ' ') || 'Unknown'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3 uppercase tracking-wide">Severity Level</h4>
                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold border-2 ${getSeverityColor(result.severity_level)}`}>
                      {result.severity_level || 'Unknown'}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Treatment Recommendation */}
              {result.ai_explanation && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-blue-900">Treatment Recommendation</h4>
                  </div>
                  <div
                    className="text-blue-900 leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{ __html: `<p class="mb-3">${parseMarkdown(result.ai_explanation)}</p>` }}
                  />
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-amber-900">Next Steps</h4>
                </div>
                <ul className="space-y-2">
                  {result.disease_detected ? (
                    <>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Follow the treatment recommendation above</span>
                      </li>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Monitor the plant closely for changes</span>
                      </li>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Consult an agricultural expert if needed</span>
                      </li>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Take preventive measures for other plants</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Continue regular plant care routine</span>
                      </li>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Monitor for any changes in plant health</span>
                      </li>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Maintain good growing conditions</span>
                      </li>
                      <li className="flex items-start gap-3 text-amber-900">
                        <span className="text-amber-600 font-bold text-lg">•</span>
                        <span>Regular inspection helps early detection</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Detection;
