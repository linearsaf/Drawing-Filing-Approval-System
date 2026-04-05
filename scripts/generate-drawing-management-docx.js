const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  TabStopPosition,
  TabStopType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "docs", "Drawing-Management-App-Documentation.docx");

const PAGE = {
  width: 11906,
  height: 16838,
  margin: 1440,
};
PAGE.contentWidth = PAGE.width - PAGE.margin * 2;

const COLORS = {
  primary: "184F3A",
  secondary: "C55B3C",
  gold: "A97A22",
  text: "233238",
  muted: "5D6B66",
  light: "E8F1EE",
  line: "C9D5CE",
};

const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 1, color: COLORS.line };
const TABLE_BORDERS = {
  top: TABLE_BORDER,
  bottom: TABLE_BORDER,
  left: TABLE_BORDER,
  right: TABLE_BORDER,
};

function run(text, options = {}) {
  return new TextRun({
    text,
    bold: options.bold,
    italics: options.italics,
    color: options.color ?? COLORS.text,
    size: options.size ?? 22,
    break: options.break,
    font: "Arial",
  });
}

function paragraph(textOrRuns, options = {}) {
  const children = Array.isArray(textOrRuns)
    ? textOrRuns
    : [run(textOrRuns ?? "", options.runOptions ?? {})];

  return new Paragraph({
    children,
    heading: options.heading,
    alignment: options.alignment,
    pageBreakBefore: options.pageBreakBefore,
    spacing: options.spacing,
    tabStops: options.tabStops,
    border: options.border,
  });
}

function heading(text, level, options = {}) {
  return paragraph([run(text, { bold: true, size: options.size ?? 28, color: COLORS.primary })], {
    heading: level,
    pageBreakBefore: options.pageBreakBefore,
    spacing: options.spacing ?? { before: 120, after: 180 },
  });
}

function body(text, options = {}) {
  return paragraph(text, {
    alignment: options.alignment,
    spacing: options.spacing ?? { after: 120 },
    runOptions: {
      size: options.size ?? 22,
      color: options.color ?? COLORS.text,
      bold: options.bold,
      italics: options.italics,
    },
  });
}

function bulletList(items, reference = "bullets") {
  return items.map(
    (item) =>
      new Paragraph({
        numbering: { reference, level: 0 },
        spacing: { after: 80 },
        children: [run(item, { size: 22 })],
      })
  );
}

function numberedList(items, reference) {
  return items.map(
    (item) =>
      new Paragraph({
        numbering: { reference, level: 0 },
        spacing: { after: 80 },
        children: [run(item, { size: 22 })],
      })
  );
}

function breakPage() {
  return new Paragraph({ children: [new PageBreak()] });
}

function normalizeCellContent(content, options = {}) {
  if (content instanceof Paragraph) {
    return [content];
  }

  if (Array.isArray(content)) {
    return content.map((item) => {
      if (item instanceof Paragraph) {
        return item;
      }

      return body(item, {
        size: options.size ?? 20,
        bold: options.bold,
        color: options.color,
      });
    });
  }

  return [
    body(content ?? "", {
      size: options.size ?? 20,
      bold: options.bold,
      color: options.color,
    }),
  ];
}

function cell(content, width, options = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: TABLE_BORDERS,
    shading: options.header ? { fill: COLORS.light, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: normalizeCellContent(content, options),
  });
}

function createTable(widths, rows, options = {}) {
  const headerRow = options.headers
    ? [
        new TableRow({
          tableHeader: true,
          children: options.headers.map((value, index) =>
            cell(value, widths[index], {
              header: true,
              bold: true,
              size: 20,
              color: COLORS.primary,
            })
          ),
        }),
      ]
    : [];

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((value, index) => cell(value, widths[index], { size: 20 })),
      })
  );

  return new Table({
    width: { size: PAGE.contentWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [...headerRow, ...bodyRows],
  });
}

function imageBlock(imagePath, title, caption, options = {}) {
  const type = path.extname(imagePath).replace(".", "").toLowerCase();

  return [
    heading(title, HeadingLevel.HEADING_2, { spacing: { before: 120, after: 120 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new ImageRun({
          type,
          data: fs.readFileSync(imagePath),
          transformation: { width: options.width ?? 520, height: options.height ?? 292 },
          altText: { title, description: caption, name: path.basename(imagePath) },
        }),
      ],
    }),
    body(caption, {
      alignment: AlignmentType.CENTER,
      italics: true,
      color: COLORS.muted,
      size: 19,
      spacing: { after: 180 },
    }),
  ];
}

function divider(titleText) {
  return paragraph([run(titleText, { bold: true, size: 22, color: COLORS.primary })], {
    spacing: { before: 180, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: COLORS.primary, space: 1 },
    },
  });
}

const documentControlRows = [
  ["Nama dokumen", "Dokumentasi Lengkap Drawing Management App"],
  ["Jenis dokumen", "Master documentation / system dossier"],
  ["Nama produk", "Drawing Filing & Approval System (Drawing Management App)"],
  ["Versi dokumen", "1.0"],
  ["Status dokumen", "Draft for Internal Review"],
  ["Audiens utama", "Manajemen dan tim internal"],
  ["Bahasa dokumen", "Bahasa Indonesia dengan istilah produk/UI tertentu tetap English"],
  [
    "Sumber rujukan utama",
    [
      "PRD implementasi aktual",
      "ERD & schema snapshot",
      "Implementation constraints and mitigations",
      "UI wording guide",
      "Role documentation dan screenshot aplikasi",
    ],
  ],
  ["Tanggal dokumen", "5 April 2026"],
];

