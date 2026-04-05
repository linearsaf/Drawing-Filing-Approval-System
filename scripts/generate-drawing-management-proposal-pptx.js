const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();

pptx.layout = "LAYOUT_16x9";
pptx.author = "OpenAI Codex";
pptx.company = "Solusi Bangun Indonesia";
pptx.subject = "Proposal Drawing Management App";
pptx.title = "Proposal Drawing Management App";
pptx.lang = "id-ID";
pptx.theme = {
  headFontFace: "Calibri",
  bodyFontFace: "Calibri",
  lang: "id-ID",
};

const COLORS = {
  forest: "184F3A",
  forestDark: "123A2A",
  clay: "C55B3C",
  sand: "F5F1E8",
  sage: "DCE8DE",
  leaf: "7FA67D",
  ink: "233238",
  slate: "5D6B66",
  mist: "EEF3EF",
  white: "FFFFFF",
  line: "D7DED6",
  gold: "C99A3B",
};

const IMAGES = {
  login: "docs/Images/01-login-page.png",
  dashboard: "docs/Images/02.Drafter-dashboard-page.png",
  drawingList: "docs/Images/03.drafter-drawing-list-page.png",
  newDrawing: "docs/Images/04.Drafter-new-drawing-page.png",
  approverDashboard: "docs/Images/05. dashboard-Approver-L2.png",
  checkPage: "docs/Images/06. Draf-lleader-Approval-page.png",
  detailDraftLeader: "docs/Images/07. drawing-detail-draft-leader.png",
  approvalL1: "docs/Images/08. L1-Approval-page.png",
  approvalL2: "docs/Images/09. L2-Approval-page.png",
  detailApprover: "docs/Images/10. drawing-detail-Approver-L2.png",
};

function addTopBand(slide, color = COLORS.forest) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.25,
    line: { color },
    fill: { color },
  });
}

function addFooter(slide, number, label = "Proposal Drawing Management App") {
  slide.addText(label, {
    x: 0.6,
    y: 5.15,
    w: 5.8,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 9,
    color: COLORS.slate,
    margin: 0,
  });
  slide.addText(String(number).padStart(2, "0"), {
    x: 8.9,
    y: 5.08,
    w: 0.45,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 10,
    bold: true,
    color: COLORS.forest,
    align: "right",
    margin: 0,
  });
}

function addTitle(slide, eyebrow, title, subtitle) {
  addTopBand(slide);
  slide.addText(eyebrow, {
    x: 0.65,
    y: 0.45,
    w: 2.4,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 11,
    color: COLORS.clay,
    bold: true,
    margin: 0,
  });
  slide.addText(title, {
    x: 0.65,
    y: 0.72,
    w: 6.4,
    h: 0.55,
    fontFace: "Calibri",
    fontSize: 27,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.65,
      y: 1.18,
      w: 7.2,
      h: 0.4,
      fontFace: "Calibri",
      fontSize: 11,
      color: COLORS.slate,
      margin: 0,
    });
  }
}

function addBulletList(slide, items, opts = {}) {
  const runs = [];
  items.forEach((item, index) => {
    runs.push({
      text: item,
      options: {
        bullet: true,
        breakLine: index !== items.length - 1,
      },
    });
  });
  slide.addText(runs, {
    x: opts.x ?? 0.8,
    y: opts.y ?? 1.6,
    w: opts.w ?? 3.8,
    h: opts.h ?? 2.8,
    fontFace: "Calibri",
    fontSize: opts.fontSize ?? 15,
    color: opts.color ?? COLORS.ink,
    breakLine: false,
    valign: "top",
    margin: 0.04,
    paraSpaceAfterPt: 11,
    bullet: { indent: 14 },
  });
}

