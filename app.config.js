/* ==========================================================================
   BizFlow - Aplikasi Kelola Order, Stok & Harga Member
   Berkas 1 dari 5: app.config.js  (REVISI: edisi PRO penuh)

   FUNGSI BERKAS INI
   Pusat konfigurasi (tanpa logika bisnis). Semua nilai tetap aplikasi
   ditaruh di sini agar core.js, components.js, dan index.html tidak perlu
   menanam angka atau teks "ajaib" sendiri.

   EDISI
   Ini adalah aplikasi PRO itu sendiri (produk berbayar, full fitur).
   - Tidak ada kunci lisensi dan tidak ada menu yang digembok.
   - Laporan Laba, Pengeluaran, serta Staf & Kasir selalu terbuka.
   - "Mode Demo" BUKAN versi terbatas. Ia hanya ruang latihan/simulasi
     dengan seluruh fitur PRO tetap aktif, dan datanya bisa direset.

   URUTAN MUAT DI index.html (nanti):
     1. app.config.js   (berkas ini)
     2. core.js         (otak aplikasi, dikunci/dilindungi)
     3. components.js   (komponen UI)
   styles.css dimuat lewat <link> di <head>.

   ATURAN PENTING
   - Berkas ini diekspor sebagai window.BIZFLOW_CONFIG dan DIBEKUKAN
     (deep freeze). Tidak ada kode lain yang boleh mengubahnya saat runtime.
   - TIDAK ADA data dummy yang masuk ke database utama secara otomatis.
     Objek DEMO_SEED di bawah hanya dibaca core.js ketika pengguna
     menekan tombol simulasi/demo secara eksplisit.
   - Contoh data untuk kotak isian form ada di PLACEHOLDERS (hanya teks
     bayangan/placeholder, tidak pernah disimpan).
   ========================================================================== */

