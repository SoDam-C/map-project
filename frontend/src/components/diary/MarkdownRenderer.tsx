'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  content: string;
}

export function MarkdownRenderer({ content }: Props) {
  if (!content) return null;

  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-[var(--color-text)] prose-headings:font-bold
      prose-p:text-[var(--color-text)] prose-p:leading-relaxed
      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-blue-500 prose-blockquote:text-[var(--color-text-secondary)]
      prose-code:text-blue-300 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-[''] prose-code:after:content-['']
      prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10
      prose-img:rounded-lg prose-img:max-w-full
      prose-li:text-[var(--color-text)]
      prose-hr:border-white/10
      prose-table:text-sm
      prose-th:text-[var(--color-text-secondary)] prose-th:border-white/10
      prose-td:border-white/10
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
