import fs from "node:fs";

const jsonPath = "src/data/astuces-blog-seed.json";
const tsPath = "src/data/astuces-blog-seed.ts";
const posts = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const ids = new Set(["ia_0001", "ia_0002", "ia_0005", "ia_0012", "ia_0019"]);
for (const post of posts) {
  if (ids.has(post.id)) post.trending = true;
}
fs.writeFileSync(jsonPath, JSON.stringify(posts, null, 2));
fs.writeFileSync(
  tsPath,
  `import type { StoredBlogPost } from "@/lib/blog-blocks";\n\nexport const astucesBlogSeed = ${JSON.stringify(posts, null, 2)} as unknown as StoredBlogPost[];\n`,
);
console.log("trending flagged");
