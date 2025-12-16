import type { TextBlockType } from "../../../../types/artifacts";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface TextBlockProps {
  block: TextBlockType;
}

export const TextBlock = ({ block }: TextBlockProps) => {
  if (!block?.payload?.content) {
    console.error("⚠️ TextBlock received invalid data:", block);
    return <div className="animate-pulse h-4 bg-gray-200 rounded"></div>;
  }

  return (
    <div className="prose prose-lg prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  showLineNumbers
                  wrapLines
                  wrapLongLines
                  language={match[1]}
                  // @ts-expect-error ignore it
                  style={
                    // @ts-expect-error ignore it
                    styles.solarizedDarkAtom as {
                      [key: string]: React.CSSProperties;
                    }
                  }
                  customStyle={{
                    margin: 0,
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    padding: 0,
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-[var(--color-palette-beige-4)] px-1 py-0.5 rounded text-xs"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children, ...props }) {
            return (
              <p
                className="mb-0 whitespace-pre-line overflow-wrap-break-word leading-relaxed"
                {...props}
              >
                {children}
              </p>
            );
          },
          h1({ children, ...props }) {
            return (
              <h1 className="text-lg font-semibold mt-2 mb-4" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="text-base font-semibold mt-5 mb-3" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3 className="text-base font-semibold mt-4 mb-2" {...props}>
                {children}
              </h3>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="mb-1" {...props}>
                {children}
              </li>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-2 border-[var(--color-palette-gold-dark)] pl-4 my-4 italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          strong({ children, ...props }) {
            return (
              <strong className="font-medium" {...props}>
                {children}
              </strong>
            );
          },
          em({ children, ...props }) {
            return (
              <em className="italic" {...props}>
                {children}
              </em>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table
                  className="min-w-full divide-y divide-gray-300 border border-gray-300"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          pre({ children, ...props }) {
            return (
              <pre className="overflow-x-auto min-w-full w-[300px]" {...props}>
                {children}
              </pre>
            );
          },
        }}
      >
        {block.payload.content}
      </ReactMarkdown>
    </div>
  );
};