function addCard(slide, x, y, w, h, title, body, accent = COLORS.forest) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    line: { color: COLORS.line, width: 1 },
    fill: { color: COLORS.white },
    shadow: {
      type: "outer",
      color: "000000",
      blur: 2,
      offset: 1,
      angle: 45,
      opacity: 0.08,
    },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 0.1,
    h,
    line: { color: accent },
    fill: { color: accent },
  });
  slide.addText(title, {
    x: x + 0.22,
    y: y + 0.18,
    w: w - 0.35,
    h: 0.28,
    fontFace: "Calibri",
    fontSize: 15,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.22,
    y: y + 0.52,
    w: w - 0.35,
    h: h - 0.64,
    fontFace: "Calibri",
    fontSize: 11.5,
    color: COLORS.slate,
    margin: 0,
    valign: "top",
  });
}

function addMetric(slide, x, y, w, h, value, label, accent = COLORS.clay) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    line: { color: COLORS.line, width: 1 },
    fill: { color: COLORS.white },
  });
  slide.addText(value, {
    x: x + 0.18,
    y: y + 0.18,
    w: w - 0.36,
    h: 0.45,
    fontFace: "Calibri",
    fontSize: 24,
    bold: true,
    color: accent,
    margin: 0,
    align: "center",
  });
  slide.addText(label, {
    x: x + 0.15,
    y: y + 0.7,
    w: w - 0.3,
    h: 0.35,
    fontFace: "Calibri",
    fontSize: 10.5,
    color: COLORS.slate,
    margin: 0,
    align: "center",
  });
}

function addIconBadge(slide, x, y, label, color) {
  slide.addShape(pptx.ShapeType.ellipse, {
    x,
    y,
    w: 0.42,
    h: 0.42,
    line: { color },
    fill: { color },
  });
  slide.addText(label, {
    x,
    y: y + 0.02,
    w: 0.42,
    h: 0.32,
    fontFace: "Calibri",
    fontSize: 12,
    bold: true,
    color: COLORS.white,
    margin: 0,
    align: "center",
  });
}

function addFeature(slide, x, y, title, body, badge, color) {
  addIconBadge(slide, x, y, badge, color);
  slide.addText(title, {
    x: x + 0.56,
    y: y - 0.01,
    w: 2.2,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 13.5,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.56,
    y: y + 0.22,
    w: 2.45,
    h: 0.55,
    fontFace: "Calibri",
    fontSize: 10.5,
    color: COLORS.slate,
    margin: 0,
    valign: "top",
  });
}

function addImageFrame(slide, path, x, y, w, h) {
  slide.addShape(pptx.ShapeType.rect, {
    x: x - 0.03,
    y: y - 0.03,
    w: w + 0.06,
    h: h + 0.06,
    line: { color: COLORS.line, width: 1 },
    fill: { color: COLORS.white },
    shadow: {
      type: "outer",
      color: "000000",
      blur: 2,
      offset: 1,
      angle: 45,
      opacity: 0.08,
    },
  });
  slide.addImage({
    path,
    x,
    y,
    w,
    h,
    sizing: { type: "contain", w, h },
  });
}

function addArrow(slide, x, y, w, text, color = COLORS.clay) {
  slide.addShape(pptx.ShapeType.chevron, {
    x,
    y,
    w,
    h: 0.48,
    line: { color },
    fill: { color },
  });
  slide.addText(text, {
    x: x + 0.08,
    y: y + 0.11,
    w: w - 0.16,
    h: 0.16,
    fontFace: "Calibri",
    fontSize: 10,
    bold: true,
    color: COLORS.white,
    margin: 0,
    align: "center",
  });
}

function addPhase(slide, x, y, title, period, bullets, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w: 2.12,
    h: 2.05,
    rectRadius: 0.08,
    line: { color: COLORS.line, width: 1 },
    fill: { color: COLORS.white },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w: 2.12,
    h: 0.16,
    line: { color },
    fill: { color },
  });
  slide.addText(title, {
    x: x + 0.16,
    y: y + 0.2,
    w: 1.8,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 14,
    bold: true,
    color: COLORS.ink,
    margin: 0,
    align: "center",
  });
  slide.addText(period, {
    x: x + 0.16,
    y: y + 0.46,
    w: 1.8,
    h: 0.18,
    fontFace: "Calibri",
    fontSize: 10,
    color: color,
    bold: true,
    margin: 0,
    align: "center",
  });
  addBulletList(slide, bullets, {
    x: x + 0.16,
    y: y + 0.74,
    w: 1.8,
    h: 1.1,
    fontSize: 10.5,
  });
}

