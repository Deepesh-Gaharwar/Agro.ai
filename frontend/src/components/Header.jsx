import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">CropHealth AI</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-green-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-green-600 transition-colors">How it Works</a>
            <a href="#testimonials" className="text-gray-600 hover:text-green-600 transition-colors">Reviews</a>
            <a href="#pricing" className="text-gray-600 hover:text-green-600 transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-green-600 transition-colors">Sign In</button>
            <button className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105">
              <Link to="/login">
                   Get Started
              </Link>
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Header;