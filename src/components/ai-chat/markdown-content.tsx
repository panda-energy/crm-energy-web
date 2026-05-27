"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

/**
 * MarkdownContent -- renders assistant markdown safely.
 *
 * Uses react-markdown with remark-gfm for tables, strikethrough, etc.
 * Custom component mapping ensures token-based styling.
 */

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-base font-bold">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-2.5 text-sm font-bold">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-sm font-semibold">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-1.5 ml-4 list-disc space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ children, className }) => {
    // Inline code vs code block
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded bg-muted/70 p-2 text-xs">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-muted/70 px-1 py-0.5 text-xs">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <pre className="mb-1.5">{children}</pre>,
  blockquote: ({ children }) => (
    <blockquote className="mb-1.5 border-l-2 border-brand/50 pl-3 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand underline underline-offset-2 hover:text-brand/80"
    >
      {children}
    </a>
  ),
  table: ({ children }) => (
    <div className="mb-1.5 overflow-x-auto">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/50 px-2 py-1">{children}</td>
  ),
};

export interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