const executiveSummaryPoints = [
  "Drawing Management App disusun untuk menjadi workspace utama filing drawing, pengelolaan revisi, approval berjenjang, dan distribusi Final Drawing.",
  "Aplikasi yang ada saat ini sudah melampaui tahap konsep dan telah mencakup authentication, role-based access, dashboard per role, Drawing List, detail drawing, Check, Approval, Final Approval, final PDF access, audit trail, serta User Management.",
  "Nilai utama bagi manajemen adalah mengurangi risiko penggunaan drawing yang belum final, mempercepat pencarian dokumen, dan meningkatkan traceability keputusan dalam workflow maintenance.",
];

const problemPoints = [
  "Drawing tersebar dan sulit ditelusuri ketika dibutuhkan cepat oleh tim operasional.",
  "Status revisi dan approval tidak selalu terdokumentasi rapi di satu tempat.",
  "Riwayat revisi sulit dibaca ketika perubahan terjadi berulang.",
  "Consumer berisiko menggunakan drawing yang belum final atau sudah obsolete.",
  "Distribusi Final Drawing belum selalu disertai kontrol akses dan jejak aktivitas yang memadai.",
];

const solutionPoints = [
  "Menjadikan aplikasi sebagai repositori kerja terpusat untuk Create Drawing, Check, Approval, Final Approval, dan distribusi Final Drawing.",
  "Menerapkan workflow per revisi dengan approval level 1 wajib dan level 2 opsional.",
  "Menyediakan jalur Upload Old Drawing untuk dokumen legacy yang sudah selesai wet sign di luar sistem.",
  "Menjamin Consumer hanya melihat drawing berstatus Completed.",
  "Menyediakan revision history, approval history, audit timeline, preview, print, dan download final PDF dalam satu alur.",
];

const objectivePoints = [
  "menjadi workspace utama filing drawing",
  "mengelola workflow Check dan Approval secara berjenjang",
  "menjaga histori revisi tetap rapi dan terlacak",
  "memastikan Consumer hanya melihat Final Drawing yang valid",
  "menyediakan audit trail untuk aktivitas penting",
  "memberi Admin kontrol atas user, role, dan Request Access baru",
];

const businessValuePoints = [
  "satu sumber acuan yang lebih terpercaya untuk dokumen final",
  "waktu pencarian dan review drawing menjadi lebih singkat",
  "akuntabilitas keputusan review meningkat karena approval tersimpan per revisi",
  "kontrol distribusi dokumen lebih kuat melalui backend authorization",
  "kesiapan audit dan root cause analysis menjadi lebih baik",
];

const inScopePoints = [
  "Sign In, Reset Password request, dan Reset Password submit",
  "public Request Access dan review oleh Admin",
  "role guard pada page dan API",
  "dashboard per role",
  "Drawing List dengan search, filter, card view, dan Compact List",
  "Drawing Detail",
  "Create Drawing, Edit Drawing, Submit Revision",
  "Check Drawing, Approval level 1, dan Final Approval",
  "preview PDF, print PDF, dan download Final Drawing",
  "revision history, approval history, audit timeline",
  "Admin User Management",
];

const outOfScopePoints = [
  "approval workflow multi-level bebas di luar skema L1 wajib + L2 opsional",
  "multi-role per user",
  "annotation langsung di PDF",
  "compare visual antar revision",
  "notification center in-app",
  "mobile app native",
  "external DMS / ERP integration",
  "legal digital signature",
];

const workflowMain = [
  "Create Drawing -> Submit to Check -> Approval -> Final Drawing -> Distribution",
  "Upload Old Drawing -> Completed -> Distribution",
];

const workflowOperationalSteps = [
  "Drafter membuat drawing baru dan mengunggah PDF.",
  "Drawing disimpan sebagai Draft atau langsung dikirim ke Waiting Check.",
  "Draft Leader melakukan Check dan menyusun approver per revisi.",
  "Jika lolos, drawing masuk ke Waiting Approval L1 dengan assignee yang dipilih.",
  "Approver Level 1 memproses approval tahap pertama.",
  "Jika level 2 disiapkan, drawing masuk ke Waiting Final Approval.",
  "Head memproses Final Approval bila level 2 memang dipakai.",
  "Jika level 2 tidak dipakai, Approval level 1 langsung menyelesaikan revisi menjadi Completed.",
  "Jika level 2 dipakai dan lolos, revisi menjadi Completed.",
  "Consumer dan role internal yang berhak dapat membuka, print, dan download Final Drawing.",
  "Jika ada perubahan lanjutan, Drafter atau Admin membuat revisi baru dari drawing yang sudah Completed.",
];

const legacySteps = [
  "Draft Leader atau Admin membuka Upload Old Drawing.",
  "User mengisi metadata utama dan mengunggah PDF.",
  "Sistem menyimpan createdBy sebagai uploader dan drawnByUserId sebagai pemilik drawing secara bisnis.",
  "Drawing langsung dibuat sebagai Completed dengan workflowSource = LEGACY_READY.",
  "Consumer langsung dapat preview, print, dan download.",
  "Jika perlu perubahan di masa depan, revisi berikutnya kembali masuk workflow normal.",
];

