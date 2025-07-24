import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock, User, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RecentCalls({ calls }) {
  const getEmotionColor = (emotion) => {
    const colors = {
      fear: "bg-red-500/20 text-red-400",
      anger: "bg-orange-500/20 text-orange-400",
      sadness: "bg-blue-500/20 text-blue-400",
      joy: "bg-green-500/20 text-green-400",
      surprise: "bg-purple-500/20 text-purple-400",
      disgust: "bg-yellow-500/20 text-yellow-400",
      neutral: "bg-slate-500/20 text-slate-400"
    };
    return colors[emotion] || colors.neutral;
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 h-fit">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Calls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {calls.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No calls analyzed yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Upload an audio file to get started
              </p>
            </div>
          ) : (
            calls.slice(0, 5).map((call, index) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {call.is_suspicious ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-sm text-slate-300">
                      {format(new Date(call.created_date), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(call.audio_file_url, '_blank')}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 h-8 w-8 p-0"
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{call.speaker_id}</span>
                  <Badge className={getEmotionColor(call.dominant_emotion)}>
                    {call.dominant_emotion}
                  </Badge>
                </div>
                
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                  {call.transcript}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${getConfidenceColor(call.confidence_score)}`}>
                    {(call.confidence_score * 100).toFixed(1)}% confidence
                  </span>
                  <Badge 
                    className={call.is_suspicious 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-green-500/20 text-green-400"
                    }
                  >
                    {call.is_suspicious ? "Suspicious" : "Normal"}
                  </Badge>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
