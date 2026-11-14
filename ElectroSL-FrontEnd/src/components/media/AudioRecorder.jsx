
import React, { useState, useRef, useEffect } from 'react';

const MAX_DURATION = 30;

const AudioRecorder = ({ onAudioReady }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current.state === 'recording'
    ) {
      recorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      setError('');

      if (!navigator.mediaDevices?.getUserMedia ||
          !window.MediaRecorder) {
        setError('Your browser does not support audio recording.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;
      chunksRef.current = [];
      secondsRef.current = 0;
      setSeconds(0);

      const options = {};

      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      }

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);

          setAudioURL((previous) => {
            if (previous) URL.revokeObjectURL(previous);
            return url;
          });

          if (onAudioReady) onAudioReady(blob);
        }

        stream.getTracks().forEach((track) => track.stop());

        clearInterval(timerRef.current);
        timerRef.current = null;

        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
      }, 1000);

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, MAX_DURATION * 1000);

    } catch (err) {
      console.error('Recording error:', err);

      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access.'
          : 'Unable to start recording. Please try again.'
      );

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
    }
  };

  const recordAgain = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);

    setAudioURL(null);
    setSeconds(0);
    setError('');

    if (onAudioReady) onAudioReady(null);
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      if (
        recorderRef.current &&
        recorderRef.current.state === 'recording'
      ) {
        recorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  return (
    <div className="audio-recorder">
      <div className="audio-recorder-header">
        <span>🎤 Voice Description</span>
        <span className="recording-limit">Maximum 30 seconds</span>
      </div>

      <div className="recording-timer">
        {`00:${String(seconds).padStart(2, '0')}`} / 00:30
      </div>

      <div className="recording-actions">
        {!isRecording && !audioURL && (
          <button
            type="button"
            className="record-button"
            onClick={startRecording}
          >
            🎤 Start Recording
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            className="stop-button"
            onClick={stopRecording}
          >
            ⏹ Stop Recording
          </button>
        )}

        {audioURL && (
          <div className="audio-playback">
            <p>✓ Recording completed!</p>

            <audio controls src={audioURL}>
              Your browser does not support audio playback.
            </audio>

            <button
              type="button"
              className="record-button"
              onClick={recordAgain}
            >
              ↻ Record Again
            </button>
          </div>
        )}
      </div>

      {isRecording && (
        <p className="recording-status">
          🔴 Recording in progress...
        </p>
      )}

      {error && (
        <p className="recording-error">{error}</p>
      )}
    </div>
  );
};

export default AudioRecorder;