const roleMatrixRows = [
  [
    "Admin",
    "Kontrol penuh lintas workflow dan administrasi user",
    "Dashboard, Drawing List, Create Drawing, Upload Old Drawing, User Management",
    "Mengelola user, Request Access, reset password, delete drawing, dan mengambil alih capability operasional bila diperlukan",
  ],
  [
    "Drafter",
    "Pembuatan drawing dan revisi",
    "Dashboard, Drawing List, Create Drawing",
    "Create Drawing, upload PDF, save draft, edit rejected revision, submit to Check, dan create revision baru dari Completed",
  ],
  [
    "Draft Leader",
    "Quality gate awal dan assignment approval",
    "Dashboard, Drawing List, Upload Old Drawing",
    "Melakukan Check, menetapkan Approver L1 dan optional L2, menambahkan note, serta memproses legacy import",
  ],
  [
    "Approver L1",
    "Approval tahap pertama",
    "Dashboard, Drawing List",
    "Meninjau revision Waiting Approval L1 yang ditugaskan dan memberi keputusan approval atau rejection",
  ],
  [
    "Head",
    "Final Approval",
    "Dashboard, Drawing List",
    "Meninjau revision Waiting Final Approval yang ditugaskan dan mengubah revision menjadi Completed bila disetujui",
  ],
  [
    "Consumer",
    "Pemakai Final Drawing",
    "Dashboard, Drawing List",
    "Mengakses drawing Completed secara read-only, melakukan preview, print, dan download Final Drawing",
  ],
];

const roleNarratives = [
  {
    title: "Admin",
    points: [
      "Memiliki akses paling luas terhadap user, Request Access, dan seluruh workflow drawing.",
      "Menjadi fallback operator untuk proses lintas role tanpa mengubah prinsip assignment approval.",
      "Dapat mengelola user aktif/inactive, reset password user lain, dan memproses Upload Old Drawing.",
    ],
  },
  {
    title: "Drafter",
    points: [
      "Bertanggung jawab membuat drawing, memperbarui revision, dan mengirim revisi ke workflow Check.",
      "Dapat mengedit Draft dan revision yang rejected, lalu submit ulang ke Waiting Check.",
      "Dapat membuat revisi baru dari drawing Completed tanpa menghapus histori lama.",
    ],
  },
  {
    title: "Draft Leader",
    points: [
      "Berfungsi sebagai quality gate pertama sebelum revision masuk ke Approval.",
      "Menentukan Approver level 1 yang wajib dan Approver level 2 yang opsional.",
      "Dapat menggunakan Upload Old Drawing untuk legacy drawing yang sudah selesai wet sign di luar sistem.",
    ],
  },
  {
    title: "Approver L1",
    points: [
      "Menilai kelayakan operasional revisi setelah lolos Check.",
      "Dapat menyelesaikan revisi langsung bila level 2 tidak digunakan.",
      "Reject wajib menyertakan note agar perbaikan lebih jelas bagi Drafter.",
    ],
  },
  {
    title: "Head",
    points: [
      "Menjadi gate akhir sebelum Final Drawing dinyatakan siap dipakai sebagai referensi resmi.",
      "Terlibat hanya pada revisi yang memang menyiapkan level 2.",
      "Keputusan Final Approval membuat revision aktif menjadi Completed dan visible untuk Consumer.",
    ],
  },
  {
    title: "Consumer",
    points: [
      "Memakai Final Drawing untuk kebutuhan referensi kerja dan seluruh aksesnya bersifat read-only.",
      "Hanya dapat melihat drawing berstatus Completed.",
      "Dapat membaca approval history dan audit timeline sebagai konteks penggunaan dokumen.",
    ],
  },
];

const moduleRows = [
  ["Auth", "Sign In, Request Access, Reset Password, Account Password", "Better Auth, session management, active/inactive user control, reset password flow"],
  ["Dashboard", "Ringkasan visible drawing, queue per role, activity feed", "Memberi visibilitas cepat terhadap workload, status, dan kesehatan workflow"],
  ["Drawing Management", "Create Drawing, Edit Drawing, Drawing Detail, Drawing List", "Menangani metadata drawing, upload PDF, search, filter, revision history, dan audit timeline"],
  ["Check & Approval", "Check Drawing, Approval, Final Approval", "Menerapkan note, decision, assignee, dan transisi status per revisi"],
  ["Final Drawing Access", "Preview, print, download, Final Drawing viewer", "Menyediakan akses dokumen final yang dikontrol backend sesuai role"],
  ["Admin", "User Management, Request Access review", "Mengelola user lifecycle dan jalur onboarding user baru"],
];

const businessRules = [
  "`drawingNumber` unik secara global.",
  "`drawingId + revisionNo` unik.",
  "approval plan disusun per revisi dengan level 1 wajib dan level 2 opsional.",
  "satu user satu role.",
  "semua reject mengembalikan proses ke Drafter dan reject note wajib diisi.",
  "Consumer hanya melihat drawing Completed.",
  "Completed revision tidak diedit langsung; revisi baru dibuat sebagai row baru.",
  "legacy import langsung Completed dan tidak melewati approval digital.",
  "`createdBy` adalah uploader, sedangkan `drawnByUserId` adalah pemilik drawing secara bisnis.",
];

