// Builds the static site into dist/:
//   - copies index.html, assets/ and admin/
//   - renders each content/posts/*.md into dist/blog/<slug>/index.html
//   - renders the blog list at dist/blog/index.html
//   - injects the newest three posts into the homepage at <!-- LATEST_POSTS -->
//
// Set SITE_URL (e.g. https://whynotnow.example) so shared links get full image URLs.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const COPY = ['index.html', 'assets', 'admin'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function isoDate(value) {
  // YAML turns 2026-11-16 into a Date; the editor may also write a plain string.
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value || '').slice(0, 10);
}

function prettyDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// Uploaded images are stored as /assets/uploads/...; make them relative so pages work in any folder.
const relUrl = (url, root) => (url && url.startsWith('/') ? root + url.slice(1) : url);
const absUrl = (url) => (url && url.startsWith('/') && SITE_URL ? SITE_URL + url : url);

async function readPosts() {
  const files = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.md'));
  const posts = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      if (data.draft) continue;
      if (!data.title || !data.date) {
        console.warn(`Skipping ${file}: it needs a title and a date.`);
        continue;
      }
      posts.push({
        slug: file.replace(/\.md$/, ''),
        title: data.title,
        date: isoDate(data.date),
        summary: data.summary || '',
        image: data.image || '',
        body: content
      });
    } catch (err) {
      console.error(`Could not read post ${file}:`, err);
      throw err;
    }
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

function card(post, root) {
  return `<a class="post-card" href="${root}blog/${esc(post.slug)}/">
  <time datetime="${post.date}">${prettyDate(post.date)}</time>
  <h3>${esc(post.title)}</h3>
  <p>${esc(post.summary)}</p>
</a>`;
}

function page(template, { title, description, root, content, headExtra = '' }) {
  const vars = { title: esc(title), description: esc(description), root, content, head_extra: headExtra, year: String(new Date().getFullYear()) };
  return template.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
}

async function main() {
  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });
  for (const item of COPY) {
    await fs.cp(path.join(ROOT, item), path.join(DIST, item), { recursive: true });
  }

  const template = await fs.readFile(path.join(ROOT, 'templates', 'page.html'), 'utf8');
  const posts = await readPosts();

  // One page per post
  for (const post of posts) {
    const root = '../../';
    const image = post.image ? `<img class="post-image" src="${esc(relUrl(post.image, root))}" alt="">` : '';
    const og = [
      `<meta property="og:type" content="article">`,
      `<meta property="og:title" content="${esc(post.title)}">`,
      `<meta property="og:description" content="${esc(post.summary)}">`,
      SITE_URL ? `<meta property="og:url" content="${esc(SITE_URL)}/blog/${esc(post.slug)}/">` : '',
      post.image && SITE_URL ? `<meta property="og:image" content="${esc(absUrl(post.image))}">` : ''
    ].filter(Boolean).join('\n');
    const content = `<section>
  <div class="wrap">
    <article class="post">
      <a class="text-link" href="../">← All reflections</a>
      <time datetime="${post.date}">${prettyDate(post.date)}</time>
      <h1>${esc(post.title)}</h1>
      ${image}
      <div class="post-body">${marked.parse(post.body).replaceAll('src="/', `src="${root}`)}</div>
    </article>
  </div>
</section>`;
    const out = path.join(DIST, 'blog', post.slug, 'index.html');
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, page(template, { title: `${post.title} · Why Not Now`, description: post.summary, root, content, headExtra: og }));
  }

  // Blog list
  const listRoot = '../';
  const list = `<section class="blog-hero">
  <div class="wrap stack">
    <p class="eyebrow">Daily reflections</p>
    <h1>Living with purpose</h1>
    <p class="lede">A short reflection each day on faith, gratitude, and making today count.</p>
  </div>
</section>
<section style="padding-top:0">
  <div class="wrap">
    ${posts.length ? `<div class="posts">${posts.map((p) => card(p, listRoot)).join('\n')}</div>` : '<p class="posts-empty">New reflections are on the way.</p>'}
  </div>
</section>`;
  await fs.mkdir(path.join(DIST, 'blog'), { recursive: true });
  await fs.writeFile(path.join(DIST, 'blog', 'index.html'), page(template, { title: 'Daily Reflections · Why Not Now', description: 'Daily reflections on living with purpose.', root: listRoot, content: list }));

  // Homepage: newest three posts
  const indexPath = path.join(DIST, 'index.html');
  const index = await fs.readFile(indexPath, 'utf8');
  if (!index.includes('<!-- LATEST_POSTS -->')) throw new Error('index.html is missing the <!-- LATEST_POSTS --> marker');
  const latest = posts.length ? posts.slice(0, 3).map((p) => card(p, '')).join('\n') : '<p class="posts-empty">New reflections are on the way.</p>';
  await fs.writeFile(indexPath, index.replace('<!-- LATEST_POSTS -->', latest));

  console.log(`Built ${posts.length} post(s) into dist/`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
