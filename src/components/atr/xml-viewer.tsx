"use client";

/**
 * Stub for XML viewer — full implementation in F-4.4.
 */
interface XmlViewerProps {
  xml: string;
  filename?: string;
}

export function XmlViewer({ xml, filename }: XmlViewerProps) {
  return (
    <div className="rounded-md bg-muted p-4">
      <pre className="overflow-x-auto whitespace-pre-wrap text-xs font-mono">
        {xml}
      </pre>
    </div>
  );
}
