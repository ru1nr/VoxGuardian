import React, { useState, useEffect } from "react";
import { Call } from "@/api/entities";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Search, Filter, AlertTriangle, CheckCircle, Clock, User, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function History() {
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmotion, setFilterEmotion] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  useEffect(() => {
    filterCalls();
  }, [calls, searchTerm, filterStatus, filterEmotion]);

  const loadCalls = async () => {
    try {
      const callsData = await Call.list("-created_date", 50);
      setCalls(callsData);
    } catch (err) {
      console.error("Error loading calls:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCalls = () => {
    let filtered = calls;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(call => 
        call.transcript.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.speaker_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(call => {
        if (filterStatus === "suspicious") return call.is_suspicious;
        if (filterStatus === "normal") return !call.is_suspicious;
        return true;
      });
    }

    // Emotion filter
    if (filterEmotion !== "all") {
      filtered = filtered.filter(call => call.dominant_emotion === filterEmotion);
    }

    setFilteredCalls(filtered);
  };

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
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Call History</h1>
            <p className="text-slate-400">Review and analyze past emergency calls</p>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Search calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Calls</SelectItem>
                  <SelectItem value="suspicious">Suspicious Only</SelectItem>
                  <SelectItem value="normal">Normal Only</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterEmotion} onValueChange={setFilterEmotion}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Filter by emotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emotions</SelectItem>
                  <SelectItem value="fear">Fear</SelectItem>
                  <SelectItem value="anger">Anger</SelectItem>
                  <SelectItem value="sadness">Sadness</SelectItem>
                  <SelectItem value="joy">Joy</SelectItem>
                  <SelectItem value="surprise">Surprise</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setFilterStatus("all");
                  setFilterEmotion("all");
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">
              Call Records ({filteredCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-300">Time</TableHead>
                    <TableHead className="text-slate-300">Speaker</TableHead>
                    <TableHead className="text-slate-300">Transcript</TableHead>
                    <TableHead className="text-slate-300">Emotion</TableHead>
                    <TableHead className="text-slate-300">Confidence</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map((call) => (
                    <TableRow key={call.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {format(new Date(call.created_date), "MMM d, HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {call.speaker_id}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 max-w-xs">
                        <div className="truncate" title={call.transcript}>
                          {call.transcript}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEmotionColor(call.dominant_emotion)}>
                          {call.dominant_emotion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${getConfidenceColor(call.confidence_score)}`}>
                          {(call.confidence_score * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {call.is_suspicious ? (
                            <Badge className="bg-red-500/20 text-red-400">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Suspicious
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Normal
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(call.audio_file_url, '_blank')}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}