import { withClient, getPublicGardenOwnerUserId } from "@/lib/db";

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3040").replace(/\/$/, "");
  let userId: string;
  try {
    userId = getPublicGardenOwnerUserId();
  } catch {
    return [
      { url: base + "/", lastModified: new Date() },
      { url: `${base}/insights`, lastModified: new Date() },
      { url: `${base}/products`, lastModified: new Date() },
      { url: `${base}/products/canvascraft`, lastModified: new Date() },
      { url: `${base}/stack`, lastModified: new Date() },
      { url: `${base}/artifacts`, lastModified: new Date() },
      { url: `${base}/collider`, lastModified: new Date() },
    ];
  }

  const staticUrls: { url: string; lastModified: Date }[] = [
    { url: base + "/", lastModified: new Date() },
    { url: `${base}/insights`, lastModified: new Date() },
    { url: `${base}/products`, lastModified: new Date() },
    { url: `${base}/products/canvascraft`, lastModified: new Date() },
    { url: `${base}/stack`, lastModified: new Date() },
    { url: `${base}/artifacts`, lastModified: new Date() },
    { url: `${base}/collider`, lastModified: new Date() },
  ];

  try {
    const rows = await withClient(async (c) => {
      const content = await c.query(`SELECT slug, updated_at FROM public_garden.public_content_items
        WHERE user_id = $1 AND published = true AND archived_at IS NULL`, [userId]);
      const changelog = await c.query(`SELECT slug, updated_at FROM public_garden.public_changelog_posts
        WHERE user_id = $1 AND published = true AND archived_at IS NULL`, [userId]);
      const artifacts = await c.query(`SELECT slug, updated_at FROM public_garden.public_artifacts
        WHERE user_id = $1 AND published = true AND archived_at IS NULL`, [userId]);
      return { content: content.rows, changelog: changelog.rows, artifacts: artifacts.rows };
    });

    const urls = [...staticUrls];
    for (const r of rows.content as { slug: string; updated_at: string }[]) {
      urls.push({ url: `${base}/insights/${r.slug}`, lastModified: new Date(r.updated_at) });
    }
    for (const r of rows.changelog as { slug: string; updated_at: string }[]) {
      urls.push({ url: `${base}/changelog/${r.slug}`, lastModified: new Date(r.updated_at) });
    }
    for (const r of rows.artifacts as { slug: string; updated_at: string }[]) {
      urls.push({ url: `${base}/artifacts/${r.slug}`, lastModified: new Date(r.updated_at) });
    }
    return urls;
  } catch {
    return staticUrls;
  }
}
