import { notFound } from "next/navigation";
import { DocViewer } from "@/components/doc-viewer";
import { DocSidebar } from "@/components/doc-sidebar";
import { getDocBySlug, getDocNavigation, getAllDocSlugs } from "@/lib/docs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return {
      title: "文档未找到",
    };
  }

  return {
    title: `${doc.meta.title} - 使用文档`,
    description: doc.meta.title,
  };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugArray } = await params;
  const slug = slugArray.join("/");
  const doc = await getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const navigation = getDocNavigation();

  return (
    <div className="flex gap-4 md:gap-8">
      <DocSidebar sections={navigation} />
      <main className="flex-1 min-w-0">
        <div className="md:hidden mb-3">
          <MobileDocNav sections={navigation} />
        </div>
        <DocViewer content={doc.content} />
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