function addRiskRow(slide, y, risk, impact, mitigation, accent) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.65,
    y,
    w: 8.7,
    h: 0.63,
    line: { color: COLORS.line, width: 1 },
    fill: { color: COLORS.white },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.65,
    y,
    w: 0.12,
    h: 0.63,
    line: { color: accent },
    fill: { color: accent },
  });
  slide.addText(risk, {
    x: 0.86,
    y: y + 0.11,
    w: 1.95,
    h: 0.15,
    fontFace: "Calibri",
    fontSize: 11,
    bold: true,
    color: COLORS.ink,
    margin: 0,
  });
  slide.addText(impact, {
    x: 3.0,
    y: y + 0.11,
    w: 2.15,
    h: 0.18,
    fontFace: "Calibri",
    fontSize: 10,
    color: COLORS.slate,
    margin: 0,
  });
  slide.addText(mitigation, {
    x: 5.38,
    y: y + 0.11,
    w: 3.62,
    h: 0.24,
    fontFace: "Calibri",
    fontSize: 10,
    color: COLORS.slate,
    margin: 0,
  });
}

// Slide 1
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.forestDark };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 5.625,
    line: { color: COLORS.forestDark },
    fill: { color: COLORS.forestDark },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 3.65,
    w: 10,
    h: 1.98,
    line: { color: COLORS.sand },
    fill: { color: COLORS.sand },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x: 6.2,
    y: 0,
    w: 3.8,
    h: 3.75,
    line: { color: COLORS.clay },
    fill: { color: COLORS.clay, transparency: 12 },
  });
  slide.addText("PROPOSAL SISTEM", {
    x: 0.75,
    y: 0.62,
    w: 2.1,
    h: 0.2,
    fontSize: 11,
    bold: true,
    color: COLORS.sand,
    margin: 0,
  });
  slide.addText("Drawing\nManagement App", {
    x: 0.75,
    y: 1.02,
    w: 4.4,
    h: 1.2,
    fontSize: 28,
    bold: true,
    color: COLORS.white,
    margin: 0,
    breakLine: false,
  });
  slide.addText("Satu sumber kendali untuk filing, approval, revisi, dan distribusi final drawing secara aman dan terlacak.", {
    x: 0.76,
    y: 2.43,
    w: 4.6,
    h: 0.56,
    fontSize: 13.5,
    color: "E6EFE8",
    margin: 0,
    valign: "mid",
  });
  addMetric(slide, 0.76, 3.98, 1.75, 1.08, "1", "Repositori final yang terkontrol", COLORS.forest);
  addMetric(slide, 2.68, 3.98, 1.75, 1.08, "100%", "Status revisi lebih terlacak", COLORS.clay);
  addMetric(slide, 4.6, 3.98, 1.75, 1.08, "0", "Akses consumer ke draft", COLORS.gold);
  slide.addText("Disiapkan untuk Maintenance Manager\nProposal adopsi dan penguatan implementasi aplikasi", {
    x: 6.45,
    y: 4.18,
    w: 2.85,
    h: 0.7,
    fontSize: 12.5,
    color: COLORS.ink,
    bold: true,
    margin: 0,
    align: "left",
  });
}

