import { useState, useEffect, useRef, useCallback } from 'react';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export type VoiceInputStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

export interface UseVoiceInputReturn {
  transcript: string;
  isListening: boolean;
  status: VoiceInputStatus;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useVoiceInput(
  onTranscriptChange?: (transcript: string) => void,
  options?: {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
  }
): UseVoiceInputReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Store the callback in a ref to avoid recreating the recognition instance
  const onTranscriptChangeRef = useRef(onTranscriptChange);
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = options?.continuous ?? false;
    recognition.interimResults = options?.interimResults ?? true;
    recognition.lang = options?.lang ?? 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[useVoiceInput] Recognition result event:', event);
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPiece + ' ';
        } else {
          interimTranscript += transcriptPiece;
        }
      }

      const newTranscript = (finalTranscript || interimTranscript).trim();
      console.log('[useVoiceInput] New transcript:', newTranscript);
      setTranscript(newTranscript);

      if (onTranscriptChangeRef.current) {
        console.log('[useVoiceInput] Calling onTranscriptChange callback');
        onTranscriptChangeRef.current(newTranscript);
      }

      if (finalTranscript) {
        setStatus('processing');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      let errorMessage = 'Voice input error occurred';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your device.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please enable it in your browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          // User stopped it, not really an error
          errorMessage = '';
          break;
        default:
          errorMessage = `Voice input error: ${event.error}`;
      }

      if (errorMessage) {
        setError(errorMessage);
        setStatus('error');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported, options?.continuous, options?.interimResults, options?.lang, status]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice input is not supported in this browser');
      setStatus('unsupported');
      return;
    }

    if (!recognitionRef.current || isListening) return;

    try {
      setError(null);
      setStatus('listening');
      setIsListening(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setError('Failed to start voice input');
      setStatus('error');
      setIsListening(false);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('idle');
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    if (status !== 'listening') {
      setStatus('idle');
    }
  }, [status]);

  return {
    transcript,
    isListening,
    status,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    isSupported,
  };
}