(function (global) {
  "use strict";

  /* ------------------------------------------------------------------------
     1. IDENTITAS APLIKASI
     ------------------------------------------------------------------------ */
  var APP = {
    name: "BizFlow",
    fullName: "BizFlow - Aplikasi Kelola Order, Stok & Harga Member",
    productLine: "BizFlow POS",
    tagline: "Sistem Kasir & Stok",
    subtitle: "BizFlow POS & Inventory",
    version: "1.0.0",
    schemaVersion: 1,
    locale: "id-ID",
    timezoneLabel: "WIB",
    defaultStoreName: "Nama Toko Anda",
    defaultBranchName: "Cabang Utama",
    defaultCashierName: "Kasir",
    defaultCashierRole: "Kasir Utama"
  };

  /* ------------------------------------------------------------------------
     2. EDISI PRO
     Aplikasi ini sudah PRO sejak awal. Nilai di bawah hanya untuk label
     dan banner; tidak ada logika aktivasi atau penguncian.
     ------------------------------------------------------------------------ */
  var EDITION = {
    id: "pro",
    name: "Versi PRO",
    badgeLabel: "Versi PRO Aktif",
    badgeIcon: "verified",
    allFeaturesUnlocked: true,
    proFeatures: ["laporan-laba", "pengeluaran", "staf-kasir"]
  };

  /* ------------------------------------------------------------------------
     3. PENYIMPANAN (localStorage)
     Setiap mode memakai ruang penyimpanan terpisah supaya data latihan
     (Mode Demo) tidak pernah bercampur dengan data Toko Sendiri.
     ------------------------------------------------------------------------ */
  var STORAGE = {
    prefix: "bizflow.v1.",
    keys: {
      meta: "meta",
      session: "session"
    },
    namespaces: {
      demo: "demo",
      store: "store"
    },
    collections: [
      "products",
      "members",
      "orders",
      "expenses",
      "staff",
      "counters"
    ],
    autosaveDebounceMs: 250
  };

  /* ------------------------------------------------------------------------
     4. MODE DATA
     - demo  : ruang latihan/simulasi. Awalnya KOSONG; data contoh hanya
               masuk jika pengguna menekan "Muat Data Demo".
               Semua fitur PRO tetap aktif di sini.
     - store : "Mode Toko Sendiri" (data nyata milik pengguna).
     ------------------------------------------------------------------------ */
  var MODES = {
    defaultMode: "demo",
    list: {
      demo: {
        id: "demo",
        label: "Mode Demo",
        icon: "toggle_on",
        description: "Ruang latihan dengan semua fitur PRO. Data bisa direset kapan saja.",
        resettable: true
      },
      store: {
        id: "store",
        label: "Toko Sendiri",
        icon: "storefront",
        description: "Data nyata milik toko Anda.",
        resettable: false
      }
    }
  };

  /* ------------------------------------------------------------------------
     5. MENU NAVIGASI
     Mengikuti sidebar pada desain Stitch (data-path pada code.html).
     Grup "FITUR PRO" hanyalah pengelompokan tampilan; semua menunya
     selalu terbuka.
     ------------------------------------------------------------------------ */
  var NAVIGATION = {
    defaultRoute: "dashboard",
    groups: [
      {
        id: "main",
        label: "MENU UTAMA",
        items: [
          {
            path: "dashboard",
            label: "Dashboard",
            icon: "space_dashboard",
            badge: null
          },
          {
            path: "pesanan-order",
            label: "Pesanan (Order)",
            icon: "receipt_long",
            badge: "ordersInProcess"
          },
          {
            path: "stok-produk",
            label: "Stok Produk",
            icon: "inventory_2",
            badge: "tagIcon"
          },
          {
            path: "menu-member",
            label: "Menu Member",
            icon: "card_membership",
            badge: "vipTag"
          }
        ]
      },
      {
        id: "pro",
        label: "FITUR PRO",
        items: [
          {
            path: "laporan-laba",
            label: "Laporan Laba",
            icon: "analytics",
            badge: null
          },
          {
            path: "pengeluaran",
            label: "Pengeluaran",
            icon: "account_balance_wallet",
            badge: null
          },
          {
            path: "staf-kasir",
            label: "Staf & Kasir",
            icon: "badge",
            badge: null
          }
        ]
      }
    ]
  };

  /* ------------------------------------------------------------------------
     6. HEADER TOKO
     Teks dan ikon tombol pada header (ubah nama toko, mode toko sendiri,
     reset demo, banner mode).
     ------------------------------------------------------------------------ */
  var HEADER = {
    renameStore: {
      icon: "edit",
      label: "Ubah Nama Toko",
      dialogTitle: "Ubah Nama Toko",
      fieldLabel: "Nama Toko",
      maxLength: 60
    },
    ownStoreButton: {
      icon: "storefront",
      label: "Toko Sendiri",
      activeLabel: "Kembali ke Mode Demo",
      confirmTitle: "Beralih ke Mode Toko Sendiri?",
      confirmText: "Anda akan memakai ruang data terpisah yang kosong dan siap diisi data toko nyata. Data Mode Demo tidak ikut terbawa."
    },
    demoButtons: {
      load: {
        icon: "play_circle",
        label: "Muat Data Demo",
        confirmTitle: "Muat data simulasi?",
        confirmText: "Data contoh akan dimasukkan ke Mode Demo agar Anda bisa berlatih memakai semua fitur."
      },
      reset: {
        icon: "restart_alt",
        label: "Reset Demo",
        confirmTitle: "Reset Mode Demo?",
        confirmText: "Semua data di Mode Demo akan dihapus dan kembali kosong. Data Toko Sendiri tidak terpengaruh."
      }
    },
    banners: {
      demo: {
        icon: "toggle_on",
        label: "Mode Demo",
        tone: "neutral"
      },
      store: {
        icon: "storefront",
        label: "Mode Toko Sendiri",
        tone: "primary"
      },
      pro: {
        icon: "verified",
        label: "Versi PRO Aktif",
        tone: "success"
      }
    },
    notificationsIcon: "notifications"
  };

  /* ------------------------------------------------------------------------
     7. MATA UANG & FORMAT
     ------------------------------------------------------------------------ */
  var FORMAT = {
    currency: {
      code: "IDR",
      symbol: "Rp",
      symbolSpacing: " ",
      thousandSeparator: ".",
      decimalSeparator: ",",
      decimals: 0
    },
    date: {
      shortOptions: { day: "2-digit", month: "short", year: "numeric" },
      timeOptions: { hour: "2-digit", minute: "2-digit", hour12: false },
      timePrefix: "Pukul",
      timeSuffix: "WIB"
    },
    percent: {
      decimals: 0,
      symbol: "%"
    }
  };

  /* ------------------------------------------------------------------------
     8. PENOMORAN (nomor pesanan, SKU otomatis, id)
     Contoh hasil nomor pesanan: #ORD-2026-0001
     ------------------------------------------------------------------------ */
  var NUMBERING = {
    order: {
      prefix: "ORD",
      withYear: true,
      padLength: 4,
      displayHash: true
    },
    sku: {
      autoPrefix: "SKU",
      padLength: 3
    },
    idLength: 10
  };

  /* ------------------------------------------------------------------------
     9. TINGKAT MEMBER (HARGA MEMBER)
     Harga Umum vs Harga Member diatur per produk di Stok Produk.
     Tingkat di bawah hanya menentukan label, ikon, warna lencana (badge),
     dan poin loyalitas. "pointsRate" = poin per Rp 1.000 belanja.
     ------------------------------------------------------------------------ */
  var MEMBER_TIERS = {
    defaultTier: "none",
    list: {
      none: {
        id: "none",
        label: "Reguler / Non-Member",
        short: "Reguler",
        icon: "person",
        badgeClass: "badge--neutral",
        usesMemberPrice: false,
        pointsRate: 0
      },
      silver: {
        id: "silver",
        label: "Member Silver",
        short: "Silver",
        icon: "military_tech",
        badgeClass: "badge--member",
        usesMemberPrice: true,
        pointsRate: 1
      },
      gold: {
        id: "gold",
        label: "Member Gold",
        short: "Gold",
        icon: "verified",
        badgeClass: "badge--member",
        usesMemberPrice: true,
        pointsRate: 2
      },
      platinum: {
        id: "platinum",
        label: "Member Platinum",
        short: "Platinum",
        icon: "workspace_premium",
        badgeClass: "badge--member",
        usesMemberPrice: true,
        pointsRate: 3
      }
    },
    order: ["none", "silver", "gold", "platinum"],
    priceSwitcherLabels: {
      regular: "Harga Reguler",
      member: "Harga Member"
    },
    discountLabels: {
      points: "Poin",
      special: "Khusus",
      vip: "VIP",
      percent: "Persen"
    }
  };

  /* ------------------------------------------------------------------------
     10. PESANAN (ORDER)
     ------------------------------------------------------------------------ */
  var ORDERS = {
    statuses: {
      processing: {
        id: "processing",
        label: "Diproses",
        badgeClass: "badge--warning",
        countsAsRevenue: false,
        editable: true
      },
      paid: {
        id: "paid",
        label: "Lunas",
        badgeClass: "badge--success",
        countsAsRevenue: true,
        editable: false
      },
      void: {
        id: "void",
        label: "Dibatalkan",
        badgeClass: "badge--danger",
        countsAsRevenue: false,
        editable: false
      }
    },
    statusOrder: ["processing", "paid", "void"],
    defaultStatus: "processing",
    paymentMethods: {
      cash: { id: "cash", label: "Tunai", icon: "payments" },
      qris: { id: "qris", label: "QRIS", icon: "qr_code_2" },
      transfer: { id: "transfer", label: "Transfer Bank", icon: "account_balance" }
    },
    paymentOrder: ["cash", "qris", "transfer"],
    defaultPayment: "cash",
    filters: [
      { id: "all", label: "Semua", icon: null },
      { id: "member", label: "Member Saja", icon: "star" },
      { id: "cash", label: "Tunai", icon: null },
      { id: "qris", label: "QRIS", icon: null }
    ],
    defaultFilter: "all",
    tableColumns: [
      { id: "number", label: "No. Pesanan", align: "left" },
      { id: "customer", label: "Pelanggan", align: "left" },
      { id: "items", label: "Rincian Menu", align: "left" },
      { id: "total", label: "Total Bayar", align: "right" },
      { id: "discount", label: "Diskon Member", align: "right" },
      { id: "status", label: "Status", align: "center" },
      { id: "action", label: "Aksi", align: "center" }
    ],
    walkInCustomerLabel: "Pembeli Umum",
    newOrderButton: { icon: "add_shopping_cart", label: "+ Catat Pesanan Baru" },
    dashboardRecentLimit: 5,
    pageSize: 20,
    allowVoidPaidOrder: true,
    restockOnVoid: true,
    maxItemQty: 9999
  };

  /* ------------------------------------------------------------------------
     11. STOK PRODUK
     ------------------------------------------------------------------------ */
  var INVENTORY = {
    defaultMinStock: 5,
    lowStockLabel: "Menipis",
    outOfStockLabel: "Habis",
    inStockLabel: "Tersedia",
    stockUnit: "pcs",
    stockUnits: ["pcs", "kg", "gram", "liter", "ml", "pak", "dus", "botol", "porsi"],
    categories: ["Minuman", "Makanan", "Biji Kopi", "Bahan Baku", "Dairy", "Powder", "Lainnya"],
    defaultCategory: "Lainnya",
    addButton: { icon: "add_box", label: "+ Tambah Produk / Atur Harga Member" },
    opnameButton: { icon: "inventory", label: "Cek Opname Stok" },
    barcodeInputIcon: "barcode_scanner",
    tableColumns: [
      { id: "product", label: "Produk", align: "left" },
      { id: "sku", label: "SKU", align: "left" },
      { id: "stock", label: "Stok", align: "right" },
      { id: "regular", label: "Harga Reguler", align: "right" },
      { id: "member", label: "Harga Member", align: "right" },
      { id: "action", label: "Aksi", align: "center" }
    ],
    memberDiscountBadge: {
      showPercentWhenAuto: true,
      customLabelMaxLength: 20
    },
    allowNegativeStock: false
  };

  /* ------------------------------------------------------------------------
     12. MEMBER
     ------------------------------------------------------------------------ */
  var MEMBERS = {
    tableColumns: [
      { id: "name", label: "Nama Member", align: "left" },
      { id: "phone", label: "No. HP", align: "left" },
      { id: "tier", label: "Tingkat", align: "center" },
      { id: "points", label: "Poin", align: "right" },
      { id: "spent", label: "Total Belanja", align: "right" },
      { id: "action", label: "Aksi", align: "center" }
    ],
    addButton: { icon: "person_add", label: "+ Tambah Member" },
    phoneMinDigits: 8,
    phoneMaxDigits: 15
  };

  /* ------------------------------------------------------------------------
     13. PENGELUARAN
     ------------------------------------------------------------------------ */
  var EXPENSES = {
    categories: ["Bahan Baku", "Sewa", "Listrik & Air", "Gaji", "Transportasi", "Peralatan", "Lainnya"],
    defaultCategory: "Lainnya",
    tableColumns: [
      { id: "date", label: "Tanggal", align: "left" },
      { id: "title", label: "Keterangan", align: "left" },
      { id: "category", label: "Kategori", align: "center" },
      { id: "amount", label: "Jumlah", align: "right" },
      { id: "action", label: "Aksi", align: "center" }
    ],
    addButton: { icon: "add", label: "+ Catat Pengeluaran" }
  };

  /* ------------------------------------------------------------------------
     14. STAF & KASIR
     ------------------------------------------------------------------------ */
  var STAFF = {
    roles: {
      owner: { id: "owner", label: "Pemilik" },
      supervisor: { id: "supervisor", label: "Supervisor" },
      cashier: { id: "cashier", label: "Kasir" }
    },
    roleOrder: ["owner", "supervisor", "cashier"],
    defaultRole: "cashier",
    shifts: {
      morning: { id: "morning", label: "Shift Pagi", start: "08:00", end: "16:00" },
      evening: { id: "evening", label: "Shift Sore", start: "16:00", end: "22:00" }
    },
    shiftOrder: ["morning", "evening"],
    defaultShift: "morning",
    tableColumns: [
      { id: "name", label: "Nama", align: "left" },
      { id: "role", label: "Peran", align: "left" },
      { id: "shift", label: "Shift", align: "center" },
      { id: "status", label: "Status", align: "center" },
      { id: "action", label: "Aksi", align: "center" }
    ],
    addButton: { icon: "person_add", label: "+ Tambah Staf" },
    greeting: "Halo",
    greetingSuffix: "Aktif"
  };

  /* ------------------------------------------------------------------------
     15. LAPORAN LABA
     Laba kotor = penjualan lunas - HPP. Laba bersih = laba kotor - pengeluaran.
     (Rumus dijalankan di core.js.)
     ------------------------------------------------------------------------ */
  var REPORTS = {
    periods: [
      { id: "today", label: "Hari Ini" },
      { id: "week", label: "7 Hari" },
      { id: "month", label: "Bulan Ini" },
      { id: "all", label: "Semua" }
    ],
    defaultPeriod: "today",
    cards: {
      revenue: "Total Penjualan",
      cogs: "Total HPP (Modal)",
      grossProfit: "Laba Kotor",
      expenses: "Total Pengeluaran",
      netProfit: "Laba Bersih",
      margin: "Margin Bersih"
    },
    topProductsLimit: 5,
    topProductsTitle: "Produk Terlaris"
  };

  /* ------------------------------------------------------------------------
     16. DASHBOARD
     ------------------------------------------------------------------------ */
  var DASHBOARD = {
    greeting: "Halo",
    greetingSuffix: "Shift Aktif",
    description: "Kelola kasir cepat, pantau margin otomatis, dan tetapkan potongan eksklusif untuk pelanggan loyal.",
    sessionPrefix: "Sesi Buka:",
    onlineLabel: "Kasir Online",
    offlineLabel: "Kasir Offline",
    scanPlaceholderLabel: "Scan Barcode / SKU...",
    cards: {
      revenue: { label: "Total Omzet Hari Ini", icon: "payments", comparisonLabel: "vs kemarin" },
      orders: { label: "Total Pesanan Kasir", icon: "receipt_long", unit: "Pesanan", processingSuffix: "diproses", paidSuffix: "selesai lunas" },
      products: { label: "Katalog & SKU Aktif", icon: "category", unit: "SKU", lowStockSuffix: "SKU Menipis", lowStockHint: "<5 pcs sisa" },
      members: { label: "Pelanggan Member", icon: "workspace_premium", unit: "Member", todaySuffix: "Transaksi Hari Ini" }
    },
    recentTitle: "Transaksi Pesanan Kasir",
    recentLiveLabel: "Live Feed",
    recentSubtitle: "Daftar transaksi terakhir dari pesanan shift berjalan",
    recentFooter: "Lihat Semua Pesanan",
    catalogTitle: "Katalog & Harga Member",
    catalogBadge: "VIP Matrix",
    catalogSubtitle: "Perbandingan harga umum vs harga eksklusif tier member",
    catalogLimit: 4
  };

  /* ------------------------------------------------------------------------
     17. CETAK STRUK (pada setiap transaksi pesanan)
     Lebar kertas termal umum: 58 mm atau 80 mm.
     ------------------------------------------------------------------------ */
  var RECEIPT = {
    buttonLabel: "Struk",
    buttonIcon: "print",
    windowTitle: "Struk Pesanan",
    paperWidthMm: 58,
    paperWidthOptions: [58, 80],
    charsPerLine: 32,
    fontFamily: "'Courier New', monospace",
    fontSizePx: 12,
    showLogo: false,
    showCashier: true,
    showMemberInfo: true,
    showMemberSaving: true,
    showPaymentMethod: true,
    showOrderNumber: true,
    showDateTime: true,
    headerLines: ["{storeName}", "{branchName}"],
    footerLines: ["Terima kasih sudah berbelanja!", "Barang yang dibeli tidak dapat dikembalikan."],
    labels: {
      orderNumber: "No",
      date: "Tanggal",
      cashier: "Kasir",
      customer: "Pelanggan",
      member: "Member",
      subtotal: "Subtotal",
      memberSaving: "Hemat Member",
      total: "TOTAL",
      payment: "Bayar",
      cashPaid: "Tunai",
      change: "Kembali",
      status: "Status"
    },
    autoPrintOnOpen: true,
    closeAfterPrint: false
  };

  /* ------------------------------------------------------------------------
     18. PLACEHOLDER FORM (TEKS BAYANGAN SAJA)
     Dipakai pada atribut placeholder di kotak input. Nilai ini TIDAK PERNAH
     disimpan ke database dan TIDAK menjadi isi default kolom.
     ------------------------------------------------------------------------ */
  var PLACEHOLDERS = {
    storeName: "mis. Toko Kopi & Retail Sejahtera",
    branchName: "mis. Cabang Utama",
    cashierName: "mis. Budi",
    barcode: "Scan Barcode / SKU...",
    search: "Cari nama, SKU, atau nomor pesanan...",
    product: {
      name: "mis. Kopi Arabica Gayo 250g",
      sku: "mis. KB-001",
      category: "mis. Biji Kopi",
      cost: "mis. 42000",
      priceRegular: "mis. 65000",
      priceMember: "mis. 55000",
      stock: "mis. 42",
      minStock: "mis. 5",
      memberLabel: "mis. Diskon Khusus"
    },
    member: {
      name: "mis. Rian Pratama",
      phone: "mis. 081234567890",
      note: "mis. Suka kopi tanpa gula"
    },
    order: {
      customer: "Pilih member atau biarkan kosong untuk pembeli umum",
      qty: "mis. 2",
      cashPaid: "mis. 100000",
      note: "mis. Kurangi es"
    },
    expense: {
      title: "mis. Bayar listrik bulan ini",
      amount: "mis. 750000",
      note: "mis. Dibayar via transfer"
    },
    staff: {
      name: "mis. Budi Santoso",
      phone: "mis. 081234567890"
    }
  };

  /* ------------------------------------------------------------------------
     19. PESAN SISTEM
     ------------------------------------------------------------------------ */
  var MESSAGES = {
    emptyStates: {
      orders: {
        icon: "receipt_long",
        title: "Belum ada pesanan",
        text: "Tekan \"+ Catat Pesanan Baru\" untuk membuat transaksi pertama."
      },
      products: {
        icon: "inventory_2",
        title: "Belum ada produk",
        text: "Tambahkan produk beserta Harga Reguler dan Harga Member."
      },
      members: {
        icon: "card_membership",
        title: "Belum ada member",
        text: "Daftarkan pelanggan loyal untuk memberi harga eksklusif."
      },
      expenses: {
        icon: "account_balance_wallet",
        title: "Belum ada pengeluaran",
        text: "Catat biaya operasional agar laba bersih akurat."
      },
      staff: {
        icon: "badge",
        title: "Belum ada staf",
        text: "Tambahkan staf dan kasir yang bertugas di toko."
      },
      reports: {
        icon: "analytics",
        title: "Belum ada data laporan",
        text: "Laporan akan terisi setelah ada pesanan berstatus Lunas."
      },
      demoHint: "Ingin berlatih dulu? Tekan \"Muat Data Demo\" di bagian atas."
    },
    success: {
      saved: "Perubahan berhasil disimpan.",
      deleted: "Data berhasil dihapus.",
      orderCreated: "Pesanan berhasil dicatat.",
      orderPaid: "Pesanan ditandai Lunas.",
      orderVoided: "Pesanan dibatalkan.",
      storeRenamed: "Nama toko berhasil diperbarui.",
      demoLoaded: "Data demo berhasil dimuat.",
      demoReset: "Mode Demo berhasil direset.",
      modeChanged: "Mode berhasil diganti."
    },
    errors: {
      required: "Kolom ini wajib diisi.",
      invalidNumber: "Masukkan angka yang valid.",
      negativeNumber: "Angka tidak boleh negatif.",
      insufficientStock: "Stok tidak mencukupi.",
      duplicateSku: "SKU sudah dipakai produk lain.",
      invalidPhone: "Nomor HP tidak valid.",
      storageFailed: "Gagal menyimpan data di perangkat ini.",
      notFound: "Data tidak ditemukan.",
      memberPriceAboveRegular: "Harga Member tidak boleh lebih tinggi dari Harga Reguler.",
      emptyCart: "Tambahkan minimal satu produk ke pesanan.",
      demoOnly: "Aksi ini hanya tersedia di Mode Demo."
    },
    confirm: {
      deleteTitle: "Hapus data ini?",
      deleteText: "Tindakan ini tidak dapat dibatalkan.",
      voidTitle: "Batalkan pesanan ini?",
      voidText: "Status pesanan menjadi Dibatalkan dan stok dikembalikan.",
      yes: "Ya, Lanjutkan",
      no: "Batal"
    },
    buttons: {
      save: "Simpan",
      cancel: "Batal",
      close: "Tutup",
      edit: "Ubah",
      delete: "Hapus",
      add: "Tambah",
      search: "Cari",
      markPaid: "Tandai Lunas",
      void: "Batalkan Pesanan"
    }
  };

  /* ------------------------------------------------------------------------
     20. ASET EKSTERNAL (font & ikon sesuai DESIGN.md)
     Plus Jakarta Sans untuk judul, Inter untuk data/tabel,
     Material Symbols Outlined untuk ikon.
     ------------------------------------------------------------------------ */
  var ASSETS = {
    fontsStylesheet:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap",
    iconsStylesheet:
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    fontHeadline: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    iconClass: "material-symbols-outlined"
  };

  /* ------------------------------------------------------------------------
     21. LAYOUT (mengikuti DESIGN.md)
     ------------------------------------------------------------------------ */
  var LAYOUT = {
    sidebarWidthPx: 260,
    sidebarRailWidthPx: 72,
    headerHeightPx: 64,
    maxCanvasWidthPx: 1600,
    breakpoints: {
      mobile: 768,
      tablet: 1024
    },
    sidebarCollapsedStorageKey: "ui.sidebarCollapsed",
    toastDurationMs: 3500
  };

  /* ------------------------------------------------------------------------
     22. DATA SIMULASI (DEMO_SEED)
     PERHATIAN: Data di bawah BUKAN isi database. Ia hanya dibaca core.js
     ketika pengguna menekan "Muat Data Demo" di Mode Demo. Saat aplikasi
     dibuka pertama kali, semua tabel database selalu kosong.

     Aturan format:
     - Waktu pesanan memakai "minutesAgo" (menit yang lalu) supaya tidak
       terpaku pada tanggal tertentu.
     - Item pesanan merujuk produk lewat "sku", lalu core.js mengubahnya
       menjadi id produk saat memuat demo.
     - "unitPrice" = harga yang dibayar (Harga Member bila pelanggan member).
     - Pesanan berstatus "processing" tidak mengurangi stok sampai Lunas.
       (Aturan stok dijalankan core.js.)
     ------------------------------------------------------------------------ */
  var DEMO_SEED = {
    store: {
      name: "Toko Kopi & Retail Sejahtera",
      branch: "Cabang Utama",
      cashier: "Budi",
      cashierRole: "Kasir Utama"
    },
    products: [
      {
        sku: "KB-001",
        name: "Kopi Arabica Gayo 250g",
        category: "Biji Kopi",
        unit: "pcs",
        cost: 42000,
        priceRegular: 65000,
        priceMember: 55000,
        memberLabel: "-15%",
        stock: 42,
        minStock: 5
      },
      {
        sku: "SR-102",
        name: "Sirup Karamel Premium 750ml",
        category: "Bahan Baku",
        unit: "pcs",
        cost: 70000,
        priceRegular: 98000,
        priceMember: 88000,
        memberLabel: "Diskon Khusus",
        stock: 18,
        minStock: 5
      },
      {
        sku: "SU-004",
        name: "Susu UHT Full Cream 1L",
        category: "Dairy",
        unit: "pcs",
        cost: 16000,
        priceRegular: 22000,
        priceMember: 20000,
        memberLabel: "Tier Basic",
        stock: 4,
        minStock: 5
      },
      {
        sku: "MP-201",
        name: "Matcha Ceremonial 100g",
        category: "Powder",
        unit: "pcs",
        cost: 58000,
        priceRegular: 85000,
        priceMember: 72000,
        memberLabel: "-15% VIP",
        stock: 25,
        minStock: 5
      },
      {
        sku: "MN-010",
        name: "Kopi Susu Aren",
        category: "Minuman",
        unit: "porsi",
        cost: 9000,
        priceRegular: 22000,
        priceMember: 19000,
        memberLabel: "Member",
        stock: 100,
        minStock: 10
      },
      {
        sku: "MK-020",
        name: "Roti Bakar Cokelat",
        category: "Makanan",
        unit: "porsi",
        cost: 11000,
        priceRegular: 24000,
        priceMember: 22000,
        memberLabel: "Member",
        stock: 60,
        minStock: 10
      }
    ],
    members: [
      { ref: "rian", name: "Rian Pratama", phone: "081200000001", tier: "gold", points: 120 },
      { ref: "dewi", name: "Dewi Sartika", phone: "081200000002", tier: "silver", points: 55 },
      { ref: "bambang", name: "Bambang Wijaya", phone: "081200000003", tier: "platinum", points: 310 },
      { ref: "siti", name: "Siti Aminah", phone: "081200000004", tier: "silver", points: 40 }
    ],
    orders: [
      {
        memberRef: "rian",
        minutesAgo: 20,
        payment: "qris",
        status: "paid",
        items: [
          { sku: "MN-010", qty: 2, unitPrice: 19000 },
          { sku: "MK-020", qty: 1, unitPrice: 22000 }
        ]
      },
      {
        memberRef: "dewi",
        minutesAgo: 27,
        payment: "cash",
        status: "paid",
        items: [
          { sku: "KB-001", qty: 1, unitPrice: 55000 }
        ]
      },
      {
        memberRef: "bambang",
        minutesAgo: 42,
        payment: "transfer",
        status: "processing",
        items: [
          { sku: "MN-010", qty: 3, unitPrice: 19000 },
          { sku: "MK-020", qty: 2, unitPrice: 22000 }
        ]
      },
      {
        memberRef: null,
        minutesAgo: 57,
        payment: "qris",
        status: "paid",
        items: [
          { sku: "SR-102", qty: 1, unitPrice: 98000 }
        ]
      },
      {
        memberRef: "siti",
        minutesAgo: 74,
        payment: "cash",
        status: "paid",
        items: [
          { sku: "MN-010", qty: 4, unitPrice: 19000 }
        ]
      }
    ],
    expenses: [
      { title: "Pembelian bahan baku mingguan", category: "Bahan Baku", amount: 1250000, daysAgo: 1 },
      { title: "Tagihan listrik dan air", category: "Listrik & Air", amount: 780000, daysAgo: 3 },
      { title: "Sewa tempat bulan berjalan", category: "Sewa", amount: 3500000, daysAgo: 5 }
    ],
    staff: [
      { name: "Budi", role: "cashier", shift: "morning", active: true },
      { name: "Sari", role: "cashier", shift: "evening", active: true },
      { name: "Andi", role: "supervisor", shift: "morning", active: true }
    ]
  };

  /* ------------------------------------------------------------------------
     23. SAKELAR FITUR (feature flags)
     Memudahkan menyalakan/mematikan bagian aplikasi tanpa menyentuh core.js.
     Semua fitur inti PRO bernilai true. Kartu "Upgrade Bisnis" pada desain
     awal dimatikan karena ini sudah edisi PRO penuh.
     ------------------------------------------------------------------------ */
  var FEATURES = {
    receiptPrinting: true,
    memberPricing: true,
    stockOpname: true,
    barcodeQuickAdd: true,
    notifications: true,
    exportBackupJson: true,
    importBackupJson: true,
    upgradeCard: false,
    debugLog: false
  };

  /* ------------------------------------------------------------------------
     RAKIT, BEKUKAN, DAN EKSPOR
     ------------------------------------------------------------------------ */
  var CONFIG = {
    APP: APP,
    EDITION: EDITION,
    STORAGE: STORAGE,
    MODES: MODES,
    NAVIGATION: NAVIGATION,
    HEADER: HEADER,
    FORMAT: FORMAT,
    NUMBERING: NUMBERING,
    MEMBER_TIERS: MEMBER_TIERS,
    ORDERS: ORDERS,
    INVENTORY: INVENTORY,
    MEMBERS: MEMBERS,
    EXPENSES: EXPENSES,
    STAFF: STAFF,
    REPORTS: REPORTS,
    DASHBOARD: DASHBOARD,
    RECEIPT: RECEIPT,
    PLACEHOLDERS: PLACEHOLDERS,
    MESSAGES: MESSAGES,
    ASSETS: ASSETS,
    LAYOUT: LAYOUT,
    DEMO_SEED: DEMO_SEED,
    FEATURES: FEATURES
  };

  function deepFreeze(target) {
    if (target === null || typeof target !== "object" || Object.isFrozen(target)) {
      return target;
    }
    Object.getOwnPropertyNames(target).forEach(function (name) {
      deepFreeze(target[name]);
    });
    return Object.freeze(target);
  }

  deepFreeze(CONFIG);

  Object.defineProperty(global, "BIZFLOW_CONFIG", {
    value: CONFIG,
    writable: false,
    configurable: false,
    enumerable: true
  });
})(typeof window !== "undefined" ? window : this);