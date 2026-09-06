import { getPublicBlogPost, getPublicBlogPosts, type PublicBlogPost } from "@/lib/fns/blog";

export type { PublicBlogPost };

export async function loadBlogIndex(): Promise<PublicBlogPost[]> {
  const { posts } = await getPublicBlogPosts();
  return [...posts].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

export async function loadBlogPost(slug: string): Promise<PublicBlogPost | null> {
  const { post } = await getPublicBlogPost({ data: { slug } });
  return post;
}
