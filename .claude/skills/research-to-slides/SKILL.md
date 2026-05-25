---
name: research-to-slides
description: "Use this skill when the user wants to create a research presentation about a company or industry. The user provides a company name or industry name, and you autonomously research public information (financial reports, market data, news, competitive landscape, etc.) and generate a professional, well-designed PowerPoint presentation using the user's template. Trigger when the user mentions researching a company/industry and turning it into slides, or asks for a \"research report,\" \"industry analysis,\" \"company profile/deep dive,\" or \"competitive landscape\" presentation."
license: Proprietary. See LICENSE.txt in pptx skill for template usage terms.
---

# Research-to-Slides Skill

Automatically research a company or industry and produce a professional presentation using the 鼎帷 (Dingwei) industry research template.

## Prerequisites

- The [pptx](../pptx/SKILL.md) skill must be installed (already in this project)
- Python dependencies: `python-pptx`, `defusedxml`, `lxml`, `Pillow`
- Node.js dependency: `pptxgenjs` (for alternative creation path)

## Template

The default template is at:
```
E:\学术论文集合\鼎帷行业研究&基础研究笔试题目模版参考(33).pptx
```

**Always ask the user if they want to use a different template before starting.**

---

## Workflow

### Phase 1: Understand the Request

1. Clarify the scope:
   - **Company research**: Deep dive into a specific company
   - **Industry research**: Broad analysis of an industry/sector
   - **Combined**: Company within its industry context

2. Ask clarifying questions if the user's request is vague (e.g., "research Tesla" could mean the auto business, energy business, or both). One or two quick questions, not a long interview.

### Phase 2: Research (Web Search + Web Fetch)

Conduct thorough web research. Search in **both English and Chinese** for comprehensive coverage.

**Required research dimensions:**

| Dimension | What to Look For | Search Queries (examples) |
|-----------|-----------------|--------------------------|
| **Company/Industry Overview** | Founded, HQ, employees, business scope, key products/services | `"{name}" company overview profile` |
| **Financial Performance** | Revenue, profit, growth rate, margins (last 2-3 years) | `"{name}" annual report revenue 2025 2024` |
| **Market Position** | Market share, ranking, competitive advantages | `"{name}" market share industry ranking` |
| **Competitive Landscape** | Key competitors, comparison, differentiation | `"{name}" competitors comparison analysis` |
| **Business Segments** | Product lines, revenue breakdown by segment | `"{name}" business segments revenue breakdown` |
| **Recent News & Strategy** | New products, M&A, strategic shifts (last 12 months) | `"{name}" latest news strategy 2026` |
| **Industry Trends** | Market size, growth forecast, technology trends | `"{industry}" market trends forecast 2026` |
| **Risks & Challenges** | Regulatory, competitive, operational risks | `"{name}" risks challenges regulatory` |

**Research quality rules:**
- Use at least 8-10 web searches; do not stop after 2-3 results
- Cross-reference financial figures between sources
- Prioritize recent data (current year minus 0-2 years)
- Capture specific numbers, not just qualitative descriptions
- For Chinese companies, search both CN and EN sources
- Save noteworthy statistics and data points for slide content

### Phase 3: Analyze the Template

**Read the template structure before creating slides:**

```bash
python -c "
from pptx import Presentation
prs = Presentation(r'E:\学术论文集合\鼎帷行业研究&基础研究笔试题目模版参考(33).pptx')
for i, slide in enumerate(prs.slides):
    print(f'=== Slide {i+1} (Layout: {slide.slide_layout.name}) ===')
    for shape in slide.shapes:
        if shape.has_text_frame:
            texts = [p.text.strip() for p in shape.text_frame.paragraphs if p.text.strip()]
            if texts: print(f'  [{shape.name}] {\" | \".join(texts[:2])}')
        if shape.has_table:
            print(f'  [{shape.name}] TABLE {len(shape.table.rows)}x{len(shape.table.columns)}')
"
```

### Phase 4: Content Strategy & Slide Mapping

Based on your research, plan which slides to use. The template has **two style families** — use them consistently:

#### Template 1: Enterprise Color (Slides 6-11)
Best for: Traditional enterprises, manufacturing, consumer goods, energy, finance

#### Template 2: Technology Enterprise Color (Slides 12-15)
Best for: Tech companies, AI, SaaS, biotech, new energy, digital economy

**Choose ONE style family and stick to it throughout.** Don't mix Template 1 and Template 2 slides in the same deck.

