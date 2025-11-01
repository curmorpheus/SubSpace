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
    const lastXRef = useRef<number>(0);
    const lastYRef = useRef<number>(0);

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

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Setup canvas
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;

      // Pointer event handlers (works for mouse, touch, and pen)
      const pointerDown = (e: PointerEvent) => {
        e.preventDefault();

        const rect = canvas.getBoundingClientRect();
        lastXRef.current = e.clientX - rect.left;
        lastYRef.current = e.clientY - rect.top;
        isDrawingRef.current = true;
        setIsEmpty(false);

        // Capture the pointer
        canvas.setPointerCapture(e.pointerId);
      };

      const pointerMove = (e: PointerEvent) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastXRef.current, lastYRef.current);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastXRef.current = x;
        lastYRef.current = y;
      };

      const pointerUp = (e: PointerEvent) => {
        if (isDrawingRef.current) {
          e.preventDefault();
          isDrawingRef.current = false;

          // Release the pointer
          if (canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
          }
        }
      };

      // Add pointer event listeners
      canvas.addEventListener('pointerdown', pointerDown);
      canvas.addEventListener('pointermove', pointerMove);
      canvas.addEventListener('pointerup', pointerUp);
      canvas.addEventListener('pointercancel', pointerUp);

      return () => {
        canvas.removeEventListener('pointerdown', pointerDown);
        canvas.removeEventListener('pointermove', pointerMove);
        canvas.removeEventListener('pointerup', pointerUp);
        canvas.removeEventListener('pointercancel', pointerUp);
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
            className="w-full h-48"
            style={{
              touchAction: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none',
              WebkitTouchCallout: 'none'
            }}
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