const statusRows = [
  ["Draft", "Revisi masih dikerjakan atau disimpan sementara.", "Drafter dapat melanjutkan edit atau submit."],
  ["Waiting Check", "Revisi siap direview oleh Draft Leader.", "Draft Leader melakukan Check."],
  ["Check Rejected", "Revisi ditolak pada tahap Check.", "Kembali ke Drafter untuk perbaikan."],
  ["Waiting Approval L1", "Revisi lolos Check dan menunggu Approval level 1.", "Approver L1 yang ditugaskan memproses keputusan."],
  ["Approval L1 Rejected", "Revisi ditolak di approval tahap pertama.", "Kembali ke Drafter untuk perbaikan."],
  ["Waiting Final Approval", "Revisi menunggu approval level 2 / Head.", "Head yang ditugaskan memproses keputusan final."],
  ["Final Approval Rejected", "Revisi ditolak pada tahap Final Approval.", "Kembali ke Drafter untuk perbaikan."],
  ["Completed", "Revisi final selesai dan siap didistribusikan.", "Visible untuk Consumer dan role internal yang berhak."],
  ["Obsolete", "Revisi lama tidak lagi menjadi acuan aktif.", "Tetap tersimpan sebagai histori."],
];

const technicalStackRows = [
  ["Frontend", "React 19 + Next.js App Router", "UI web internal dengan route modern dan komponen reusable"],
  ["Backend", "Next.js Route Handlers", "Menangani API, auth, dan workflow server-side"],
  ["Database", "MySQL", "Menyimpan metadata drawing, audit, approval, dan user"],
  ["ORM", "Drizzle ORM", "Menyediakan schema dan access layer yang terstruktur"],
  ["Authentication", "Better Auth + Drizzle Adapter", "Session management dan kontrol akses"],
  ["Validation", "Zod", "Menjaga validasi input di layer aplikasi"],
  ["PDF", "react-pdf, pdfjs-dist, pdf-lib", "Preview, print, dan manipulasi PDF final"],
  ["Email", "nodemailer", "Dipakai untuk Request Access approved dan Reset Password"],
  ["Styling", "Tailwind CSS + custom UI components", "Menyediakan UI internal yang konsisten"],
];

const dataModelRows = [
  ["user", "Menyimpan user aplikasi utama", "Role, status aktif, identitas akun"],
  ["session / account / verification", "Mendukung Better Auth", "Session, provider account, token verifikasi/reset"],
  ["user_access_requests", "Menyimpan request user baru", "Jalur onboarding sebelum akun dibuat"],
  ["drawings", "Entitas induk drawing", "Metadata utama dan pointer logis ke current/latest completed revision"],
  ["drawing_revisions", "Riwayat revisi per drawing", "Status workflow, file PDF, revision note"],
  ["approval_actions", "Jejak keputusan approval", "Actor, decision, level, note, timestamp"],
  ["revision_approval_steps", "Assignment approver per revisi", "Menjaga assignee level 1 dan level 2"],
  ["audit_logs / download_logs", "Traceability operasional", "Jejak perubahan, entity log, dan aktivitas download"],
];

const apiRows = [
  ["Auth", ["POST /api/auth/[...all]"], "Authentication dan session management"],
  [
    "Access Request",
    [
      "POST /api/access-requests",
      "GET /api/admin/access-requests",
      "PATCH /api/admin/access-requests/[id]",
      "POST /api/admin/access-requests/[id]/approve",
      "POST /api/admin/access-requests/[id]/reject",
    ],
    "Mengelola Request Access dari calon user hingga keputusan akhir",
  ],
  [
    "Users",
    [
      "GET /api/admin/users",
      "POST /api/admin/users",
      "PATCH /api/admin/users/[id]",
      "PATCH /api/admin/users/[id]/password",
      "GET /api/users/drafters",
      "GET /api/users/approvers?level=1|2",
    ],
    "User directory, create/update user, reset password, dan lookup assignee",
  ],
  [
    "Drawings",
    [
      "GET /api/drawings",
      "POST /api/drawings",
      "POST /api/drawings/legacy",
      "GET /api/drawings/[id]",
      "PATCH /api/drawings/[id]",
      "DELETE /api/drawings/[id]",
      "POST /api/drawings/[id]/revisions",
    ],
    "CRUD metadata drawing, legacy import, dan pembuatan revisi baru",
  ],
  [
    "Revisions",
    [
      "GET /api/revisions/[revisionId]",
      "PATCH /api/revisions/[revisionId]",
      "POST /api/revisions/[revisionId]/submit",
      "POST /api/revisions/[revisionId]/check",
      "PATCH /api/revisions/[revisionId]/approval-plan",
      "POST /api/revisions/[revisionId]/approve-level-1",
      "POST /api/revisions/[revisionId]/approve-level-2",
      "GET /api/revisions/[revisionId]/preview",
      "GET /api/revisions/[revisionId]/print",
      "GET /api/revisions/[revisionId]/download",
    ],
    "Workflow revisi, preview, print, dan download dokumen final",
  ],
  ["Dashboard", ["GET /api/dashboard/summary"], "Ringkasan queue dan statistik dashboard"],
  ["Password", ["POST /api/password/request-reset", "POST /api/password/reset"], "Reset Password request dan submit token"],
];

