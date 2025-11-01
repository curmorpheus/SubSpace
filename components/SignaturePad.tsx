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
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const isDrawingRef = useRef(false);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        if (canvas && ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          setIsEmpty(true);
        }
      },
      isEmpty: () => isEmpty,
      toDataURL: () => {
        return canvasRef.current?.toDataURL('image/png') ?? "";
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.error('Canvas not found');
        return;
      }

      // Initialize canvas context and event handlers
      const initializeCanvas = () => {
        const rect = canvas.getBoundingClientRect();

        // Don't initialize if canvas has no dimensions yet
        if (rect.width === 0 || rect.height === 0) {
          console.log('Canvas has no dimensions, waiting...');
          return false;
        }

        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d', { willReadFrequently: false });
        if (!ctx) {
          console.error('Could not get 2d context');
          return false;
        }

        // Store context in ref
        ctxRef.current = ctx;

        // Setup context styling
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        console.log('Canvas initialized:', { width: canvas.width, height: canvas.height, dpr });
        return true;
      };

      // Pointer event handlers
      const handlePointerDown = (e: PointerEvent) => {
        console.log('Pointer down');
        const rect = canvas.getBoundingClientRect();

        lastPosRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        isDrawingRef.current = true;
        setIsEmpty(false);

        canvas.setPointerCapture(e.pointerId);
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDrawingRef.current || !lastPosRef.current || !ctxRef.current) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctxRef.current.beginPath();
        ctxRef.current.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();

        lastPosRef.current = { x, y };
      };

      const handlePointerUp = (e: PointerEvent) => {
        console.log('Pointer up');
        isDrawingRef.current = false;
        lastPosRef.current = null;

        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      };

      // Use ResizeObserver to wait for canvas to have dimensions
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === canvas) {
            const rect = entry.contentRect;
            if (rect.width > 0 && rect.height > 0) {
              // Initialize if not already done
              if (!ctxRef.current) {
                if (initializeCanvas()) {
                  // Attach event listeners after successful initialization
                  canvas.addEventListener('pointerdown', handlePointerDown);
                  canvas.addEventListener('pointermove', handlePointerMove);
                  canvas.addEventListener('pointerup', handlePointerUp);
                  canvas.addEventListener('pointercancel', handlePointerUp);
                  console.log('Event listeners attached');
                }
              } else {
                // Canvas was resized, reinitialize
                const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
                initializeCanvas();
                if (ctxRef.current && imageData) {
                  ctxRef.current.putImageData(imageData, 0, 0);
                }
              }
            }
          }
        }
      });

      resizeObserver.observe(canvas);

      // Try immediate initialization in case canvas already has dimensions
      if (initializeCanvas()) {
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('pointercancel', handlePointerUp);
        console.log('Event listeners attached');
      }

      // Cleanup
      return () => {
        console.log('Cleaning up');
        resizeObserver.disconnect();
        canvas.removeEventListener('pointerdown', handlePointerDown);
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointercancel', handlePointerUp);
      };
    }, []);

    const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
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
            className="w-full h-48 block"
            style={{
              touchAction: 'none',
            }}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none select-none">
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
