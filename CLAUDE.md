# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js project that generates PowerPoint presentations programmatically using [pptxgenjs](https://www.npmjs.com/package/pptxgenjs) v4.x. Each `.js` file at the repo root is a standalone slide-generation script that produces a `.pptx` file.

## Commands

```bash
# Install dependencies
npm install

# Generate a slide deck (run any create script)
node create_nersc_slide.js
```

There are no build, lint, or test scripts configured.

## Patterns

- **Standalone scripts**: Each `.js` file at the repo root is self-contained — it `require("pptxgenjs")`, creates a `new pptxgen()` instance, builds slides, and calls `pres.writeFile()` to produce a `.pptx`. No shared modules or utilities between scripts.
- **Layout**: Scripts assume `LAYOUT_16x9` (10×5.625 inches).
- **Color schemes**: Defined as hex constants at the top of each script (no shared theme).
- **Positioning**: All elements use absolute x/y/w/h coordinates in inches. KPI cards, charts, and text are laid out with computed offsets from constants like `MARGIN` and calculated widths.
- **Output**: Files are written to `d:/claude code/` (hardcoded absolute path). When creating new scripts, use `__dirname` or a relative path instead.

## pptxgenjs Key APIs in Use

- `pres.addSlide()` — create a slide
- `slide.background`, `slide.addShape()`, `slide.addText()`, `slide.addChart()` — populate slides
- `pres.shapes.RECTANGLE`, `pres.charts.DOUGHNUT` — built-in shape/chart types
- `pres.writeFile({ fileName })` — async output via Promise
- Rich text via array of `{ text, options }` objects passed to `addText()`