const infrastructurePoints = {
  storage: [
    "Setiap revisi minimal menghasilkan satu file PDF, sehingga pertumbuhan storage akan terus naik seiring umur sistem.",
    "Local disk pada VPS cocok untuk dev atau pilot kecil, tetapi tidak sehat sebagai strategi jangka menengah dan panjang.",
    "Untuk production perusahaan, file storage sebaiknya dipisah ke object storage private atau storage enterprise internal.",
  ],
  backup: [
    "Database backup dan file backup harus dianggap dua aset yang saling terkait.",
    "Minimum policy yang disarankan: database backup harian, offsite copy untuk file storage, retention minimal 30 hari, dan restore drill berkala.",
    "Restore procedure harus menjaga konsistensi metadata database dan file actual di storage.",
  ],
  security: [
    "Path file tidak boleh dianggap sebagai security boundary.",
    "Preview dan download harus melalui authorization backend, bukan akses file langsung tanpa kontrol.",
    "TLS/HTTPS penuh, audit download penting, dan validasi MIME type / extension diperlukan untuk menjaga keamanan dokumen sensitif.",
  ],
  operasional: [
    "Monitoring disk, CPU, memori, database, dan error rate perlu aktif sebelum pemakaian luas.",
    "System owner dan admin operasional harus ditetapkan agar backup, kapasitas, dan access review tidak terabaikan.",
    "Jika PDF processing meningkat, worker terpisah untuk job berat perlu dipertimbangkan.",
  ],
};

const riskRows = [
  ["Pertumbuhan storage PDF", "Disk cepat penuh, backup makin berat, risiko downtime meningkat", "Pisahkan file storage dari app server, gunakan object storage, dan terapkan capacity planning berkala"],
  ["Coupling app server dan file", "Migrasi server, scale-out, dan restore menjadi lebih rumit", "Pertahankan abstraction layer storage dan simpan metadata + storage key secara konsisten"],
  ["Keterbatasan CPU dan RAM", "Preview, upload, print, dan watermarking dapat memperlambat aplikasi", "Batasi ukuran upload, gunakan streaming file, dan siapkan worker bila volume meningkat"],
  ["Network dan upload reliability", "Upload gagal di tengah jalan dan persepsi user terhadap sistem menurun", "Gunakan error handling yang jelas, checksum/validation, dan pertimbangkan resumable upload bila diperlukan"],
  ["Keamanan dokumen perusahaan", "Risiko akses tidak sah pada drawing teknis yang sensitif", "Private storage, authorization backend, audit log, TLS, dan encryption at rest bila diwajibkan"],
  ["Single point of failure operasional", "Gangguan satu node dapat menghentikan layanan secara total", "Siapkan backup terjadwal, monitoring health, runbook insiden, dan rencana storage/database yang lebih durable"],
];

const implementationRows = [
  ["Fase 1", "Penetapan kebutuhan, owner proses, dan target pilot", "Area pilot dipilih, prioritas drawing ditetapkan, governance awal disepakati"],
  ["Fase 2", "Penguatan teknis dan kesiapan infrastruktur", "Storage strategy, backup, monitoring, security review, dan UAT user inti disiapkan"],
  ["Fase 3", "Pilot operasional terarah", "Migrasi old drawing prioritas, pendampingan operasional, dan evaluasi workflow nyata"],
  ["Fase 4", "Operasional berkelanjutan", "KPI, feedback loop, capacity planning, SOP admin, dan perbaikan minor berjalan rutin"],
];

const termRows = [
  ["Drawing", "Istilah domain utama yang tetap dipakai dalam English."],
  ["Drawing List", "Gunakan konsisten, jangan diganti menjadi Daftar Drawing."],
  ["Create Drawing", "Gunakan untuk CTA pembuatan drawing baru."],
  ["Upload Old Drawing", "Istilah khusus untuk legacy import yang langsung Completed."],
  ["Current Revision", "Jangan diganti menjadi Revisi Aktif."],
  ["Final Drawing", "Gunakan konsisten untuk dokumen final yang menjadi referensi resmi."],
  ["Check / Approval / Final Approval", "Istilah tahap workflow dipertahankan dalam English."],
  ["Request Access", "Gunakan untuk jalur permintaan akun baru."],
  ["User Management", "Gunakan sebagai nama area administrasi user."],
  ["Legacy Ready", "Gunakan sebagai badge sumber drawing lama yang langsung Completed."],
  ["Uploaded by / Drawn by", "Keduanya harus dibedakan, terutama pada flow legacy import."],
];

const screenshotEntries = [
  {
    path: path.join(ROOT, "docs", "Images", "01-login-page.png"),
    title: "Lampiran A1. Halaman Sign In",
    caption: "Tampilan entry point aplikasi yang juga menyediakan akses ke Request Access dan Reset Password.",
  },
  {
    path: path.join(ROOT, "docs", "Images", "02.Drafter-dashboard-page.png"),
    title: "Lampiran A2. Dashboard Drafter",
    caption: "Contoh dashboard per role yang menampilkan summary queue, visible drawing, dan aktivitas kerja harian.",
  },
  {
    path: path.join(ROOT, "docs", "Images", "03.drafter-drawing-list-page.png"),
    title: "Lampiran A3. Drawing List",
    caption: "Drawing List menyediakan search, filter, card view, dan Compact List untuk memudahkan penelusuran drawing.",
  },
  {
    path: path.join(ROOT, "docs", "Images", "06. Draf-lleader-Approval-page.png"),
    title: "Lampiran A4. Halaman Check Drawing",
    caption: "Contoh halaman Check yang dipakai Draft Leader untuk meninjau PDF, memberi note, dan menentukan approver.",
  },
  {
    path: path.join(ROOT, "docs", "Images", "09. L2-Approval-page.png"),
    title: "Lampiran A5. Halaman Final Approval",
    caption: "Contoh halaman Final Approval untuk Head sebelum revision resmi dinyatakan Completed.",
  },
];

