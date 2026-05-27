"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "@/lib/ui/toast";
import { cn } from "@/lib/utils/cn";

/**
 * Lightweight XML viewer with CSS-based syntax highlighting.
 * No external dependencies for highlighting — uses regex tokenization.
 *
 * Features:
 *  - Syntax highlighting for tags, attributes, values, comments
 *  - Copy to clipboard
 *  - Download as .xml file
 *  - Optional side-by-side diff view
 */

interface XmlViewerProps {
  xml: string;
  /** Second XML for side-by-side comparison. */
  xmlCompare?: string;
  filename?: string;
  className?: string;
}

export function XmlViewer({
  xml,
  xmlCompare,
  filename = "document.xml",
  className,
}: XmlViewerProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(xml);
      toast.success("XML copiado al portapapeles");
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }, [xml]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [xml, filename]);

  if (xmlCompare) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleCopy}>
            <Copy className="size-3" aria-hidden />
            Copiar
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
            <Download className="size-3" aria-hidden />
            Descargar
          </Button>
        </div>
        <XmlDiffView original={xml} corrected={xmlCompare} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1" onClick={handleCopy}>
          <Copy className="size-3" aria-hidden />
          Copiar
        </Button>
        <Button variant="outline" size="sm" className="gap-1" onClick={handleDownload}>
          <Download className="size-3" aria-hidden />
          Descargar
        </Button>
      </div>
      <XmlHighlighted xml={xml} />
    </div>
  );
}

/** Single XML panel with syntax highlighting. */
function XmlHighlighted({ xml }: { xml: string }) {
  const highlighted = useMemo(() => highlightXml(xml), [xml]);
  return (
    <div className="max-h-[500px] overflow-auto rounded-md border border-border bg-muted/50 p-4">
      <pre className="text-xs leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

/** Side-by-side diff view. */
function XmlDiffView({
  original,
  corrected,
}: {
  original: string;
  corrected: string;
}) {
  const origLines = original.split("\n");
  const corrLines = corrected.split("\n");
  const maxLen = Math.max(origLines.length, corrLines.length);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Original
        </p>
        <div className="max-h-[400px] overflow-auto rounded-md border border-border bg-muted/50 p-3">
          <pre className="text-xs leading-relaxed">
            {origLines.map((line, i) => {
              const isDiff = i < corrLines.length && line !== corrLines[i];
              return (
                <div
                  key={i}
                  className={cn(isDiff && "bg-red-100/50 dark:bg-red-900/20")}
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightXml(line),
                    }}
                  />
                </div>
              );
            })}
          </pre>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Corregido
        </p>
        <div className="max-h-[400px] overflow-auto rounded-md border border-border bg-muted/50 p-3">
          <pre className="text-xs leading-relaxed">
            {corrLines.map((line, i) => {
              const isDiff = i < origLines.length && line !== origLines[i];
              return (
                <div
                  key={i}
                  className={cn(isDiff && "bg-green-100/50 dark:bg-green-900/20")}
                >
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightXml(line),
                    }}
                  />
                </div>
              );
            })}
            {/* Extra lines in corrected */}
            {corrLines.length < maxLen &&
              Array.from({ length: maxLen - corrLines.length }).map((_, i) => (
                <div key={`empty-${i}`}>&nbsp;</div>
              ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ── Syntax highlighting via regex ──────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Lightweight XML syntax highlighting using regex.
 * Colorizes: comments, tags, attribute names, attribute values, text content.
 *
 * Uses Tailwind-compatible class names that work in both light and dark mode.
 * The colors are applied via inline spans with classes.
 */
function highlightXml(xml: string): string {
  let result = escapeHtml(xml);

  // XML declaration <?xml ... ?>
  result = result.replace(
    /(&lt;\?xml\b[^?]*\?&gt;)/g,
    '<span class="text-muted-foreground">$1</span>',
  );

  // Comments <!-- ... -->
  result = result.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="text-muted-foreground italic">$1</span>',
  );

  // Attribute values "..."
  result = result.replace(
    /(&quot;[^&]*&quot;)/g,
    '<span class="text-green-700 dark:text-green-400">$1</span>',
  );

  // Attribute names (word before =)
  result = result.replace(
    /\b([a-zA-Z_][\w.-]*)(=)/g,
    '<span class="text-orange-700 dark:text-orange-400">$1</span>$2',
  );

  // Closing tags </...>
  result = result.replace(
    /(&lt;\/)([\w:.-]+)(&gt;)/g,
    '<span class="text-blue-700 dark:text-blue-400">$1$2$3</span>',
  );

  // Self-closing tags <.../> and opening tags <...>
  result = result.replace(
    /(&lt;)([\w:.-]+)/g,
    '<span class="text-blue-700 dark:text-blue-400">$1$2</span>',
  );

  // Closing angle bracket
  result = result.replace(
    /(\/?&gt;)/g,
    '<span class="text-blue-700 dark:text-blue-400">$1</span>',
  );

  return result;
}
