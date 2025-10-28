import { DocViewer } from "@/components/doc-viewer";
import { DocSidebar } from "@/components/doc-sidebar";
import { getDocBySlug, getDocNavigation } from "@/lib/docs";

export default async function HelpPage() {
  // Load the docs index as the default landing content
  const doc = await getDocBySlug("index");
  const navigation = getDocNavigation();

  return (
    <div className="flex gap-8">
      <DocSidebar sections={navigation} />
      <main className="flex-1 min-w-0">
        {doc ? (
          <DocViewer content={doc.content} />
        ) : (
          <div className="text-muted-foreground">文档首页缺失，请联系管理员。</div>
        )}
      </main>
    </div>
  );
}