function appendMainSections(mainChildren) {
  mainChildren.push(heading("Document Control", HeadingLevel.HEADING_1));
  mainChildren.push(
    body(
      "Dokumen ini menyatukan materi bisnis, operasional, dan teknis yang sebelumnya tersebar di beberapa file markdown menjadi satu referensi resmi untuk review manajemen, onboarding, dan implementasi."
    )
  );
  mainChildren.push(
    createTable([2600, PAGE.contentWidth - 2600], documentControlRows, {
      headers: ["Item", "Keterangan"],
    })
  );
  mainChildren.push(breakPage());

  mainChildren.push(heading("Daftar Isi", HeadingLevel.HEADING_1));
  mainChildren.push(
    body(
      "Daftar isi berikut akan mengenali Heading 1 sampai Heading 3. Bila nomor halaman belum terisi saat file pertama kali dibuka, lakukan Update Field di Microsoft Word."
    )
  );
  mainChildren.push(
    new TableOfContents("Daftar Isi", {
      hyperlink: true,
      headingStyleRange: "1-3",
    })
  );

  mainChildren.push(heading("Ringkasan Eksekutif", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  executiveSummaryPoints.forEach((point) => mainChildren.push(body(point)));

  mainChildren.push(heading("Latar Belakang dan Problem Statement", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Masalah utama yang hendak diselesaikan adalah ketidakteraturan pengelolaan drawing, minimnya kontrol terhadap status revisi, dan sulitnya menelusuri jejak keputusan approval dalam konteks operasional maintenance."
    )
  );
  mainChildren.push(...bulletList(problemPoints));
  mainChildren.push(
    body(
      "Dampak langsungnya adalah waktu review lebih panjang, koordinasi antar peran menjadi kurang efisien, dan keyakinan terhadap keabsahan dokumen final menurun."
    )
  );

  mainChildren.push(heading("Gambaran Solusi Aplikasi", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Drawing Management App adalah workspace digital internal yang mengelola siklus hidup drawing dari Create Drawing, Check, Approval, Final Approval, sampai distribusi Final Drawing secara terpusat dan terlacak."
    )
  );
  mainChildren.push(...bulletList(solutionPoints));

  mainChildren.push(heading("Objective dan Business Value", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(divider("Objective"));
  mainChildren.push(...bulletList(objectivePoints));
  mainChildren.push(divider("Business Value"));
  mainChildren.push(...bulletList(businessValuePoints));

  mainChildren.push(heading("Scope Implementasi Saat Ini", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(heading("In Scope", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(inScopePoints));
  mainChildren.push(heading("Out of Scope", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(outOfScopePoints));

  mainChildren.push(heading("Workflow End-to-End", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(heading("Alur Utama", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(workflowMain));
  mainChildren.push(heading("Workflow Operasional", HeadingLevel.HEADING_2));
  mainChildren.push(...numberedList(workflowOperationalSteps, "numbers1"));
  mainChildren.push(heading("Workflow Legacy Import", HeadingLevel.HEADING_2));
  mainChildren.push(...numberedList(legacySteps, "numbers2"));

  mainChildren.push(heading("Role dan Tanggung Jawab", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Role model saat ini menggunakan pola satu user satu role. Tabel berikut merangkum fokus dan aktivitas utama tiap peran dalam workflow aplikasi."
    )
  );
  mainChildren.push(
    createTable([1200, 1850, 2300, PAGE.contentWidth - 5350], roleMatrixRows, {
      headers: ["Role", "Fokus", "Akses Utama", "Aktivitas Penting"],
    })
  );

  roleNarratives.forEach((role) => {
    mainChildren.push(heading(role.title, HeadingLevel.HEADING_2));
    mainChildren.push(...bulletList(role.points));
  });
}

function appendSupportingSections(mainChildren) {
  mainChildren.push(heading("Modul Aplikasi dan Fitur Utama", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Secara fungsional, aplikasi dibangun sebagai monolithic Next.js app yang menggabungkan modul auth, workflow drawing, approval, final document access, dan administrasi user."
    )
  );
  mainChildren.push(
    createTable([1600, 2650, PAGE.contentWidth - 4250], moduleRows, {
      headers: ["Modul", "Cakupan", "Nilai Utama"],
    })
  );

  mainChildren.push(heading("Status Lifecycle dan Business Rules", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Status revision yang dipakai sistem menjadi pengunci perilaku workflow dan hak akses user. Consumer hanya dapat melihat drawing berstatus Completed."
    )
  );
  mainChildren.push(
    createTable([1700, 4200, PAGE.contentWidth - 5900], statusRows, {
      headers: ["Status", "Makna", "Aksi / Aktor Berikutnya"],
    })
  );
  mainChildren.push(heading("Business Rules Kunci", HeadingLevel.HEADING_2));
  mainChildren.push(...numberedList(businessRules, "numbers3"));

  mainChildren.push(heading("Arsitektur Teknis dan Stack", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Arsitektur saat ini adalah web application full stack berbasis Next.js, dengan business logic berada di service layer dan file handling berjalan bersama runtime aplikasi."
    )
  );
  mainChildren.push(
    createTable([1650, 2600, PAGE.contentWidth - 4250], technicalStackRows, {
      headers: ["Lapisan", "Teknologi", "Peran"],
    })
  );
  mainChildren.push(heading("Catatan Implementasi", HeadingLevel.HEADING_2));
  mainChildren.push(
    ...bulletList([
      "Aplikasi berjalan sebagai monolithic Next.js app.",
      "Business logic diletakkan pada service layer.",
      "UI memakai komponen internal sederhana berbasis Tailwind CSS.",
      "Storage file saat ini masih berada di server aplikasi, sehingga perlu perhatian khusus untuk fase production.",
    ])
  );

  mainChildren.push(heading("Data Model Ringkas", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Model data aktual terdiri dari entitas auth, user onboarding, drawing lifecycle, approval tracking, audit, dan download logging. Ringkasan berikut fokus pada entitas yang berdampak langsung ke proses bisnis dan implementasi."
    )
  );
  mainChildren.push(
    createTable([1650, 2400, PAGE.contentWidth - 4050], dataModelRows, {
      headers: ["Entitas", "Fungsi", "Catatan Penting"],
    })
  );
  mainChildren.push(heading("Relasi Konseptual", HeadingLevel.HEADING_2));
  mainChildren.push(
    ...bulletList([
      "Satu user dapat memiliki session, account auth, approval action, audit log, dan download log.",
      "Satu drawing memiliki banyak drawing revision.",
      "Setiap drawing revision dapat memiliki approval_actions, revision_approval_steps, dan download_logs.",
      "`drawings.current_revision_id` dan `drawings.latest_completed_revision_id` adalah reference logis, bukan foreign key fisik.",
      "`audit_logs.action` disimpan sebagai varchar, bukan enum ketat.",
    ])
  );
  mainChildren.push(heading("Enum Aktual", HeadingLevel.HEADING_2));
  mainChildren.push(
    ...bulletList([
      "UserRole: ADMIN, DRAFTER, DRAFT_LEADER, APPROVER_L1, HEAD, CONSUMER",
      "AccessRequestStatus: PENDING, APPROVED, REJECTED",
      "RevisionStatus: DRAFT, WAITING_CHECK, CHECK_REJECTED, WAITING_APPROVAL_1, APPROVAL_1_REJECTED, WAITING_APPROVAL_2, APPROVAL_2_REJECTED, COMPLETED, OBSOLETE",
      "ApprovalDecision: APPROVED, REJECTED",
      "AuditEntityType: DRAWING, REVISION, USER, ACCESS_REQUEST",
    ])
  );

  mainChildren.push(heading("API dan Integrasi Utama", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "API saat ini bersifat internal dan dikelompokkan berdasarkan domain fungsional. Ringkasan berikut dirancang untuk memberi gambaran struktur integrasi, bukan spesifikasi request/response lengkap."
    )
  );
  mainChildren.push(
    createTable([1500, 3600, PAGE.contentWidth - 5100], apiRows, {
      headers: ["Domain", "Endpoint Utama", "Tujuan"],
    })
  );

  mainChildren.push(heading("Infrastruktur, Storage, Backup, dan Security", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(heading("Storage", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(infrastructurePoints.storage));
  mainChildren.push(heading("Backup dan Disaster Recovery", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(infrastructurePoints.backup));
  mainChildren.push(heading("Security", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(infrastructurePoints.security));
  mainChildren.push(heading("Kesiapan Operasional", HeadingLevel.HEADING_2));
  mainChildren.push(...bulletList(infrastructurePoints.operasional));

  mainChildren.push(heading("Risiko dan Mitigasi", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Risiko implementasi yang paling cepat menjadi masalah nyata berada pada area storage, file handling, backup, security, dan governance operasional. Tabel berikut merangkum fokus mitigasi yang disarankan."
    )
  );
  mainChildren.push(
    createTable([1900, 2500, PAGE.contentWidth - 4400], riskRows, {
      headers: ["Risiko", "Dampak", "Mitigasi Utama"],
    })
  );

  mainChildren.push(heading("Rencana Implementasi dan Operasional", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Dokumen ini memosisikan aplikasi sebagai implementasi kerja yang perlu diperkuat dan diadopsi secara terarah, bukan dimulai ulang dari nol."
    )
  );
  mainChildren.push(
    createTable([1200, 2500, PAGE.contentWidth - 3700], implementationRows, {
      headers: ["Fase", "Fokus", "Output Utama"],
    })
  );
  mainChildren.push(heading("Kebutuhan Governance Minimum", HeadingLevel.HEADING_2));
  mainChildren.push(
    ...bulletList([
      "Tetapkan system owner dan backup person.",
      "Siapkan checklist operasional mingguan atau bulanan untuk storage, backup, user access, dan email failure.",
      "Lakukan restore drill secara berkala, bukan hanya mengandalkan backup pasif.",
      "Evaluasi kebutuhan object storage abstraction sebelum volume file membesar.",
    ])
  );

  mainChildren.push(heading("Lampiran Screenshot", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Lampiran berikut dipilih untuk mewakili tampilan utama aplikasi tanpa menduplikasi seluruh konten tiap page. Fokus lampiran adalah memberi konteks visual terhadap bagian-bagian yang paling sering dipakai."
    )
  );

  screenshotEntries.forEach((entry, index) => {
    if (index > 0) {
      mainChildren.push(breakPage());
    }
    mainChildren.push(...imageBlock(entry.path, entry.title, entry.caption));
  });

  mainChildren.push(heading("Lampiran Referensi Istilah", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Referensi istilah berikut diambil dari UI Wording Guide agar wording pada dokumentasi dan aplikasi tetap konsisten."
    )
  );
  mainChildren.push(
    createTable([2600, PAGE.contentWidth - 2600], termRows, {
      headers: ["Istilah", "Panduan Penggunaan"],
    })
  );

  mainChildren.push(heading("Pernyataan Legal", HeadingLevel.HEADING_1, { pageBreakBefore: true }));
  mainChildren.push(
    body(
      "Dokumen ini disusun untuk kebutuhan review, koordinasi, dan implementasi internal. Seluruh materi, struktur, ilustrasi, serta narasi yang tercantum pada halaman-halaman sebelumnya diperlakukan sebagai bagian dari dokumentasi resmi yang proprietary dan dilindungi hak cipta."
    )
  );
  mainChildren.push(
    body(
      "Hak kepemilikan intelektual atas dokumen ini, termasuk namun tidak terbatas pada isi, format, gambar, dan materi pendukungnya, berada pada pihak yang dinyatakan dalam pemberitahuan hak cipta berikut. Dokumen ini tidak dimaksudkan sebagai materi open source atau untuk distribusi publik."
    )
  );
  mainChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 280, after: 120 },
      children: [run("© 2026 LinearSAF. All rights reserved.", { bold: true, size: 24, color: COLORS.primary })],
    })
  );
  mainChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [run("https://linearsaf.com", { size: 22, color: COLORS.secondary })],
    })
  );
  mainChildren.push(
      ...bulletList([
      "Dokumen ini tidak untuk diperbanyak, disebarluaskan, dipublikasikan, atau dialihkan kepada pihak lain tanpa persetujuan tertulis dari LinearSAF.",
      "Isi dokumen disediakan hanya untuk evaluasi, komunikasi internal, implementasi, dan pengambilan keputusan yang relevan dengan Drawing Management App.",
      "Penggunaan sebagian atau seluruh isi dokumen di luar konteks yang diizinkan wajib terlebih dahulu memperoleh otorisasi resmi dari LinearSAF.",
      "Penyebutan nama merek, istilah produk, dan referensi sistem di dalam dokumen ini tetap mengikuti konteks dokumentasi internal dan tidak mengalihkan hak kepemilikan atas merek atau identitas pihak terkait.",
      ])
  );
  mainChildren.push(
    body(
      "Apabila dokumen ini dibagikan dalam bentuk cetak maupun digital di lingkungan yang diizinkan, penerima wajib menjaga kerahasiaan, integritas, dan penggunaan yang sesuai dengan tujuan bisnis yang telah ditetapkan oleh LinearSAF."
    )
  );
}

function buildMainChildren() {
  const mainChildren = [];
  appendMainSections(mainChildren);
  appendSupportingSections(mainChildren);
  return mainChildren;
}

function buildDoc() {
  const mainChildren = buildMainChildren();
  return new Document({
    creator: "OpenAI Codex",
    title: "Dokumentasi Lengkap Drawing Management App",
    description: "Master documentation untuk manajemen dan tim internal.",
    subject: "Drawing Management App Documentation",
    features: {
      updateFields: true,
    },
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 22,
            color: COLORS.text,
          },
        },
      },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial", color: COLORS.primary },
          paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: COLORS.primary },
          paragraph: { spacing: { before: 180, after: 160 }, outlineLevel: 1 },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: COLORS.primary },
          paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numbers1",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numbers2",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numbers3",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: {
              top: PAGE.margin,
              right: PAGE.margin,
              bottom: PAGE.margin,
              left: PAGE.margin,
            },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2400, after: 240 },
            children: [run("Dokumentasi Lengkap", { bold: true, size: 34, color: COLORS.primary })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [run("Drawing Management App", { bold: true, size: 40, color: COLORS.text })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 420 },
            children: [
              run("Master documentation / system dossier untuk manajemen dan tim internal", {
                size: 22,
                color: COLORS.muted,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [run("Drawing Filing & Approval System", { size: 24, bold: true, color: COLORS.secondary })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 1200 },
            children: [
              run(
                "Dokumen ini menggabungkan ringkasan bisnis, workflow operasional, arsitektur teknis, risiko implementasi, role documentation, dan referensi istilah ke dalam satu naskah resmi yang rapi.",
                { size: 22, color: COLORS.text }
              ),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [run("Versi 1.0", { bold: true, size: 22, color: COLORS.primary })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [run("Status: Draft for Internal Review", { size: 21, color: COLORS.muted })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [run("Tanggal: 5 April 2026", { size: 21, color: COLORS.muted })],
          }),
        ],
      },
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: {
              top: PAGE.margin,
              right: PAGE.margin,
              bottom: PAGE.margin,
              left: PAGE.margin,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                children: [run("Drawing Management App Documentation", { size: 18, color: COLORS.muted })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120 },
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                children: [
                  run("Dokumentasi Lengkap Drawing Management App", { size: 18, color: COLORS.muted }),
                  run(" ", { size: 18 }),
                  run("Halaman ", { size: 18, color: COLORS.muted }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: COLORS.muted,
                    font: "Arial",
                  }),
                ],
              }),
            ],
          }),
        },
        children: mainChildren,
      },
    ],
  });
}

async function main() {
  const doc = buildDoc();
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`DOCX written: ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
