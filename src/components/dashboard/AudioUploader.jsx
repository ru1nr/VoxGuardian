import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileAudio, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function AudioUploader({ onFileUpload, isAnalyzing, progress }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      setSelectedFile(audioFile);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
    }
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileAudio className="w-5 h-5 text-cyan-400" />
          Audio Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive 
                ? "border-cyan-400 bg-cyan-500/10" 
                : "border-slate-700 hover:border-slate-600"
            }`}
          >
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
              id="audio-upload"
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-16 h-16 mx-auto bg-slate-800 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload 911 Call Recording
                </h3>
                <p className="text-slate-400 mb-4">
                  Drag and drop your audio file here, or click to browse
                </p>
                <label htmlFor="audio-upload">
                  <Button asChild className="bg-cyan-600 hover:bg-cyan-700 text-white">
                    <span>Choose Audio File</span>
                  </Button>
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Supported formats: MP3, WAV, M4A, OGG
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <FileAudio className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-sm text-slate-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                disabled={isAnalyzing}
                className="text-slate-400 hover:text-red-400"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {isAnalyzing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Analyzing audio...</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-slate-400 text-center">
                  Processing with AI models - this may take a moment
                </p>
              </div>
            ) : (
              <Button
                onClick={handleAnalyze}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <FileAudio className="w-5 h-5 mr-2" />
                Analyze Call
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
