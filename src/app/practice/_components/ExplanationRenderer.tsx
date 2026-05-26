'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import type { ExplanationBlock } from '@/types/database'

type Props = { blocks: ExplanationBlock[] }

export function ExplanationRenderer({ blocks }: Props) {
  if (!blocks.length) {
    return (
      <p className="text-sm text-gray-400 italic">No explanation available.</p>
    )
  }

  return (
    <div className="space-y-3">
      {blocks.map((block) => {
        if (block.block_type === 'image') {
          return (
            <img
              key={block.id}
              src={block.content}
              alt="Explanation"
              className="max-w-full h-auto rounded-lg border border-gray-200"
            />
          )
        }

        return (
          <div key={block.id} className="overflow-x-auto">
            <div className="prose prose-sm max-w-none text-gray-700 break-words min-w-0">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {block.content}
              </ReactMarkdown>
            </div>
          </div>
        )
      })}
    </div>
  )
}
