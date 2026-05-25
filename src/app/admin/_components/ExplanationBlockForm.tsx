'use client'

import { useState } from 'react'
import type { BlockType } from '@/types/database'

type DefaultValues = {
  block_order: number
  block_type: BlockType
  content: string
}

type Props = {
  questionId: string
  examId: string
  sectionId: string
  nextOrder?: number
  action: (formData: FormData) => Promise<void>
  mode?: 'create' | 'edit'
  defaultValues?: DefaultValues
}

export function ExplanationBlockForm({
  questionId,
  examId,
  sectionId,
  nextOrder,
  action,
  mode = 'create',
  defaultValues,
}: Props) {
  const [blockType, setBlockType] = useState<BlockType>(
    defaultValues?.block_type ?? 'text'
  )

  return (
    <form action={action} className="flex flex-col gap-3" encType="multipart/form-data">
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="exam_id" value={examId} />
      <input type="hidden" name="section_id" value={sectionId} />
      {/* Preserve existing image URL when no new file is uploaded */}
      {defaultValues?.block_type === 'image' && (
        <input type="hidden" name="existing_content" value={defaultValues.content} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            htmlFor="block_type"
          >
            Block Type
          </label>
          <select
            id="block_type"
            name="block_type"
            value={blockType}
            onChange={(e) => setBlockType(e.target.value as BlockType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
          </select>
        </div>
        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            htmlFor="block_order"
          >
            Order
          </label>
          <input
            id="block_order"
            name="block_order"
            type="number"
            required
            defaultValue={defaultValues?.block_order ?? nextOrder}
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {blockType === 'text' ? (
        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            htmlFor="content"
          >
            Text Content
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={4}
            defaultValue={
              defaultValues?.block_type === 'text' ? defaultValues.content : undefined
            }
            placeholder="Enter explanation text..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ) : (
        <div>
          <label
            className="block text-xs font-medium text-gray-700 mb-1"
            htmlFor="image"
          >
            Image File
          </label>
          {defaultValues?.block_type === 'image' && (
            <div className="mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={defaultValues.content}
                alt="Current explanation image"
                className="max-w-xs rounded-lg border border-gray-200"
              />
              <p className="text-xs text-gray-400 mt-1">Upload a new image to replace the current one</p>
            </div>
          )}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            required={mode === 'create'}
            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
          />
        </div>
      )}

      <button
        type="submit"
        className="self-start bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        {mode === 'edit' ? 'Save Changes' : 'Add Block'}
      </button>
    </form>
  )
}
