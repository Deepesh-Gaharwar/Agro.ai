import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "../contexts/useToast";
import { detectionService } from "../services/DetectionService";
import { translateText } from "../utils/translateText";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // ✅ Added for total counts
  const [globalStats, setGlobalStats] = useState({ healthy: 0, diseased: 0 });

  const { addToast } = useToast();

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const fetchHistory = async (page) => {
    setLoading(true);
    try {
      const res = await detectionService.getDetectionHistory(page, 10);
      setHistory(res.history || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
      if (res.history?.length > 0)
        setExpandedId(res.history[0].id || res.history[0]._id);

      // ✅ Global count logic (runs once)
      if (page === 1) {
        let all = res.allHistory || [];
        if (all.length === 0 && res.pages > 1) {
          // fetch all pages only once to count total healthy/diseased
          for (let i = 2; i <= res.pages; i++) {
            const next = await detectionService.getDetectionHistory(i, 10);
            if (next.history) all = [...all, ...next.history];
          }
        } else {
          all = res.history;
        }

        const healthy = all.filter((h) => !h.disease_detected).length;
        const diseased = all.filter((h) => h.disease_detected).length;
        setGlobalStats({ healthy, diseased });
      }
    } catch (err) {
      addToast(err.message || "Failed to fetch history", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (id) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "moderate":
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "high":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
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

  const HistoryCard = ({ detection, expanded }) => {
    const [translation, setTranslation] = useState(null);

    const handleTranslate = async () => {
      if (!translation) {
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
        }
      } else setTranslation(null);
    };

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
                  { new Date(detection.timestamp).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour12: true,
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      second: "numeric",
                  })}
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
              <div
                className="text-blue-900 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{
                  __html: `<p class="mb-3">${parseMarkdown(
                    detection.treatment_recommendation
                  )}</p>`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const Pagination = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-bold text-green-600">
            {Math.min((currentPage - 1) * 10 + 1, total)}
          </span>{" "}
          to{" "}
          <span className="font-bold text-green-600">
            {Math.min(currentPage * 10, total)}
          </span>{" "}
          of <span className="font-bold text-green-600">{total}</span> results
        </p>

        <nav className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = i + 1;
            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg border-2 font-semibold transition-all ${
                  isCurrent
                    ? "bg-green-600 border-green-600 text-white shadow-lg scale-110"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-lg border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-all flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </nav>
      </div>
    </div>
  );

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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

        {/* ✅ Summary Stats (Global Counts) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
            <Activity className="h-8 w-8 mb-3" />
            <p className="text-4xl font-bold">{total}</p>
            <p className="text-blue-100">Total Scans</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg text-white">
            <CheckCircle className="h-8 w-8 mb-3" />
            <p className="text-4xl font-bold">{globalStats.healthy}</p>
            <p className="text-green-100">Healthy Plants</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 shadow-lg text-white">
            <AlertTriangle className="h-8 w-8 mb-3" />
            <p className="text-4xl font-bold">{globalStats.diseased}</p>
            <p className="text-red-100">Diseased Plants</p>
          </div>
        </div>

        {/* Accordion List */}
        {history.length > 0 ? (
          <>
            <div className="space-y-6">
              {history.map((d) => (
                <HistoryCard
                  key={d.id || d._id}
                  detection={d}
                  expanded={expandedId === (d.id || d._id)}
                />
              ))}
            </div>
            {totalPages > 1 && <Pagination />}
          </>
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
