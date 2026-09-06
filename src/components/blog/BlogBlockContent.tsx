import { sanitizeBlogHtml } from "@/lib/blog-html";
import { cn } from "@/lib/utils";

type BlogBlockContentProps = {
  html: string;
  className?: string;
};

export function BlogBlockContent({ html, className }: BlogBlockContentProps) {
  const safe = sanitizeBlogHtml(html);
  return (
    <div
      className={cn(
        "blog-prose mx-auto max-w-2xl space-y-4 text-base leading-relaxed text-foreground/90",
        "[&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-semibold",
        "[&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold",
        "[&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold",
        "[&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-elevated [&_pre]:p-4",
        "[&_code]:font-mono [&_code]:text-sm",
        "[&_img]:rounded-xl [&_img]:border [&_img]:border-border",
        "[&_figure]:my-6",
        "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_.wp-block-buttons]:flex [&_.wp-block-buttons]:flex-wrap [&_.wp-block-buttons]:gap-3",
        "[&_.wp-block-button]:inline-flex [&_.wp-block-button]:rounded-lg [&_.wp-block-button]:bg-primary [&_.wp-block-button]:px-4 [&_.wp-block-button]:py-2 [&_.wp-block-button]:font-semibold [&_.wp-block-button]:text-primary-foreground",
        "[&_.wp-block-button.is-style-outline]:border [&_.wp-block-button.is-style-outline]:border-primary [&_.wp-block-button.is-style-outline]:bg-transparent [&_.wp-block-button.is-style-outline]:text-primary",
        "[&_.wp-block-columns]:grid [&_.wp-block-columns]:gap-4 [&_.wp-block-columns.count-2]:sm:grid-cols-2 [&_.wp-block-columns.count-3]:sm:grid-cols-3",
        "[&_.wp-block-gallery]:grid [&_.wp-block-gallery]:gap-3 [&_.wp-block-gallery.columns-2]:grid-cols-2 [&_.wp-block-gallery.columns-3]:grid-cols-3 [&_.wp-block-gallery.columns-4]:grid-cols-2 sm:[&_.wp-block-gallery.columns-4]:grid-cols-4",
        "[&_.wp-block-callout]:rounded-xl [&_.wp-block-callout]:border [&_.wp-block-callout]:border-border [&_.wp-block-callout]:bg-elevated [&_.wp-block-callout]:p-4",
        "[&_.wp-block-cover]:overflow-hidden [&_.wp-block-cover]:rounded-2xl",
        "[&_.wp-block-cover__inner]:flex [&_.wp-block-cover__inner]:min-h-[inherit] [&_.wp-block-cover__inner]:flex-col [&_.wp-block-cover__inner]:justify-end [&_.wp-block-cover__inner]:p-6 [&_.wp-block-cover__inner]:text-white",
        "[&_.wp-block-toc]:rounded-xl [&_.wp-block-toc]:border [&_.wp-block-toc]:border-border [&_.wp-block-toc]:bg-elevated [&_.wp-block-toc]:p-4",
        "[&_.ratio]:relative [&_.ratio]:aspect-video [&_.ratio_iframe]:absolute [&_.ratio_iframe]:inset-0 [&_.ratio_iframe]:size-full [&_.ratio_iframe]:rounded-xl",
        "[&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:p-2 [&_th]:border [&_th]:border-border [&_th]:bg-elevated [&_th]:p-2 [&_th]:text-left",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
