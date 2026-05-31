import { createAdminClient } from '@/lib/supabase/admin'
import { updateExplanationBlock } from '@/app/admin/actions'
import { ExplanationBlockForm } from '@/app/admin/_components/ExplanationBlockForm'

type Props = {
  params: Promise<{
    examId: string
    sectionId: string
    questionId: string
    blockId: string
  }>
}

export default async function EditExplanationBlockPage({ params }: Props) {
  const { examId, sectionId, questionId, blockId } = await params
  const admin = createAdminClient()

  const { data: block } = await admin
    .from('explanation_blocks')
    .select('*')
    .eq('id', blockId)
    .single()

  if (!block) {
    return <p className="text-gray-500">Explanation block not found.</p>
  }

  const action = updateExplanationBlock.bind(null, blockId)

  return (
    <div>
      <div className="mb-6">
        <a
          href={`/admin/exams/${examId}/sections/${sectionId}/questions/${questionId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← Question
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
          Edit Explanation Block #{block.block_order}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg">
        <ExplanationBlockForm
          questionId={questionId}
          examId={examId}
          sectionId={sectionId}
          mode="edit"
          defaultValues={{
            block_order: block.block_order,
            block_type: block.block_type,
            content: block.content,
          }}
          action={action}
        />
      </div>
    </div>
  )
}
