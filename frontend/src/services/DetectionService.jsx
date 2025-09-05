import axios from 'axios';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class DetectionService {
  async detectDisease(imageFile) {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await axios.post(`${API_BASE_URL}/detect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Detection failed');
    }
  }

  async detectDiseaseFromBase64(imageData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/detect`, {
        image: imageData,
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Detection failed');
    }
  }

  async getDetectionHistory(page = 1, perPage = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/history`, {
        params: {
          page,
          per_page: perPage,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch history');
    }
  }

  async getUserStats() {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch stats');
    }
  }
}

export const detectionService = new DetectionService();