#### Slide Inventory & Usage

| Slide | Layout Features | Best For |
|-------|----------------|----------|
| **Slide 1** | Cover page: title + subtitle + logo area | Title slide with company name and report type |
| **Slide 6** (T1) | 3-column layout with text boxes, multi-line descriptions | Company overview, 3 key highlights |
| **Slide 7** (T1) | 3-row horizontal segments with page number | Business segments (3 divisions) |
| **Slide 8** (T1) | 2x3 grid: top circles + bottom text areas | Competitive landscape (2 companies × 3 dimensions) |
| **Slide 9** (T1) | 4-column structure with groups and sub-rows | Financial data by 4 dimensions or 4 time periods |
| **Slide 10** (T1) | 4-column with section headers + bullet groups | Strategy breakdown: 4 strategic pillars |
| **Slide 11** (T1) | Complex 4-column, text boxes with connector lines | Detailed competitive analysis or SWOT |
| **Slide 12** (T2) | Dual table layout (7-col left, 4-col right) | Financial comparison tables |
| **Slide 13** (T2) | 4 numbered sections (01-04) with tables below | 4 business segments with data tables |
| **Slide 14** (T2) | Two large groups (top + bottom) | Industry trends (top) + Company response (bottom) |
| **Slide 15** (T2) | Single large content group | Risks & challenges, or comprehensive summary |
| **Slide 16** | Closing slide | Thank you / Q&A / Contact |

**Typical 8-10 slide research deck structure:**

```
1. Cover (Slide 1)           — Company name + "行业研究/基础研究"
2. Company Overview          — Slide 6(T1) or Slide 8(T1) or Slide 14(T2)
3. Financial Performance     — Slide 9(T1) or Slide 12(T2)
4. Business Segments         — Slide 7(T1) or Slide 13(T2)
5. Competitive Landscape     — Slide 8(T1) or Slide 11(T1)
6. Market Trends & Strategy  — Slide 10(T1) or Slide 14(T2)
7. Risks & Challenges        — Slide 15(T2) or Slide 11(T1)
8. Outlook / Summary         — Slide 10(T1) or Slide 15(T2)
9. Closing (Slide 16)        — Thank you slide
```

**Adapt the mapping to your research findings.** If you found extraordinary financial data, give it more slides. If the competitive analysis is thin, merge it with market overview.

### Phase 5: Build the Presentation

