import { DocViewer } from "@/components/doc-viewer";
import { DocSidebar } from "@/components/doc-sidebar";
import { getDocBySlug, getDocNavigation } from "@/lib/docs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default async function HelpPage() {
  // Load the docs index as the default landing content
  const doc = await getDocBySlug("index");
  const navigation = getDocNavigation();

  return (
    <div className="flex gap-4 md:gap-8">
      <DocSidebar sections={navigation} />
      <main className="flex-1 min-w-0">
        <div className="md:hidden mb-3">
          <MobileDocNav sections={navigation} />
        </div>
        {doc ? (
          <DocViewer content={doc.content} />
        ) : (
          <div className="text-muted-foreground">文档首页缺失，请联系管理员。</div>
        )}
      </main>
    </div>
  );
}

function MobileDocNav({ sections }: { sections: ReturnType<typeof getDocNavigation> }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Menu className="h-4 w-4" />
          文档目录
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>文档目录</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{section.title}</h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <a href={`/help/${item.slug}`} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
                      {item.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
