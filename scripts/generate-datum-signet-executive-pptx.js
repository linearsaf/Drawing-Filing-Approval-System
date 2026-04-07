const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "docs", "Datum-Signet-Executive-Briefing.pptx");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_16x9";
pptx.author = "OpenAI Codex";
pptx.company = "LinearSAF";
pptx.subject = "Datum Signet executive presentation";
pptx.title = "Datum Signet - Executive Briefing";
pptx.lang = "id-ID";
pptx.theme = {
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  lang: "id-ID",
};

const C = {
  ink: "122033",
  navy: "17324D",
  blue: "2C5B8C",
  slate: "62748A",
  mist: "EAF0F5",
  cloud: "F7F9FB",
  line: "D7E0E8",
  white: "FFFFFF",
  gold: "C7902F",
  green: "2F7D68",
  coral: "C96A4A",
};

const IMAGES = {
  login: path.join(ROOT, "docs", "Images", "01-login-page.png"),
  dashboard: path.join(ROOT, "docs", "Images", "02.Drafter-dashboard-page.png"),
  drawings: path.join(ROOT, "docs", "Images", "03.drafter-drawing-list-page.png"),
  check: path.join(ROOT, "docs", "Images", "06. Draf-lleader-Approval-page.png"),
};

function addSlideNumber(slide, index) {
  slide.addText(String(index).padStart(2, "0"), {
    x: 9.15,
    y: 5.0,
    w: 0.45,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 9,
    color: C.slate,
    align: "right",
  });
}

function addHeader(slide, title, kicker) {
  slide.addText(kicker.toUpperCase(), {
    x: 0.6,
    y: 0.35,
    w: 2.3,
    h: 0.28,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 10,
    bold: true,
    color: C.blue,
    charSpacing: 2,
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.68,
    w: 5.9,
    h: 0.55,
    margin: 0,
    fontFace: "Cambria",
    fontSize: 26,
    bold: true,
    color: C.ink,
  });
}

function addFooter(slide, text = "Datum Signet | Executive Briefing") {
  slide.addText(text, {
    x: 0.6,
    y: 5.0,
    w: 2.9,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 9,
    color: C.slate,
  });
}

function addCard(slide, opts) {
  slide.addShape(pptx.ShapeType.rect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    line: { color: opts.lineColor ?? C.line, width: 1 },
    fill: { color: opts.fillColor ?? C.white },
    radius: 0.1,
    shadow: { type: "outer", color: "000000", blur: 2, offset: 1, angle: 45, opacity: 0.1 },
  });

  if (opts.accentColor) {
    slide.addShape(pptx.ShapeType.rect, {
      x: opts.x,
      y: opts.y,
      w: 0.08,
      h: opts.h,
      line: { color: opts.accentColor, width: 0 },
      fill: { color: opts.accentColor },
    });
  }
}

function addBulletList(slide, items, box, color = C.ink, fontSize = 16) {
  slide.addText(
    items.map((item, index) => ({
      text: item,
      options: {
        bullet: true,
        breakLine: index !== items.length - 1,
      },
    })),
    {
      x: box.x,
      y: box.y,
      w: box.w,
      h: box.h,
      margin: 0,
      fontFace: "Calibri",
      fontSize,
      color,
      breakLine: false,
      paraSpaceAfterPt: 12,
      valign: "top",
    }
  );
}

function addSectionLabel(slide, text, x, y, w = 1.8) {
  slide.addText(text.toUpperCase(), {
    x,
    y,
    w,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 9,
    bold: true,
    color: C.slate,
    charSpacing: 1.8,
  });
}

function addTitleSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.ink };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 3.2,
    h: 5.625,
    line: { color: C.navy, width: 0 },
    fill: { color: C.navy },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.2,
    y: 0,
    w: 6.8,
    h: 5.625,
    line: { color: C.ink, width: 0 },
    fill: { color: "0F1B2A" },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.7,
    y: 0.72,
    w: 1.15,
    h: 0.08,
    line: { color: C.gold, width: 0 },
    fill: { color: C.gold },
  });

  slide.addText("DATUM SIGNET", {
    x: 0.72,
    y: 1.0,
    w: 4.7,
    h: 0.55,
    margin: 0,
    fontFace: "Cambria",
    fontSize: 28,
    bold: true,
    color: C.white,
    charSpacing: 1,
  });
  slide.addText("Executive Briefing", {
    x: 0.72,
    y: 1.56,
    w: 2.9,
    h: 0.28,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: "BDD0E3",
  });
  slide.addText(
    "Workspace internal untuk filing drawing, approval bertingkat, distribusi final drawing, dan audit trail yang lebih tertib.",
    {
      x: 0.72,
      y: 2.02,
      w: 4.15,
      h: 1.0,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 18,
      color: "DCE6F0",
      valign: "mid",
    }
  );

  slide.addImage({
    path: IMAGES.drawings,
    x: 5.2,
    y: 0.72,
    w: 4.15,
    h: 2.35,
    sizing: { type: "cover", x: 5.2, y: 0.72, w: 4.15, h: 2.35 },
  });
  slide.addImage({
    path: IMAGES.dashboard,
    x: 5.6,
    y: 3.25,
    w: 3.75,
    h: 1.95,
    sizing: { type: "cover", x: 5.6, y: 3.25, w: 3.75, h: 1.95 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.95,
    y: 0.48,
    w: 4.55,
    h: 4.92,
    line: { color: "6F87A0", width: 1.2 },
    fill: { color: "0F1B2A", transparency: 100 },
  });

  slide.addText("Prepared for management review", {
    x: 0.72,
    y: 4.82,
    w: 2.6,
    h: 0.2,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 10,
    color: "95AAC0",
  });
  slide.addText("LinearSAF", {
    x: 0.72,
    y: 5.02,
    w: 1.2,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 10,
    bold: true,
    color: C.gold,
  });
}

function addExecutiveSummary() {
  const slide = pptx.addSlide();
  slide.background = { color: C.cloud };
  addHeader(slide, "Kenapa App Ini Penting", "Executive Summary");

  slide.addText(
    "Datum Signet memusatkan pengelolaan drawing agar status revisi, approval, dan dokumen final tidak lagi tersebar di banyak jalur kerja.",
    {
      x: 0.6,
      y: 1.25,
      w: 5.8,
      h: 0.7,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 18,
      color: C.ink,
    }
  );

  const cards = [
    { x: 0.6, title: "1", body: "Satu workspace untuk filing, review, approval, dan distribusi final.", color: C.blue },
    { x: 3.18, title: "2", body: "Jejak revisi dan keputusan approval lebih mudah diaudit.", color: C.green },
    { x: 5.76, title: "3", body: "Sudah berjalan sebagai web app dan mobile-view ready.", color: C.gold },
  ];

  cards.forEach((card) => {
    addCard(slide, { x: card.x, y: 2.0, w: 2.35, h: 1.65, accentColor: card.color });
    slide.addText(card.title, {
      x: card.x + 0.18,
      y: card.y + 0.18,
      w: 0.35,
      h: 0.3,
      margin: 0,
      fontFace: "Cambria",
      fontSize: 24,
      bold: true,
      color: card.color,
    });
    slide.addText(card.body, {
      x: card.x + 0.18,
      y: 2.52,
      w: 1.95,
      h: 0.9,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 15,
      color: C.ink,
      valign: "mid",
    });
  });

  addSectionLabel(slide, "Core message", 0.6, 3.95);
  slide.addText(
    "Fokus aplikasi bukan hanya digitalisasi file, tetapi memastikan bahwa drawing final yang dipakai tim memang versi yang tepat, sudah disahkan, dan mudah ditelusuri kembali.",
    {
      x: 0.6,
      y: 4.2,
      w: 7.8,
      h: 0.55,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 16,
      color: C.slate,
    }
  );

  addFooter(slide);
  addSlideNumber(slide, 2);
}