// Slide 2
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.sand };
  addTitle(
    slide,
    "Ringkasan Eksekutif",
    "Permasalahan dokumen teknik saat ini membutuhkan kendali yang lebih disiplin",
    "Aplikasi ini menghadirkan alur kerja digital dari draft hingga drawing final sehingga approval, histori revisi, dan distribusi berjalan lebih tertib."
  );
  addCard(
    slide,
    0.7,
    1.75,
    2.7,
    2.25,
    "Masalah bisnis",
    "Drawing tersebar, status revisi sering tidak jelas, dan proses approval masih sulit ditelusuri saat dibutuhkan oleh tim maintenance maupun audit.",
    COLORS.clay
  );
  addCard(
    slide,
    3.6,
    1.75,
    2.7,
    2.25,
    "Solusi yang diajukan",
    "Drawing Management App menjadi workspace terpusat untuk filing, check, approval berjenjang, distribusi final, dan audit trail dalam satu aplikasi web internal.",
    COLORS.forest
  );
  addCard(
    slide,
    6.5,
    1.75,
    2.8,
    2.25,
    "Nilai utama",
    "Mengurangi risiko penggunaan dokumen yang belum final, mempercepat pencarian drawing, dan meningkatkan akuntabilitas keputusan approval.",
    COLORS.gold
  );
  addMetric(slide, 0.9, 4.3, 2.0, 0.72, "Berbasis peran", "Kontrol akses per fungsi");
  addMetric(slide, 3.15, 4.3, 2.0, 0.72, "Audit trail", "Jejak aktivitas penting");
  addMetric(slide, 5.4, 4.3, 2.0, 0.72, "PDF final", "Preview, print, download");
  addMetric(slide, 7.65, 4.3, 1.35, 0.72, "Pilot", "Siap diuji");
  addFooter(slide, 2);
}

// Slide 3
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  addTitle(
    slide,
    "Gambaran Masalah",
    "Masalah utama pada pengelolaan drawing dan dokumen teknis",
    "Temuan ini dirangkum dari konteks PRD aplikasi dan praktik operasional yang umum terjadi pada filing drawing."
  );
  addBulletList(slide, [
    "Drawing tersebar di berbagai folder sehingga sulit menemukan versi yang benar.",
    "Approval check dan persetujuan akhir tidak terdokumentasi konsisten.",
    "Riwayat revisi sulit dibaca saat terjadi perubahan berulang.",
    "User berisiko memakai drawing yang belum final atau sudah obsolete.",
    "Distribusi PDF final belum memiliki kontrol akses dan jejak unduh yang kuat.",
  ], { x: 0.8, y: 1.72, w: 4.15, h: 2.7, fontSize: 14 });
  addImageFrame(slide, IMAGES.drawingList, 5.35, 1.7, 4.0, 2.15);
  addCard(
    slide,
    5.36,
    4.03,
    4.0,
    0.8,
    "Dampak ke maintenance",
    "Waktu review lebih panjang, koordinasi lintas peran tidak efisien, dan keputusan operasional menjadi kurang percaya diri karena sumber dokumen belum tunggal.",
    COLORS.clay
  );
  addFooter(slide, 3);
}

// Slide 4
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.sand };
  addTitle(
    slide,
    "Gambaran Solusi",
    "Drawing Management App adalah workspace digital untuk siklus hidup drawing",
    "Platform ini mengelola proses dari pembuatan draft, review, approval, hingga distribusi drawing final dalam satu alur terkontrol."
  );
  addArrow(slide, 0.8, 2.1, 1.3, "Draft", COLORS.clay);
  addArrow(slide, 2.15, 2.1, 1.4, "Check", COLORS.forest);
  addArrow(slide, 3.65, 2.1, 1.6, "Approval L1", COLORS.gold);
  addArrow(slide, 5.35, 2.1, 1.55, "Approval L2", COLORS.leaf);
  addArrow(slide, 7.0, 2.1, 1.5, "Completed", COLORS.forestDark);
  slide.addText("Tersedia juga jalur legacy import untuk old drawing yang sudah final sehingga dokumen lama tetap bisa difiling rapi dan langsung didistribusikan secara terkontrol.", {
    x: 0.82,
    y: 2.86,
    w: 7.78,
    h: 0.45,
    fontSize: 12,
    color: COLORS.slate,
    margin: 0,
    align: "center",
  });
  addCard(
    slide,
    0.8,
    3.55,
    2.3,
    1.15,
    "Untuk Drafter",
    "Membuat, mengedit, submit, dan membuat revisi baru dari drawing completed.",
    COLORS.clay
  );
  addCard(
    slide,
    3.35,
    3.55,
    2.3,
    1.15,
    "Untuk Reviewer",
    "Check drawing, menugaskan approver, memberi note, dan mengelola jalur persetujuan.",
    COLORS.forest
  );
  addCard(
    slide,
    5.9,
    3.55,
    2.3,
    1.15,
    "Untuk Consumer",
    "Mengakses hanya drawing final yang valid dengan preview, print, dan download.",
    COLORS.gold
  );
  addFooter(slide, 4);
}

