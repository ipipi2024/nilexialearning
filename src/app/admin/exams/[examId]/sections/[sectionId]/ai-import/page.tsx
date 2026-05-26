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
    admin.from('questions').select('number').eq('section_id', sectionId),
  ])

  const existingNumbers = questions?.map((q) => q.number) ?? []

  return (
    <div className="space-y-6">
      <div>
        <a
          href={`/admin/exams/${examId}/sections/${sectionId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {section?.name ?? 'Section'}
        </a>
        <h1 className="text-xl font-bold text-gray-900 mt-2">AI Import Questions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload a screenshot of exam questions. AI will draft them for your review before saving.
        </p>
      </div>

      <AiImportShell examId={examId} sectionId={sectionId} existingNumbers={existingNumbers} />
    </div>
  )
}
