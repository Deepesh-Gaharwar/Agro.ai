import React, { useEffect, useState } from "react";
import { useToast } from "../contexts/useToast";
import { 
  User, 
  Mail, 
  Calendar, 
  Settings, 
  Bell, 
  History, 
  BarChart3, 
  Edit2, 
  Save, 
  X, 
  Trash2,
  Leaf,
  Shield,
  AlertTriangle,
  Sprout,
  Activity
} from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    notifications: true,
    history: true,
    analytics: true,
  });
  const [createdAt, setCreatedAt] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const settingLabels = {
    notifications: "Email Notifications",
    history: "Detection History", 
    analytics: "Data Analytics",
  };

  const settingDescriptions = {
    notifications: "Receive alerts about crop health issues and system updates",
    history: "Keep a complete record of all your crop health detections",
    analytics: "Help improve our AI model with your anonymized data",
  };

  const settingIcons = {
    notifications: Bell,
    history: History,
    analytics: BarChart3,
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data);
      setFormData({ username: data.username, email: data.email });
      setSettings(data.settings);
      setCreatedAt(new Date(data.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    } catch (err) {
      addToast({
        id: Date.now(),
        message: err.message || "Failed to load profile",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const data = await res.json();
      
      // Update user state immediately with the new data
      setUser(data);
      setEditMode(false);
      
      addToast({
        id: Date.now(),
        message: "Profile updated successfully!",
        type: "success"
      });
    } catch (err) {
      // Reset form data to original values if update fails
      setFormData({ username: user.username, email: user.email });
      addToast({
        id: Date.now(),
        message: err.message || "Failed to update profile",
        type: "error"
      });
    }
  };

  const handleSettingChange = async (key) => {
    const newValue = !settings[key];
    
    // Update UI immediately for better UX
    setSettings(prev => ({ ...prev, [key]: newValue }));
    
    try {
      const res = await fetch("/api/profile/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ [key]: newValue }),
      });
      
      if (!res.ok) {
        // Revert the change if API call fails
        setSettings(prev => ({ ...prev, [key]: !newValue }));
        throw new Error("Failed to update settings");
      }
      
      const data = await res.json();
      // Ensure we have the latest settings from server
      setSettings(data.settings);

      addToast({
        id: Date.now(),
        message: `${settingLabels[key]} ${newValue ? "enabled" : "disabled"}`,
        type: "success"
      });
    } catch (err) {
      addToast({
        id: Date.now(),
        message: err.message || "Failed to update settings",
        type: "error"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and you'll lose all your crop health data.")) {
      return;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete account");
      
      addToast({
        id: Date.now(),
        message: "Account deleted successfully",
        type: "success"
      });
      
      localStorage.removeItem("token");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      addToast({
        id: Date.now(),
        message: err.message || "Failed to delete account",
        type: "error"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load your profile information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-lg shadow-sm mb-4">
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-800">CropHealth AI Profile</h1>
          </div>
          <p className="text-gray-600">Manage your agricultural intelligence settings</p>
        </div>

        {/* Profile Information Card */}
        <div className="bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                <p className="text-gray-600 text-sm">Your CropHealthAI account details</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {editMode ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      placeholder="Enter your username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({ username: user.username, email: user.email });
                    }}
                    className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <User className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Username</p>
                      <p className="text-lg font-semibold text-gray-800">{user.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-lg font-semibold text-gray-800">{user.email}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-lg font-semibold text-gray-800">{createdAt}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors mt-4"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings Card */}
        <div className="bg-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Account Settings</h2>
                <p className="text-gray-600 text-sm">Customize your CropHealthAI experience</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {Object.keys(settings).map((key) => {
              const IconComponent = settingIcons[key];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      key === 'notifications' ? 'bg-yellow-100 text-yellow-600' :
                      key === 'history' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{settingLabels[key]}</h3>
                      <p className="text-sm text-gray-600">{settingDescriptions[key]}</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={() => handleSettingChange(key)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                      settings[key] 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        settings[key] ? 'translate-x-6 mt-0.5 ml-0.5' : 'translate-x-0.5 mt-0.5'
                      }`}/>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-green-600 text-white shadow-md rounded-lg">
          <div className="px-6 py-4 border-b border-green-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Your CropHealthAI Impact</h2>
                <p className="text-green-100 text-sm">See how you're improving agriculture</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Sprout className="w-10 h-10 mx-auto mb-2 text-green-200" />
                <div className="text-2xl font-bold mb-1">127</div>
                <div className="text-green-100 text-sm">Crops Analyzed</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <Shield className="w-10 h-10 mx-auto mb-2 text-green-200" />
                <div className="text-2xl font-bold mb-1">94%</div>
                <div className="text-green-100 text-sm">Health Accuracy</div>
              </div>
              <div className="text-center p-4 bg-white/10 rounded-lg">
                <User className="w-10 h-10 mx-auto mb-2 text-green-200" />
                <div className="text-2xl font-bold mb-1">23</div>
                <div className="text-green-100 text-sm">Issues Prevented</div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white shadow-md rounded-lg border-2 border-red-200">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
                <p className="text-red-700 text-sm">Irreversible actions for your account</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">Delete Account</h3>
              <p className="text-red-700 mb-4 text-sm">
                Once you delete your account, there's no going back. All your crop health data, 
                detection history, and settings will be permanently removed.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}