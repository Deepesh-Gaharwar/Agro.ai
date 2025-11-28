import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, User, LogOut, Camera, History, BarChart3 } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Agro.ai
            </span>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-2 bg-gray-50/40 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-100 shadow-inner">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/dashboard')
                    ? 'bg-green-100 text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/detection"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/detection')
                    ? 'bg-green-100 text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <Camera className="h-4 w-4" />
                <span>Detection</span>
              </Link>

              <Link
                to="/history"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive('/history')
                    ? 'bg-green-100 text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-all font-medium"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:block">{user?.username}</span>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-500 font-medium hover:bg-red-100 hover:text-red-600 transition-all shadow-sm cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isAuthenticated && (
        <div className="md:hidden border-t border-gray-200 bg-white/80 backdrop-blur-md">
          <div className="flex justify-around py-2">
            <Link
              to="/dashboard"
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive('/dashboard') ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/detection"
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive('/detection') ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <Camera className="h-5 w-5" />
              <span>Detection</span>
            </Link>
            <Link
              to="/history"
              className={`flex flex-col items-center py-2 px-3 text-xs ${
                isActive('/history') ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              <History className="h-5 w-5" />
              <span>History</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;