// Slide 5
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  addTitle(
    slide,
    "Fitur Utama",
    "Fitur inti yang langsung memberi nilai ke operasional",
    "Desain solusi berfokus pada kontrol dokumen, disiplin approval, dan kemudahan akses untuk user yang tepat."
  );
  addFeature(slide, 0.82, 1.78, "Workspace berbasis peran", "Dashboard dan aksi menyesuaikan peran: Drafter, Draft Leader, Approver, Head, Consumer, dan Admin.", "R", COLORS.forest);
  addFeature(slide, 3.45, 1.78, "Kontrol revisi", "Setiap revisi disimpan sebagai entitas baru sehingga histori tidak menimpa drawing lama.", "V", COLORS.clay);
  addFeature(slide, 6.08, 1.78, "Approval berjenjang", "Rencana approval per revisi dengan L1 wajib dan L2 opsional sesuai kebutuhan organisasi.", "A", COLORS.gold);
  addFeature(slide, 0.82, 3.02, "Akses PDF final", "Preview, print, dan download final drawing melalui route backend yang lebih aman.", "P", COLORS.leaf);
  addFeature(slide, 3.45, 3.02, "Pencarian dan filter", "Pencarian berdasarkan nomor drawing, area, status, revisi, drafter, dan rentang tanggal.", "S", COLORS.forestDark);
  addFeature(slide, 6.08, 3.02, "Jejak audit", "Riwayat approval, histori revisi, dan timeline aktivitas tersedia untuk kebutuhan telusur.", "T", COLORS.clay);
  addImageFrame(slide, IMAGES.dashboard, 6.1, 3.82, 3.15, 1.25);
  addCard(
    slide,
    0.82,
    4.16,
    4.95,
    0.88,
    "Fitur tambahan yang sudah tersedia",
    "Admin user management, public request access flow, reset password, upload old drawing, dan final drawing viewer.",
    COLORS.forest
  );
  addFooter(slide, 5);
}

