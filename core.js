/* ==========================================================================
   BizFlow - Aplikasi Kelola Order, Stok & Harga Member
   Berkas 2 dari 5: core.js  (OTAK APLIKASI / CORE LOGIC)

   TUGAS BERKAS INI
   Seluruh logika bisnis dan penyimpanan data. Tidak ada kode tampilan di
   sini; components.js dan index.html hanya memanggil API publik
   window.BizFlowCore.

   Cakupan:
   - Penyimpanan localStorage (ruang Mode Demo dan Toko Sendiri terpisah)
   - CRUD Produk (Harga Reguler & Harga Member), opname stok
   - CRUD Member (tingkat Silver/Gold/Platinum, poin)
   - Pesanan: harga member otomatis, stok otomatis berkurang, Lunas, Batal
   - Pengeluaran, Staf & Kasir
   - Dashboard, Laporan Laba (omzet, HPP, laba kotor, laba bersih)
   - Data header toko: ubah nama, mode, muat/reset demo
   - Struk (teks dan HTML siap cetak)
   - Cadangan JSON (ekspor/impor)

   PERLINDUNGAN
   - State berada di dalam closure privat; tidak bisa diubah dari luar.
   - API publik dibekukan (deep freeze) dan dipasang sebagai
     window.BizFlowCore yang tidak bisa ditimpa.
   - Semua data yang keluar adalah salinan (clone), jadi mengubah hasilnya
     tidak mengubah database.
   - Catatan jujur: kode JavaScript di browser tidak bisa 100% disembunyikan;
     pengaman ini mencegah kerusakan tidak sengaja, bukan pembobolan
     yang disengaja.

   KONTRAK HASIL
   Semua fungsi yang mengubah data TIDAK PERNAH melempar error. Hasilnya:
     { ok: true,  data: ..., message: "..." }
     { ok: false, error: "pesan", field: "namaKolom" | null }

   ATURAN STOK (sesuai permintaan "otomatis potong stok")
   Stok langsung berkurang saat pesanan dicatat (status apa pun selain
   Dibatalkan). Pesanan yang dibatalkan mengembalikan stok bila
   ORDERS.restockOnVoid bernilai true di app.config.js.

   DATA DEMO
   Hanya masuk ketika demo.load() dipanggil secara eksplisit.
   Database selalu mulai kosong.
   ========================================================================== */

