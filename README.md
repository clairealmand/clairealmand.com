# clairealmand.com

Claire Almand's personal site. Plain HTML, CSS, and a little JavaScript. No framework, no build step, no CMS.

## How it works
- `index.html` is the whole page. Each section is a chapter of one day, from 5:47 a.m. to 11:11 p.m.
- `assets/main.js` crossfades the background photos and updates the corner clock as you scroll.
- `assets/style.css` holds the design. Each chapter's accent color follows its time of day.
- `img/` holds Claire's photos and the Guild crests.

## Editing
Change the text in `index.html`, commit, and push. Every push to `main` deploys; every other branch gets its own preview link.

## AI search and SEO
- Structured data (schema.org Person and WebSite) sits in the `<head>` of `index.html`.
- `llms.txt` summarizes Claire for AI assistants. Keep it in step with the page.
- `robots.txt` and `sitemap.xml` are ready for launch.
- Before launch: remove the `noindex` meta tag in `index.html`.

## Hosting
Built for Cloudflare Pages (no build command, output directory `/`). `_headers` sets caching. Works the same on Netlify.
