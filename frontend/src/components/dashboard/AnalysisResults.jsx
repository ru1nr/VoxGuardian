import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, User, Brain, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AnalysisResults({ results }) {
  const getEmotionColor = (emotion) => {
    const colors = {
      fear: "bg-red-500/20 text-red-400 border-red-500/30",
      anger: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      sadness: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      joy: "bg-green-500/20 text-green-400 border-green-500/30",
      surprise: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      disgust: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      neutral: "bg-slate-500/20 text-slate-400 border-slate-500/30"
    };
    return colors[emotion] || colors.neutral;
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const confidencePercentage = (results.confidence_score * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Status Alert */}
      <Card className={`border-2 ${
        results.is_suspicious 
          ? "bg-red-900/20 border-red-700" 
          : "bg-green-900/20 border-green-700"
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            {results.is_suspicious ? (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-400" />
            )}
            <div>
              <h3 className={`text-xl font-bold ${
                results.is_suspicious ? "text-red-400" : "text-green-400"
              }`}>
                {results.is_suspicious ? "SUSPICIOUS CALL DETECTED" : "NORMAL CALL DETECTED"}
              </h3>
              <p className="text-slate-400">
                {results.is_suspicious 
                  ? "This call has been flagged for further review"
                  : "This call appears to be a genuine emergency"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Confidence Score</p>
                <p className={`text-2xl font-bold ${getConfidenceColor(results.confidence_score)}`}>
                  {confidencePercentage}%
                </p>
              </div>
              <Brain className="w-8 h-8 text-cyan-400" />
            </div>
            <Progress 
              value={results.confidence_score * 100} 
              className="mt-3 h-2"
            />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Speaker ID</p>
                <p className="text-2xl font-bold text-white">{results.speaker_id}</p>
              </div>
              <User className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emotion Analysis */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Emotion Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge className={`${getEmotionColor(results.dominant_emotion)} border px-4 py-2`}>
              <span className="text-sm font-medium capitalize">
                {results.dominant_emotion}
              </span>
            </Badge>
            <span className="text-slate-400">Dominant emotion detected</span>
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Call Transcript
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-slate-300 leading-relaxed">
              "{results.transcript}"
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
            <Clock className="w-4 h-4" />
            <span>
              Analysis completed in {results.analysis_duration || 2.1}s
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