(function (global) {
  "use strict";

  /* ------------------------------------------------------------------------
     0. PENGAMAN AWAL
     ------------------------------------------------------------------------ */
  if (Object.prototype.hasOwnProperty.call(global, "BizFlowCore")) {
    return;
  }

  var CFG = global.BIZFLOW_CONFIG;

  if (!CFG) {
    Object.defineProperty(global, "BizFlowCore", {
      value: Object.freeze({
        ready: false,
        error: "app.config.js belum dimuat. Muat app.config.js sebelum core.js."
      }),
      writable: false,
      configurable: false,
      enumerable: true
    });
    return;
  }

  /* ------------------------------------------------------------------------
     1. PINTASAN KONFIGURASI
     ------------------------------------------------------------------------ */
  var APP = CFG.APP;
  var EDITION = CFG.EDITION;
  var ST = CFG.STORAGE;
  var MODES = CFG.MODES;
  var FMT = CFG.FORMAT;
  var NUM = CFG.NUMBERING;
  var TIERS = CFG.MEMBER_TIERS;
  var ORD = CFG.ORDERS;
  var INV = CFG.INVENTORY;
  var MEM = CFG.MEMBERS;
  var EXP = CFG.EXPENSES;
  var STF = CFG.STAFF;
  var REP = CFG.REPORTS;
  var DASH = CFG.DASHBOARD;
  var RCP = CFG.RECEIPT;
  var MSG = CFG.MESSAGES;
  var ERR = MSG.errors;
  var SUC = MSG.success;
  var FEAT = CFG.FEATURES;
  var SEED = CFG.DEMO_SEED;

  /* Pesan tambahan milik core (tidak ada padanannya di app.config.js). */
  var CORE_MSG = {
    cashShort: "Uang tunai kurang dari total bayar.",
    paidVoidBlocked: "Pesanan lunas tidak dapat dibatalkan.",
    notProcessing: "Hanya pesanan berstatus Diproses yang dapat diubah.",
    alreadyVoid: "Pesanan sudah dibatalkan.",
    invalidChoice: "Pilihan tidak valid.",
    invalidBackup: "Berkas cadangan tidak valid.",
    featureOff: "Fitur ini sedang dinonaktifkan.",
    invalidDate: "Tanggal tidak valid.",
    inactiveProduct: "Produk tidak aktif.",
    unexpected: "Terjadi kesalahan tak terduga. Data dikembalikan seperti semula.",
    imported: "Cadangan berhasil dipulihkan.",
    stockUpdated: "Stok berhasil diperbarui.",
    activeStaffSet: "Kasir aktif berhasil diganti."
  };

  var SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var DAY_MS = 86400000;

  /* ------------------------------------------------------------------------
     2. UTILITAS UMUM
     ------------------------------------------------------------------------ */
  function isObj(v) {
    return v !== null && typeof v === "object" && !Array.isArray(v);
  }

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function clone(v) {
    if (v === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(v));
  }

  function pad(n, len) {
    var s = String(Math.abs(Math.floor(Number(n) || 0)));
    while (s.length < len) {
      s = "0" + s;
    }
    return s;
  }

  function fail(message, field) {
    return { ok: false, error: message, field: field || null };
  }

  function success(data, message) {
    return { ok: true, data: data === undefined ? null : data, message: message || "" };
  }

  function cleanText(v, max) {
    var s = v === undefined || v === null ? "" : String(v);
    s = s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
    if (max && s.length > max) {
      s = s.slice(0, max).trim();
    }
    return s;
  }

  function isBlank(v) {
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  }

  function round3(n) {
    return Math.round(n * 1000) / 1000;
  }

  function randomChars(len) {
    var chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    var bytes = null;
    var out = "";
    var i;
    try {
      if (global.crypto && typeof global.crypto.getRandomValues === "function") {
        bytes = new Uint8Array(len);
        global.crypto.getRandomValues(bytes);
      }
    } catch (e) {
      bytes = null;
    }
    for (i = 0; i < len; i += 1) {
      var r = bytes ? bytes[i] : Math.floor(Math.random() * 256);
      out += chars.charAt(r % chars.length);
    }
    return out;
  }

  function findById(list, id) {
    var i;
    if (!Array.isArray(list) || isBlank(id)) {
      return null;
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) {
        return list[i];
      }
    }
    return null;
  }

  function indexOfId(list, id) {
    var i;
    for (i = 0; i < list.length; i += 1) {
      if (list[i] && list[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  function newId(prefix, list) {
    var id;
    do {
      id = prefix + "_" + randomChars(NUM.idLength);
    } while (findById(list, id));
    return id;
  }

  /* Mengubah input (angka atau teks seperti "65.000" / "Rp 65.000") menjadi angka. */
  function toNumber(v, allowDecimal) {
    var s;
    var parts;
    if (typeof v === "number") {
      return isFinite(v) ? v : NaN;
    }
    if (typeof v !== "string") {
      return NaN;
    }
    s = v.replace(/[^\d,.\-]/g, "").replace(/(?!^)-/g, "");
    if (s === "" || s === "-") {
      return NaN;
    }
    if (allowDecimal) {
      s = s.replace(/,/g, ".");
      parts = s.split(".");
      if (parts.length > 2) {
        s = parts.slice(0, -1).join("") + "." + parts[parts.length - 1];
      }
    } else if (!/^-?\d+\.\d{1,2}$/.test(s)) {
      /* "65.000" -> 65000. Desimal polos seperti "65000.5" (dari input
         type=number) dibiarkan apa adanya lalu dibulatkan oleh numField. */
      s = s.replace(/[.,]/g, "");
    }
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }

  /* Validasi satu kolom angka. opts: {decimal, min, max, def, required} */
  function numField(raw, field, opts) {
    var n;
    var min = opts && typeof opts.min === "number" ? opts.min : 0;
    if (isBlank(raw)) {
      if (opts && opts.required) {
        return { ok: false, error: ERR.required, field: field };
      }
      return { ok: true, value: opts && opts.def !== undefined ? opts.def : 0 };
    }
    n = toNumber(raw, !!(opts && opts.decimal));
    if (isNaN(n)) {
      return { ok: false, error: ERR.invalidNumber, field: field };
    }
    n = opts && opts.decimal ? round3(n) : Math.round(n);
    if (n < min) {
      return { ok: false, error: min === 0 ? ERR.negativeNumber : ERR.invalidNumber, field: field };
    }
    if (opts && typeof opts.max === "number" && n > opts.max) {
      return { ok: false, error: ERR.invalidNumber, field: field };
    }
    return { ok: true, value: n };
  }

  /* ------------------------------------------------------------------------
     3. TANGGAL & WAKTU
     ------------------------------------------------------------------------ */
  function toDate(v) {
    var d;
    if (v instanceof Date) {
      d = v;
    } else if (typeof v === "number") {
      d = new Date(v);
    } else if (typeof v === "string" && v) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        d = new Date(Number(v.slice(0, 4)), Number(v.slice(5, 7)) - 1, Number(v.slice(8, 10)), 12, 0, 0, 0);
      } else {
        d = new Date(v);
      }
    } else {
      return null;
    }
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds(), 0);
  }

  function dayKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1, 2) + "-" + pad(d.getDate(), 2);
  }

  function nowDate() {
    return new Date();
  }

  /* ------------------------------------------------------------------------
     4. FORMAT TAMPILAN
     ------------------------------------------------------------------------ */
  function formatNumber(n, decimals) {
    var value = Number(n);
    var dec = typeof decimals === "number" ? decimals : 0;
    var neg;
    var parts;
    var intPart;
    if (!isFinite(value)) {
      value = 0;
    }
    neg = value < 0;
    parts = Math.abs(value).toFixed(dec).split(".");
    intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, FMT.currency.thousandSeparator);
    if (parts[1]) {
      intPart += FMT.currency.decimalSeparator + parts[1];
    }
    if (neg && Number(parts.join("")) !== 0) {
      return "-" + intPart;
    }
    return intPart;
  }

  function formatCurrency(n) {
    var value = Number(n);
    var neg;
    if (!isFinite(value)) {
      value = 0;
    }
    neg = value < 0 && Math.round(Math.abs(value)) !== 0;
    return (neg ? "-" : "") + FMT.currency.symbol + FMT.currency.symbolSpacing +
      formatNumber(Math.abs(value), FMT.currency.decimals);
  }

  function formatPercent(n, decimals) {
    var dec = typeof decimals === "number" ? decimals : FMT.percent.decimals;
    var value = Number(n);
    if (!isFinite(value)) {
      value = 0;
    }
    return formatNumber(value, dec) + FMT.percent.symbol;
  }

  function formatQuantity(n) {
    var value = Number(n);
    if (!isFinite(value)) {
      value = 0;
    }
    return String(round3(value)).replace(".", FMT.currency.decimalSeparator);
  }

  function formatDate(v) {
    var d = toDate(v);
    if (!d) {
      return "-";
    }
    try {
      return new Intl.DateTimeFormat(APP.locale, FMT.date.shortOptions).format(d);
    } catch (e) {
      return pad(d.getDate(), 2) + " " + SHORT_MONTHS[d.getMonth()] + " " + d.getFullYear();
    }
  }

  function formatClock(v) {
    var d = toDate(v);
    if (!d) {
      return "--:--";
    }
    return pad(d.getHours(), 2) + ":" + pad(d.getMinutes(), 2);
  }

  function formatTime(v) {
    return FMT.date.timePrefix + " " + formatClock(v) + " " + FMT.date.timeSuffix;
  }

  function formatDateTime(v) {
    return formatDate(v) + " " + formatClock(v);
  }

  /* ------------------------------------------------------------------------
     5. ADAPTER PENYIMPANAN (localStorage, dengan cadangan memori)
     ------------------------------------------------------------------------ */
  var storage = (function () {
    var ls = null;
    var persistent = false;
    var mem = {};
    try {
      ls = global.localStorage;
      ls.setItem("__bizflow_probe__", "1");
      ls.removeItem("__bizflow_probe__");
      persistent = true;
    } catch (e) {
      ls = null;
      persistent = false;
    }
    return {
      isPersistent: function () {
        return persistent;
      },
      get: function (key) {
        try {
          if (persistent) {
            return ls.getItem(key);
          }
        } catch (e) {
          /* jatuh ke memori */
        }
        return has(mem, key) ? mem[key] : null;
      },
      set: function (key, value) {
        if (persistent) {
          try {
            ls.setItem(key, value);
            return true;
          } catch (e) {
            return false;
          }
        }
        mem[key] = value;
        return true;
      },
      remove: function (key) {
        try {
          if (persistent) {
            ls.removeItem(key);
          }
        } catch (e) {
          /* diabaikan */
        }
        delete mem[key];
      }
    };
  })();

  function collectionKey(namespace, name) {
    return ST.prefix + ST.namespaces[namespace] + "." + name;
  }

  function metaKey() {
    return ST.prefix + ST.keys.meta;
  }

  function sessionKey() {
    return ST.prefix + ST.keys.session;
  }

  function readJson(key) {
    var raw = storage.get(key);
    if (raw === null || raw === undefined || raw === "") {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeJson(key, value) {
    var text;
    try {
      text = JSON.stringify(value);
    } catch (e) {
      return false;
    }
    return storage.set(key, text);
  }

  /* ------------------------------------------------------------------------
     6. STATE PRIVAT
     ------------------------------------------------------------------------ */
  var S = {
    mode: MODES.defaultMode,
    meta: null,
    session: null,
    data: null
  };

  var listeners = [];
  var initError = "";

  function defaultStoreInfo() {
    return {
      name: APP.defaultStoreName,
      branch: APP.defaultBranchName,
      cashier: APP.defaultCashierName,
      cashierRole: APP.defaultCashierRole
    };
  }

  function sanitizeStoreInfo(raw) {
    var base = defaultStoreInfo();
    var info = isObj(raw) ? raw : {};
    var name = cleanText(info.name, HEADER_NAME_MAX());
    var branch = cleanText(info.branch, 60);
    var cashier = cleanText(info.cashier, 60);
    var role = cleanText(info.cashierRole, 60);
    return {
      name: name || base.name,
      branch: branch || base.branch,
      cashier: cashier || base.cashier,
      cashierRole: role || base.cashierRole
    };
  }

  function HEADER_NAME_MAX() {
    return CFG.HEADER.renameStore.maxLength;
  }

  function emptyCollection(name) {
    if (name === "counters") {
      return { order: {}, sku: 0 };
    }
    return [];
  }

  function emptyData() {
    var data = {};
    ST.collections.forEach(function (name) {
      data[name] = emptyCollection(name);
    });
    return data;
  }

  function currentNamespace() {
    return S.mode;
  }

  function loadMeta() {
    var raw = readJson(metaKey());
    var meta = {
      schemaVersion: APP.schemaVersion,
      mode: MODES.defaultMode,
      stores: {}
    };
    if (isObj(raw)) {
      if (typeof raw.mode === "string" && has(MODES.list, raw.mode)) {
        meta.mode = raw.mode;
      }
      if (isObj(raw.stores)) {
        Object.keys(MODES.list).forEach(function (id) {
          meta.stores[id] = sanitizeStoreInfo(raw.stores[id]);
        });
      }
    }
    Object.keys(MODES.list).forEach(function (id) {
      if (!meta.stores[id]) {
        meta.stores[id] = defaultStoreInfo();
      }
    });
    return meta;
  }

  function saveMeta() {
    return writeJson(metaKey(), S.meta);
  }

  function loadSession() {
    var raw = readJson(sessionKey());
    var session = {};
    Object.keys(MODES.list).forEach(function (id) {
      var item = isObj(raw) && isObj(raw[id]) ? raw[id] : {};
      session[id] = { openedAt: typeof item.openedAt === "string" ? item.openedAt : "" };
    });
    return session;
  }

  function saveSession() {
    return writeJson(sessionKey(), S.session);
  }

  function ensureSession(namespace) {
    var item = S.session[namespace];
    var opened = item && item.openedAt ? toDate(item.openedAt) : null;
    var now = nowDate();
    if (!opened || dayKey(opened) !== dayKey(now)) {
      S.session[namespace] = { openedAt: now.toISOString() };
      saveSession();
    }
  }

  function loadData(namespace) {
    var data = emptyData();
    ST.collections.forEach(function (name) {
      var raw = readJson(collectionKey(namespace, name));
      if (name === "counters") {
        if (isObj(raw)) {
          data.counters = {
            order: isObj(raw.order) ? raw.order : {},
            sku: typeof raw.sku === "number" && isFinite(raw.sku) ? raw.sku : 0
          };
        }
      } else if (Array.isArray(raw)) {
        data[name] = raw.filter(function (item) {
          return isObj(item) && typeof item.id === "string";
        });
      }
    });
    return data;
  }

  function saveCollection(name) {
    return writeJson(collectionKey(currentNamespace(), name), S.data[name]);
  }

  function emit(event) {
    var payload = event || {};
    payload.mode = S.mode;
    listeners.slice().forEach(function (fn) {
      try {
        fn(payload);
      } catch (e) {
        /* pendengar yang error tidak boleh merusak core */
      }
    });
  }

  function subscribe(fn) {
    if (typeof fn !== "function") {
      return function () {};
    }
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) {
        listeners.splice(i, 1);
      }
    };
  }

  /* Transaksi: ubah data di memori, simpan, dan kembalikan bila gagal. */
  function tx(collections, fn, eventType) {
    var snapshot = {};
    var res;
    var i;
    function restore() {
      collections.forEach(function (name) {
        S.data[name] = clone(snapshot[name]);
      });
    }
    collections.forEach(function (name) {
      snapshot[name] = clone(S.data[name]);
    });
    try {
      res = fn();
    } catch (e) {
      restore();
      return fail(CORE_MSG.unexpected);
    }
    if (!res || !res.ok) {
      restore();
      return res || fail(CORE_MSG.unexpected);
    }
    for (i = 0; i < collections.length; i += 1) {
      if (!saveCollection(collections[i])) {
        restore();
        collections.forEach(function (name) {
          saveCollection(name);
        });
        return fail(ERR.storageFailed);
      }
    }
    emit({ type: eventType || "data", collections: collections.slice() });
    return res;
  }

  /* ------------------------------------------------------------------------
     7. PENGATURAN TOKO & MODE
     ------------------------------------------------------------------------ */
  function getStoreInfo() {
    var info = clone(S.meta.stores[S.mode]);
    info.mode = S.mode;
    info.namespace = ST.namespaces[S.mode];
    return info;
  }

  function persistMeta(eventType) {
    if (!saveMeta()) {
      return fail(ERR.storageFailed);
    }
    emit({ type: eventType || "store", collections: [] });
    return success(getStoreInfo(), SUC.saved);
  }

  function renameStore(name) {
    var clean = cleanText(name, CFG.HEADER.renameStore.maxLength);
    var previous;
    var res;
    if (!clean) {
      return fail(ERR.required, "name");
    }
    previous = S.meta.stores[S.mode].name;
    S.meta.stores[S.mode].name = clean;
    res = persistMeta("store");
    if (!res.ok) {
      S.meta.stores[S.mode].name = previous;
      return res;
    }
    res.message = SUC.storeRenamed;
    return res;
  }

  function updateStoreInfo(patch) {
    var current = S.meta.stores[S.mode];
    var backup = clone(current);
    var p = isObj(patch) ? patch : {};
    var res;
    if (has(p, "name")) {
      var name = cleanText(p.name, CFG.HEADER.renameStore.maxLength);
      if (!name) {
        return fail(ERR.required, "name");
      }
      current.name = name;
    }
    if (has(p, "branch")) {
      var branch = cleanText(p.branch, 60);
      if (!branch) {
        return fail(ERR.required, "branch");
      }
      current.branch = branch;
    }
    if (has(p, "cashier")) {
      var cashier = cleanText(p.cashier, 60);
      if (!cashier) {
        return fail(ERR.required, "cashier");
      }
      current.cashier = cashier;
    }
    if (has(p, "cashierRole")) {
      var role = cleanText(p.cashierRole, 60);
      if (!role) {
        return fail(ERR.required, "cashierRole");
      }
      current.cashierRole = role;
    }
    res = persistMeta("store");
    if (!res.ok) {
      S.meta.stores[S.mode] = backup;
    }
    return res;
  }

  function getSession() {
    var opened = S.session[S.mode] && S.session[S.mode].openedAt ? S.session[S.mode].openedAt : "";
    var online = true;
    try {
      if (global.navigator && typeof global.navigator.onLine === "boolean") {
        online = global.navigator.onLine;
      }
    } catch (e) {
      online = true;
    }
    return {
      openedAt: opened,
      openedLabel: opened ? DASH.sessionPrefix + " " + formatClock(opened) + " " + FMT.date.timeSuffix : "",
      online: online,
      onlineLabel: online ? DASH.onlineLabel : DASH.offlineLabel
    };
  }

  function getMode() {
    return S.mode;
  }

  function listModes() {
    return Object.keys(MODES.list).map(function (id) {
      var m = clone(MODES.list[id]);
      m.active = id === S.mode;
      return m;
    });
  }

  function setMode(id) {
    var previous;
    if (typeof id !== "string" || !has(MODES.list, id)) {
      return fail(CORE_MSG.invalidChoice, "mode");
    }
    if (id === S.mode) {
      return success({ mode: S.mode }, SUC.modeChanged);
    }
    previous = S.mode;
    S.mode = id;
    S.meta.mode = id;
    if (!saveMeta()) {
      S.mode = previous;
      S.meta.mode = previous;
      return fail(ERR.storageFailed);
    }
    S.data = loadData(id);
    ensureSession(id);
    emit({ type: "mode", collections: ST.collections.slice() });
    return success({ mode: id }, SUC.modeChanged);
  }

  /* ------------------------------------------------------------------------
     8. PRODUK
     ------------------------------------------------------------------------ */
  function productStatus(p) {
    if (p.stock <= 0) {
      return "out";
    }
    if (p.stock <= p.minStock) {
      return "low";
    }
    return "ok";
  }

  function productStatusLabel(status) {
    if (status === "out") {
      return INV.outOfStockLabel;
    }
    if (status === "low") {
      return INV.lowStockLabel;
    }
    return INV.inStockLabel;
  }

  function viewProduct(p) {
    var v = clone(p);
    var status = productStatus(p);
    var hasMember = p.priceMember !== null && p.priceMember !== undefined;
    v.status = status;
    v.statusLabel = productStatusLabel(status);
    v.hasMemberPrice = hasMember;
    v.memberPriceEffective = hasMember ? p.priceMember : p.priceRegular;
    v.memberDiscountAmount = hasMember ? Math.max(0, p.priceRegular - p.priceMember) : 0;
    v.memberDiscountPercent = hasMember && p.priceRegular > 0
      ? Math.round(((p.priceRegular - p.priceMember) / p.priceRegular) * 100)
      : 0;
    v.marginRegular = p.priceRegular - p.cost;
    v.marginMember = v.memberPriceEffective - p.cost;
    return v;
  }

  function validateProduct(raw, ignoreId) {
    var src = isObj(raw) ? raw : {};
    var name = cleanText(src.name, 80);
    var sku = cleanText(src.sku, 30).toUpperCase();
    var category;
    var unit;
    var label;
    var cost;
    var regular;
    var member;
    var stock;
    var minStock;
    var memberValue = null;
    var i;

    if (!name) {
      return fail(ERR.required, "name");
    }
    category = cleanText(src.category, 60) || INV.defaultCategory;
    unit = cleanText(src.unit, 20) || INV.stockUnit;
    label = cleanText(src.memberLabel, INV.memberDiscountBadge.customLabelMaxLength);

    cost = numField(src.cost, "cost", { min: 0, def: 0 });
    if (!cost.ok) {
      return cost;
    }
    regular = numField(src.priceRegular, "priceRegular", { min: 0, required: true });
    if (!regular.ok) {
      return regular;
    }
    member = numField(src.priceMember, "priceMember", { min: 0, def: null });
    if (!member.ok) {
      return member;
    }
    if (member.value !== null) {
      memberValue = member.value;
      if (memberValue > regular.value) {
        return fail(ERR.memberPriceAboveRegular, "priceMember");
      }
    }
    stock = numField(src.stock, "stock", {
      decimal: true,
      min: INV.allowNegativeStock ? -1000000000 : 0,
      def: 0
    });
    if (!stock.ok) {
      return stock;
    }
    minStock = numField(src.minStock, "minStock", { decimal: true, min: 0, def: INV.defaultMinStock });
    if (!minStock.ok) {
      return minStock;
    }

    if (sku) {
      for (i = 0; i < S.data.products.length; i += 1) {
        if (S.data.products[i].id !== ignoreId && String(S.data.products[i].sku).toUpperCase() === sku) {
          return fail(ERR.duplicateSku, "sku");
        }
      }
    }

    return {
      ok: true,
      value: {
        name: name,
        sku: sku,
        category: category,
        unit: unit,
        cost: cost.value,
        priceRegular: regular.value,
        priceMember: memberValue,
        memberLabel: label,
        stock: stock.value,
        minStock: minStock.value,
        active: src.active === undefined ? true : !!src.active
      }
    };
  }

  function nextSku() {
    var counters = S.data.counters;
    var candidate;
    var exists;
    do {
      counters.sku += 1;
      candidate = NUM.sku.autoPrefix + "-" + pad(counters.sku, NUM.sku.padLength);
      exists = S.data.products.some(function (p) {
        return String(p.sku).toUpperCase() === candidate;
      });
    } while (exists);
    return candidate;
  }

  function createProduct(input) {
    return tx(["products", "counters"], function () {
      var v = validateProduct(input, null);
      var rec;
      var stamp = nowDate().toISOString();
      if (!v.ok) {
        return v;
      }
      rec = v.value;
      if (!rec.sku) {
        rec.sku = nextSku();
      }
      rec.id = newId("prd", S.data.products);
      rec.createdAt = stamp;
      rec.updatedAt = stamp;
      S.data.products.push(rec);
      return success(viewProduct(rec), SUC.saved);
    });
  }

  function updateProduct(id, patch) {
    return tx(["products"], function () {
      var existing = findById(S.data.products, id);
      var merged;
      var v;
      var allowed = ["name", "sku", "category", "unit", "cost", "priceRegular", "priceMember", "memberLabel", "stock", "minStock", "active"];
      var p = isObj(patch) ? patch : {};
      if (!existing) {
        return fail(ERR.notFound);
      }
      merged = clone(existing);
      allowed.forEach(function (key) {
        if (has(p, key)) {
          merged[key] = p[key];
        }
      });
      v = validateProduct(merged, id);
      if (!v.ok) {
        return v;
      }
      if (!v.value.sku) {
        v.value.sku = existing.sku;
      }
      Object.keys(v.value).forEach(function (key) {
        existing[key] = v.value[key];
      });
      existing.updatedAt = nowDate().toISOString();
      return success(viewProduct(existing), SUC.saved);
    });
  }

  function removeProduct(id) {
    return tx(["products"], function () {
      var idx = indexOfId(S.data.products, id);
      if (idx < 0) {
        return fail(ERR.notFound);
      }
      S.data.products.splice(idx, 1);
      return success({ id: id }, SUC.deleted);
    });
  }

  function getProduct(id) {
    var p = findById(S.data.products, id);
    return p ? viewProduct(p) : null;
  }

  function findProductBySku(sku) {
    var key = cleanText(sku, 30).toUpperCase();
    var i;
    if (!key) {
      return null;
    }
    for (i = 0; i < S.data.products.length; i += 1) {
      if (String(S.data.products[i].sku).toUpperCase() === key) {
        return viewProduct(S.data.products[i]);
      }
    }
    return null;
  }

  function listProducts(opts) {
    var o = isObj(opts) ? opts : {};
    var search = cleanText(o.search, 80).toLowerCase();
    var category = cleanText(o.category, 60);
    var status = typeof o.status === "string" ? o.status : "all";
    var items = S.data.products.filter(function (p) {
      if (o.activeOnly && !p.active) {
        return false;
      }
      if (category && p.category !== category) {
        return false;
      }
      if (status === "inactive" && p.active) {
        return false;
      }
      if ((status === "ok" || status === "low" || status === "out") && productStatus(p) !== status) {
        return false;
      }
      if (search) {
        return String(p.name).toLowerCase().indexOf(search) >= 0 ||
          String(p.sku).toLowerCase().indexOf(search) >= 0 ||
          String(p.category).toLowerCase().indexOf(search) >= 0;
      }
      return true;
    });
    items.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    if (typeof o.limit === "number" && o.limit > 0) {
      items = items.slice(0, o.limit);
    }
    return items.map(viewProduct);
  }

  function setStock(id, newStock) {
    return tx(["products"], function () {
      var p = findById(S.data.products, id);
      var n;
      var before;
      if (!p) {
        return fail(ERR.notFound);
      }
      n = numField(newStock, "stock", {
        decimal: true,
        min: INV.allowNegativeStock ? -1000000000 : 0,
        required: true
      });
      if (!n.ok) {
        return n;
      }
      before = p.stock;
      p.stock = n.value;
      p.updatedAt = nowDate().toISOString();
      return success({ product: viewProduct(p), before: before, after: p.stock, diff: round3(p.stock - before) }, CORE_MSG.stockUpdated);
    });
  }

  /* Opname: entries = [{ productId, counted }]. Semua berhasil atau tidak sama sekali. */
  function stockOpname(entries) {
    if (!FEAT.stockOpname) {
      return fail(CORE_MSG.featureOff);
    }
    return tx(["products"], function () {
      var list = Array.isArray(entries) ? entries : [];
      var results = [];
      var i;
      if (!list.length) {
        return fail(ERR.required, "entries");
      }
      for (i = 0; i < list.length; i += 1) {
        var entry = isObj(list[i]) ? list[i] : {};
        var p = findById(S.data.products, entry.productId);
        var n;
        var before;
        if (!p) {
          return fail(ERR.notFound, "productId");
        }
        n = numField(entry.counted, "counted", {
          decimal: true,
          min: INV.allowNegativeStock ? -1000000000 : 0,
          required: true
        });
        if (!n.ok) {
          return n;
        }
        before = p.stock;
        p.stock = n.value;
        p.updatedAt = nowDate().toISOString();
        results.push({ productId: p.id, name: p.name, before: before, after: p.stock, diff: round3(p.stock - before) });
      }
      return success(results, CORE_MSG.stockUpdated);
    });
  }

  function listCategories() {
    var seen = {};
    var out = [];
    INV.categories.concat(S.data.products.map(function (p) {
      return p.category;
    })).forEach(function (c) {
      if (c && !has(seen, c)) {
        seen[c] = true;
        out.push(c);
      }
    });
    return out;
  }

  /* ------------------------------------------------------------------------
     9. MEMBER
     ------------------------------------------------------------------------ */
  function memberStatsMap() {
    var map = {};
    S.data.orders.forEach(function (o) {
      var st = ORD.statuses[o.status];
      if (!o.memberId || !st || !st.countsAsRevenue) {
        return;
      }
      if (!map[o.memberId]) {
        map[o.memberId] = { totalSpent: 0, orderCount: 0, lastOrderAt: "" };
      }
      map[o.memberId].totalSpent += o.total;
      map[o.memberId].orderCount += 1;
      if (!map[o.memberId].lastOrderAt || o.createdAt > map[o.memberId].lastOrderAt) {
        map[o.memberId].lastOrderAt = o.createdAt;
      }
    });
    return map;
  }

  function viewMember(m, statsMap) {
    var v = clone(m);
    var tier = TIERS.list[m.tier] || TIERS.list[TIERS.defaultTier];
    var stats = statsMap && statsMap[m.id] ? statsMap[m.id] : { totalSpent: 0, orderCount: 0, lastOrderAt: "" };
    v.tierLabel = tier.label;
    v.tierShort = tier.short;
    v.tierIcon = tier.icon;
    v.tierBadgeClass = tier.badgeClass;
    v.totalSpent = stats.totalSpent;
    v.orderCount = stats.orderCount;
    v.lastOrderAt = stats.lastOrderAt;
    return v;
  }

  function digitsOnly(v) {
    return String(v === undefined || v === null ? "" : v).replace(/\D/g, "");
  }

  function validatePhone(raw, field, list, ignoreId) {
    var digits = digitsOnly(raw);
    var i;
    if (!digits) {
      return { ok: true, value: "" };
    }
    if (digits.length < MEM.phoneMinDigits || digits.length > MEM.phoneMaxDigits) {
      return fail(ERR.invalidPhone, field);
    }
    for (i = 0; i < list.length; i += 1) {
      if (list[i].id !== ignoreId && digitsOnly(list[i].phone) === digits) {
        return fail(ERR.invalidPhone + " Nomor sudah terdaftar.", field);
      }
    }
    return { ok: true, value: digits };
  }

  function validateMember(raw, ignoreId) {
    var src = isObj(raw) ? raw : {};
    var name = cleanText(src.name, 80);
    var tier = typeof src.tier === "string" ? src.tier : "silver";
    var phone;
    var points;
    if (!name) {
      return fail(ERR.required, "name");
    }
    if (!has(TIERS.list, tier) || tier === TIERS.defaultTier) {
      return fail(CORE_MSG.invalidChoice, "tier");
    }
    phone = validatePhone(src.phone, "phone", S.data.members, ignoreId);
    if (!phone.ok) {
      return phone;
    }
    points = numField(src.points, "points", { min: 0, def: 0 });
    if (!points.ok) {
      return points;
    }
    return {
      ok: true,
      value: {
        name: name,
        phone: phone.value,
        tier: tier,
        points: points.value,
        note: cleanText(src.note, 200),
        active: src.active === undefined ? true : !!src.active
      }
    };
  }

  function createMember(input) {
    return tx(["members"], function () {
      var v = validateMember(input, null);
      var rec;
      if (!v.ok) {
        return v;
      }
      rec = v.value;
      rec.id = newId("mbr", S.data.members);
      rec.createdAt = nowDate().toISOString();
      S.data.members.push(rec);
      return success(viewMember(rec, memberStatsMap()), SUC.saved);
    });
  }

  function updateMember(id, patch) {
    return tx(["members"], function () {
      var existing = findById(S.data.members, id);
      var merged;
      var v;
      var p = isObj(patch) ? patch : {};
      if (!existing) {
        return fail(ERR.notFound);
      }
      merged = clone(existing);
      ["name", "phone", "tier", "points", "note", "active"].forEach(function (key) {
        if (has(p, key)) {
          merged[key] = p[key];
        }
      });
      v = validateMember(merged, id);
      if (!v.ok) {
        return v;
      }
      Object.keys(v.value).forEach(function (key) {
        existing[key] = v.value[key];
      });
      return success(viewMember(existing, memberStatsMap()), SUC.saved);
    });
  }

  function removeMember(id) {
    return tx(["members"], function () {
      var idx = indexOfId(S.data.members, id);
      if (idx < 0) {
        return fail(ERR.notFound);
      }
      S.data.members.splice(idx, 1);
      return success({ id: id }, SUC.deleted);
    });
  }

  function getMember(id) {
    var m = findById(S.data.members, id);
    return m ? viewMember(m, memberStatsMap()) : null;
  }

  function listMembers(opts) {
    var o = isObj(opts) ? opts : {};
    var search = cleanText(o.search, 80).toLowerCase();
    var tier = typeof o.tier === "string" ? o.tier : "all";
    var stats = memberStatsMap();
    var items = S.data.members.filter(function (m) {
      if (o.activeOnly && !m.active) {
        return false;
      }
      if (tier !== "all" && m.tier !== tier) {
        return false;
      }
      if (search) {
        return String(m.name).toLowerCase().indexOf(search) >= 0 || String(m.phone).indexOf(search) >= 0;
      }
      return true;
    });
    items.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    return items.map(function (m) {
      return viewMember(m, stats);
    });
  }

  function memberTiers() {
    return TIERS.order.map(function (id) {
      return clone(TIERS.list[id]);
    });
  }

  /* ------------------------------------------------------------------------
     10. PESANAN (ORDER)
     ------------------------------------------------------------------------ */
  function pointsFor(total, tierId) {
    var tier = TIERS.list[tierId] || TIERS.list[TIERS.defaultTier];
    return Math.floor(Math.max(0, total) / 1000) * tier.pointsRate;
  }

  function nextOrderNumber(date) {
    var year = String(date.getFullYear());
    var key = NUM.order.withYear ? year : "all";
    var counters = S.data.counters;
    var n = (typeof counters.order[key] === "number" ? counters.order[key] : 0) + 1;
    counters.order[key] = n;
    return NUM.order.prefix + (NUM.order.withYear ? "-" + year : "") + "-" + pad(n, NUM.order.padLength);
  }

  /* Menghitung rancangan pesanan tanpa mengubah data (dipakai preview & create). */
  function computeDraft(input) {
    var src = isObj(input) ? input : {};
    var member = null;
    var tierId = TIERS.defaultTier;
    var tierCfg = TIERS.list[TIERS.defaultTier];
    var usesMemberPrice = false;
    var payment = isBlank(src.payment) ? ORD.defaultPayment : String(src.payment);
    var status = isBlank(src.status) ? ORD.defaultStatus : String(src.status);
    var rawItems = Array.isArray(src.items) ? src.items : [];
    var order = [];
    var qtyById = {};
    var items = [];
    var subtotalRegular = 0;
    var total = 0;
    var i;

    if (!has(ORD.paymentMethods, payment)) {
      return fail(CORE_MSG.invalidChoice, "payment");
    }
    if (!has(ORD.statuses, status) || status === "void") {
      return fail(CORE_MSG.invalidChoice, "status");
    }
    if (!isBlank(src.memberId)) {
      member = findById(S.data.members, src.memberId);
      if (!member) {
        return fail(ERR.notFound, "memberId");
      }
      tierId = member.tier;
      tierCfg = TIERS.list[tierId] || TIERS.list[TIERS.defaultTier];
      usesMemberPrice = !!(FEAT.memberPricing && tierCfg.usesMemberPrice);
    }
    if (!rawItems.length) {
      return fail(ERR.emptyCart, "items");
    }

    for (i = 0; i < rawItems.length; i += 1) {
      var raw = isObj(rawItems[i]) ? rawItems[i] : {};
      var q = numField(raw.qty, "qty", { decimal: true, min: 0, required: true });
      if (!q.ok) {
        return q;
      }
      if (q.value <= 0 || q.value > ORD.maxItemQty) {
        return fail(ERR.invalidNumber, "qty");
      }
      if (isBlank(raw.productId)) {
        return fail(ERR.notFound, "productId");
      }
      if (!has(qtyById, raw.productId)) {
        qtyById[raw.productId] = 0;
        order.push(raw.productId);
      }
      qtyById[raw.productId] = round3(qtyById[raw.productId] + q.value);
    }

    for (i = 0; i < order.length; i += 1) {
      var product = findById(S.data.products, order[i]);
      var qty = qtyById[order[i]];
      var unitPrice;
      if (!product) {
        return fail(ERR.notFound, "productId");
      }
      if (!product.active) {
        return fail(CORE_MSG.inactiveProduct + " " + product.name, "productId");
      }
      if (qty > ORD.maxItemQty) {
        return fail(ERR.invalidNumber, "qty");
      }
      if (!INV.allowNegativeStock && qty > product.stock) {
        return fail(ERR.insufficientStock + " " + product.name + " (sisa " + formatQuantity(product.stock) + " " + product.unit + ").", "qty");
      }
      unitPrice = usesMemberPrice && product.priceMember !== null && product.priceMember !== undefined
        ? product.priceMember
        : product.priceRegular;
      items.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        qty: qty,
        regularPrice: product.priceRegular,
        unitPrice: unitPrice,
        cost: product.cost
      });
      subtotalRegular += Math.round(product.priceRegular * qty);
      total += Math.round(unitPrice * qty);
    }

    return success({
      member: member,
      tier: tierId,
      customerName: member ? member.name : (cleanText(src.customerName, 80) || ORD.walkInCustomerLabel),
      usesMemberPrice: usesMemberPrice,
      payment: payment,
      status: status,
      items: items,
      subtotalRegular: subtotalRegular,
      memberDiscount: Math.max(0, subtotalRegular - total),
      total: total
    });
  }

  /* Menentukan uang tunai & kembalian. */
  function cashInfo(payment, status, total, rawCash) {
    var n;
    if (payment !== "cash" || status !== "paid") {
      return { ok: true, cashPaid: null, change: 0 };
    }
    if (isBlank(rawCash)) {
      return { ok: true, cashPaid: total, change: 0 };
    }
    n = numField(rawCash, "cashPaid", { min: 0, required: true });
    if (!n.ok) {
      return n;
    }
    if (n.value < total) {
      return fail(CORE_MSG.cashShort, "cashPaid");
    }
    return { ok: true, cashPaid: n.value, change: n.value - total };
  }

  function previewOrder(input) {
    var d = computeDraft(input);
    if (!d.ok) {
      return d;
    }
    return success({
      customerName: d.data.customerName,
      tier: d.data.tier,
      usesMemberPrice: d.data.usesMemberPrice,
      items: clone(d.data.items),
      subtotalRegular: d.data.subtotalRegular,
      memberDiscount: d.data.memberDiscount,
      total: d.data.total,
      pointsToEarn: d.data.member ? pointsFor(d.data.total, d.data.tier) : 0
    });
  }

  function createOrder(input) {
    return tx(["orders", "products", "members", "counters"], function () {
      var d = computeDraft(input);
      var draft;
      var cash;
      var stamp = nowDate();
      var order;
      var member;
      var earned = 0;
      var info = S.meta.stores[S.mode];
      if (!d.ok) {
        return d;
      }
      draft = d.data;
      cash = cashInfo(draft.payment, draft.status, draft.total, isObj(input) ? input.cashPaid : null);
      if (!cash.ok) {
        return cash;
      }

      draft.items.forEach(function (item) {
        var p = findById(S.data.products, item.productId);
        if (p) {
          p.stock = round3(p.stock - item.qty);
          p.updatedAt = stamp.toISOString();
        }
      });

      if (draft.status === "paid" && draft.member) {
        member = findById(S.data.members, draft.member.id);
        if (member) {
          earned = pointsFor(draft.total, member.tier);
          member.points += earned;
        }
      }

      order = {
        id: newId("ord", S.data.orders),
        number: nextOrderNumber(stamp),
        createdAt: stamp.toISOString(),
        paidAt: draft.status === "paid" ? stamp.toISOString() : "",
        voidedAt: "",
        memberId: draft.member ? draft.member.id : null,
        customerName: draft.customerName,
        tier: draft.tier,
        items: draft.items,
        subtotalRegular: draft.subtotalRegular,
        memberDiscount: draft.memberDiscount,
        total: draft.total,
        payment: draft.payment,
        cashPaid: cash.cashPaid,
        change: cash.change,
        status: draft.status,
        note: cleanText(isObj(input) ? input.note : "", 200),
        cashier: info.cashier,
        pointsAwarded: earned
      };
      S.data.orders.push(order);
      return success(viewOrder(order), SUC.orderCreated);
    });
  }

  function markOrderPaid(id, opts) {
    return tx(["orders", "members"], function () {
      var o = findById(S.data.orders, id);
      var cash;
      var member;
      var earned;
      var stamp = nowDate().toISOString();
      if (!o) {
        return fail(ERR.notFound);
      }
      if (o.status !== "processing") {
        return fail(CORE_MSG.notProcessing);
      }
      cash = cashInfo(o.payment, "paid", o.total, isObj(opts) ? opts.cashPaid : null);
      if (!cash.ok) {
        return cash;
      }
      o.status = "paid";
      o.paidAt = stamp;
      o.cashPaid = cash.cashPaid;
      o.change = cash.change;
      if (o.memberId) {
        member = findById(S.data.members, o.memberId);
        if (member) {
          earned = pointsFor(o.total, member.tier);
          member.points += earned;
          o.pointsAwarded = earned;
        }
      }
      return success(viewOrder(o), SUC.orderPaid);
    });
  }

  function voidOrder(id) {
    return tx(["orders", "products", "members"], function () {
      var o = findById(S.data.orders, id);
      var member;
      if (!o) {
        return fail(ERR.notFound);
      }
      if (o.status === "void") {
        return fail(CORE_MSG.alreadyVoid);
      }
      if (o.status === "paid" && !ORD.allowVoidPaidOrder) {
        return fail(CORE_MSG.paidVoidBlocked);
      }
      if (ORD.restockOnVoid) {
        o.items.forEach(function (item) {
          var p = findById(S.data.products, item.productId);
          if (p) {
            p.stock = round3(p.stock + item.qty);
            p.updatedAt = nowDate().toISOString();
          }
        });
      }
      if (o.pointsAwarded > 0 && o.memberId) {
        member = findById(S.data.members, o.memberId);
        if (member) {
          member.points = Math.max(0, member.points - o.pointsAwarded);
        }
      }
      o.pointsAwarded = 0;
      o.status = "void";
      o.voidedAt = nowDate().toISOString();
      return success(viewOrder(o), SUC.orderVoided);
    });
  }

  /* Ubah metode bayar / catatan pada pesanan yang masih Diproses. */
  function updateOrder(id, patch) {
    return tx(["orders"], function () {
      var o = findById(S.data.orders, id);
      var p = isObj(patch) ? patch : {};
      if (!o) {
        return fail(ERR.notFound);
      }
      if (o.status !== "processing") {
        return fail(CORE_MSG.notProcessing);
      }
      if (has(p, "payment")) {
        if (!has(ORD.paymentMethods, p.payment)) {
          return fail(CORE_MSG.invalidChoice, "payment");
        }
        o.payment = p.payment;
      }
      if (has(p, "note")) {
        o.note = cleanText(p.note, 200);
      }
      return success(viewOrder(o), SUC.saved);
    });
  }

  function orderItemsSummary(o) {
    return o.items.map(function (item) {
      return formatQuantity(item.qty) + "x " + item.name;
    }).join(", ");
  }

  function viewOrder(o) {
    var v = clone(o);
    var st = ORD.statuses[o.status] || ORD.statuses[ORD.defaultStatus];
    var pm = ORD.paymentMethods[o.payment] || ORD.paymentMethods[ORD.defaultPayment];
    var tier = TIERS.list[o.tier] || TIERS.list[TIERS.defaultTier];
    var cogs = 0;
    var count = 0;
    o.items.forEach(function (item) {
      cogs += Math.round(item.cost * item.qty);
      count += item.qty;
    });
    v.numberDisplay = (NUM.order.displayHash ? "#" : "") + o.number;
    v.statusLabel = st.label;
    v.statusBadgeClass = st.badgeClass;
    v.countsAsRevenue = st.countsAsRevenue;
    v.editable = st.editable;
    v.paymentLabel = pm.label;
    v.paymentIcon = pm.icon;
    v.tierLabel = tier.label;
    v.tierIcon = tier.icon;
    v.tierBadgeClass = tier.badgeClass;
    v.isMember = o.tier !== TIERS.defaultTier;
    v.itemsSummary = orderItemsSummary(o);
    v.itemCount = round3(count);
    v.cogs = cogs;
    v.profit = o.total - cogs;
    v.timeLabel = formatTime(o.createdAt);
    v.dateLabel = formatDate(o.createdAt);
    v.canMarkPaid = o.status === "processing";
    v.canVoid = o.status === "processing" || (o.status === "paid" && ORD.allowVoidPaidOrder);
    v.canPrint = !!FEAT.receiptPrinting;
    return v;
  }

  function getOrder(id) {
    var o = findById(S.data.orders, id);
    return o ? viewOrder(o) : null;
  }

  /* opts: {filter:'all'|'member'|<id metode bayar>, status, search, period, limit, offset} */
  function queryOrders(opts) {
    var o = isObj(opts) ? opts : {};
    var filter = typeof o.filter === "string" ? o.filter : ORD.defaultFilter;
    var status = typeof o.status === "string" ? o.status : "all";
    var search = cleanText(o.search, 80).toLowerCase();
    var range = o.period ? periodRange(o.period) : null;
    var rows = S.data.orders.filter(function (ord) {
      if (filter === "member" && ord.tier === TIERS.defaultTier) {
        return false;
      }
      if (filter !== "all" && filter !== "member" && ord.payment !== filter) {
        return false;
      }
      if (status !== "all" && ord.status !== status) {
        return false;
      }
      if (range && !inRange(ord.createdAt, range)) {
        return false;
      }
      if (search) {
        return String(ord.number).toLowerCase().indexOf(search) >= 0 ||
          String(ord.customerName).toLowerCase().indexOf(search) >= 0 ||
          orderItemsSummary(ord).toLowerCase().indexOf(search) >= 0;
      }
      return true;
    });
    var total;
    var offset = typeof o.offset === "number" && o.offset > 0 ? Math.floor(o.offset) : 0;
    var limit = typeof o.limit === "number" && o.limit > 0 ? Math.floor(o.limit) : rows.length;
    rows.sort(function (a, b) {
      if (a.createdAt === b.createdAt) {
        return a.number < b.number ? 1 : -1;
      }
      return a.createdAt < b.createdAt ? 1 : -1;
    });
    total = rows.length;
    return {
      items: rows.slice(offset, offset + limit).map(viewOrder),
      total: total,
      offset: offset,
      limit: limit
    };
  }

  /* ------------------------------------------------------------------------
     11. PENGELUARAN
     ------------------------------------------------------------------------ */
  function validateExpense(raw) {
    var src = isObj(raw) ? raw : {};
    var title = cleanText(src.title, 100);
    var category = cleanText(src.category, 60) || EXP.defaultCategory;
    var amount;
    var date;
    if (!title) {
      return fail(ERR.required, "title");
    }
    amount = numField(src.amount, "amount", { min: 0, required: true });
    if (!amount.ok) {
      return amount;
    }
    if (amount.value <= 0) {
      return fail(ERR.invalidNumber, "amount");
    }
    if (isBlank(src.date)) {
      date = nowDate();
    } else {
      date = toDate(src.date);
      if (!date) {
        return fail(CORE_MSG.invalidDate, "date");
      }
    }
    return {
      ok: true,
      value: {
        title: title,
        category: category,
        amount: amount.value,
        date: date.toISOString(),
        note: cleanText(src.note, 200)
      }
    };
  }

  function viewExpense(e) {
    var v = clone(e);
    v.dateLabel = formatDate(e.date);
    v.dateInput = dayKey(toDate(e.date) || nowDate());
    return v;
  }

  function createExpense(input) {
    return tx(["expenses"], function () {
      var v = validateExpense(input);
      var rec;
      if (!v.ok) {
        return v;
      }
      rec = v.value;
      rec.id = newId("exp", S.data.expenses);
      rec.createdAt = nowDate().toISOString();
      S.data.expenses.push(rec);
      return success(viewExpense(rec), SUC.saved);
    });
  }

  function updateExpense(id, patch) {
    return tx(["expenses"], function () {
      var existing = findById(S.data.expenses, id);
      var merged;
      var v;
      var p = isObj(patch) ? patch : {};
      if (!existing) {
        return fail(ERR.notFound);
      }
      merged = clone(existing);
      ["title", "category", "amount", "date", "note"].forEach(function (key) {
        if (has(p, key)) {
          merged[key] = p[key];
        }
      });
      v = validateExpense(merged);
      if (!v.ok) {
        return v;
      }
      Object.keys(v.value).forEach(function (key) {
        existing[key] = v.value[key];
      });
      return success(viewExpense(existing), SUC.saved);
    });
  }

  function removeExpense(id) {
    return tx(["expenses"], function () {
      var idx = indexOfId(S.data.expenses, id);
      if (idx < 0) {
        return fail(ERR.notFound);
      }
      S.data.expenses.splice(idx, 1);
      return success({ id: id }, SUC.deleted);
    });
  }

  function getExpense(id) {
    var e = findById(S.data.expenses, id);
    return e ? viewExpense(e) : null;
  }

  function listExpenses(opts) {
    var o = isObj(opts) ? opts : {};
    var search = cleanText(o.search, 80).toLowerCase();
    var category = cleanText(o.category, 60);
    var range = o.period ? periodRange(o.period) : null;
    var items = S.data.expenses.filter(function (e) {
      if (category && e.category !== category) {
        return false;
      }
      if (range && !inRange(e.date, range)) {
        return false;
      }
      if (search) {
        return String(e.title).toLowerCase().indexOf(search) >= 0 || String(e.category).toLowerCase().indexOf(search) >= 0;
      }
      return true;
    });
    items.sort(function (a, b) {
      return a.date < b.date ? 1 : -1;
    });
    return items.map(viewExpense);
  }

  function expenseCategories() {
    var seen = {};
    var out = [];
    EXP.categories.concat(S.data.expenses.map(function (e) {
      return e.category;
    })).forEach(function (c) {
      if (c && !has(seen, c)) {
        seen[c] = true;
        out.push(c);
      }
    });
    return out;
  }

  /* ------------------------------------------------------------------------
     12. STAF & KASIR
     ------------------------------------------------------------------------ */
  function validateStaff(raw, ignoreId) {
    var src = isObj(raw) ? raw : {};
    var name = cleanText(src.name, 60);
    var role = isBlank(src.role) ? STF.defaultRole : String(src.role);
    var shift = isBlank(src.shift) ? STF.defaultShift : String(src.shift);
    var phone;
    if (!name) {
      return fail(ERR.required, "name");
    }
    if (!has(STF.roles, role)) {
      return fail(CORE_MSG.invalidChoice, "role");
    }
    if (!has(STF.shifts, shift)) {
      return fail(CORE_MSG.invalidChoice, "shift");
    }
    phone = validatePhone(src.phone, "phone", S.data.staff, ignoreId);
    if (!phone.ok) {
      return phone;
    }
    return {
      ok: true,
      value: {
        name: name,
        role: role,
        shift: shift,
        phone: phone.value,
        active: src.active === undefined ? true : !!src.active
      }
    };
  }

  function viewStaff(s) {
    var v = clone(s);
    var role = STF.roles[s.role] || STF.roles[STF.defaultRole];
    var shift = STF.shifts[s.shift] || STF.shifts[STF.defaultShift];
    v.roleLabel = role.label;
    v.shiftLabel = shift.label;
    v.shiftTime = shift.start + " - " + shift.end;
    v.statusLabel = s.active ? "Aktif" : "Nonaktif";
    v.isCurrentCashier = S.meta.stores[S.mode].cashier === s.name;
    return v;
  }

  function createStaff(input) {
    return tx(["staff"], function () {
      var v = validateStaff(input, null);
      var rec;
      if (!v.ok) {
        return v;
      }
      rec = v.value;
      rec.id = newId("stf", S.data.staff);
      rec.createdAt = nowDate().toISOString();
      S.data.staff.push(rec);
      return success(viewStaff(rec), SUC.saved);
    });
  }

  function updateStaff(id, patch) {
    return tx(["staff"], function () {
      var existing = findById(S.data.staff, id);
      var merged;
      var v;
      var p = isObj(patch) ? patch : {};
      if (!existing) {
        return fail(ERR.notFound);
      }
      merged = clone(existing);
      ["name", "role", "shift", "phone", "active"].forEach(function (key) {
        if (has(p, key)) {
          merged[key] = p[key];
        }
      });
      v = validateStaff(merged, id);
      if (!v.ok) {
        return v;
      }
      Object.keys(v.value).forEach(function (key) {
        existing[key] = v.value[key];
      });
      return success(viewStaff(existing), SUC.saved);
    });
  }

  function removeStaff(id) {
    return tx(["staff"], function () {
      var idx = indexOfId(S.data.staff, id);
      if (idx < 0) {
        return fail(ERR.notFound);
      }
      S.data.staff.splice(idx, 1);
      return success({ id: id }, SUC.deleted);
    });
  }

  function getStaff(id) {
    var s = findById(S.data.staff, id);
    return s ? viewStaff(s) : null;
  }

  function listStaff(opts) {
    var o = isObj(opts) ? opts : {};
    var search = cleanText(o.search, 80).toLowerCase();
    var items = S.data.staff.filter(function (s) {
      if (o.activeOnly && !s.active) {
        return false;
      }
      if (typeof o.role === "string" && o.role !== "all" && s.role !== o.role) {
        return false;
      }
      if (search) {
        return String(s.name).toLowerCase().indexOf(search) >= 0;
      }
      return true;
    });
    items.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name));
    });
    return items.map(viewStaff);
  }

  /* Menjadikan seorang staf sebagai kasir yang tampil di header & struk. */
  function setActiveStaff(id) {
    var s = findById(S.data.staff, id);
    var current = S.meta.stores[S.mode];
    var backup = clone(current);
    var res;
    if (!s) {
      return fail(ERR.notFound);
    }
    if (!s.active) {
      return fail(CORE_MSG.invalidChoice, "staffId");
    }
    current.cashier = s.name;
    current.cashierRole = (STF.roles[s.role] || STF.roles[STF.defaultRole]).label;
    res = persistMeta("store");
    if (!res.ok) {
      S.meta.stores[S.mode] = backup;
      return res;
    }
    res.message = CORE_MSG.activeStaffSet;
    return res;
  }

  /* ------------------------------------------------------------------------
     13. LAPORAN, DASHBOARD & NOTIFIKASI
     ------------------------------------------------------------------------ */
  function periodRange(periodId) {
    var now = nowDate();
    var today = startOfDay(now);
    var id = typeof periodId === "string" ? periodId : REP.defaultPeriod;
    var from = null;
    if (id === "today") {
      from = today;
    } else if (id === "week") {
      from = addDays(today, -6);
    } else if (id === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else {
      id = "all";
    }
    return {
      id: id,
      fromMs: from ? from.getTime() : null,
      toMs: Number.MAX_SAFE_INTEGER,
      from: from
    };
  }

  function inRange(value, range) {
    var d = toDate(value);
    var ms;
    if (!d) {
      return false;
    }
    ms = d.getTime();
    if (range.fromMs !== null && ms < range.fromMs) {
      return false;
    }
    return ms <= range.toMs;
  }

  function orderSaleDate(o) {
    return o.paidAt || o.createdAt;
  }

  function revenueOrders() {
    return S.data.orders.filter(function (o) {
      var st = ORD.statuses[o.status];
      return !!(st && st.countsAsRevenue);
    });
  }

  function sumRevenueBetween(fromMs, toMs) {
    var total = 0;
    revenueOrders().forEach(function (o) {
      var d = toDate(orderSaleDate(o));
      var ms = d ? d.getTime() : NaN;
      if (!isNaN(ms) && ms >= fromMs && ms < toMs) {
        total += o.total;
      }
    });
    return total;
  }

  function orderCogs(o) {
    var cogs = 0;
    o.items.forEach(function (item) {
      cogs += Math.round(item.cost * item.qty);
    });
    return cogs;
  }

  function reportSummary(periodId) {
    var requested = typeof periodId === "string" ? periodId : REP.defaultPeriod;
    var valid = REP.periods.some(function (p) {
      return p.id === requested;
    });
    var range = periodRange(valid ? requested : REP.defaultPeriod);
    var revenue = 0;
    var cogs = 0;
    var memberDiscount = 0;
    var orderCount = 0;
    var expensesTotal = 0;
    var topMap = {};
    var byPayment = {};
    var byCategory = {};
    var dayMap = {};
    var daily = [];
    var topProducts;
    var gross;
    var net;

    function bucket(key) {
      if (!has(dayMap, key)) {
        dayMap[key] = { date: key, revenue: 0, cogs: 0, expenses: 0, net: 0 };
      }
      return dayMap[key];
    }

    Object.keys(ORD.paymentMethods).forEach(function (id) {
      byPayment[id] = { id: id, label: ORD.paymentMethods[id].label, count: 0, total: 0 };
    });

    revenueOrders().forEach(function (o) {
      var saleDate = toDate(orderSaleDate(o));
      var orderCost;
      if (!saleDate || !inRange(saleDate, range)) {
        return;
      }
      orderCost = orderCogs(o);
      revenue += o.total;
      cogs += orderCost;
      memberDiscount += o.memberDiscount;
      orderCount += 1;
      if (has(byPayment, o.payment)) {
        byPayment[o.payment].count += 1;
        byPayment[o.payment].total += o.total;
      }
      bucket(dayKey(saleDate)).revenue += o.total;
      bucket(dayKey(saleDate)).cogs += orderCost;
      o.items.forEach(function (item) {
        var key = item.productId || item.sku;
        if (!has(topMap, key)) {
          topMap[key] = { productId: item.productId, sku: item.sku, name: item.name, unit: item.unit, qty: 0, revenue: 0, cost: 0, profit: 0 };
        }
        topMap[key].qty = round3(topMap[key].qty + item.qty);
        topMap[key].revenue += Math.round(item.unitPrice * item.qty);
        topMap[key].cost += Math.round(item.cost * item.qty);
        topMap[key].profit = topMap[key].revenue - topMap[key].cost;
      });
    });

    S.data.expenses.forEach(function (e) {
      var d = toDate(e.date);
      if (!d || !inRange(d, range)) {
        return;
      }
      expensesTotal += e.amount;
      bucket(dayKey(d)).expenses += e.amount;
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });

    if (range.from) {
      var cursor = startOfDay(range.from);
      var last = startOfDay(nowDate());
      while (cursor.getTime() <= last.getTime()) {
        bucket(dayKey(cursor));
        cursor = addDays(cursor, 1);
      }
    }
    Object.keys(dayMap).sort().forEach(function (key) {
      var b = dayMap[key];
      b.net = b.revenue - b.cogs - b.expenses;
      daily.push(b);
    });

    topProducts = Object.keys(topMap).map(function (key) {
      return topMap[key];
    }).sort(function (a, b) {
      if (b.qty !== a.qty) {
        return b.qty - a.qty;
      }
      return b.revenue - a.revenue;
    }).slice(0, REP.topProductsLimit);

    gross = revenue - cogs;
    net = gross - expensesTotal;

    return {
      period: range.id,
      from: range.from ? range.from.toISOString() : "",
      orderCount: orderCount,
      revenue: revenue,
      cogs: cogs,
      grossProfit: gross,
      expenses: expensesTotal,
      netProfit: net,
      marginPercent: revenue > 0 ? (net / revenue) * 100 : 0,
      grossMarginPercent: revenue > 0 ? (gross / revenue) * 100 : 0,
      averageOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      memberDiscountTotal: memberDiscount,
      topProducts: topProducts,
      byPayment: Object.keys(byPayment).map(function (id) {
        return byPayment[id];
      }),
      expensesByCategory: Object.keys(byCategory).map(function (c) {
        return { category: c, total: byCategory[c] };
      }).sort(function (a, b) {
        return b.total - a.total;
      }),
      daily: daily,
      hasData: orderCount > 0 || expensesTotal > 0
    };
  }

  function listPeriods() {
    return clone(REP.periods);
  }

  function dashboardStats() {
    var now = nowDate();
    var t0 = startOfDay(now).getTime();
    var y0 = addDays(startOfDay(now), -1).getTime();
    var revenueToday = sumRevenueBetween(t0, Number.MAX_SAFE_INTEGER);
    var revenueYesterday = sumRevenueBetween(y0, t0);
    var ordersToday = S.data.orders.filter(function (o) {
      var d = toDate(o.createdAt);
      return d && d.getTime() >= t0 && o.status !== "void";
    });
    var processingToday = 0;
    var paidToday = 0;
    var memberTxToday = 0;
    var activeProducts = S.data.products.filter(function (p) {
      return p.active;
    });
    var low = 0;
    var out = 0;
    var processingTotal = 0;
    var recent;
    var catalog;

    ordersToday.forEach(function (o) {
      if (o.status === "processing") {
        processingToday += 1;
      }
      if (o.status === "paid") {
        paidToday += 1;
      }
      if (o.tier !== TIERS.defaultTier) {
        memberTxToday += 1;
      }
    });
    activeProducts.forEach(function (p) {
      var st = productStatus(p);
      if (st === "low") {
        low += 1;
      } else if (st === "out") {
        out += 1;
      }
    });
    S.data.orders.forEach(function (o) {
      if (o.status === "processing") {
        processingTotal += 1;
      }
    });

    recent = queryOrders({ limit: ORD.dashboardRecentLimit });
    catalog = listProducts({ activeOnly: true }).filter(function (p) {
      return p.hasMemberPrice;
    }).slice(0, DASH.catalogLimit);

    return {
      revenueToday: revenueToday,
      revenueYesterday: revenueYesterday,
      revenueChangePercent: revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : null,
      ordersToday: ordersToday.length,
      processingToday: processingToday,
      paidToday: paidToday,
      processingOrders: processingTotal,
      ordersTotal: S.data.orders.length,
      activeSku: activeProducts.length,
      lowStockCount: low,
      outOfStockCount: out,
      memberCount: S.data.members.length,
      memberTransactionsToday: memberTxToday,
      recentOrders: recent.items,
      catalog: catalog,
      store: getStoreInfo(),
      session: getSession()
    };
  }

  function navigationBadges() {
    var processing = 0;
    S.data.orders.forEach(function (o) {
      if (o.status === "processing") {
        processing += 1;
      }
    });
    return { ordersInProcess: processing };
  }

  function listNotifications() {
    var items = [];
    var processing = 0;
    if (!FEAT.notifications) {
      return items;
    }
    S.data.products.forEach(function (p) {
      var st;
      if (!p.active) {
        return;
      }
      st = productStatus(p);
      if (st === "out") {
        items.push({
          id: "out_" + p.id,
          type: "danger",
          icon: "error",
          title: p.name + " " + INV.outOfStockLabel.toLowerCase(),
          text: "Stok " + p.sku + " sudah habis."
        });
      } else if (st === "low") {
        items.push({
          id: "low_" + p.id,
          type: "warning",
          icon: "warning",
          title: p.name + " " + INV.lowStockLabel.toLowerCase(),
          text: "Sisa " + formatQuantity(p.stock) + " " + p.unit + " (batas " + formatQuantity(p.minStock) + ")."
        });
      }
    });
    S.data.orders.forEach(function (o) {
      if (o.status === "processing") {
        processing += 1;
      }
    });
    if (processing > 0) {
      items.push({
        id: "processing",
        type: "info",
        icon: "pending_actions",
        title: processing + " pesanan " + ORD.statuses.processing.label.toLowerCase(),
        text: "Selesaikan pembayaran atau batalkan pesanan yang menggantung."
      });
    }
    return items;
  }

  /* ------------------------------------------------------------------------
     14. STRUK
     ------------------------------------------------------------------------ */
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function wrapText(text, width) {
    var words = String(text).split(" ");
    var lines = [];
    var cur = "";
    words.forEach(function (word) {
      var w = word;
      while (w.length > width) {
        if (cur) {
          lines.push(cur);
          cur = "";
        }
        lines.push(w.slice(0, width));
        w = w.slice(width);
      }
      if (!cur) {
        cur = w;
      } else if ((cur + " " + w).length <= width) {
        cur += " " + w;
      } else {
        lines.push(cur);
        cur = w;
      }
    });
    if (cur || !lines.length) {
      lines.push(cur);
    }
    return lines;
  }

  function centerText(text, width) {
    var t = String(text);
    var left;
    if (t.length >= width) {
      return t;
    }
    left = Math.floor((width - t.length) / 2);
    return new Array(left + 1).join(" ") + t;
  }

  function rowText(left, right, width) {
    var l = String(left);
    var r = String(right);
    var space;
    if (l.length + r.length + 1 > width) {
      l = l.slice(0, Math.max(0, width - r.length - 1));
    }
    space = width - l.length - r.length;
    if (space < 1) {
      space = 1;
    }
    return l + new Array(space + 1).join(" ") + r;
  }

  function fillTemplate(line, info) {
    return String(line)
      .replace(/\{storeName\}/g, info.name)
      .replace(/\{branchName\}/g, info.branch);
  }

  function buildReceipt(orderId, opts) {
    var o = findById(S.data.orders, orderId);
    var options = isObj(opts) ? opts : {};
    var widthMm = RCP.paperWidthOptions.indexOf(options.paperWidthMm) >= 0 ? options.paperWidthMm : RCP.paperWidthMm;
    var cpl = Math.max(20, Math.floor((RCP.charsPerLine * widthMm) / RCP.paperWidthMm));
    var L = RCP.labels;
    var info = S.meta.stores[S.mode];
    var lines = [];
    var sep = new Array(cpl + 1).join("-");
    var view;
    var text;
    var html;
    var script = "";

    if (!FEAT.receiptPrinting) {
      return fail(CORE_MSG.featureOff);
    }
    if (!o) {
      return fail(ERR.notFound);
    }
    view = viewOrder(o);

    RCP.headerLines.forEach(function (line) {
      wrapText(fillTemplate(line, info), cpl).forEach(function (part) {
        lines.push(centerText(part, cpl));
      });
    });
    lines.push(sep);
    if (RCP.showOrderNumber) {
      lines.push(rowText(L.orderNumber, o.number, cpl));
    }
    if (RCP.showDateTime) {
      lines.push(rowText(L.date, formatDateTime(o.createdAt), cpl));
    }
    if (RCP.showCashier) {
      lines.push(rowText(L.cashier, o.cashier || info.cashier, cpl));
    }
    lines.push(rowText(L.customer, o.customerName, cpl));
    if (RCP.showMemberInfo && view.isMember) {
      lines.push(rowText(L.member, view.tierLabel, cpl));
    }
    lines.push(sep);

    o.items.forEach(function (item) {
      wrapText(item.name, cpl).forEach(function (part) {
        lines.push(part);
      });
      lines.push(rowText(
        "  " + formatQuantity(item.qty) + " x " + formatNumber(item.unitPrice, 0),
        formatNumber(Math.round(item.unitPrice * item.qty), 0),
        cpl
      ));
    });
    lines.push(sep);

    lines.push(rowText(L.subtotal, formatNumber(o.subtotalRegular, 0), cpl));
    if (RCP.showMemberSaving && o.memberDiscount > 0) {
      lines.push(rowText(L.memberSaving, "-" + formatNumber(o.memberDiscount, 0), cpl));
    }
    lines.push(rowText(L.total, formatCurrency(o.total), cpl));
    if (RCP.showPaymentMethod) {
      lines.push(rowText(L.payment, view.paymentLabel, cpl));
    }
    if (o.cashPaid !== null && o.cashPaid !== undefined) {
      lines.push(rowText(L.cashPaid, formatNumber(o.cashPaid, 0), cpl));
      lines.push(rowText(L.change, formatNumber(o.change, 0), cpl));
    }
    lines.push(rowText(L.status, view.statusLabel, cpl));
    lines.push(sep);

    RCP.footerLines.forEach(function (line) {
      wrapText(fillTemplate(line, info), cpl).forEach(function (part) {
        lines.push(centerText(part, cpl));
      });
    });

    text = lines.join("\n");

    if (RCP.autoPrintOnOpen) {
      script = "<script>window.onload=function(){window.print();" +
        (RCP.closeAfterPrint ? "window.onafterprint=function(){window.close();};" : "") +
        "};<\/script>";
    }
    html = "<!DOCTYPE html><html lang=\"id\"><head><meta charset=\"utf-8\"><title>" +
      escapeHtml(RCP.windowTitle + " " + o.number) + "</title><style>" +
      "@page{size:" + widthMm + "mm auto;margin:2mm;}" +
      "html,body{margin:0;padding:0;background:#ffffff;color:#000000;}" +
      "body{width:" + widthMm + "mm;}" +
      "pre{margin:0;padding:2mm;font-family:" + RCP.fontFamily + ";font-size:" + RCP.fontSizePx + "px;line-height:1.35;white-space:pre-wrap;}" +
      "</style></head><body><pre>" + escapeHtml(text) + "</pre>" + script + "</body></html>";

    return success({
      orderId: o.id,
      number: o.number,
      title: RCP.windowTitle + " " + o.number,
      paperWidthMm: widthMm,
      charsPerLine: cpl,
      lines: lines,
      text: text,
      html: html
    });
  }

  /* ------------------------------------------------------------------------
     15. DATA DEMO (hanya jika diminta secara eksplisit)
     ------------------------------------------------------------------------ */
  function loadDemo() {
    var dataBackup;
    var metaBackup;
    var now = nowDate();
    var dayStart = startOfDay(now).getTime();
    var data = emptyData();
    var skuMap = {};
    var memberMap = {};
    var ordersSorted;
    var i;

    if (S.mode !== "demo") {
      return fail(ERR.demoOnly);
    }
    dataBackup = clone(S.data);
    metaBackup = clone(S.meta);

    try {
      SEED.products.forEach(function (p) {
        var rec = {
          id: newId("prd", data.products),
          sku: String(p.sku).toUpperCase(),
          name: p.name,
          category: p.category,
          unit: p.unit,
          cost: p.cost,
          priceRegular: p.priceRegular,
          priceMember: p.priceMember,
          memberLabel: p.memberLabel || "",
          stock: p.stock,
          minStock: p.minStock,
          active: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        };
        data.products.push(rec);
        skuMap[rec.sku] = rec;
      });

      SEED.members.forEach(function (m) {
        var rec = {
          id: newId("mbr", data.members),
          name: m.name,
          phone: digitsOnly(m.phone),
          tier: m.tier,
          points: m.points,
          note: "",
          active: true,
          createdAt: now.toISOString()
        };
        data.members.push(rec);
        memberMap[m.ref] = rec;
      });

      SEED.staff.forEach(function (s) {
        data.staff.push({
          id: newId("stf", data.staff),
          name: s.name,
          role: s.role,
          shift: s.shift,
          phone: "",
          active: s.active !== false,
          createdAt: now.toISOString()
        });
      });

      SEED.expenses.forEach(function (e) {
        var when = addDays(now, -e.daysAgo);
        data.expenses.push({
          id: newId("exp", data.expenses),
          title: e.title,
          category: e.category,
          amount: e.amount,
          date: when.toISOString(),
          note: "",
          createdAt: now.toISOString()
        });
      });

      ordersSorted = SEED.orders.slice().sort(function (a, b) {
        return b.minutesAgo - a.minutesAgo;
      });

      /* Nomor pesanan memakai penghitung milik data baru. */
      var savedData = S.data;
      S.data = data;
      for (i = 0; i < ordersSorted.length; i += 1) {
        var so = ordersSorted[i];
        var member = so.memberRef ? memberMap[so.memberRef] : null;
        var stampMs = Math.max(dayStart, now.getTime() - so.minutesAgo * 60000);
        var stamp = new Date(stampMs);
        var items = [];
        var subtotal = 0;
        var total = 0;
        so.items.forEach(function (it) {
          var p = skuMap[String(it.sku).toUpperCase()];
          if (!p) {
            return;
          }
          items.push({
            productId: p.id,
            sku: p.sku,
            name: p.name,
            unit: p.unit,
            qty: it.qty,
            regularPrice: p.priceRegular,
            unitPrice: it.unitPrice,
            cost: p.cost
          });
          subtotal += p.priceRegular * it.qty;
          total += it.unitPrice * it.qty;
        });
        if (!items.length) {
          continue;
        }
        data.orders.push({
          id: newId("ord", data.orders),
          number: nextOrderNumber(stamp),
          createdAt: stamp.toISOString(),
          paidAt: so.status === "paid" ? stamp.toISOString() : "",
          voidedAt: "",
          memberId: member ? member.id : null,
          customerName: member ? member.name : ORD.walkInCustomerLabel,
          tier: member ? member.tier : TIERS.defaultTier,
          items: items,
          subtotalRegular: subtotal,
          memberDiscount: Math.max(0, subtotal - total),
          total: total,
          payment: so.payment,
          cashPaid: so.payment === "cash" && so.status === "paid" ? total : null,
          change: 0,
          status: so.status,
          note: "",
          cashier: SEED.store.cashier,
          pointsAwarded: 0
        });
      }
      S.data = savedData;
    } catch (e) {
      S.data = dataBackup;
      S.meta = metaBackup;
      return fail(CORE_MSG.unexpected);
    }

    S.data = data;
    S.meta.stores.demo = sanitizeStoreInfo({
      name: SEED.store.name,
      branch: SEED.store.branch,
      cashier: SEED.store.cashier,
      cashierRole: SEED.store.cashierRole
    });

    var failed = !saveMeta();
    ST.collections.forEach(function (name) {
      if (!saveCollection(name)) {
        failed = true;
      }
    });
    if (failed) {
      S.data = dataBackup;
      S.meta = metaBackup;
      saveMeta();
      ST.collections.forEach(function (name) {
        saveCollection(name);
      });
      return fail(ERR.storageFailed);
    }
    emit({ type: "demo", collections: ST.collections.slice() });
    return success({ products: data.products.length, members: data.members.length, orders: data.orders.length }, SUC.demoLoaded);
  }

  function resetDemo() {
    var dataBackup;
    var metaBackup;
    var failed;
    if (S.mode !== "demo") {
      return fail(ERR.demoOnly);
    }
    dataBackup = clone(S.data);
    metaBackup = clone(S.meta);
    S.data = emptyData();
    S.meta.stores.demo = defaultStoreInfo();
    failed = !saveMeta();
    ST.collections.forEach(function (name) {
      if (!saveCollection(name)) {
        failed = true;
      }
    });
    if (failed) {
      S.data = dataBackup;
      S.meta = metaBackup;
      saveMeta();
      ST.collections.forEach(function (name) {
        saveCollection(name);
      });
      return fail(ERR.storageFailed);
    }
    S.session.demo = { openedAt: nowDate().toISOString() };
    saveSession();
    emit({ type: "demo", collections: ST.collections.slice() });
    return success({}, SUC.demoReset);
  }

  /* ------------------------------------------------------------------------
     16. CADANGAN JSON
     ------------------------------------------------------------------------ */
  function exportBackup() {
    if (!FEAT.exportBackupJson) {
      return fail(CORE_MSG.featureOff);
    }
    return success({
      filename: "bizflow-" + ST.namespaces[S.mode] + "-" + dayKey(nowDate()) + ".json",
      json: JSON.stringify({
        app: APP.name,
        schemaVersion: APP.schemaVersion,
        exportedAt: nowDate().toISOString(),
        namespace: ST.namespaces[S.mode],
        store: clone(S.meta.stores[S.mode]),
        data: clone(S.data)
      }, null, 2)
    });
  }

  function importBackup(text) {
    var obj;
    var incoming = {};
    var storeInfo;
    var storeBackup;
    var res;
    if (!FEAT.importBackupJson) {
      return fail(CORE_MSG.featureOff);
    }
    try {
      obj = JSON.parse(String(text));
    } catch (e) {
      return fail(CORE_MSG.invalidBackup);
    }
    if (!isObj(obj) || obj.app !== APP.name || !isObj(obj.data) || typeof obj.schemaVersion !== "number" || obj.schemaVersion > APP.schemaVersion) {
      return fail(CORE_MSG.invalidBackup);
    }
    ST.collections.forEach(function (name) {
      var raw = obj.data[name];
      if (name === "counters") {
        incoming.counters = {
          order: isObj(raw) && isObj(raw.order) ? raw.order : {},
          sku: isObj(raw) && typeof raw.sku === "number" && isFinite(raw.sku) ? raw.sku : 0
        };
      } else {
        incoming[name] = Array.isArray(raw)
          ? raw.filter(function (item) {
            return isObj(item) && typeof item.id === "string";
          })
          : [];
      }
    });
    storeInfo = sanitizeStoreInfo(obj.store);
    storeBackup = clone(S.meta.stores[S.mode]);

    res = tx(ST.collections.slice(), function () {
      ST.collections.forEach(function (name) {
        S.data[name] = incoming[name];
      });
      return success({}, CORE_MSG.imported);
    }, "import");
    if (!res.ok) {
      return res;
    }
    S.meta.stores[S.mode] = storeInfo;
    if (!saveMeta()) {
      S.meta.stores[S.mode] = storeBackup;
      return fail(ERR.storageFailed);
    }
    emit({ type: "store", collections: [] });
    return res;
  }

  /* ------------------------------------------------------------------------
     17. INISIALISASI
     ------------------------------------------------------------------------ */
  function init() {
    try {
      S.meta = loadMeta();
      S.mode = S.meta.mode;
      S.session = loadSession();
      S.data = loadData(S.mode);
      ensureSession(S.mode);
      saveMeta();
    } catch (e) {
      initError = CORE_MSG.unexpected;
      S.meta = loadMetaSafe();
      S.mode = MODES.defaultMode;
      S.session = {};
      Object.keys(MODES.list).forEach(function (id) {
        S.session[id] = { openedAt: "" };
      });
      S.data = emptyData();
    }
  }

  function loadMetaSafe() {
    var meta = { schemaVersion: APP.schemaVersion, mode: MODES.defaultMode, stores: {} };
    Object.keys(MODES.list).forEach(function (id) {
      meta.stores[id] = defaultStoreInfo();
    });
    return meta;
  }

  init();

  /* ------------------------------------------------------------------------
     18. API PUBLIK (dibekukan)
     ------------------------------------------------------------------------ */
  function deepFreeze(target) {
    if (target === null || typeof target !== "object" || Object.isFrozen(target)) {
      return target;
    }
    Object.getOwnPropertyNames(target).forEach(function (name) {
      var child = target[name];
      if (typeof child === "function") {
        Object.freeze(child);
      } else {
        deepFreeze(child);
      }
    });
    return Object.freeze(target);
  }

  var API = {
    ready: true,
    version: APP.version,
    status: function () {
      return { ready: !initError, error: initError, persistent: storage.isPersistent() };
    },
    subscribe: subscribe,
    edition: function () {
      return clone(EDITION);
    },

    format: {
      currency: formatCurrency,
      number: formatNumber,
      percent: formatPercent,
      quantity: formatQuantity,
      date: formatDate,
      clock: formatClock,
      time: formatTime,
      dateTime: formatDateTime
    },

    mode: {
      get: getMode,
      set: setMode,
      list: listModes,
      isDemo: function () {
        return S.mode === "demo";
      }
    },

    store: {
      get: getStoreInfo,
      rename: renameStore,
      update: updateStoreInfo,
      session: getSession,
      setActiveStaff: setActiveStaff
    },

    demo: {
      load: loadDemo,
      reset: resetDemo
    },

    products: {
      list: listProducts,
      get: getProduct,
      findBySku: findProductBySku,
      create: createProduct,
      update: updateProduct,
      remove: removeProduct,
      setStock: setStock,
      opname: stockOpname,
      categories: listCategories
    },

    members: {
      list: listMembers,
      get: getMember,
      create: createMember,
      update: updateMember,
      remove: removeMember,
      tiers: memberTiers
    },

    orders: {
      preview: previewOrder,
      create: createOrder,
      query: queryOrders,
      get: getOrder,
      markPaid: markOrderPaid,
      void: voidOrder,
      update: updateOrder
    },

    expenses: {
      list: listExpenses,
      get: getExpense,
      create: createExpense,
      update: updateExpense,
      remove: removeExpense,
      categories: expenseCategories
    },

    staff: {
      list: listStaff,
      get: getStaff,
      create: createStaff,
      update: updateStaff,
      remove: removeStaff
    },

    reports: {
      summary: reportSummary,
      periods: listPeriods
    },

    dashboard: {
      stats: dashboardStats
    },

    navigation: {
      badges: navigationBadges
    },

    notifications: {
      list: listNotifications
    },

    receipt: {
      build: buildReceipt
    },

    backup: {
      export: exportBackup,
      import: importBackup
    }
  };

  deepFreeze(API);

  Object.defineProperty(global, "BizFlowCore", {
    value: API,
    writable: false,
    configurable: false,
    enumerable: true
  });
})(typeof window !== "undefined" ? window : this);