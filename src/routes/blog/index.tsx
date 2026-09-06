import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexPage } from "@/components/blog/BlogIndexPage";
import { loadBlogIndex } from "@/lib/load-blog";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    seoHead({
      title: "Blog — BelKou",
      description:
        "Articles BelKou sur l'IA, la formation, le live et la tech.",
      path: "/blog",
    }),
  loader: () => loadBlogIndex(),
  component: BlogIndexRoute,
});

function BlogIndexRoute() {
  const posts = Route.useLoaderData();
  return <BlogIndexPage posts={posts} />;
}
