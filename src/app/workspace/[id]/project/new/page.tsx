import { CreateProjectForm } from "@/app/components/CreateProjectForm";
import Link from "next/link";

export default async function NewProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow mb-8">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <Link href={`/workspace/${id}`} className="text-blue-500 hover:underline">
                        ← Back to Workspace
                    </Link>
                </div>
            </header>

            {/* Form */}
            <CreateProjectForm workspaceId={id} />
        </div>
    );
}