import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../contexts/useToast";
import { detectionService } from "../services/detectionService";
import { translateText } from "../utils/translateText";
import { diseaseTranslations } from "../utils/diseaseTranslations";
import {
  Camera,
  Upload,
  X,
  AlertTriangle,
  CheckCircle,
  Loader,
  Leaf,
  Activity,
  MessageCircle,
  Send,
  Bot,
  User as UserIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Detection = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [diseaseName, setDiseaseName] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const { addToast } = useToast();
  

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleImageSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      setResult(null);
      setShowChat(false);
      setChatMessages([]);
    } else {
      addToast("Please select a valid image file", "error");
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
    setShowChat(false);
    setChatMessages([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseMarkdown = (text) => {
    if (!text) return "";

    let html = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-gray-900">$1</strong>'
    );

    html = html.replace(
      /(?:^|\n)(?:\*\*)?(?:Disease Name|Disease|रोग|गंभीरता|लक्षण|कारण|उपचार|रोकथाम|विवरण|Prevention|Cure|Symptoms|Cause)(?:\*\*)?:/gi,
      (match) =>
        `<h3 class="text-lg font-bold text-blue-900 mt-4 mb-2">${match.replace(
          /\*\*/g,
          ""
        )}</h3>`
    );

    html = html.replace(
      /(?:\n|^)[\*\-\•]\s+(.*)/g,
      '<li class="ml-5 list-disc text-blue-900">$1</li>'
    );

    html = html.replace(
      /\n\s{4,}[\*\-\•]\s+(.*)/g,
      '<li class="ml-10 list-disc text-blue-900">$1</li>'
    );

    html = html.replace(
      /(?:\n|^)\d+\.\s+(.*)/g,
      '<li class="ml-5 list-decimal">$1</li>'
    );

    html = html.replace(
      /(<li.*?>[\s\S]*?<\/li>)/g,
      '<ul class="list-disc pl-6 space-y-1">$1</ul>'
    );

    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = html.replace(/\n/g, "<br/>");

    return `<div class="space-y-2">${html}</div>`;
  };

  const detectDisease = async () => {
    if (!selectedImage) {
      addToast("Please select an image first", "error");
      return;
    }

    setDetecting(true);
    try {
      const detectionResult = await detectionService.detectDisease(
        selectedImage
      );
      setResult(detectionResult);
      setDiseaseName(detectionResult.disease_detected);
     // console.log(detectionResult)

      if (detectionResult.disease_detected) {
        addToast("Disease detected! Check the results below.", "warning");
        // Add welcome message to chat
        setChatMessages([
          {
            role: "assistant",
            content: `I've detected ${detectionResult.disease_detected.replace(
              /_/g,
              " "
            )} in your plant. Feel free to ask me any questions about this disease, its treatment, or prevention methods!`,
            timestamp: new Date().toISOString(),
          },
        ]);
        setShowChat(true); // Auto-open chat
      } else {
        addToast("Great! No disease detected in this plant.", "success");
        setChatMessages([
          {
            role: "assistant",
            content:
              "Your plant appears healthy! If you have any questions about plant care or disease prevention, feel free to ask.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setShowChat(true); // Auto-open chat
      }
    } catch (error) {
      addToast(error.message || "Detection failed", "error");
    } finally {
      setDetecting(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || sendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput("");

    // Add user message to chat
    const newUserMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newUserMessage]);
    setSendingMessage(true);

    try {
      // Call chat API
      const response = await detectionService.chatAboutDisease({
        detection_id: result?.detection_id,
        message: userMessage,
        chat_history: chatMessages,
      });

      // Add bot response to chat
      const botMessage = {
        role: "assistant",
        content: response.message,
        timestamp: response.timestamp,
      };
      setChatMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      addToast("Failed to send message. Please try again.", "error");
      // Add error message
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I apologize, but I encountered an error. Please try asking your question again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "moderate":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "high":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Disease Detection
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image of your plant to detect diseases using AI
          </p>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Upload Plant Image
            </h2>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your image here
              </h3>
              <p className="text-gray-600 mb-4">or click to browse</p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, and other image formats
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative inline-block w-full">
                <div className="w-full max-w-2xl h-64 mx-auto rounded-2xl shadow-md border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Selected plant"
                    className="w-full h-full object-contain"
                  />
                </div>

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
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium shadow-md cursor-pointer"
                >
                  <Upload className="h-5 w-5 mr-2" /> Choose Different Image
                </button>

                <button
                  onClick={detectDisease}
                  disabled={detecting}
                  className="flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md cursor-pointer"
                >
                  {detecting ? (
                    <>
                      <Loader className="h-5 w-5 mr-2 animate-spin" />{" "}
                      Analyzing...
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
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    result.disease_detected ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  {result.disease_detected ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Detection Results
                </h2>
              </div>

              <button
                onClick={async () => {
                  if (!result.translation || result.translation.lang !== "hi") {
                    try {
                      const textToTranslate = `
                        Disease: ${result.disease_detected || "Healthy"}
                        Severity: ${result.severity_level || "Unknown"}
                        Explanation: ${result.ai_explanation || ""}
                      `;

                      addToast("Translating to Hindi...", "info");
                      const translated = await translateText(
                        textToTranslate,
                        "hi"
                      );

                      setResult((prev) => ({
                        ...prev,
                        translation: { text: translated, lang: "hi" },
                      }));

                      addToast("Translated successfully!", "success");
                    } catch (err) {
                      addToast("Translation failed. Try again.", "error");
                    }
                  } else {
                    setResult((prev) => ({ ...prev, translation: null }));
                  }
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                {result.translation && result.translation.lang === "hi"
                  ? "Show in English"
                  : "Translate to Hindi"}
              </button>
            </div>

            <div className="space-y-6">
              {/* Detection Summary Card */}
              <div
                className={`rounded-xl p-6 border-2 ${
                  result.disease_detected
                    ? "bg-red-50 border-red-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {result.disease_detected ? (
                    <AlertTriangle className="h-12 w-12 text-red-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3
                      className={`text-2xl font-bold mb-2 ${
                        result.disease_detected
                          ? "text-red-900"
                          : "text-green-900"
                      }`}
                    >
                      {result.disease_detected
                        ? "Disease Detected"
                        : "Plant is Healthy"}
                    </h3>
                    <p
                      className={`text-lg ${
                        result.disease_detected
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      Confidence Level:{" "}
                      <span className="font-semibold">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Disease Info Grid */}
              {result.disease_detected && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">
                      Disease Type
                    </h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {result.translation?.lang === "hi"
                        ? "पत्तियों की बीमारी"
                        : result.disease_type?.replace(/_/g, " ") ||
                          "Leaf Disease"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3 uppercase tracking-wide">
                      Severity Level
                    </h4>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold border-2 ${getSeverityColor(
                        result.severity_level
                      )}`}
                    >
                      {result.translation?.lang === "hi"
                        ? result.severity_level === "Low"
                          ? "कम"
                          : result.severity_level === "High"
                          ? "उच्च"
                          : "मध्यम"
                        : result.severity_level || "Unknown"}
                    </span>
                  </div>
                </div>
              )}

              {/* Disease Name Box */}
              {result && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Disease Name
                  </h4>
                  <p className="text-lg font-bold text-gray-900">
                    {result.translation?.lang === "hi"
                      ? diseaseTranslations[diseaseName] || "अज्ञात रोग"
                      : result.disease_detected?.replace(/_+/g, " ").trim()}
                  </p>
                </div>
              )}

              {/* AI Treatment Recommendation */}
              {result.ai_explanation && (
                <div
                  className="text-blue-900 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{
                    __html:
                      result.translation?.lang === "hi"
                        ? `<p class="mb-3">${parseMarkdown(
                            result.translation.text
                          )}</p>`
                        : `<p class="mb-3">${parseMarkdown(
                            result.ai_explanation
                          )}</p>`,
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* Chat Section - Below Detection Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
            {/* Chat Header */}
            <div
              className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowChat(!showChat)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Ask Questions About This Disease
                    </h3>
                    <p className="text-sm text-gray-600">
                      Chat with our AI expert for more information
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {chatMessages.length > 1 && (
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {chatMessages.length - 1} message
                      {chatMessages.length > 2 ? "s" : ""}
                    </span>
                  )}
                  <div
                    className={`transform transition-transform ${
                      showChat ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Messages - Collapsible */}
            {showChat && (
              <div className="p-6">
                {/* Chat Messages Area */}
                <div className="max-h-96 overflow-y-auto mb-4 space-y-4 pr-2">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl p-4 ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            className="prose prose-sm max-w-none text-sm leading-relaxed
    prose-p:mb-2 prose-ul:my-1 prose-li:my-0
    prose-strong:text-gray-900 prose-code:bg-gray-200 prose-code:px-1 prose-code:rounded
    prose-headings:mb-2 prose-headings:text-gray-800 prose-headings:font-semibold"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                    </div>
                  ))}
                  {sendingMessage && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="bg-gray-100 rounded-2xl p-4">
                        <Loader className="h-5 w-5 text-gray-600 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input Area */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendChatMessage();
                        }
                      }}
                      placeholder="Ask about treatment, prevention, or care tips..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={sendingMessage}
                    />
                    <button
                      onClick={sendChatMessage}
                      disabled={sendingMessage || !chatInput.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Send className="h-5 w-5" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Press Enter to send • AI-powered responses
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Detection;
