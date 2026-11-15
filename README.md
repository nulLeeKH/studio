# studio

Source for https://studio.nulleekh.com. One page collecting what BURGESS1977™ has made. A Node script turns `products/` into static HTML (Korean at `/`, English at `/en/`), and GitHub Actions deploys it to GitHub Pages.

```bash
pnpm install   # Node 24+
pnpm dev       # http://127.0.0.1:8081
pnpm test
pnpm build     # dist/
```

## Products

Each product is one folder holding its introduction, documents and images. The product list follows folder name order; the numeric sort prefix (`01-` and so on) is left out of public URLs.

```
products/01-wesualizer/
  index.md
  thumbnail.png       # optional source picture (.png, .jpg or .webp), 16:10 recommended
  privacy/
    ko.md
    en.md
    diagram.png
  files/
    policy.pdf
```

The front matter of the root `index.md` is what the product list shows.

```markdown
---
name: Wesualizer
url: https://example.com
summary_ko: 한 줄 설명
summary_en: One-line summary
draft: true
---

Everything from here is the body shown at /wesualizer/. It can be omitted.
```

`name` is required. Without `url`, the list shows "준비 중" ("Coming soon" on `/en/`). `summary_ko` and `summary_en` go together. `draft: true` only hides the product from the Korean and English product lists and counts. Its root page, documents, images and attachments stay public, so a privacy policy can be published first. To list the product, delete the `draft` line or set it to `false`.

A product's title in the list links to its studio page (`/wesualizer/` and so on). The URL below the title links to the actual service.

## Thumbnail and share card

Put one source picture next to `index.md` as `thumbnail.png`, `thumbnail.jpg` or `thumbnail.webp`, at full size. The build derives the rest and does not publish the source:

- `/<product>/thumbnail.webp`: always 1600×1000, shown in the list and on the product page inside a 16:10 dashed frame. The whole picture is scaled to fit and centered, never cropped; any other ratio gets transparent margins.
- `/<product>/og.jpg`: the 1200×630 share card for the product's pages. The whole picture sits on a dark background with a white dashed line around it. Pages of a product without a picture use the site card, `static/og.jpg`.

16:10 fills the frame exactly. Screens of other shapes, portrait phones included, still fit without cropping.

## Documents and files

The path without `products/` and the numeric sort prefix becomes the URL. Markdown is served as HTML without the extension; images and other files are served as they are, extension included. Each folder's `index.md` is that folder's root.

| File | URL |
|---|---|
| `products/01-wesualizer/index.md` | `/wesualizer/` |
| `products/01-wesualizer/privacy/ko.md` | `/wesualizer/privacy/ko/` |
| `products/01-wesualizer/privacy/en.md` | `/wesualizer/privacy/en/` |
| `products/01-wesualizer/help/index.md` | `/wesualizer/help/` |
| `products/01-wesualizer/privacy/diagram.png` | `/wesualizer/privacy/diagram.png` |
| `products/01-wesualizer/files/policy.pdf` | `/wesualizer/files/policy.pdf` |

Write documents in plain Markdown. The first `#` heading becomes the page title; without one, the file name is used. Standard CommonMark (headings, emphasis, quotes, lists, code, rules, links, images and so on) and GFM tables, strikethrough, task lists and footnotes are supported. Raw HTML is shown as text.

Documents other than the root product introduction can add the following. `lang` is `ko` (default) or `en`.

```markdown
---
title: Wesualizer Privacy Policy
lang: en
---

# Privacy Policy

Policy text.
```

Relative paths to images, attachments and other documents are resolved from **the folder of the source Markdown file**. For example, in `privacy/ko.md`:

```markdown
![Alt text describing the image](diagram.png "Caption shown below the image")
[English](en.md)
[Attachment](../files/policy.pdf)
```

A paragraph holding only one image becomes a figure, with the quoted title as its caption. The `![alt text]` is the description screen readers read, separate from the caption. The caption is not repeated as a tooltip. Without a caption, the image and its alt text are still shown.

`.md` in document links is turned into the extensionless URL at build time. Documents and files are not linked from the product list automatically.

Write product and document paths in lowercase letters, digits and hyphens. The build reports a product URL that collides with `en` or a file or folder in `static/`, products or documents that end up at the same URL, and file and folder conflicts. Files and folders starting with a dot are not deployed, and symbolic links are not allowed. Every other file is public.

`pnpm dev` picks up changes to product introductions, documents, images and files. A document URL without the trailing `/` redirects to the one with it.

## Commits

`<type>: <subject>`, checked by commitlint.

| Type | When |
|---|---|
| `product` | Add, change or take down a product |
| `site` | Design, code, configuration |

## Deploy

Pushing to `main` deploys the site (`.github/workflows/deploy.yml`).

## License

- Content and logo: © BURGESS1977™
- Font: [D2Coding](https://github.com/naver/d2codingfont) 1.3.3, SIL Open Font License 1.1 (`static/fonts/OFL.txt`).

A studio by [nulLeeKH](https://blog.nulleekh.com)