Use the [pptx skill's editing workflow](../pptx/editing.md):

```bash
# Step 1: Unpack the template
python .claude/skills/pptx/scripts/office/unpack.py \
  "E:\学术论文集合\鼎帷行业研究&基础研究笔试题目模版参考(33).pptx" \
  unpacked/

# Step 2: Remove unused slides (from unpacked/ppt/presentation.xml → <p:sldIdLst>)
# Step 3: Duplicate slides you need more copies of
python .claude/skills/pptx/scripts/add_slide.py unpacked/ slide{N}.xml

# Step 4: Edit slide content (edit unpacked/ppt/slides/slide{N}.xml files)
# ⚠️ Use subagents to edit slides in parallel when there are 4+ slides

# Step 5: Clean orphaned files
python .claude/skills/pptx/scripts/clean.py unpacked/

# Step 6: Pack into output
python .claude/skills/pptx/scripts/office/pack.py unpacked/ output.pptx --original \
  "E:\学术论文集合\鼎帷行业研究&基础研究笔试题目模版参考(33).pptx"
```

**Content editing rules:**
- Replace ALL `XXX`/`XXXX`/`XXXXXX` placeholder text — never leave placeholder text
- Keep text concise: headlines ≤20 characters Chinese, body text ≤40 chars per line
- Use specific data points from research (numbers, percentages, years)
- Maintain the template's font sizes and styles — do not change formatting
- Keep the slide title (the large header text) tightly focused on ONE topic
- Remove unused text boxes by deleting their `<p:sp>` element entirely
- When a text area doesn't fit, shorten the content — never shrink fonts

### Phase 6: Visual QA

Follow the [pptx skill's QA process](../pptx/SKILL.md#qa-required):

1. Extract text and check for leftover placeholders:
   ```bash
   python -c "
   from pptx import Presentation
   prs = Presentation('output.pptx')
   for i, slide in enumerate(prs.slides):
       for shape in slide.shapes:
           if shape.has_text_frame:
               for p in shape.text_frame.paragraphs:
                   if 'XXX' in p.text.upper():
                       print(f'Slide {i+1}: PLACEHOLDER FOUND: {p.text}')
   "
   ```

2. If LibreOffice + Poppler are available, convert to images and inspect visually:
   ```bash
   python .claude/skills/pptx/scripts/office/soffice.py --headless --convert-to pdf output.pptx
   pdftoppm -jpeg -r 150 output.pdf slide
   ```
   Inspect each `slide-*.jpg` for layout issues.

3. Verify:
   - No `XXX` placeholders remain
   - All numbers/data points are accurate (cross-check against research)
   - Slides flow logically from overview → details → outlook
   - Font sizes and styles match the template
   - Slide count matches the plan

---

## Design Principles

### Layout Selection
- **Vary layouts** — never use the same slide layout twice in a row
- **Match layout to content type**: tables for financials, columns for comparisons, groups for bullet points
- **Respect the template's design**: this template uses a specific color scheme and font hierarchy — don't override it

### Content Density
- Each slide should convey ONE main message
- Body text: 2-4 bullet points or short paragraphs per section
- Data slides: numbers first, commentary as labels/captions
- Don't fill every text box — white space is intentional

### Data Presentation
- Prefer specific numbers over vague descriptions ("Revenue grew 23.4% in 2025" not "Strong revenue growth")
- Use consistent units and time periods across slides
- When comparing, use the same metric for all entities

### Chinese Text Guidelines
- Use formal/professional Chinese suitable for business presentations
- Headlines: concise and impactful (标题简短有力)
- Descriptions: data-driven, avoid marketing fluff
- Company names: use the commonly recognized Chinese name (e.g., "比亚迪" not "BYD")

---

## Example Session

**User**: "帮我研究一下宁德时代，做个PPT"

**Skill workflow**:
1. Ask: "需要聚焦哪个方面？整体公司研究还是特定业务（动力电池/储能/换电）？"
2. Research: Search "宁德时代 公司概况 财务 2025", "CATL market share battery industry 2026", "宁德时代 竞争对手 竞争格局", "CATL revenue breakdown segment", "宁德时代 最新动态 战略 2026", "动力电池 行业趋势 市场规模", "CATL risks challenges", etc.
3. Analyze template → choose Template 2 (Technology Enterprise Color) since CATL is a tech-driven new energy company
4. Build slides:
   - Slide 1: Cover — "宁德时代(CATL)行业研究"
   - Slide 14: Company Overview — 公司概况 + 核心数据
   - Slide 13: Business Segments — 动力电池/储能/电池回收/其他 (01-04)
   - Slide 12: Financial Performance — Revenue/profit table
   - Slide 10: Competitive Landscape — 宁德/比亚迪/中创新航/亿纬锂能 comparison
   - Slide 14: Industry Trends — 动力电池市场趋势 + 公司布局
   - Slide 15: Risks & Outlook — 风险挑战 + 展望
   - Slide 16: Closing
5. QA → fix issues → deliver

---

## Template Slide Reference (Quick Lookup)

| Slide | Title Text | Key Shapes | Placeholder Pattern |
|-------|-----------|------------|---------------------|
| 1 | 行业研究/基础研究测试参考 | 文本占位符 2 | Direct replacement |
| 6 | 模板1：企业蓝色模版 | 文本框 6, 131-136 | Replace `XXX`/`XXXX` in text boxes |
| 7 | 模板1：企业蓝色模版 | 组 94-96 | Replace group text |
| 8 | 模板1：企业蓝色模版 | 文本框 104-121, 圆形 | Replace `XXX` in circles and text boxes |
| 9 | 模板1：企业蓝色模版 | 文本框 23-26, 矩形 61 | Replace `XXXX` in 4-column headers and data |
| 10 | 模板1：企业蓝色模版 | 矩形 22, 圆形 56-103 | Replace `XX`/`XXXX`/`标题` |
| 11 | 模板1：企业蓝色模版 | 文本框 126-211 | Replace `XXX` in complex 4-column layout |
| 12 | 模板2：科技企业蓝色模版 | 表格 3, 表格 5 | Replace table cells and header `XXXX` |
| 13 | 模板2：科技企业蓝色模版 | 表格 35, 表格 36, 文本框 | Replace table cells, `XXXX` headers, 01-04 labels |
| 14 | 模板2：科技企业蓝色模版 | 组 156, 157 | Replace group content |
| 15 | 模板2：科技企业蓝色模版 | 组 19 | Replace group content |
| 16 | (closing layout) | — | Direct replacement |
