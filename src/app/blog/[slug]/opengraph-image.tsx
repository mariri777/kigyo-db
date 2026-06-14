import { ImageResponse } from "next/og";
import { CATEGORY_LABEL, getPost } from "@/content/posts";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard } from "@/shared/og";

export const alt = "ブログ記事 | 超!企業DB";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return new ImageResponse(
      (
        <OgCard sectionLabel="Blog" title="記事が見つかりません" />
      ),
      { ...size },
    );
  }
  return new ImageResponse(
    (
      <OgCard
        sectionLabel={`Blog · ${CATEGORY_LABEL[post.category]}`}
        title={post.title}
        subtitle={post.lede.slice(0, 110)}
        chips={[
          post.publishedAt,
          `読了 ${post.readTimeMin} 分`,
          post.author === "ai-editor" ? "AI + 編集部" : "編集部",
        ]}
      />
    ),
    { ...size },
  );
}
