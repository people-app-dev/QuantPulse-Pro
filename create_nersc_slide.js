const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "NERSC Analysis";
pres.title = "NERSC 2024 Annual Highlights";

// ---- Color Palette (Deep Tech / Ocean) ----
const BG = "0A1628";
const CARD_BG = "122944";
const ACCENT_TEAL = "00B4D8";
const ACCENT_BLUE = "0077B6";
const WHITE = "FFFFFF";
const LIGHT_STEEL = "B0C4DE";
const MUTED = "7B93AD";
const KPI_COLORS = ["00B4D8", "48CAE4", "90E0EF", "ADE8F4"];
const MARGIN = 0.65;

// ---- Slide ----
const slide = pres.addSlide();
slide.background = { color: BG };

// ---- Top accent thin bar ----
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 10, h: 0.04, fill: { color: ACCENT_TEAL }
});

// ---- Title ----
slide.addText("NERSC 2024  Annual Highlights", {
  x: MARGIN, y: 0.18, w: 10 - 2 * MARGIN, h: 0.55,
  fontSize: 30, fontFace: "Calibri", color: WHITE, bold: true,
  margin: 0
});

// ---- Subtitle ----
slide.addText("National Energy Research Scientific Computing Center  |  A DOE Office of Science User Facility", {
  x: MARGIN, y: 0.68, w: 10 - 2 * MARGIN, h: 0.28,
  fontSize: 11, fontFace: "Calibri", color: LIGHT_STEEL,
  margin: 0
});

// ======= KPI Cards Row =======
const kpiY = 1.15;
const kpiH = 0.72;
const kpiW = (10 - 2 * MARGIN - 3 * 0.25) / 4; // 4 cards, 3 gaps of 0.25"
const kpiGap = 0.25;
const kpiStartX = MARGIN;
const kpis = [
  { value: "~11,600", label: "Annual Users", sub: "across all 50 states" },
  { value: "850+", label: "Institutions", sub: "+ National Laboratories" },
  { value: ">2,400M", label: "CPU Hours Used", sub: "in FY 2024" },
  { value: "460+", label: "Publications", sub: "cited NERSC resources" }
];

kpis.forEach((kpi, i) => {
  const x = kpiStartX + i * (kpiW + kpiGap);
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: kpiY, w: kpiW, h: kpiH,
    fill: { color: CARD_BG },
    shadow: { type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.25 }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y: kpiY, w: 0.05, h: kpiH,
    fill: { color: KPI_COLORS[i] }
  });
  slide.addText(kpi.value, {
    x: x + 0.16, y: kpiY + 0.06, w: kpiW - 0.26, h: 0.36,
    fontSize: 21, fontFace: "Calibri", color: KPI_COLORS[i], bold: true,
    margin: 0
  });
  slide.addText(kpi.label, {
    x: x + 0.16, y: kpiY + 0.38, w: kpiW - 0.26, h: 0.20,
    fontSize: 10, fontFace: "Calibri", color: LIGHT_STEEL, bold: true,
    margin: 0
  });
  slide.addText(kpi.sub, {
    x: x + 0.16, y: kpiY + 0.54, w: kpiW - 0.26, h: 0.16,
    fontSize: 7.5, fontFace: "Calibri", color: MUTED,
    margin: 0
  });
});

// ======= Bottom Section: Two Columns =======
const botY = 2.15;
const contentW = 10 - 2 * MARGIN; // 8.70"
const leftW = 4.65;
const rightW = contentW - leftW - 0.30; // 3.75"
const rightX = MARGIN + leftW + 0.30;   // 5.60"

// --- LEFT: Pie Chart - DOE Program Office Allocation ---
slide.addText("Computing Allocation by DOE Program Office", {
  x: MARGIN, y: botY, w: leftW, h: 0.32,
  fontSize: 12, fontFace: "Calibri", color: LIGHT_STEEL, bold: true,
  margin: 0
});

