import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Inline formatting helper for bold (**text**) and italics (*text*)
function formatInlineText(text: string): React.ReactNode[] {
  // Regex to match **bold** or *italic*
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(
        <em key={`italic-${match.index}`} className="italic text-zinc-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    // If there is an unfinished formatting mark at the end (e.g. streaming **word), strip or display cleanly
    const rest = text.slice(lastIndex);
    tokens.push(rest.replace(/\*\*/g, ""));
  }

  return tokens.length > 0 ? tokens : [text];
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentListItems.length > 0) {
      if (isNumberedList) {
        nodes.push(
          <ol
            key={`ol-${nodes.length}`}
            className="my-2 space-y-1.5 list-decimal list-outside ml-5 text-zinc-100 font-medium leading-relaxed"
          >
            {currentListItems}
          </ol>
        );
      } else {
        nodes.push(
          <ul
            key={`ul-${nodes.length}`}
            className="my-2 space-y-1.5 list-disc list-outside ml-5 text-zinc-100 font-medium leading-relaxed"
          >
            {currentListItems}
          </ul>
        );
      }
      currentListItems = [];
      isNumberedList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Horizontal rule
    if (line === "---" || line === "***" || line === "___") {
      flushList();
      nodes.push(<hr key={`hr-${i}`} className="my-3 border-white/10" />);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <h3
          key={`h3-${i}`}
          className="text-white font-bold text-base sm:text-lg mt-3.5 mb-1.5 first:mt-0 tracking-tight"
        >
          {formatInlineText(line.slice(4).trim())}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <h2
          key={`h2-${i}`}
          className="text-white font-bold text-lg sm:text-xl mt-4 mb-2 first:mt-0 tracking-tight"
        >
          {formatInlineText(line.slice(3).trim())}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      nodes.push(
        <h1
          key={`h1-${i}`}
          className="text-white font-extrabold text-xl sm:text-2xl mt-4 mb-2 first:mt-0 tracking-tight"
        >
          {formatInlineText(line.slice(2).trim())}
        </h1>
      );
      continue;
    }

    // Unordered List Items: "* ", "- ", "• "
    if (line.startsWith("* ") || line.startsWith("- ") || line.startsWith("• ")) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      const itemText = line.slice(2).trim();
      currentListItems.push(
        <li key={`li-${i}`} className="pl-1 leading-relaxed">
          {formatInlineText(itemText)}
        </li>
      );
      continue;
    }

    // Numbered List Items: e.g. "1. ", "2. "
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      if (!isNumberedList && currentListItems.length > 0) flushList();
      isNumberedList = true;
      const itemText = numberedMatch[2].trim();
      currentListItems.push(
        <li key={`li-${i}`} className="pl-1 leading-relaxed">
          {formatInlineText(itemText)}
        </li>
      );
      continue;
    }

    // Normal paragraph
    flushList();
    nodes.push(
      <p
        key={`p-${i}`}
        className="my-1.5 leading-relaxed font-medium text-zinc-100 first:mt-0 last:mb-0"
      >
        {formatInlineText(line)}
      </p>
    );
  }

  flushList();

  return <div className={`space-y-1 ${className}`}>{nodes}</div>;
}
