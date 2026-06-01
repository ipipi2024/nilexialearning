import { createAdminClient } from '@/lib/supabase/admin'
import { AiImportShell } from './AiImportShell'

type Props = {
  params: Promise<{ examId: string; sectionId: string }>
}

export default async function AiImportPage({ params }: Props) {
  const { examId, sectionId } = await params
  const admin = createAdminClient()

  const [{ data: section }, { data: questions }] = await Promise.all([
    admin.from('sections').select('name').eq('id', sectionId).single(),
    admin.from('questions').select('number, sub_label, display_label').eq('section_id', sectionId),
  ])

  const existingLabels = (questions ?? []).map(
    (q: { number: number; sub_label: string | null; display_label: string | null }) =>
      q.display_label ?? (q.sub_label ? `${q.number}(${q.sub_label})` : String(q.number))
  )

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/admin/exams/${examId}/sections/${sectionId}`}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          ← {section?.name ?? 'Section'}
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">AI Import Questions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload a screenshot of exam questions. AI will draft them for your review before saving.
        </p>
      </div>

      <AiImportShell examId={examId} sectionId={sectionId} existingLabels={existingLabels} />
    </div>
  )
}