// Slide 6
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.sand };
  addTitle(
    slide,
    "Cara Kerja",
    "Alur kerja sederhana dari file masuk sampai drawing final siap dipakai",
    "Alur kerja dirancang agar status, penanggung jawab, dan keputusan approval selalu dapat ditelusuri."
  );
  const steps = [
    ["1", "Drafter", "Membuat drawing baru atau revisi dan mengunggah PDF."],
    ["2", "Draft Leader", "Melakukan check dan menetapkan approver level 1 serta opsional level 2."],
    ["3", "Approver L1", "Memverifikasi revisi dan memberi keputusan approval pertama."],
    ["4", "Head / L2", "Memberi persetujuan final bila level 2 digunakan."],
    ["5", "Consumer", "Mengakses hanya drawing berstatus completed untuk operasional."],
  ];
  steps.forEach(([badge, title, body], index) => {
    const x = 0.85 + index * 1.8;
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: 2.0,
      w: 1.45,
      h: 1.75,
      rectRadius: 0.08,
      line: { color: COLORS.line, width: 1 },
      fill: { color: COLORS.white },
    });
    addIconBadge(slide, x + 0.5, 2.14, badge, index % 2 === 0 ? COLORS.forest : COLORS.clay);
    slide.addText(title, {
      x: x + 0.12,
      y: 2.65,
      w: 1.2,
      h: 0.2,
      fontSize: 12,
      bold: true,
      color: COLORS.ink,
      align: "center",
      margin: 0,
    });
    slide.addText(body, {
      x: x + 0.1,
      y: 2.94,
      w: 1.24,
      h: 0.6,
      fontSize: 9.4,
      color: COLORS.slate,
      align: "center",
      margin: 0,
      valign: "mid",
    });
    if (index < steps.length - 1) {
      slide.addShape(pptx.ShapeType.chevron, {
        x: x + 1.5,
        y: 2.65,
        w: 0.22,
        h: 0.24,
        line: { color: COLORS.gold },
        fill: { color: COLORS.gold },
      });
    }
  });
  addCard(
    slide,
    0.85,
    4.22,
    4.05,
    0.78,
    "Kontrol bisnis utama",
    "Reject wajib menyertakan note, revisi completed bersifat read-only, dan consumer hanya melihat drawing final yang valid.",
    COLORS.forest
  );
  addImageFrame(slide, IMAGES.checkPage, 5.35, 4.02, 3.95, 1.0);
  addFooter(slide, 6);
}

// Slide 7
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  addTitle(
    slide,
    "Manfaat & Nilai",
    "Dampak bisnis yang paling relevan untuk manajemen maintenance",
    "Nilai utama solusi ini bukan hanya digitalisasi, tetapi kendali dokumen, kepastian status, dan ketertelusuran keputusan."
  );
  addMetric(slide, 0.78, 1.7, 2.05, 1.0, "1 sumber", "Repositori final yang lebih terpercaya", COLORS.forest);
  addMetric(slide, 3.0, 1.7, 2.05, 1.0, "Lebih cepat", "Pencarian drawing dan histori revisi", COLORS.clay);
  addMetric(slide, 5.22, 1.7, 2.05, 1.0, "Lebih aman", "Akses final PDF lewat kontrol role", COLORS.gold);
  addMetric(slide, 7.44, 1.7, 1.75, 1.0, "Siap audit", "Approval dan download terlacak", COLORS.leaf);
  addCard(
    slide,
    0.78,
    3.0,
    2.75,
    1.45,
    "Efisiensi operasional",
    "Tim tidak perlu lagi mengandalkan folder terpisah atau konfirmasi manual untuk memastikan versi final yang benar.",
    COLORS.forest
  );
  addCard(
    slide,
    3.68,
    3.0,
    2.75,
    1.45,
    "Kepastian keputusan",
    "Catatan check dan approval tersimpan per revisi, membantu saat ada pertanyaan teknis atau perubahan mendadak.",
    COLORS.clay
  );
  addCard(
    slide,
    6.58,
    3.0,
    2.6,
    1.45,
    "Kesiapan scale-up",
    "Arsitektur saat ini sudah mendukung penguatan ke fase pilot dan produksi dengan perbaikan storage, backup, dan monitoring.",
    COLORS.gold
  );
  addFooter(slide, 7);
}

