import React, { useState } from 'react';

const AudioRecorder = ({ onAudioReady }) => {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Real MediaRecorder API logic will go here
    if (!isRecording) {
      console.log("Started recording (Max 30s)...");
    } else {
      console.log("Stopped recording.");
      if (onAudioReady) onAudioReady("audio_blob_placeholder");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 flex items-center justify-between">
      <span className="text-gray-700">Voice Note Description (Max 30s)</span>
      <button 
        type="button"
        onClick={toggleRecording}
        className={`px-4 py-2 rounded text-white font-bold ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isRecording ? '⏹ Stop' : '🎤 Record'}
      </button>
    </div>
  );
};

export default AudioRecorder;