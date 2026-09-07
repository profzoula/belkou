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
      .sort((a, b) => {
        const score = (item: typeof a) =>
          (item.category === post.category ? 3 : 0) +
          (item.tags?.filter((tag) => post.tags?.includes(tag)).length ?? 0);
        return score(b) - score(a);
      })
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
      ogImage: loaderData?.post?.coverImageUrl,
    }),
  component: BlogArticleRoute,
});

function BlogArticleRoute() {
  const { post, related } = Route.useLoaderData();
  return <BlogArticlePage post={post} related={related} />;
}
