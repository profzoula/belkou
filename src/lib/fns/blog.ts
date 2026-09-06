import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { BlogPost } from "@/lib/blog";

export type PublicBlogPost = BlogPost & {
  htmlBody: string;
  coverImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export const getPublicBlogPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublishedBlogPosts } = await import("@/server/site-content");
  const { storedToPublicPost } = await import("@/lib/blog-storage");
  const posts = await getPublishedBlogPosts();
  return {
    posts: posts.map((post) => {
      const publicPost = storedToPublicPost(post);
      return {
        ...publicPost,
        htmlBody: publicPost.htmlBody,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
      } satisfies PublicBlogPost;
    }),
  };
});

export const getPublicBlogPost = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ slug: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { getPublishedBlogPostBySlug } = await import("@/server/site-content");
    const { storedToPublicPost } = await import("@/lib/blog-storage");
    const post = await getPublishedBlogPostBySlug(data.slug);
    if (!post) return { post: null as PublicBlogPost | null };
    const publicPost = storedToPublicPost(post);
    return {
      post: {
        ...publicPost,
        htmlBody: publicPost.htmlBody,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
      } satisfies PublicBlogPost,
    };
  });
