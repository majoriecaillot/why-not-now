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
docs/HOW-TO-POST.md   guide for Majorie
```

## Build and preview

```bash
npm install
npm run preview      # builds into dist/ and serves it at http://localhost:8000
```

Set `SITE_URL` (e.g. `SITE_URL=https://example.com npm run build`) so shared posts
get full image URLs for Facebook previews.

## How posting works

1. Majorie opens `/admin`, signs in with GitHub and writes a post.
2. Sveltia (running entirely in her browser) commits a Markdown file to
   `content/posts/` through the GitHub API.
3. The static host sees the commit, runs `npm run build` and publishes `dist/`.

The only server piece is the OAuth sign-in helper,
[sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth). GitHub needs a
client secret to finish a login, and that secret can't live in the browser.

### Setup checklist

- [ ] Create the GitHub repo and push this project; add Majorie as a collaborator.
- [ ] Create a GitHub OAuth App (callback: `https://<auth host>/callback`).
- [ ] Deploy sveltia-cms-auth (Cloudflare Worker or similar) with the app's client
      ID/secret, and `ALLOWED_DOMAINS` set to the site's domain.
- [ ] Fill in `repo` and `base_url` in `admin/config.yml` (marked TODO).
- [ ] Connect the repo to the host (e.g. Cloudflare Pages): build command
      `npm run build`, output directory `dist`, env `SITE_URL`.
- [ ] Point the domain at the host, then retire the WordPress site.

To try the editor before sign-in exists: run `npm run preview`, open
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