slide.addChart(pres.charts.DOUGHNUT, [{
  name: "Allocation",
  labels: [
    "Basic Energy Sciences (40%)",
    "High Energy Physics (20%)",
    "Fusion Energy & Plasma (12%)",
    "Biological & Environmental (12%)",
    "Nuclear Physics (12%)",
    "Adv. Scientific Computing (2%)",
    "Biological Systems (2%)",
    "SBIR (0.2%)"
  ],
  values: [40, 20, 12, 12, 12, 2, 2, 0.2]
}], {
  x: MARGIN, y: botY + 0.40, w: leftW, h: 1.85,
  showPercent: true,
  showTitle: false,
  showLegend: true,
  legendPos: "r",
  legendFontSize: 7,
  legendColor: LIGHT_STEEL,
  chartColors: ["00B4D8", "0077B6", "023E8A", "0096C7", "48CAE4", "90E0EF", "ADE8F4", "CAF0F8"],
  dataLabelColor: WHITE,
  dataLabelFontSize: 8,
  chartArea: { fill: { color: CARD_BG } }
});

// --- RIGHT: User Composition ---
slide.addText("User Composition", {
  x: rightX, y: botY, w: rightW, h: 0.32,
  fontSize: 12, fontFace: "Calibri", color: LIGHT_STEEL, bold: true,
  margin: 0
});

const userTypes = [
  { label: "Graduate Students", pct: 32 },
  { label: "Postdoctoral Fellows", pct: 19 },
  { label: "Staff Scientists", pct: 15 },
  { label: "University Faculty", pct: 13 },
  { label: "Undergraduate Students", pct: 10 },
  { label: "Professional Staff", pct: 5 },
  { label: "Other", pct: 6 }
];

const barStartY = botY + 0.42;
const barH = 0.16;
const barGap = 0.05;
const barMaxW = 1.65;
const labelW = 1.30;

userTypes.forEach((item, i) => {
  const y = barStartY + i * (barH + barGap);
  slide.addText(item.label, {
    x: rightX, y, w: labelW, h: barH,
    fontSize: 7.5, fontFace: "Calibri", color: LIGHT_STEEL,
    align: "right", valign: "middle", margin: 0
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rightX + labelW + 0.08, y: y + 0.04, w: barMaxW, h: barH - 0.08,
    fill: { color: "1A3352" }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: rightX + labelW + 0.08, y: y + 0.04, w: barMaxW * item.pct / 100, h: barH - 0.08,
    fill: { color: ACCENT_TEAL }
  });
  slide.addText(item.pct + "%", {
    x: rightX + labelW + barMaxW + 0.15, y, w: 0.45, h: barH,
    fontSize: 8, fontFace: "Calibri", color: WHITE, bold: true,
    valign: "middle", margin: 0
  });
});

// Institution type + discipline summary
const instY = barStartY + userTypes.length * (barH + barGap) + 0.15;
slide.addText([
  { text: "60% ", options: { bold: true, color: ACCENT_TEAL } },
  { text: "Universities", options: { color: LIGHT_STEEL } },
  { text: "    28% ", options: { bold: true, color: ACCENT_TEAL } },
  { text: "Government Labs", options: { color: LIGHT_STEEL } },
  { text: "    <1% ", options: { bold: true, color: ACCENT_TEAL } },
  { text: "Private", options: { color: LIGHT_STEEL } },
  { text: "", options: { breakLine: true, fontSize: 4 } },
  { text: "Top disciplines: ", options: { bold: true, color: LIGHT_STEEL } },
  { text: "Chemical Sciences, Physics, High Energy Physics, Fusion Energy, Geosciences, Materials Sciences, Biosciences, Climate & Environmental Science, Plasma Science, Computer Science", options: { color: MUTED } }
], {
  x: rightX, y: instY, w: rightW, h: 0.62,
  fontSize: 7.5, fontFace: "Calibri",
  margin: 0, valign: "top",
  lineSpacingMultiple: 1.2
});

// ======= Bottom accent bar =======
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 5.585, w: 10, h: 0.04, fill: { color: ACCENT_TEAL }
});

// ======= Source footnote =======
slide.addText("Source: NERSC Annual Report FY2024  |  nersc.gov", {
  x: MARGIN, y: 5.20, w: 10 - 2 * MARGIN, h: 0.22,
  fontSize: 7, fontFace: "Calibri", color: MUTED,
  margin: 0
});

// ---- Save ----
const outPath = "d:/claude code/NERSC_2024_Slide.pptx";
pres.writeFile({ fileName: outPath }).then(() => {
  console.log("Saved to:", outPath);
}).catch(err => {
  console.error("Error:", err);
});
