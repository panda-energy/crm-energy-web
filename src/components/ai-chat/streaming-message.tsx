"use client";

import { useEffect, useState, useRef } from "react";
import { MarkdownContent } from "./markdown-content";

/**
 * StreamingMessage -- simulates typing effect for assistant messages.
 *
 * Progressively reveals characters (~30 chars every 50ms) to simulate
 * real-time streaming from an LLM endpoint. Once fully revealed,
 * renders the complete markdown.
 *
 * MSW returns the full message at once; this component creates the
 * illusion of streaming client-side.
 */

const CHARS_PER_TICK = 30;
const TICK_MS = 50;

export interface StreamingMessageProps {
  content: string;
  /** Whether to animate or show instantly (for old messages). */
  animate: boolean;
  onComplete?: () => void;
}

export function StreamingMessage({
  content,
  animate,
  onComplete,
}: StreamingMessageProps) {
  const [visibleLength, setVisibleLength] = useState(animate ? 0 : content.length);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef = useRef(!animate);

  useEffect(() => {
    if (!animate || completedRef.current) return undefined;

    intervalRef.current = setInterval(() => {
      setVisibleLength((prev) => {
        const next = prev + CHARS_PER_TICK;
        if (next >= content.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          completedRef.current = true;
          onComplete?.();
          return content.length;
        }
        return next;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [animate, content.length, onComplete]);

  const visibleContent = content.slice(0, visibleLength);

  return <MarkdownContent content={visibleContent} />;
}
