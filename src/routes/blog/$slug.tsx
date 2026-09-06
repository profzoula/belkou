import { createFileRoute, notFound } from "@tanstack/react-router";
import { BlogArticlePage } from "@/components/blog/BlogArticlePage";
import { loadBlogPost, loadBlogIndex } from "@/lib/load-blog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await loadBlogPost(params.slug);
    if (!post) throw notFound();
    const related = (await loadBlogIndex())
      .filter((item) => item.slug !== post.slug)
      .slice(0, 3);
    return { post, related };
  },
  head: ({ loaderData }) =>
    seoHead({
      title: loaderData?.post
        ? loaderData.post.seoTitle || `${loaderData.post.title} — Blog BelKou`
        : "Article — Blog BelKou",
      description:
        loaderData?.post?.seoDescription || loaderData?.post?.excerpt,
      path: loaderData?.post ? `/blog/${loaderData.post.slug}` : "/blog",
    }),
  component: BlogArticleRoute,
});

function BlogArticleRoute() {
  const { post, related } = Route.useLoaderData();
  return <BlogArticlePage post={post} related={related} />;
}
