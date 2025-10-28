import fs from "fs";
import path from "path";
import matter from "gray-matter";

const docsDirectory = path.join(process.cwd(), "docs");

export interface DocMeta {
  title: string;
  slug: string;
  category?: string;
}

export interface DocContent {
  meta: DocMeta;
  content: string;
}

export interface DocSection {
  title: string;
  items: Array<{
    title: string;
    slug: string;
  }>;
}

/**
 * Get all documentation slugs
 */
export function getAllDocSlugs(): string[] {
  const slugs: string[] = [];

  function walkDir(dir: string, prefix = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, prefix ? `${prefix}/${file}` : file);
      } else if (file.endsWith(".md")) {
        const slug = prefix ? `${prefix}/${file.replace(/\.md$/, "")}` : file.replace(/\.md$/, "");
        if (slug !== "index") {
          slugs.push(slug);
        }
      }
    });
  }

  walkDir(docsDirectory);
  return slugs;
}

/**
 * Get documentation content by slug
 */
export async function getDocBySlug(slug: string): Promise<DocContent | null> {
  try {
    const fullPath = path.join(docsDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Extract title from first h1 or use filename
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : data.title || slug.split("/").pop() || "Untitled";

    return {
      meta: {
        title,
        slug,
        category: slug.split("/")[0],
      },
      content,
    };
  } catch (error) {
    console.error(`Error reading doc: ${slug}`, error);
    return null;
  }
}

/**
 * Get documentation navigation structure
 */
export function getDocNavigation(): DocSection[] {
  return [
    {
      title: "快速开始",
      items: [
        { title: "账户注册与审核", slug: "getting-started/registration" },
      ],
    },
    {
      title: "相册功能",
      items: [
        { title: "浏览相册", slug: "features/albums/browsing" },
        { title: "上传照片", slug: "features/albums/uploading" },
      ],
    },
    {
      title: "文件管理",
      items: [
        { title: "文件分类", slug: "features/files/categories" },
        { title: "上传文件", slug: "features/files/uploading" },
        { title: "下载与管理", slug: "features/files/managing" },
      ],
    },
    {
      title: "管理员功能",
      items: [
        { title: "文件分类管理", slug: "admin/file-categories" },
        { title: "相册分类管理", slug: "admin/album-categories" },
      ],
    },
  ];
}
