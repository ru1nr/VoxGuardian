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
      const response = await axios.get("http://localhost:5000/recent-calls");
      setRecentCalls(response.data.slice(0, 10)); // Latest 10 calls
    } catch (err) {
      console.error("Error loading recent calls:", err);
      setRecentCalls([]); // Fallback to empty array
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

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await axios.post("http://localhost:5000/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      // Use response from backend
      const result = response.data;
      const id = Date.now(); // Generate ID once to avoid duplicates
      const createdDate = new Date().toISOString(); // TODO: Pull from backend response in future

      setAnalysisResults({
        ...result,
        id: id,
        speaker_id: `speaker_${Math.floor(Math.random() * 999) + 1}`,
        dominant_emotion: "neutral", // placeholder until real analysis
        created_date: createdDate,
        audio_file_url: `/audio/${file.name}`,
        analysis_duration: 2.1, // optional mock metric
      });

      setRecentCalls((prev) => [
        {
          ...result,
          id: id,
          speaker_id: `speaker_${Math.floor(Math.random() * 999) + 1}`,
          dominant_emotion: "neutral",
          created_date: createdDate,
          audio_file_url: `/audio/${file.name}`,
          analysis_duration: 2.1,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err) {
      setError("Failed to analyze audio file. Please try again.");
      console.error("Analysis error:", err);
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
