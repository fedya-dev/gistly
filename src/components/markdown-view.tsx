'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { CodeView } from '@/components/code-view'

interface MarkdownViewProps {
  content: string
  className?: string
}

export function MarkdownView({ content, className }: MarkdownViewProps) {
  return (
    <div className={cn('md-view', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 scroll-mt-24 border-b pb-2 text-2xl font-bold tracking-tight first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-6 scroll-mt-24 text-xl font-semibold tracking-tight first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-5 scroll-mt-24 text-lg font-semibold first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="my-3 leading-7 text-foreground/90">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1.5 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1.5 pl-6">{children}</ol>,
          li: ({ children }) => <li className="leading-7 pl-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-primary/50 bg-primary/5 py-1 pl-4 pr-3 text-foreground/80 italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-border" />,
          table: ({ children }) => (
            <div className="scroll-slim my-4 overflow-x-auto rounded-lg border">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b px-3.5 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border-b px-3.5 py-2 align-top">{children}</td>,
          img: ({ src, alt }) => (
            <img src={src} alt={alt ?? ''} className="my-4 max-w-full rounded-lg border" />
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const raw = String(children ?? '')
            const isBlock = /language-/.test(className ?? '') || raw.includes('\n')
            if (isBlock) {
              const lang = /language-([\w-]+)/.exec(className ?? '')?.[1] ?? 'text'
              return (
                <CodeView
                  code={raw.replace(/\n$/, '')}
                  language={lang}
                  className="my-4"
                  maxHeight="none"
                />
              )
            }
            return (
              <code className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
                {children}
              </code>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
