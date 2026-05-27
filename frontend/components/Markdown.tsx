import type { ReactNode } from "react";

/**
 * Dependency-free Markdown renderer.
 *
 * Covers what a store admin realistically writes on policy / about / FAQ pages
 * and blog posts: headings (# .. ######), paragraphs with line breaks, bold,
 * italic, inline code, links, images, bullet + numbered lists, blockquotes,
 * horizontal rules, fenced code blocks and GFM tables. Builds React elements
 * directly — no dangerouslySetInnerHTML.
 */

type Props = { source: string; className?: string };

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "hr" }
  | { type: "code"; text: string }
  | { type: "table"; header: string[]; rows: string[][] };

function safeUrl(url: string): string {
  const u = (url || "").trim();
  return /^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : "#";
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`/g;
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${n++}`;
    if (m[1] !== undefined) {
      nodes.push(
        <img
          key={key}
          src={safeUrl(m[2])}
          alt={m[1]}
          className="my-4 max-w-full h-auto"
        />
      );
    } else if (m[3] !== undefined) {
      const href = safeUrl(m[4]);
      const external = /^https?:/i.test(href);
      nodes.push(
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-ink underline underline-offset-2 hover:text-rust"
        >
          {m[3]}
        </a>
      );
    } else if (m[5] !== undefined) {
      nodes.push(<strong key={key}>{m[5]}</strong>);
    } else if (m[6] !== undefined) {
      nodes.push(<em key={key}>{m[6]}</em>);
    } else if (m[7] !== undefined) {
      nodes.push(
        <code
          key={key}
          className="bg-neutral-100 px-1.5 py-0.5 rounded text-[0.9em]"
        >
          {m[7]}
        </code>
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function withBreaks(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split("\n").forEach((ln, j) => {
    if (j > 0) out.push(<br key={`${key}-br-${j}`} />);
    out.push(...renderInline(ln, `${key}-l${j}`));
  });
  return out;
}

function isBlockStart(line: string): boolean {
  return (
    /^#{1,6}\s+/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line) ||
    /^\s*>\s?/.test(line) ||
    line.trim().startsWith("```") ||
    /^\s*([-*_])\s*(\1\s*){2,}$/.test(line) ||
    line.trim().startsWith("|")
  );
}

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }

    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: "heading", level: h[1].length, text: h[2].trim() });
      i++;
      continue;
    }

    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      lines[i + 1].includes("-") &&
      /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])
    ) {
      const splitRow = (r: string) =>
        r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: buf.join("\n") });
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: buf.join("\n") });
  }
  return blocks;
}

const HEADING_CLASS: Record<number, string> = {
  1: "font-serif text-3xl md:text-4xl mt-8 mb-3",
  2: "font-serif text-2xl md:text-3xl mt-8 mb-3",
  3: "font-serif text-xl md:text-2xl mt-6 mb-2",
  4: "font-medium text-lg mt-5 mb-2",
  5: "font-medium text-base mt-4 mb-2",
  6: "font-medium text-sm uppercase tracking-wide mt-4 mb-2",
};

function renderBlock(b: Block, idx: number): ReactNode {
  const key = `b-${idx}`;
  switch (b.type) {
    case "heading": {
      const Tag = `h${b.level}` as keyof JSX.IntrinsicElements;
      return (
        <Tag key={key} className={HEADING_CLASS[b.level] || "font-medium mt-4 mb-2"}>
          {renderInline(b.text, key)}
        </Tag>
      );
    }
    case "p":
      return (
        <p key={key} className="text-neutral-700 leading-relaxed mb-4">
          {withBreaks(b.text, key)}
        </p>
      );
    case "ul":
      return (
        <ul
          key={key}
          className="list-disc pl-6 mb-4 space-y-1.5 text-neutral-700 leading-relaxed"
        >
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol
          key={key}
          className="list-decimal pl-6 mb-4 space-y-1.5 text-neutral-700 leading-relaxed"
        >
          {b.items.map((it, j) => (
            <li key={j}>{renderInline(it, `${key}-${j}`)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote
          key={key}
          className="border-l-2 border-ink pl-4 italic text-neutral-600 mb-4"
        >
          {withBreaks(b.text, key)}
        </blockquote>
      );
    case "hr":
      return <hr key={key} className="my-8 border-neutral-200" />;
    case "code":
      return (
        <pre
          key={key}
          className="bg-neutral-900 text-neutral-100 text-sm p-4 rounded mb-4 overflow-x-auto"
        >
          <code>{b.text}</code>
        </pre>
      );
    case "table":
      return (
        <div key={key} className="mb-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-neutral-100">
              <tr>
                {b.header.map((c, j) => (
                  <th
                    key={j}
                    className="p-2 text-left border border-neutral-200 font-medium"
                  >
                    {renderInline(c, `${key}-h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((c, j) => (
                    <td
                      key={j}
                      className="p-2 border border-neutral-200 text-neutral-700"
                    >
                      {renderInline(c, `${key}-${r}-${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

export default function Markdown({ source, className }: Props) {
  if (!source) return null;
  const blocks = parseBlocks(source);
  return <div className={className}>{blocks.map((b, i) => renderBlock(b, i))}</div>;
}
