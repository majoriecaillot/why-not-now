# Why Not Now — static site

A static rebuild of the "Why Not Now" WordPress/Elementor site. There's no server-side
code. A small Node build turns Markdown posts into plain HTML pages, and Majorie writes
posts in the browser with [Sveltia CMS](https://github.com/sveltia/sveltia-cms).

```
index.html            homepage (newest 3 posts are injected at <!-- LATEST_POSTS -->)
content/posts/*.md    blog posts, one Markdown file each (written by the CMS)
templates/page.html   layout for the blog list and post pages
scripts/build.mjs     build: everything above -> dist/
admin/                the CMS editor (index.html + config.yml)
assets/css, js, img   styles, contact-form script, site images
assets/uploads/       photos uploaded through the CMS
.github/workflows/    GitHub Pages build and deploy
docs/HOW-TO-POST.md   guide for Majorie
```

## Build and preview

```bash
npm install
npm run preview      # builds into dist/ and serves it at http://localhost:8000
```

The deploy workflow sets `SITE_URL` to the Pages address, so shared posts get full
image URLs for Facebook previews.

## How posting works

Live site: https://majoriecaillot.github.io/why-not-now/ (editor at `/admin/`).

1. Majorie opens `/admin/` and writes a post.
2. Sveltia, running entirely in her browser, commits a Markdown file to
   `content/posts/` through the GitHub API.
3. `.github/workflows/deploy.yml` runs `npm run build` and publishes `dist/` to
   GitHub Pages, so the post is live a couple of minutes later.

There is no server. Sign-in uses Sveltia's **Sign In Using Access Token** with a
fine-grained GitHub token limited to this one repo. Other devices are added with
**Sign In with Mobile** (QR code) from a signed-in device. The token lives only in
the browser's local storage; never commit it.

### Setup checklist

- [x] Repo `majoriecaillot/why-not-now` created and pushed.
- [ ] As Majorie: **Settings → Pages → Build and deployment → Source: GitHub
      Actions**, then re-run the "Deploy to GitHub Pages" workflow.
- [ ] As Majorie: create a fine-grained token (Settings → Developer settings →
      Fine-grained tokens): repository access **Only select repositories →
      why-not-now**, permission **Contents: Read and write**. Store it in her
      password manager.
- [ ] Sign her in at `/admin/` with that token, then **Sign In with Mobile** for her phone.
- [ ] Custom domain (later): add it under Settings → Pages, update `site_url` /
      `display_url` in `admin/config.yml`, then retire the WordPress site.

When the token expires, create a new one the same way and sign in again.

To try the editor locally without a token: run `npm run preview`, open
`http://localhost:8000/admin/` in Chrome or Edge, and choose **Work with Local
Repository**.

## Social links

LinkedIn, Instagram and Facebook are linked in `index.html`, in both the hero and
the contact section. To change a profile URL, update it in both places.

## Contact form

A static site has no server to receive form posts. The form posts to whatever URL is
in the `data-endpoint` attribute on `<form id="contact-form">`. Until you set that
URL, the form validates input and then tells the visitor that their message was not
sent.

To get messages by email, create a form with a hosted form service and paste its
endpoint into `data-endpoint`. Examples:

- **Formspree**: `https://formspree.io/f/<your-form-id>`. The hidden `_gotcha` field
  is already set up as Formspree's spam honeypot.
- **Web3Forms / Getform / Basin**: same idea. Add any hidden fields they require,
  such as an access key.

If you host on Netlify, you can use Netlify Forms instead. Add `name="contact"` and
`data-netlify="true"` to the form and remove the JS `fetch`.

## Not carried over from the original

- The About, Work and Contact subpages. They held only theme demo content
  (placeholder portfolio items, `hello@ricarhdh.com`).
- The "Click here" buttons, which linked to `#`.
- The original portrait in the hero, replaced with "website image" from the
  media library at Majorie's request.
