import React, { useState, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';
import { detectionService } from '../services/detectionService';
import { Camera, Upload, X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

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
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear previous result
      setResult(null);
    } else {
      addToast('Please select a valid image file', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        return 'severity-low';
      case 'medium':
        return 'severity-medium';
      case 'high':
        return 'severity-high';
      default:
        return 'healthy';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Disease Detection</h1>
        <p className="text-gray-600">
          Upload an image of your plant to detect diseases using AI
        </p>
      </div>

      {/* Image Upload Area */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Plant Image</h2>
        
        {!imagePreview ? (
          <div
            className="upload-area rounded-lg p-8 text-center cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your image here or click to browse
            </h3>
            <p className="text-gray-600">
              Supports JPG, PNG, and other image formats
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Selected plant"
                className="w-full max-w-md mx-auto rounded-lg shadow-md"
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Different Image
              </button>
              
              <button
                onClick={detectDisease}
                disabled={detecting}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detecting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Detect Disease
                  </>
                )}
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Detection Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6 fade-in">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detection Results</h2>
          
          <div className="space-y-4">
            {/* Health Status */}
            <div className="flex items-center space-x-3">
              {result.disease_detected ? (
                <AlertTriangle className="h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="h-8 w-8 text-green-500" />
              )}
              <div>
                <h3 className="text-lg font-medium">
                  {result.disease_detected ? 'Disease Detected' : 'Plant is Healthy'}
                </h3>
                <p className="text-gray-600">
                  Confidence: {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Disease Information */}
            {result.disease_detected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Disease Type</h4>
                  <p className="text-gray-700 capitalize">
                    {result.disease_type?.replace(/_/g, ' ') || 'Unknown'}
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Severity Level</h4>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(result.severity_level)}`}>
                    {result.severity_level || 'Unknown'}
                  </span>
                </div>
              </div>
            )}

            {/* Treatment Recommendation */}
            {result.treatment_recommendation && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Treatment Recommendation</h4>
                <p className="text-blue-800">{result.treatment_recommendation}</p>
              </div>
            )}

            {/* Additional Tips */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">📋 Next Steps</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                {result.disease_detected ? (
                  <>
                    <li>• Follow the treatment recommendation above</li>
                    <li>• Monitor the plant closely for changes</li>
                    <li>• Consider consulting an agricultural expert</li>
                    <li>• Take preventive measures for other plants</li>
                  </>
                ) : (
                  <>
                    <li>• Continue regular plant care routine</li>
                    <li>• Monitor for any changes in plant health</li>
                    <li>• Maintain good growing conditions</li>
                    <li>• Regular inspection helps early detection</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-green-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-green-900 mb-4">📸 Photography Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-green-800 mb-2">Best Practices</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Use natural daylight for best results</li>
              <li>• Focus on the affected leaf or area</li>
              <li>• Ensure the image is clear and not blurry</li>
              <li>• Fill the frame with the plant part</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-green-800 mb-2">Avoid These</h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Dark or poorly lit images</li>
              <li>• Images taken from too far away</li>
              <li>• Blurry or out-of-focus shots</li>
              <li>• Images with multiple plant types</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detection;