# Hornetsch — cozy art portfolio

A hand-written, single-page portfolio for **Hornetsch (Hornet)**, built with plain
HTML, CSS and JavaScript. No frameworks, no build step, and **nothing is minified
and no comments were stripped** — open any file and it is all readable.

## Run it

The folder already lives inside your XAMPP `htdocs`, so Apache can serve it
directly:

```
http://localhost/hornet-portfolio/
```

If Apache is not running, any static server works, for example:

```
php -S 127.0.0.1:8173 -t .
```

`index.html` also opens straight from disk in a browser, but serving it over
HTTP is nicer because the gallery's big images load lazily.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The whole page: hero, about, gallery, minigame, commissions, contact, footer, lightbox. |
| `styles.css` | Every style, in numbered sections with comments at the top. |
| `main.js` | Every behaviour, in numbered sections with comments at the top. |
| `pieces/` | Your original artwork, untouched. This is the source of truth. |
| `assets/thumbs/` | Web-sized copies of each piece used by the gallery grid. |
| `assets/sprites/` | Quaxly, Fuecoco and Sprigatito with the white background removed, used by the minigame. |
| `assets/favicon.svg` | A tiny hornet-with-a-hat favicon. |
| `tools/prepare-assets.ps1` | Regenerates the thumbnails and sprites from `pieces/`. |
| `tools/check.js` | Checks ids, image paths and CSS brace balance. |
| `tools/validate.js` | Checks HTML tag balance, anchors and image alt text. |
| `tools/shoot.js` | Optional: drives headless Edge to screenshot and smoke-test the page. |

## Adding new art

1. Drop the new PNG into `pieces/`.
2. Run `tools/prepare-assets.ps1` in PowerShell to build its thumbnail.
3. Copy one `<article class="card">` block in `index.html`, point the `src` at the
   new thumbnail and `data-full` at the file in `pieces/`, and give it a
   `data-category` of `pokemon`, `sonic`, `oc` or `fanart`.

## Things you can edit first

- **Art titles and captions** were guessed from the file names — the `<h3>` and
  `<p>` inside each card are safe to rewrite.
- **Contact details** in the "Come say hi" section are placeholders
  (`hornetsch@example.com`, `@hornetsch`, `hornetsch.art`).
- **Commission tiers** describe a general structure, not real prices — edit the
  `Sketch` / `Full Illustration` / `Reference Sheet` cards as you like.

## The minigame

"Starter Scramble" hides your three starter drawings behind nine bushes.
Sprigatito is the fastest and worth the most points, Fuecoco is slow and worth
the least, and every eleventh hit a sparkly guest appears. Combos multiply the
score, the high score is remembered in the browser, and there is keyboard
support with the `1`–`9` keys and `Space` to start.

## Little extras

Custom hornet cursor with a sparkle trail, day/night toggle (night brings out
fireflies), scroll progress bar, confetti buttons, a toaster-style welcome
message, animated counters, tilt-and-lift gallery cards, a lightbox with arrow
key navigation, and one secret konami code. Everything respects
`prefers-reduced-motion`.