// Slide 8
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.sand };
  addTitle(
    slide,
    "Rencana Implementasi",
    "Tahapan implementasi yang realistis untuk persetujuan manajemen",
    "Rencana ini mengasumsikan aplikasi dilanjutkan ke fase adopsi internal dengan penguatan teknis dan pilot terarah."
  );
  addPhase(slide, 0.72, 1.9, "Fase 1", "Minggu 1-2", [
    "Validasi kebutuhan dan penanggung jawab proses",
    "Review data drawing existing",
    "Finalisasi scope pilot"
  ], COLORS.clay);
  addPhase(slide, 2.94, 1.9, "Fase 2", "Minggu 3-4", [
    "Penguatan keamanan dan role",
    "Setup storage, backup, monitoring",
    "UAT dengan user inti"
  ], COLORS.forest);
  addPhase(slide, 5.16, 1.9, "Fase 3", "Minggu 5-6", [
    "Pilot unit maintenance",
    "Migrasi old drawing prioritas",
    "Pendampingan operasional"
  ], COLORS.gold);
  addPhase(slide, 7.38, 1.9, "Fase 4", "Minggu 7-8", [
    "Evaluasi KPI dan feedback",
    "Perbaikan minor",
    "Go-live bertahap"
  ], COLORS.leaf);
  addCard(
    slide,
    0.72,
    4.45,
    8.78,
    0.6,
    "Output utama",
    "SOP kerja baru, backlog perbaikan prioritas, dashboard pilot, dan keputusan lanjut ke rollout yang lebih luas.",
    COLORS.forestDark
  );
  addFooter(slide, 8);
}

// Slide 9
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  addTitle(
    slide,
    "Kebutuhan Teknis",
    "Kebutuhan teknis untuk mendukung adopsi yang stabil dan aman",
    "Daftar berikut merangkum stack aktual aplikasi dan kebutuhan infrastruktur minimum untuk pilot yang sehat."
  );
  addCard(slide, 0.75, 1.78, 2.2, 1.68, "Aplikasi", "Next.js App Router, React 19, Tailwind CSS, route handlers, komponen UI internal.", COLORS.forest);
  addCard(slide, 3.05, 1.78, 2.2, 1.68, "Data & Otorisasi", "MySQL, Drizzle ORM, Better Auth, validasi Zod, serta model data audit dan approval.", COLORS.clay);
  addCard(slide, 5.35, 1.78, 2.2, 1.68, "Dokumen", "PDF preview, print, dan download melalui react-pdf, pdfjs-dist, dan pdf-lib.", COLORS.gold);
  addCard(slide, 7.65, 1.78, 1.6, 1.68, "Integrasi", "Email notifikasi, request access, reset password.", COLORS.leaf);
  addBulletList(slide, [
    "Storage file sebaiknya dipisah dari app server untuk fase production.",
    "Backup database dan file harus diperlakukan sebagai dua aset yang saling terkait.",
    "Monitoring disk, CPU, memori, dan error rate perlu aktif sebelum pemakaian luas.",
    "Akses preview dan download final drawing harus tetap melalui otorisasi backend.",
  ], { x: 0.9, y: 3.82, w: 5.2, h: 1.4, fontSize: 12 });
  addImageFrame(slide, IMAGES.detailApprover, 6.25, 3.62, 3.0, 1.45);
  addFooter(slide, 9);
}

// Slide 10
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.sand };
  addTitle(
    slide,
    "Risiko & Mitigasi",
    "Risiko implementasi dapat dikendalikan dengan keputusan arsitektur yang tepat",
    "Fokus utamanya bukan pada UI, tetapi pada storage, backup, performa file, dan governance operasional."
  );
  addRiskRow(slide, 1.8, "Storage PDF tumbuh cepat", "Disk cepat penuh dan backup makin berat.", "Gunakan object storage private dan capacity planning berkala.", COLORS.clay);
  addRiskRow(slide, 2.55, "App dan file satu mesin", "Sulit scale-out dan risiko kehilangan file lebih besar.", "Pisahkan file storage dari compute server.", COLORS.forest);
  addRiskRow(slide, 3.3, "Preview atau download lambat", "UX approval terganggu saat file besar atau traffic naik.", "Batasi upload, streaming file, dan siapkan worker bila volume naik.", COLORS.gold);
  addRiskRow(slide, 4.05, "Dokumen sensitif", "Risiko akses tidak sah pada drawing perusahaan.", "Pastikan akses private, otorisasi backend, audit log, dan TLS penuh.", COLORS.leaf);
  addFooter(slide, 10);
}

