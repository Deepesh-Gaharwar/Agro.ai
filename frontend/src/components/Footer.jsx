import React from 'react';
import { Leaf, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xl font-bold">CropHealth AI</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Revolutionizing agriculture with AI-powered disease detection and smart farming solutions for a sustainable future.
              </p>
              <div className="flex space-x-4">
                <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                <Github className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Disease Detection</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Treatment Plans</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Weather Integration</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Farm Mapping</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-gray-400">support@crophealth.ai</span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-gray-400">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start">
                  <MapPin className="h-4 w-4 mr-2 text-green-400 mt-1" />
                  <span className="text-gray-400">123 AgTech Street<br />San Francisco, CA 94105</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 CropHealth AI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;