import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, AlertTriangle, CheckCircle, Clock, User, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

import AudioUploader from "../components/dashboard/AudioUploader";
import AnalysisResults from "../components/dashboard/AnalysisResults";
import RecentCalls from "../components/dashboard/RecentCalls";

// Use environment variable instead of hardcoded URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://voxguardian-production.up.railway.app';

export default function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadRecentCalls();
  }, []);

  const loadRecentCalls = async () => {
    try {
      console.log("🔍 API_BASE_URL:", API_BASE_URL);
      const response = await axios.get(`${API_BASE_URL}/recent-calls`);
      setRecentCalls(response.data.slice(0, 10));
    } catch (err) {
      console.error("Error loading recent calls:", err);
      setRecentCalls([]);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("audio", file);

      console.log("🔍 Uploading to:", `${API_BASE_URL}/analyze`);

      const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000,
      });

      setAnalysisResults(response.data);
      loadRecentCalls();

    } catch (err) {
      console.error("❌ Upload error:", err);
      setError("Failed to analyze audio file. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const getStatsCards = () => {
    const totalCalls = recentCalls.length;
    const suspiciousCalls = recentCalls.filter((call) => call.is_suspicious).length;
    const avgConfidence =
      totalCalls > 0
        ? (
            (recentCalls.reduce((sum, call) => sum + call.confidence_score, 0) /
              totalCalls) *
            100
          ).toFixed(1)
        : 0;

    return [
      {
        title: "Total Calls Today",
        value: totalCalls,
        icon: Play,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/20",
      },
      {
        title: "Suspicious Calls",
        value: suspiciousCalls,
        icon: AlertTriangle,
        color: "text-red-400",
        bgColor: "bg-red-500/20",
      },
      {
        title: "Average Confidence",
        value: `${avgConfidence}%`,
        icon: Brain,
        color: "text-green-400",
        bgColor: "bg-green-500/20",
      },
    ];
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-2">VoxGuardian Dashboard</h1>
            <p className="text-slate-400 text-lg">
              AI-Powered 911 Call Analysis & Threat Detection
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {getStatsCards().map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <AudioUploader
              onFileUpload={handleFileUpload}
              isAnalyzing={isAnalyzing}
              progress={progress}
            />

            {error && (
              <Alert className="bg-red-900/20 border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            <AnimatePresence>
              {analysisResults && <AnalysisResults results={analysisResults} />}
            </AnimatePresence>
          </div>

          <div>
            <RecentCalls calls={recentCalls} />
          </div>
        </div>
      </div>
    </div>
  );
}
