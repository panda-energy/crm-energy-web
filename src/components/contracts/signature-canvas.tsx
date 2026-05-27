"use client";

import SignaturePad, { type PointGroup } from "signature_pad";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Reusable signature canvas component (F-3.5).
 *
 * Wraps signature_pad (vanilla) with React lifecycle:
 * - Clear, undo, redo controls
 * - Empty state detection with onChange callback
 * - toDataURL extraction for base64 PNG
 * - Responsive sizing via ResizeObserver
 * - Accessible labels and keyboard hint
 */
export interface SignatureCanvasProps {
  /** Called whenever the signature changes (non-empty) or is cleared. */
  onChange?: (dataUrl: string | null) => void;
  /** Canvas height in pixels. @default 200 */
  height?: number;
  /** Additional className for the outer wrapper. */
  className?: string;
  /** Whether the canvas is disabled. */
  disabled?: boolean;
  /** Pen color. @default "#000" */
  penColor?: string;
  /** Label for accessibility. */
  "aria-label"?: string;
}

export function SignatureCanvas({
  onChange,
  height = 200,
  className,
  disabled = false,
  penColor = "#000",
  "aria-label": ariaLabel = "Lienzo de firma",
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [undoStack, setUndoStack] = useState<PointGroup[][]>([]);
  const [redoStack, setRedoStack] = useState<PointGroup[][]>([]);

  // Initialize SignaturePad on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pad = new SignaturePad(canvas, {
      penColor,
      backgroundColor: "rgba(0,0,0,0)",
    });
    padRef.current = pad;

    // Resize canvas to container
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio ?? 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      // Restore data after resize
      const data = pad.toData();
      pad.clear();
      if (data.length > 0) {
        pad.fromData(data);
      }
    };

    resizeCanvas();

    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      pad.off();
      padRef.current = null;
    };
    // penColor is set on init only; changing it after mount is not supported
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pen color when prop changes
  useEffect(() => {
    if (padRef.current) {
      padRef.current.penColor = penColor;
    }
  }, [penColor]);

  // Handle disabled state
  useEffect(() => {
    if (padRef.current) {
      if (disabled) {
        padRef.current.off();
      } else {
        padRef.current.on();
      }
    }
  }, [disabled]);

  // Listen to end-stroke events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleEndStroke = () => {
      const pad = padRef.current;
      if (!pad) return;
      const data = pad.toData();
      setUndoStack((prev) => [...prev, data]);
      setRedoStack([]);
      const empty = pad.isEmpty();
      setIsEmpty(empty);
      onChange?.(empty ? null : pad.toDataURL("image/png"));
    };

    canvas.addEventListener("pointerup", handleEndStroke);
    canvas.addEventListener("pointerleave", handleEndStroke);

    return () => {
      canvas.removeEventListener("pointerup", handleEndStroke);
      canvas.removeEventListener("pointerleave", handleEndStroke);
    };
  }, [onChange]);

  const handleClear = useCallback(() => {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    if (data.length > 0) {
      setUndoStack((prev) => [...prev, data]);
    }
    pad.clear();
    setRedoStack([]);
    setIsEmpty(true);
    onChange?.(null);
  }, [onChange]);

  const handleUndo = useCallback(() => {
    const pad = padRef.current;
    if (!pad || undoStack.length === 0) return;
    const currentData = pad.toData();
    setRedoStack((prev) => [...prev, currentData]);
    const prevState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    pad.clear();
    if (prevState && prevState.length > 0) {
      pad.fromData(prevState);
    }
    const empty = pad.isEmpty();
    setIsEmpty(empty);
    onChange?.(empty ? null : pad.toDataURL("image/png"));
  }, [undoStack, onChange]);

  const handleRedo = useCallback(() => {
    const pad = padRef.current;
    if (!pad || redoStack.length === 0) return;
    const currentData = pad.toData();
    setUndoStack((prev) => [...prev, currentData]);
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    pad.clear();
    if (nextState && nextState.length > 0) {
      pad.fromData(nextState);
    }
    const empty = pad.isEmpty();
    setIsEmpty(empty);
    onChange?.(empty ? null : pad.toDataURL("image/png"));
  }, [redoStack, onChange]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed border-border bg-background transition-colors",
          disabled && "pointer-events-none opacity-50",
          !isEmpty && "border-solid border-primary/40",
        )}
      >
        <canvas
          ref={canvasRef}
          className="w-full touch-none"
          style={{ height }}
          role="img"
          aria-label={ariaLabel}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">
              Firme aqui con el raton o el dedo
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={disabled || undoStack.length === 0}
          aria-label="Deshacer trazo"
        >
          <Undo2 className="size-3.5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRedo}
          disabled={disabled || redoStack.length === 0}
          aria-label="Rehacer trazo"
        >
          <Redo2 className="size-3.5" aria-hidden />
        </Button>
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={disabled || isEmpty}
          aria-label="Borrar firma"
        >
          <Eraser className="mr-1 size-3.5" aria-hidden />
          Borrar
        </Button>
      </div>
    </div>
  );
}
