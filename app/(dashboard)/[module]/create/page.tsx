import { EditorPage } from '@/components/crm/editor-page';
export default async function CreatePage({ params }: { params: Promise<{ module: string }> }) {
    const { module } = await params;
    return <EditorPage module={module} mode="create" />;
}
