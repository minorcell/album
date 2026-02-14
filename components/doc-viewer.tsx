'use client';

import { Card } from '@/components/ui/card';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocViewerProps {
  content: string;
}

export function DocViewer({ content }: DocViewerProps) {
  function normalizeDocHref(href?: string): { href: string; external: boolean } {
    if (!href) return { href: '#', external: false };
    // External links
    if (/^https?:\/\//i.test(href)) return { href, external: true };
    // Anchors in-page
    if (href.startsWith('#')) return { href, external: false };
    // Normalize internal doc links
    // Examples: "./getting-started/registration.md", "features/files/uploading.md", "/help/features/files/uploading"
    let base = href.replace(/^\.\//, '');
    // Remove docs/ prefix if present
    base = base.replace(/^docs\//, '');
    // Strip .md extension
    base = base.replace(/\.md$/i, '');
    // If already starts with /help, leave as absolute; otherwise prefix
    const final = base.startsWith('/help/') ? base : `/help/${base}`;
    return { href: final, external: false };
  }

  return (
    <Card className="prose prose-sm dark:prose-invert max-w-none p-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mt-1 mb-2 text-3xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="mt-5 mb-2 text-2xl font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-4 mb-1 text-xl font-medium">{children}</h3>,
          h4: ({ children }) => <h4 className="mt-3 mb-1 text-lg font-medium">{children}</h4>,
          p: ({ children }) => <p className="my-2 leading-7">{children}</p>,
          ul: ({ children }) => <ul className="my-2 ml-6 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 ml-6 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-primary text-muted-foreground my-3 border-l-4 pl-4 italic">
              {children}
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
                {children}
              </code>
            ) : (
              <code
                className="bg-muted my-3 block overflow-x-auto rounded-lg p-4 font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            ),
          pre: ({ children }) => <div className="my-3">{children}</div>,
          a: ({ href, children }) => {
            const info = normalizeDocHref(href as string | undefined);
            return info.external ? (
              <a
                href={info.href}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ) : (
              <Link href={info.href} className="text-primary hover:underline">
                {children}
              </Link>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2">{children}</td>,
          hr: () => <hr className="border-border my-5" />,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </Card>
  );
}
