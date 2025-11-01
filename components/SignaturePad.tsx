"use client";

import { useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";

interface SignaturePadProps {
  label?: string;
  required?: boolean;
}

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ label = "Signature", required = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const isDrawingRef = useRef(false);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setIsEmpty(true);
        }
      },
      isEmpty: () => isEmpty,
      toDataURL: () => {
        return canvasRef.current?.toDataURL('image/png') ?? "";
      },
    }));

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size to match display size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
      }

      // Handle resize
      const handleResize = () => {
        const rect = canvas.getBoundingClientRect();
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          if (imageData) {
            ctx.putImageData(imageData, 0, 0);
          }
        }
      };

      // Native touch event handlers (non-passive for Safari)
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length > 0) {
          const rect = canvas.getBoundingClientRect();
          const coords = {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top,
          };
          isDrawingRef.current = true;
          setIsDrawing(true);
          setIsEmpty(false);
          lastPointRef.current = coords;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current || e.touches.length === 0) return;

        const rect = canvas.getBoundingClientRect();
        const coords = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };

        if (!lastPointRef.current) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        lastPointRef.current = coords;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        isDrawingRef.current = false;
        setIsDrawing(false);
        lastPointRef.current = null;
      };

      // Add touch event listeners with non-passive option for Safari
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      window.addEventListener('resize', handleResize);

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number;
      let clientY: number;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return null;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const coords = getCoordinates(e);
      if (!coords) return;

      isDrawingRef.current = true;
      setIsDrawing(true);
      setIsEmpty(false);
      lastPointRef.current = coords;
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;

      const coords = getCoordinates(e);
      if (!coords || !lastPointRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      lastPointRef.current = coords;
    };

    const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
      setIsDrawing(false);
      lastPointRef.current = null;
    };

    const handleClear = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
      }
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-48 cursor-crosshair touch-none"
            style={{ touchAction: 'none' }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
            Sign here
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear Signature
          </button>
          <p className="text-xs text-gray-500 flex items-center">
            <span className="mr-2">📱</span>
            Use your finger or mouse
          </p>
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
