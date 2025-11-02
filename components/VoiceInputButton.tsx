"use client";

import { useEffect } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  currentValue?: string;
  className?: string;
}

export default function VoiceInputButton({
  onTranscript,
  currentValue = '',
  className = '',
}: VoiceInputButtonProps) {
  const {
    transcript,
    isListening,
    status,
    error,
    toggleListening,
    resetTranscript,
    isSupported,
  } = useVoiceInput((newTranscript) => {
    // Append to existing value if there's content
    if (currentValue && newTranscript) {
      onTranscript(`${currentValue} ${newTranscript}`);
    } else if (newTranscript) {
      onTranscript(newTranscript);
    }
  });

  // Reset transcript when listening stops
  useEffect(() => {
    if (!isListening && transcript) {
      // Small delay to ensure the last transcript is captured
      const timeout = setTimeout(() => {
        resetTranscript();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isListening, transcript, resetTranscript]);

  // Don't show button if not supported
  if (!isSupported) {
    return null;
  }

  const getButtonStyles = () => {
    switch (status) {
      case 'listening':
        return 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-300 animate-pulse';
      case 'error':
        return 'bg-red-50 text-red-600 hover:bg-red-100 border-red-300';
      case 'processing':
        return 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-300';
      default:
        return 'bg-white text-gray-400 hover:text-orange-500 hover:bg-orange-50 border-gray-200';
    }
  };

  const getTooltip = () => {
    if (error) return error;
    if (isListening) return 'Listening... Click to stop';
    return 'Click to use voice input';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        title={getTooltip()}
        className={`
          p-2 rounded-lg border-2 transition-all
          ${getButtonStyles()}
          ${className}
        `}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {/* Microphone Icon */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>

      {/* Error tooltip */}
      {error && (
        <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-red-50 border border-red-200 rounded-lg shadow-lg z-10">
          <p className="text-xs text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