// Slide 11
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.white };
  addTitle(
    slide,
    "Langkah Berikutnya",
    "Persetujuan yang dibutuhkan dari manajemen",
    "Keputusan berikut akan mempercepat pilot terarah dan mengurangi risiko implementasi sejak awal."
  );
  addCard(
    slide,
    0.82,
    1.82,
    2.55,
    2.45,
    "1. Setujui pilot",
    "Tentukan unit atau area maintenance yang menjadi pilot awal, termasuk owner proses dan target dokumen prioritas.",
    COLORS.forest
  );
  addCard(
    slide,
    3.73,
    1.82,
    2.55,
    2.45,
    "2. Setujui kesiapan infra",
    "Putuskan pendekatan storage, backup, monitoring, dan resource server minimum untuk pilot yang sehat.",
    COLORS.clay
  );
  addCard(
    slide,
    6.64,
    1.82,
    2.55,
    2.45,
    "3. Setujui governance",
    "Tetapkan admin operasional, SLA review, dan kebijakan penggunaan drawing final di lapangan.",
    COLORS.gold
  );
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.82,
    y: 4.55,
    w: 8.37,
    h: 0.32,
    line: { color: COLORS.forestDark },
    fill: { color: COLORS.forestDark },
  });
  slide.addText("Ajakan tindakan: berikan persetujuan untuk pilot implementasi dan penguatan teknis agar aplikasi siap dipakai sebagai sistem kendali drawing internal.", {
    x: 0.95,
    y: 4.97,
    w: 8.1,
    h: 0.22,
    fontFace: "Calibri",
    fontSize: 13,
    bold: true,
    color: COLORS.forestDark,
    margin: 0,
    align: "center",
  });
  addFooter(slide, 11);
}

// Slide 12
{
  const slide = pptx.addSlide();
  slide.background = { color: COLORS.forestDark };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.52,
    y: 0.52,
    w: 8.96,
    h: 4.58,
    line: { color: COLORS.sand, width: 1.2 },
    fill: { color: COLORS.forestDark },
  });
  slide.addText("Terima Kasih", {
    x: 1.1,
    y: 1.45,
    w: 7.8,
    h: 0.56,
    fontFace: "Calibri",
    fontSize: 30,
    bold: true,
    color: COLORS.white,
    align: "center",
    margin: 0,
  });
  slide.addText("Sesi tanya jawab dan diskusi persetujuan implementasi", {
    x: 1.55,
    y: 2.18,
    w: 6.9,
    h: 0.28,
    fontSize: 14,
    color: "DCE8DE",
    align: "center",
    margin: 0,
  });
  slide.addText("Drawing Management App", {
    x: 3.05,
    y: 3.3,
    w: 3.9,
    h: 0.28,
    fontSize: 16,
    bold: true,
    color: COLORS.sand,
    align: "center",
    margin: 0,
  });
  slide.addText("Bahan proposal internal untuk review manajemen", {
    x: 2.8,
    y: 3.65,
    w: 4.4,
    h: 0.2,
    fontSize: 10.5,
    color: "BFD2C2",
    align: "center",
    margin: 0,
  });
  slide.addText("© 2026 LinearSAF. All rights reserved.", {
    x: 2.2,
    y: 4.18,
    w: 5.6,
    h: 0.18,
    fontSize: 10.5,
    bold: true,
    color: COLORS.sand,
    align: "center",
    margin: 0,
  });
  slide.addText("Private and confidential. For internal use only.", {
    x: 2.05,
    y: 4.42,
    w: 5.9,
    h: 0.18,
    fontSize: 9.8,
    color: "BFD2C2",
    align: "center",
    margin: 0,
  });
  slide.addText("https://linearsaf.com", {
    x: 2.65,
    y: 4.66,
    w: 4.7,
    h: 0.18,
    fontSize: 9.8,
    color: "DCE8DE",
    align: "center",
    margin: 0,
  });
}

async function main() {
  await pptx.writeFile({ fileName: "docs/Drawing-Management-App-Proposal.pptx" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
