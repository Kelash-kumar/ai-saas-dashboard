import { EditorPage } from '@/components/crm/editor-page';
export default async function EditPage({ params }: { params: Promise<{ module: string; id: string }> }) {
    const { module, id } = await params;
    return <EditorPage module={module} id={id} mode="edit" />;
}
