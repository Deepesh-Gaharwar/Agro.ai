import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Activity,
} from "lucide-react";
import { useToast } from "../contexts/useToast";
import { detectionService } from "../services/detectionService";
import { translateText } from "../utils/translateText";
import { diseaseTranslations } from "../utils/diseaseTranslations";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await detectionService.getDetectionHistory(1, 10);
      setHistory(res.history || []);
      // console.log(res.history);
      if (res.history?.length > 0)
        setExpandedId(res.history[0].id || res.history[0]._id); // open first
    } catch (err) {
      addToast(err.message || "Failed to fetch history", "error");
    } finally {
      setLoading(false);
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

  const parseMarkdown = (text) => {
    if (!text) return "";

    // Bold text between **word**
    let html = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-gray-900">$1</strong>'
    );

    // Headings like "Disease:" or "रोग:" or "**Disease Name:**"
    html = html.replace(
      /(?:^|\n)(?:\*\*)?(?:Disease Name|Disease|रोग|गंभीरता|लक्षण|कारण|उपचार|रोकथाम|विवरण|Prevention|Cure|Symptoms|Cause)(?:\*\*)?:/gi,
      (match) =>
        `<h3 class="text-lg font-bold text-blue-900 mt-4 mb-2">${match.replace(
          /\*\*/g,
          ""
        )}</h3>`
    );

    // Bullet points for "*", "-", "•"
    html = html.replace(
      /(?:\n|^)[\*\-\•]\s+(.*)/g,
      '<li class="ml-5 list-disc text-blue-900">$1</li>'
    );

    // Nested bullets (extra indented)
    html = html.replace(
      /\n\s{4,}[\*\-\•]\s+(.*)/g,
      '<li class="ml-10 list-disc text-blue-900">$1</li>'
    );

    // Numbered points
    html = html.replace(
      /(?:\n|^)\d+\.\s+(.*)/g,
      '<li class="ml-5 list-decimal">$1</li>'
    );

    // Wrap bullet items with <ul>
    html = html.replace(
      /(<li.*?>[\s\S]*?<\/li>)/g,
      '<ul class="list-disc pl-6 space-y-1">$1</ul>'
    );

    // Two newlines → paragraph break
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');

    // Single newline → <br/>
    html = html.replace(/\n/g, "<br/>");

    return `<div class="space-y-2">${html}</div>`;
  };

  const toggleAccordion = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const HistoryCard = ({ detection, expanded }) => {
    const [translation, setTranslation] = useState(null);
    const [translating, setTranslating] = useState(false);

    const handleTranslate = async () => {
      if (!translation) {
        setTranslating(true);
        try {
          const textToTranslate = `
Disease: ${detection.disease_detected || "Healthy"}
Severity: ${detection.severity_level || "Unknown"}
Explanation: ${detection.ai_explanation || ""}
          `;
          addToast("Translating to Hindi...", "info");
          const translated = await translateText(textToTranslate, "hi");
          setTranslation({ text: translated, lang: "hi" });
          addToast("Translated successfully!", "success");
        } catch {
          addToast("Translation failed. Try again.", "error");
        } finally {
          setTranslating(false);
        }
      } else setTranslation(null);
    };

    const extractDiseaseName = (text) => {
      if (!text) return null;
      const match = text.match(/\*\*(?:Disease Name|Disease):\*\*\s*([^\*]+)/i);
      return match ? match[1].trim() : null;
    };

    const diseaseNameFromText = extractDiseaseName(
      detection.treatment_recommendation
    );

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Accordion Header */}
        <button
          className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 transition-all"
          onClick={() => toggleAccordion(detection.id || detection._id)}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                detection.disease_detected ? "bg-red-100" : "bg-green-100"
              }`}
            >
              {detection.disease_detected ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div>
              <h3
                className={`text-lg font-bold ${
                  detection.disease_detected ? "text-red-800" : "text-green-800"
                }`}
              >
                {detection.disease_detected
                  ? "Disease Detected"
                  : "Healthy Plant"}
              </h3>
              <p className="text-sm text-gray-600">
                {new Date(detection.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-6 w-6 text-gray-600" />
          ) : (
            <ChevronDown className="h-6 w-6 text-gray-600" />
          )}
        </button>

        {/* Accordion Body */}
        <div
          className={`transition-all duration-500 ${
            expanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="p-8 border-t border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    detection.disease_detected ? "bg-red-100" : "bg-green-100"
                  }`}
                >
                  {detection.disease_detected ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Detection Results
                </h2>
              </div>

              {/* <button
                onClick={handleTranslate}
                disabled={translating}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                {translation && translation.lang === "hi"
                  ? "Show in English"
                  : translating
                  ? "Translating..."
                  : "Translate to Hindi"}
              </button> */}
            </div>

            {/* Summary Box */}
            <div
              className={`rounded-xl p-6 border-2 mb-6 ${
                detection.disease_detected
                  ? "bg-red-50 border-red-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-4">
                {detection.disease_detected ? (
                  <AlertTriangle className="h-12 w-12 text-red-600 flex-shrink-0" />
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-600 flex-shrink-0" />
                )}
                <div>
                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      detection.disease_detected
                        ? "text-red-900"
                        : "text-green-900"
                    }`}
                  >
                    {detection.disease_detected
                      ? "Disease Detected"
                      : "Plant is Healthy"}
                  </h3>
                  <p
                    className={`text-lg ${
                      detection.disease_detected
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    Confidence Level:{" "}
                    <span className="font-semibold">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Disease Info */}
            {detection.disease_detected && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 uppercase tracking-wide">
                      Disease Type
                    </h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {translation?.lang === "hi"
                        ? "पत्तियों की बीमारी"
                        : detection.disease_type?.replace(/_/g, " ") ||
                          "Leaf Disease"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                    <h4 className="text-sm font-semibold text-purple-900 mb-3 uppercase tracking-wide">
                      Severity Level
                    </h4>
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold border-2 ${getSeverityColor(
                        detection.severity_level
                      )}`}
                    >
                      {translation?.lang === "hi"
                        ? detection.severity_level === "Low"
                          ? "कम"
                          : detection.severity_level === "High"
                          ? "उच्च"
                          : "मध्यम"
                        : detection.severity_level || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Disease Name */}
                {/* <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Disease Name
                  </h4>
                  <p className="text-lg font-bold text-gray-900">
                    {translation?.lang === "hi"
                      ? diseaseTranslations[
                          diseaseNameFromText
                            ?.replace(/\s+/g, "_")
                            ?.replace(/[()]/g, "")
                            ?.trim()
                        ] || "अज्ञात रोग"
                      : diseaseNameFromText || "Unknown"}
                  </p>
                </div> */}

              
                {/* AI Explanation */}
                {detection.treatment_recommendation && (
                  <div
                    className="text-blue-900 leading-relaxed space-y-3"
                    dangerouslySetInnerHTML={{
                      __html:
                        translation?.lang === "hi"
                          ? `<p class="mb-3">${parseMarkdown(
                              translation.text
                            )}</p>`
                          : `<p class="mb-3">${parseMarkdown(
                              detection.treatment_recommendation
                            )}</p>`,
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-14 h-14 border-4 border-green-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Detection History
          </h1>
          <p className="text-lg text-gray-600">
            Review your previous plant disease detections
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
            <Activity className="h-8 w-8 mb-3" />
            <p className="text-4xl font-bold">{history.length}</p>
            <p className="text-blue-100">Total Scans</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
            <CheckCircle className="h-8 w-8 mb-3" />
            <p className="text-4xl font-bold">
              {history.filter((h) => !h.disease_detected).length}
            </p>
            <p className="text-green-100">Healthy Plants</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-lg text-white">
            <AlertTriangle className="h-8 w-8 mb-3" />
            <p className="text-4xl font-bold">
              {history.filter((h) => h.disease_detected).length}
            </p>
            <p className="text-red-100">Diseased Plants</p>
          </div>
        </div>

        {/* Accordion List */}
        {history.length > 0 ? (
          <div className="space-y-6">
            {history.map((d) => (
              <HistoryCard
                key={d.id || d._id}
                detection={d}
                expanded={expandedId === (d.id || d._id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-2xl shadow-lg p-10 border">
            <p className="text-gray-700 font-medium">
              No detection history available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