function addProblemOpportunity() {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  addHeader(slide, "Masalah yang Sedang Diselesaikan", "Operational Opportunity");

  addCard(slide, { x: 0.6, y: 1.35, w: 4.05, h: 3.15, accentColor: C.coral });
  addSectionLabel(slide, "Current pain points", 0.82, 1.58, 2.2);
  addBulletList(
    slide,
    [
      "Drawing tersebar dan tidak selalu mudah ditemukan saat dibutuhkan cepat.",
      "Status revisi dan approval berisiko tidak sinkron antar pihak.",
      "Distribusi final drawing belum selalu berjalan dengan kontrol akses yang kuat.",
      "Jejak keputusan dan histori perubahan lebih sulit dibaca saat audit atau review ulang.",
    ],
    { x: 0.82, y: 1.9, w: 3.45, h: 2.2 }
  );

  addCard(slide, { x: 5.05, y: 1.35, w: 4.0, h: 3.15, accentColor: C.green, fillColor: C.cloud });
  addSectionLabel(slide, "Management impact", 5.27, 1.58, 2.0);
  slide.addText("Risiko yang ingin ditekan:", {
    x: 5.27,
    y: 1.92,
    w: 1.8,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  addBulletList(
    slide,
    [
      "Salah pakai drawing yang belum final atau sudah obsolete.",
      "Waktu review dan pencarian dokumen yang terlalu panjang.",
      "Akuntabilitas approval yang lemah saat keputusan perlu ditelusuri kembali.",
      "Kesulitan menjaga ketertiban antrian kerja antar role.",
    ],
    { x: 5.27, y: 2.18, w: 3.25, h: 1.9 }
  );

  addFooter(slide);
  addSlideNumber(slide, 3);
}

function addBrandSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.cloud };
  addHeader(slide, "Mengapa Namanya Datum Signet", "Brand Positioning");

  addCard(slide, { x: 0.6, y: 1.35, w: 2.7, h: 2.55, accentColor: C.blue });
  slide.addText("Datum", {
    x: 0.82,
    y: 1.62,
    w: 1.0,
    h: 0.3,
    margin: 0,
    fontFace: "Cambria",
    fontSize: 24,
    bold: true,
    color: C.blue,
  });
  slide.addText("Presisi dan referensi absolut. Sistem menjadi single source of truth untuk metadata, revisi, dan dokumen final.", {
    x: 0.82,
    y: 2.02,
    w: 2.05,
    h: 1.2,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 16,
    color: C.ink,
  });

  addCard(slide, { x: 3.65, y: 1.35, w: 2.7, h: 2.55, accentColor: C.gold });
  slide.addText("Signet", {
    x: 3.87,
    y: 1.62,
    w: 1.0,
    h: 0.3,
    margin: 0,
    fontFace: "Cambria",
    fontSize: 24,
    bold: true,
    color: C.gold,
  });
  slide.addText("Otoritas dan akuntabilitas. Approval bertingkat dan audit trail menjadi segel digital atas setiap keputusan dokumen.", {
    x: 3.87,
    y: 2.02,
    w: 2.05,
    h: 1.2,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 16,
    color: C.ink,
  });

  addCard(slide, { x: 6.7, y: 1.35, w: 2.7, h: 2.55, accentColor: C.green, fillColor: "EFF7F4" });
  slide.addText("Makna Gabungan", {
    x: 6.92,
    y: 1.62,
    w: 1.7,
    h: 0.3,
    margin: 0,
    fontFace: "Cambria",
    fontSize: 22,
    bold: true,
    color: C.green,
  });
  slide.addText("\"Referensi mutlak yang telah disahkan\"", {
    x: 6.92,
    y: 2.06,
    w: 2.0,
    h: 0.4,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 17,
    bold: true,
    color: C.ink,
  });
  slide.addText("Nama ini memadukan ketelitian engineering dan governance dokumen dalam satu identitas.", {
    x: 6.92,
    y: 2.48,
    w: 2.02,
    h: 0.72,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    color: C.ink,
  });

  slide.addText("Efek praktis ke stakeholder", {
    x: 0.6,
    y: 4.22,
    w: 2.1,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  slide.addTable(
    [
      [
        { text: "Audiens", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Makna", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ["Drafter / Engineer", "Ruang kerja yang menghargai presisi desain dan histori revisi."],
      ["Checker / Approver", "Keputusan review lebih jelas, aman, dan dapat ditelusuri."],
      ["Manajemen", "Kontrol kualitas dan tata kelola dokumen terlihat lebih matang."],
    ],
    {
      x: 0.6,
      y: 4.48,
      w: 8.8,
      h: 0.9,
      border: { pt: 1, color: C.line },
      fill: { color: C.white },
      fontFace: "Calibri",
      fontSize: 12,
      color: C.ink,
      margin: 0.05,
      colW: [2.0, 6.8],
      rowH: [0.32, 0.3, 0.3, 0.3],
    }
  );

  addFooter(slide);
  addSlideNumber(slide, 4);
}

function addWorkflowSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  addHeader(slide, "Alur Kerja End-to-End", "Workflow");

  const steps = [
    { x: 0.7, title: "Create", body: "Drafter menyiapkan metadata dan PDF awal." },
    { x: 2.35, title: "Check", body: "Draft Leader review dan set approver." },
    { x: 4.0, title: "Approval", body: "Approver L1, lalu Head bila L2 dipakai." },
    { x: 5.65, title: "Completed", body: "Dokumen final dikunci sebagai acuan resmi." },
    { x: 7.3, title: "Distribution", body: "Consumer dan role terkait membuka final drawing." },
  ];

  steps.forEach((step, index) => {
    addCard(slide, { x: step.x, y: 1.7, w: 1.35, h: 1.35, accentColor: index === 4 ? C.green : C.blue, fillColor: C.cloud });
    slide.addText(String(index + 1), {
      x: step.x + 0.16,
      y: 1.92,
      w: 0.25,
      h: 0.25,
      margin: 0,
      fontFace: "Cambria",
      fontSize: 18,
      bold: true,
      color: index === 4 ? C.green : C.blue,
    });
    slide.addText(step.title, {
      x: step.x + 0.16,
      y: 2.2,
      w: 0.95,
      h: 0.22,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 14,
      bold: true,
      color: C.ink,
    });
    slide.addText(step.body, {
      x: step.x + 0.16,
      y: 2.46,
      w: 1.0,
      h: 0.45,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 11,
      color: C.slate,
    });
    if (index < steps.length - 1) {
      slide.addShape(pptx.ShapeType.chevron, {
        x: step.x + 1.4,
        y: 2.18,
        w: 0.36,
        h: 0.26,
        line: { color: C.line, width: 0 },
        fill: { color: "A8B8C8" },
      });
    }
  });

  addCard(slide, { x: 0.7, y: 3.55, w: 8.55, h: 1.15, accentColor: C.gold, fillColor: "FFFBF3" });
  slide.addText("Jalur legacy import", {
    x: 0.92,
    y: 3.82,
    w: 1.7,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  slide.addText(
    "Upload Old Drawing dipakai untuk dokumen lama yang approval historisnya sudah selesai di luar sistem. Dokumen langsung masuk status Completed dan tetap bisa kembali ke workflow normal bila ada revisi baru.",
    {
      x: 2.35,
      y: 3.78,
      w: 6.45,
      h: 0.5,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 14,
      color: C.ink,
    }
  );

  addFooter(slide);
  addSlideNumber(slide, 5);
}

function addProductTodaySlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.cloud };
  addHeader(slide, "Implementasi yang Sudah Berjalan", "Current Product");

  addCard(slide, { x: 0.6, y: 1.35, w: 4.15, h: 3.1, accentColor: C.blue });
  slide.addText("Cakupan utama saat ini", {
    x: 0.82,
    y: 1.62,
    w: 1.8,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  addBulletList(
    slide,
    [
      "Authentication, request access, reset password, dan role-based access.",
      "Drawing list, drawing detail, create/edit drawing, serta revision flow.",
      "Check, approval, final approval, preview/print/download final PDF.",
      "Audit trail, user management, dan dukungan mobile-view untuk area utama app.",
    ],
    { x: 0.82, y: 1.96, w: 3.45, h: 2.0 }
  );

  slide.addImage({
    path: IMAGES.login,
    x: 5.05,
    y: 1.35,
    w: 1.8,
    h: 3.0,
    sizing: { type: "cover", x: 5.05, y: 1.35, w: 1.8, h: 3.0 },
  });
  slide.addImage({
    path: IMAGES.dashboard,
    x: 6.98,
    y: 1.35,
    w: 2.1,
    h: 1.42,
    sizing: { type: "cover", x: 6.98, y: 1.35, w: 2.1, h: 1.42 },
  });
  slide.addImage({
    path: IMAGES.check,
    x: 6.98,
    y: 2.93,
    w: 2.1,
    h: 1.42,
    sizing: { type: "cover", x: 6.98, y: 2.93, w: 2.1, h: 1.42 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.93,
    y: 1.23,
    w: 4.28,
    h: 3.34,
    line: { color: C.line, width: 1 },
    fill: { color: C.white, transparency: 100 },
  });

  addFooter(slide);
  addSlideNumber(slide, 6);
}

function addRolesSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  addHeader(slide, "Tata Kelola Peran", "Role Model");

  const roles = [
    { x: 0.6, y: 1.45, title: "Admin", body: "Kontrol lintas role, user management, request access, dan fallback operasional.", color: C.blue },
    { x: 2.75, y: 1.45, title: "Drafter", body: "Create drawing, edit revision, submit ke check, dan buat revisi baru.", color: C.green },
    { x: 4.9, y: 1.45, title: "Draft Leader", body: "Quality gate awal, check drawing, dan assignment approver.", color: C.gold },
    { x: 7.05, y: 1.45, title: "Approver / Head", body: "Approval level 1 dan final approval untuk dokumen yang ditugaskan.", color: C.coral },
  ];

  roles.forEach((role) => {
    addCard(slide, { x: role.x, y: role.y, w: 1.9, h: 1.65, accentColor: role.color, fillColor: C.cloud });
    slide.addText(role.title, {
      x: role.x + 0.18,
      y: role.y + 0.22,
      w: 1.35,
      h: 0.3,
      margin: 0,
      fontFace: "Cambria",
      fontSize: 17,
      bold: true,
      color: C.ink,
    });
    slide.addText(role.body, {
      x: role.x + 0.18,
      y: role.y + 0.58,
      w: 1.42,
      h: 0.78,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 12,
      color: C.slate,
    });
  });

  slide.addTable(
    [
      [
        { text: "Role", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Create", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Check", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Approve", options: { bold: true, color: C.white, fill: { color: C.navy } } },
        { text: "Download Final", options: { bold: true, color: C.white, fill: { color: C.navy } } },
      ],
      ["Drafter", "Ya", "-", "-", "Ya"],
      ["Draft Leader", "-", "Ya", "-", "Ya"],
      ["Approver L1", "-", "-", "L1", "Ya"],
      ["Head", "-", "-", "Final", "Ya"],
      ["Consumer", "-", "-", "-", "Ya"],
      ["Admin", "Ya", "Ya", "Ya", "Ya"],
    ],
    {
      x: 0.8,
      y: 3.5,
      w: 8.2,
      h: 1.45,
      border: { pt: 1, color: C.line },
      fill: { color: C.white },
      fontFace: "Calibri",
      fontSize: 11,
      color: C.ink,
      margin: 0.04,
      colW: [1.65, 1.0, 1.0, 1.25, 1.75],
    }
  );

  addFooter(slide);
  addSlideNumber(slide, 7);
}

function addValueSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.cloud };
  addHeader(slide, "Nilai untuk Manajemen", "Business Impact");

  const values = [
    {
      x: 0.6,
      color: C.blue,
      title: "Kontrol",
      body: "Status drawing, approval, dan distribusi final lebih jelas di satu tempat.",
    },
    {
      x: 3.18,
      color: C.green,
      title: "Traceability",
      body: "Revision history, approval history, dan audit trail lebih mudah dibuktikan.",
    },
    {
      x: 5.76,
      color: C.gold,
      title: "Efisiensi",
      body: "Pencarian dokumen dan koordinasi antar role menjadi lebih cepat.",
    },
  ];

  values.forEach((item) => {
    addCard(slide, { x: item.x, y: 1.45, w: 2.35, h: 1.7, accentColor: item.color });
    slide.addText(item.title, {
      x: item.x + 0.18,
      y: 1.72,
      w: 1.4,
      h: 0.24,
      margin: 0,
      fontFace: "Cambria",
      fontSize: 18,
      bold: true,
      color: item.color,
    });
    slide.addText(item.body, {
      x: item.x + 0.18,
      y: 2.08,
      w: 1.9,
      h: 0.72,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 13,
      color: C.ink,
    });
  });

  addCard(slide, { x: 0.6, y: 3.45, w: 8.8, h: 1.25, accentColor: C.coral, fillColor: "FFF7F4" });
  slide.addText("Implikasi praktis bagi pimpinan", {
    x: 0.82,
    y: 3.75,
    w: 2.2,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  addBulletList(
    slide,
    [
      "Menurunkan risiko salah referensi drawing di lapangan.",
      "Memperkuat governance dokumen tanpa menambah proses manual baru yang berat.",
      "Membuat readiness audit dan evaluasi root cause lebih baik karena jejak keputusan tersedia.",
    ],
    { x: 3.0, y: 3.62, w: 5.9, h: 0.7 },
    C.ink,
    13
  );

  addFooter(slide);
  addSlideNumber(slide, 8);
}

function addArchitectureSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.white };
  addHeader(slide, "Arsitektur Saat Ini", "Technology Snapshot");

  const layers = [
    { y: 1.45, label: "Frontend", tech: "Next.js 15 + React 19", color: C.blue },
    { y: 2.0, label: "Business Logic", tech: "Route handlers + service layer", color: C.green },
    { y: 2.55, label: "Data", tech: "MySQL + Drizzle ORM", color: C.gold },
    { y: 3.1, label: "Access & Files", tech: "Better Auth + local PDF storage", color: C.coral },
  ];

  layers.forEach((layer) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.8,
      y: layer.y,
      w: 4.1,
      h: 0.36,
      line: { color: layer.color, width: 0 },
      fill: { color: layer.color },
    });
    slide.addText(layer.label, {
      x: 1.02,
      y: layer.y + 0.08,
      w: 1.4,
      h: 0.16,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 13,
      bold: true,
      color: C.white,
    });
    slide.addText(layer.tech, {
      x: 2.45,
      y: layer.y + 0.08,
      w: 2.15,
      h: 0.16,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 13,
      color: C.white,
      align: "right",
    });
  });

  addCard(slide, { x: 5.35, y: 1.45, w: 3.75, h: 2.2, accentColor: C.navy, fillColor: C.cloud });
  slide.addText("Catatan penting", {
    x: 5.58,
    y: 1.72,
    w: 1.8,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  addBulletList(
    slide,
    [
      "Aplikasi sudah berjalan sebagai monolithic web app yang siap dipakai internal.",
      "Business logic dipisahkan di service layer sehingga evolusi fitur tetap terkontrol.",
      "Storage file masih berada di server aplikasi dan perlu perhatian lebih untuk skala production berikutnya.",
    ],
    { x: 5.58, y: 2.02, w: 3.0, h: 1.3 },
    C.ink,
    13
  );

  addCard(slide, { x: 5.35, y: 3.85, w: 3.75, h: 0.75, accentColor: C.gold, fillColor: "FFFBF3" });
  slide.addText("UI utama sudah mobile-view ready untuk mendukung akses pada layar yang lebih kecil.", {
    x: 5.58,
    y: 4.08,
    w: 3.02,
    h: 0.28,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 13,
    bold: true,
    color: C.ink,
    valign: "mid",
  });

  addFooter(slide);
  addSlideNumber(slide, 9);
}

function addRoadmapSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.cloud };
  addHeader(slide, "Arah Pengembangan Berikutnya", "Roadmap");

  slide.addText("Implementasi saat ini sudah layak dipakai sebagai fondasi operasional. Tahap berikutnya adalah memperluas kontrol proses dan governance.", {
    x: 0.6,
    y: 1.2,
    w: 8.1,
    h: 0.45,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 16,
    color: C.ink,
  });

  const roadmap = [
    { x: 0.75, title: "Now", color: C.blue, items: ["Core workflow berjalan", "Approval bertingkat", "Final drawing access", "Mobile-view ready"] },
    { x: 3.25, title: "Next", color: C.green, items: ["Request drawing baru", "Distribusi via Draft Leader", "Antrean Drafter lebih terstruktur"] },
    { x: 5.75, title: "Later", color: C.gold, items: ["Compare revision", "Analytics dashboard", "Object storage abstraction", "Realtime activity feed"] },
  ];

  roadmap.forEach((phase) => {
    addCard(slide, { x: phase.x, y: 1.9, w: 2.1, h: 2.2, accentColor: phase.color });
    slide.addText(phase.title, {
      x: phase.x + 0.18,
      y: 2.16,
      w: 0.8,
      h: 0.25,
      margin: 0,
      fontFace: "Cambria",
      fontSize: 20,
      bold: true,
      color: phase.color,
    });
    addBulletList(slide, phase.items, { x: phase.x + 0.18, y: 2.5, w: 1.65, h: 1.25 }, C.ink, 12);
  });

  addCard(slide, { x: 0.75, y: 4.35, w: 7.1, h: 0.65, accentColor: C.coral, fillColor: "FFF7F4" });
  slide.addText(
    "Future feature penting: user dapat mengajukan request drawing baru ke Draft Leader untuk diteruskan ke Drafter sesuai antrian kerja. Ini membantu pengendalian intake sebelum pekerjaan masuk ke workflow drafting.",
    {
      x: 1.0,
      y: 4.56,
      w: 6.55,
      h: 0.22,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 12.5,
      color: C.ink,
    }
  );

  addFooter(slide);
  addSlideNumber(slide, 10);
}

function addClosingSlide() {
  const slide = pptx.addSlide();
  slide.background = { color: C.navy };

  slide.addText("Datum Signet", {
    x: 0.72,
    y: 0.92,
    w: 3.0,
    h: 0.45,
    margin: 0,
    fontFace: "Cambria",
    fontSize: 26,
    bold: true,
    color: C.white,
  });
  slide.addText("Closing Perspective", {
    x: 0.72,
    y: 1.38,
    w: 2.1,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 14,
    bold: true,
    color: "C7D8E8",
  });

  slide.addText(
    "Aplikasi ini sudah berada pada tahap implementasi kerja yang nyata. Nilai berikutnya ada pada penguatan tata kelola, perluasan intake process, dan kesiapan operasional production yang lebih matang.",
    {
      x: 0.72,
      y: 2.05,
      w: 4.4,
      h: 0.9,
      margin: 0,
      fontFace: "Calibri",
      fontSize: 18,
      color: "E5EEF7",
    }
  );

  addCard(slide, { x: 5.55, y: 1.2, w: 3.15, h: 2.7, accentColor: C.gold, fillColor: "F7F0DE" });
  slide.addText("Rekomendasi manajemen", {
    x: 5.8,
    y: 1.48,
    w: 1.8,
    h: 0.22,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: C.ink,
  });
  addBulletList(
    slide,
    [
      "Posisikan Datum Signet sebagai workspace resmi drawing internal.",
      "Lanjutkan hardening operasional dan governance storage.",
      "Prioritaskan future intake request agar antrian drafting lebih teratur.",
    ],
    { x: 5.8, y: 1.82, w: 2.4, h: 1.45 },
    C.ink,
    13
  );

  slide.addText("LinearSAF", {
    x: 0.72,
    y: 4.95,
    w: 1.1,
    h: 0.2,
    margin: 0,
    fontFace: "Calibri",
    fontSize: 10,
    bold: true,
    color: C.gold,
  });
  addSlideNumber(slide, 11);
}

function buildDeck() {
  addTitleSlide();
  addExecutiveSummary();
  addProblemOpportunity();
  addBrandSlide();
  addWorkflowSlide();
  addProductTodaySlide();
  addRolesSlide();
  addValueSlide();
  addArchitectureSlide();
  addRoadmapSlide();
  addClosingSlide();
}

async function main() {
  buildDeck();
  await pptx.writeFile({ fileName: OUTPUT });
  console.log(`PPTX written: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
