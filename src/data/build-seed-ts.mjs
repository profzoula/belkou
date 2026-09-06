import fs from "node:fs";

const json = fs.readFileSync(
  new URL("./astuces-blog-seed.json", import.meta.url),
  "utf8",
);
const posts = JSON.parse(json);
const out = `import type { StoredBlogPost } from "@/lib/blog-blocks";

export const astucesBlogSeed = ${JSON.stringify(posts, null, 2)} as unknown as StoredBlogPost[];
`;
fs.writeFileSync(new URL("./astuces-blog-seed.ts", import.meta.url), out);
console.log("wrote", posts.length, "posts to astuces-blog-seed.ts");
