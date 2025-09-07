import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Brain, 
  Shield, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  Play,
  Star,
  Globe,
  Smartphone,
  Cloud,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full text-green-800 text-sm font-medium mb-6">
                <Brain className="h-4 w-4 mr-2" />
                AI-Powered Crop Health Detection
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Protect Your <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Crops</span> with Intelligent Disease Detection
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Revolutionary AI technology that identifies plant diseases instantly, analyzes severity, and provides personalized treatment recommendations to maximize your harvest.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="group bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg">
                  <Link to="/login">
                       Start Free Detection
                  </Link>
                  <ArrowRight className="inline h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="group flex items-center px-8 py-4 border border-gray-300 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all">
                  <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </button>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="h-10 w-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white font-semibold">
                        {i}
                      </div>
                    ))}
                  </div>
                  <span className="ml-3 text-gray-600">10,000+ farmers trust us</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative z-10">
                <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 mb-6">
                    <h3 className="text-white text-lg font-semibold mb-2">Disease Detection Results</h3>
                    <div className="flex items-center text-white">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span>Bacterial Blight Detected - 78% Severity</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="font-medium">Diseased Area</span>
                      <span className="text-red-600 font-bold">78%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">Confidence</span>
                      <span className="text-green-600 font-bold">94%</span>
                    </div>
                    <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      View Treatment Plan
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -left-6 bg-white p-4 rounded-xl shadow-lg"
              >
                <Camera className="h-8 w-8 text-green-600" />
              </motion.div>
              
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-6 -right-6 bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-xl shadow-lg text-white"
              >
                <Brain className="h-8 w-8" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible.stats ? "visible" : "hidden"}
            id="stats"
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { number: "98%", label: "Accuracy Rate", icon: <TrendingUp className="h-8 w-8" /> },
              { number: "50K+", label: "Images Analyzed", icon: <Camera className="h-8 w-8" /> },
              { number: "200+", label: "Disease Types", icon: <Shield className="h-8 w-8" /> },
              { number: "15K+", label: "Happy Farmers", icon: <Users className="h-8 w-8" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-xl text-green-600 mb-4 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isVisible.features ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Farming
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with agricultural expertise to deliver comprehensive crop health solutions.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible.features ? "visible" : "hidden"}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <Brain className="h-8 w-8" />,
                title: "AI Disease Detection",
                description: "YOLO-based deep learning models trained on PlantVillage dataset for instant, accurate disease identification.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Severity Analysis",
                description: "Calculate percentage of affected leaf area and categorize infection severity as Low, Medium, or High.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Smart Recommendations",
                description: "Customized treatment plans including organic, chemical, and preventative measures based on disease type.",
                color: "from-purple-500 to-indigo-500"
              },
              {
                icon: <Cloud className="h-8 w-8" />,
                title: "Weather Integration",
                description: "Real-time weather data integration for context-aware alerts and disease prevention strategies.",
                color: "from-orange-500 to-red-500"
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: "Farm Mapping",
                description: "GPS-based disease mapping and tracking across your entire farm with historical data analysis.",
                color: "from-teal-500 to-green-500"
              },
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "Mobile Ready",
                description: "Access via web app or mobile app with multilingual support for farmers worldwide.",
                color: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isVisible.howItWorks ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple. Fast. Accurate.
            </h2>
            <p className="text-xl text-gray-600">
              Get instant disease detection and treatment recommendations in just three steps
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible.howItWorks ? "visible" : "hidden"}
            id="howItWorks"
            className="grid md:grid-cols-3 gap-12"
          >
            {[
              {
                step: "01",
                icon: <Camera className="h-12 w-12" />,
                title: "Upload Image",
                description: "Take a photo of affected plant leaves using your smartphone or upload existing images."
              },
              {
                step: "02",
                icon: <Brain className="h-12 w-12" />,
                title: "AI Analysis",
                description: "Our advanced AI model analyzes the image and identifies diseases with 98% accuracy in seconds."
              },
              {
                step: "03",
                icon: <CheckCircle className="h-12 w-12" />,
                title: "Get Results",
                description: "Receive detailed diagnosis, severity analysis, and personalized treatment recommendations."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative text-center group"
              >
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-green-300 to-transparent transform translate-x-6"></div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isVisible.testimonials ? "visible" : "hidden"}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Farmers Are Saying
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of farmers who have revolutionized their crop management
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isVisible.testimonials ? "visible" : "hidden"}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                name: "Rajesh Kumar",
                role: "Rice Farmer, Punjab",
                image: "👨‍🌾",
                rating: 5,
                text: "CropHealth AI saved my entire harvest! Early detection of bacterial blight helped me take immediate action. My yield increased by 30% this season."
              },
              {
                name: "Maria Santos",
                role: "Organic Vegetable Farmer",
                image: "👩‍🌾",
                rating: 5,
                text: "The organic treatment recommendations are spot-on. Finally, technology that understands sustainable farming practices. Highly recommended!"
              },
              {
                name: "John Mitchell",
                role: "Commercial Fruit Grower",
                image: "🧑‍🌾",
                rating: 5,
                text: "The accuracy is incredible. What used to take days of consultation now takes seconds. This tool is a game-changer for modern agriculture."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">{testimonial.image}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-green-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic leading-relaxed">"{testimonial.text}"</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate={isVisible.cta ? "visible" : "hidden"}
            id="cta"
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of farmers who are already using AI to protect their crops and increase yields
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg">
                Start Free Trial
              </button>
              <button className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-green-600 transition-all">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;