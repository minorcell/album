import { notFound } from "next/navigation";
import { DocViewer } from "@/components/doc-viewer";
import { DocSidebar } from "@/components/doc-sidebar";
import { getDocBySlug, getDocNavigation, getAllDocSlugs } from "@/lib/docs";

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
    <div className="flex gap-8">
      <DocSidebar sections={navigation} />
      <main className="flex-1 min-w-0">
        <DocViewer content={doc.content} />
      </main>
    </div>
  );
}
