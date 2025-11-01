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
    const [isEmpty, setIsEmpty] = useState(true);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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

    // Setup canvas context
    const setupCanvas = (canvas: HTMLCanvasElement) => {
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
    };

    // Get coordinates from event
    const getCoordinates = (
      canvas: HTMLCanvasElement,
      clientX: number,
      clientY: number
    ) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    // Draw line on canvas
    const drawLine = (
      canvas: HTMLCanvasElement,
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    };

    // Initialize canvas
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setupCanvas(canvas);

      // Touch event handlers for Safari (non-passive)
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 0) return;

        const coords = getCoordinates(
          canvas,
          e.touches[0].clientX,
          e.touches[0].clientY
        );

        isDrawingRef.current = true;
        lastPointRef.current = coords;
        setIsEmpty(false);
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        if (!isDrawingRef.current || e.touches.length === 0 || !lastPointRef.current) return;

        const coords = getCoordinates(
          canvas,
          e.touches[0].clientX,
          e.touches[0].clientY
        );

        drawLine(canvas, lastPointRef.current, coords);
        lastPointRef.current = coords;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        isDrawingRef.current = false;
        lastPointRef.current = null;
      };

      // Mouse event handlers
      const handleMouseDown = (e: MouseEvent) => {
        const coords = getCoordinates(canvas, e.clientX, e.clientY);
        isDrawingRef.current = true;
        lastPointRef.current = coords;
        setIsEmpty(false);
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!isDrawingRef.current || !lastPointRef.current) return;

        const coords = getCoordinates(canvas, e.clientX, e.clientY);
        drawLine(canvas, lastPointRef.current, coords);
        lastPointRef.current = coords;
      };

      const handleMouseUp = () => {
        isDrawingRef.current = false;
        lastPointRef.current = null;
      };

      // Resize handler
      const handleResize = () => {
        const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
        setupCanvas(canvas);
        if (imageData) {
          canvas.getContext('2d')?.putImageData(imageData, 0, 0);
        }
      };

      // Add event listeners
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mouseleave', handleMouseUp);

      window.addEventListener('resize', handleResize);

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('touchcancel', handleTouchEnd);

        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mouseleave', handleMouseUp);

        window.removeEventListener('resize', handleResize);
      };
    }, []);

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
