"use client";

import { useRef, forwardRef, useImperativeHandle } from "react";
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

    useImperativeHandle(ref, () => ({
      clear: () => {
        sigCanvas.current?.clear();
      },
      isEmpty: () => {
        return sigCanvas.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return sigCanvas.current?.toDataURL() ?? "";
      },
    }));

    const handleClear = () => {
      sigCanvas.current?.clear();
    };

    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className="relative bg-white border-3 border-dashed border-purple-200 rounded-xl overflow-hidden shadow-inner">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              className: "w-full h-48 cursor-crosshair",
              style: { touchAction: "none" },
            }}
            backgroundColor="white"
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
