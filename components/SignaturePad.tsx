"use client";

import { useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

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
    const sigCanvas = useRef<SignatureCanvas>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [signatureData, setSignatureData] = useState<string>("");
    const isRestoringRef = useRef(false);

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear();
        setSignatureData("");
      },
      isEmpty: () => {
        return sigCanvas.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return sigCanvas.current?.toDataURL() ?? "";
      },
    }));

    // Prevent scrolling when touching the signature pad (for mobile)
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const preventScroll = (e: TouchEvent) => {
        e.preventDefault();
      };

      container.addEventListener('touchstart', preventScroll, { passive: false });
      container.addEventListener('touchmove', preventScroll, { passive: false });

      return () => {
        container.removeEventListener('touchstart', preventScroll);
        container.removeEventListener('touchmove', preventScroll);
      };
    }, []);

    // Save signature data whenever user finishes drawing
    const handleEnd = () => {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        const data = sigCanvas.current.toDataURL();
        setSignatureData(data);
      }
    };

    // Restore signature when canvas resizes
    useEffect(() => {
      const canvasElement = sigCanvas.current?.getCanvas();
      if (!canvasElement) return;

      const resizeObserver = new ResizeObserver(() => {
        // Only restore if we have saved data and canvas is empty (which happens after resize)
        if (signatureData && sigCanvas.current && sigCanvas.current.isEmpty() && !isRestoringRef.current) {
          isRestoringRef.current = true;
          // Small delay to ensure canvas has finished resizing
          setTimeout(() => {
            if (sigCanvas.current) {
              sigCanvas.current.fromDataURL(signatureData);
            }
            isRestoringRef.current = false;
          }, 50);
        }
      });

      resizeObserver.observe(canvasElement);

      return () => {
        resizeObserver.disconnect();
      };
    }, [signatureData]);

    const handleClear = () => {
      sigCanvas.current?.clear();
      setSignatureData("");
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div
          ref={containerRef}
          className="relative bg-white border-3 border-dashed border-purple-200 rounded-xl overflow-hidden shadow-inner"
          style={{ touchAction: "none" }}
        >
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "w-full h-48 cursor-crosshair",
              style: {
                touchAction: "none",
                msTouchAction: "none",
                WebkitUserSelect: "none",
                userSelect: "none"
              } as React.CSSProperties,
            }}
            backgroundColor="white"
            onEnd={handleEnd}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-400 pointer-events-none">
            Sign here
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
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
