/* ==========================================================================
   BizFlow - Aplikasi Kelola Order, Stok & Harga Member
   Berkas 4 dari 5: components.js  (KOMPONEN UI + AUTENTIKASI KETAT 6 ANGKA)

   ATURAN LOGIN KASIR / ADMIN
   - Username Default : Admin  (atau nama staf aktif di menu Staf & Kasir)
   - PIN Default      : 123456 (wajib tepat 6 digit angka, huruf diblokir)
   - Menolak masuk dengan username sembarang / PIN sembarang.
   ========================================================================== */

(function (global) {
  "use strict";

  var CFG = global.BIZFLOW_CONFIG;
  var Core = global.BizFlowCore;
  var doc = global.document;

  function onReady(fn) {
    if (doc.readyState === "loading") {
      doc.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  /* ------------------------------------------------------------------------
     0. PENGAMAN AWAL: config dan core wajib ada
     ------------------------------------------------------------------------ */
  if (!CFG || !Core || !Core.ready) {
    onReady(function () {
      var root = doc.getElementById("app") || doc.body;
      var why = !CFG
        ? "app.config.js belum dimuat."
        : (!Core ? "core.js belum dimuat." : (Core.error || "core.js gagal dimulai."));
      root.innerHTML = "<div style=\"max-width:520px;margin:15vh auto;padding:24px;font-family:system-ui,sans-serif;" +
        "border:1px solid #fecaca;background:#fee2e2;color:#991b1b;border-radius:12px\">" +
        "<h2 style=\"margin:0 0 8px\">BizFlow tidak dapat dimulai</h2>" +
        "<p style=\"margin:0\">" + why + " Pastikan urutan berkas: app.config.js, core.js, lalu components.js.</p></div>";
    });
    return;
  }

  /* ------------------------------------------------------------------------
     1. PINTASAN KONFIGURASI
     ------------------------------------------------------------------------ */
  var APP = CFG.APP;
  var ST = CFG.STORAGE;
  var NAV = CFG.NAVIGATION;
  var HDR = CFG.HEADER;
  var TIERS = CFG.MEMBER_TIERS;
  var ORD = CFG.ORDERS;
  var INV = CFG.INVENTORY;
  var MEM = CFG.MEMBERS;
  var EXP = CFG.EXPENSES;
  var STF = CFG.STAFF;
  var REP = CFG.REPORTS;
  var DASH = CFG.DASHBOARD;
  var RCP = CFG.RECEIPT;
  var PH = CFG.PLACEHOLDERS;
  var MSG = CFG.MESSAGES;
  var FEAT = CFG.FEATURES;
  var LAYOUT = CFG.LAYOUT;
  var F = Core.format;

  var DEFAULT_AUTH = {
    username: "Admin",
    pin: "123456"
  };

  /* ------------------------------------------------------------------------
     2. UTILITAS
     ------------------------------------------------------------------------ */
  function qs(sel, root) {
    return (root || doc).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || doc).querySelectorAll(sel));
  }

  function esc(v) {
    return String(v === undefined || v === null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ico(name, cls) {
    return "<span class=\"material-symbols-outlined" + (cls ? " " + cls : "") + "\" aria-hidden=\"true\">" + esc(name) + "</span>";
  }

  function stripPlus(label) {
    return String(label).replace(/^\+\s*/, "");
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function initials(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return "?";
    }
    return (parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "")).toUpperCase();
  }

  function digitsNum(v) {
    var n = Number(String(v === undefined || v === null ? "" : v).replace(/[^\d]/g, ""));
    return isFinite(n) ? n : 0;
  }

  function todayInput() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function money(n) {
    return F.currency(n);
  }

  function ensureHost(id, cls, attrs) {
    var el = doc.getElementById(id);
    if (!el) {
      el = doc.createElement("div");
      el.id = id;
      if (cls) {
        el.className = cls;
      }
      if (attrs) {
        Object.keys(attrs).forEach(function (k) {
          el.setAttribute(k, attrs[k]);
        });
      }
      doc.body.appendChild(el);
    }
    return el;
  }

  function isMobile() {
    try {
      return global.matchMedia("(max-width: 767px)").matches;
    } catch (e) {
      return false;
    }
  }

  function navItems() {
    var items = [];
    NAV.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        items.push(it);
      });
    });
    return items;
  }

  function navTitle(path) {
    if (path === "login") {
      return "Login Kasir";
    }
    var found = navItems().filter(function (it) {
      return it.path === path;
    })[0];
    return found ? found.label : APP.name;
  }

  function isValidRoute(path) {
    if (path === "login") {
      return true;
    }
    return navItems().some(function (it) {
      return it.path === path;
    });
  }

  function statusOptionLabel(id) {
    return ORD.statuses[id] ? ORD.statuses[id].label : id;
  }

  /* CSS tambahan khusus komponen & halaman Login. */
  function injectExtraStyles() {
    if (doc.getElementById("bizflow-ui-extra")) {
      return;
    }
    var style = doc.createElement("style");
    style.id = "bizflow-ui-extra";
    style.textContent =
      ".receipt-wrap{display:flex;justify-content:center;padding:16px;border-radius:var(--r-md);background:var(--c-rail);overflow-x:auto}" +
      ".receipt-preview{margin:0;padding:16px 12px;background:#fff;color:#000;border:1px dashed var(--c-border-hover);" +
      "border-radius:var(--r);font-family:" + RCP.fontFamily + ";font-size:" + RCP.fontSizePx + "px;line-height:1.4;" +
      "white-space:pre;overflow-x:auto;box-shadow:var(--shadow-1)}" +
      ".diff-pos{color:var(--c-ok-text);font-weight:600}.diff-neg{color:var(--c-danger-text);font-weight:600}" +
      ".page-banner{margin-bottom:0}.opname-input{max-width:120px;margin-left:auto}" +
      ".sidebar__scroll .nav-item{text-decoration:none}" +
      ".login-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at top left,#eff6ff 0%,var(--c-bg) 55%,#f3e8ff 100%)}" +
      ".login-grid{display:grid;grid-template-columns:1.05fr 1fr;width:100%;max-width:960px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:var(--r-lg);box-shadow:var(--shadow-3);overflow:hidden}" +
      ".login-hero{display:flex;flex-direction:column;justify-content:space-between;padding:40px;background:linear-gradient(145deg,#1e3a8a 0%,var(--c-primary) 55%,#4f46e5 100%);color:#fff}" +
      ".login-hero__badges{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px}" +
      ".login-hero__pill{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:var(--r-full);background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.25);font-size:12px;font-weight:600}" +
      ".login-hero__title{font-family:var(--font-head);font-size:28px;line-height:36px;font-weight:700;color:#fff;letter-spacing:-0.02em;margin-bottom:12px}" +
      ".login-hero__desc{font-size:14px;line-height:22px;color:rgba(255,255,255,0.88);margin-bottom:28px}" +
      ".login-hero__list{display:flex;flex-direction:column;gap:12px;margin-bottom:28px}" +
      ".login-hero__item{display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(255,255,255,0.92)}" +
      ".login-hero__foot{padding-top:20px;border-top:1px solid rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.8)}" +
      ".login-panel{padding:40px;display:flex;flex-direction:column;justify-content:center;background:var(--c-surface)}" +
      ".login-staff-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}" +
      ".login-staff-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--r-full);border:1px solid var(--c-border);background:var(--c-subdued);font-size:12px;font-weight:500;color:var(--c-text-2);transition:all 150ms}" +
      ".login-staff-chip:hover{border-color:var(--c-primary);background:var(--c-primary-wash);color:var(--c-primary-hover)}" +
      ".pin-wrap{position:relative;display:flex;align-items:center}" +
      ".pin-wrap .input{padding-right:42px;letter-spacing:0.25em;font-weight:600;font-variant-numeric:tabular-nums}" +
      ".pin-wrap .input::placeholder{letter-spacing:normal;font-weight:400}" +
      ".pin-toggle{position:absolute;right:6px;width:32px;height:32px;border:0;border-radius:var(--r);background:transparent;color:var(--c-text-3);display:grid;place-items:center}" +
      ".pin-toggle:hover{background:var(--c-rail);color:var(--c-text)}" +
      "@media (max-width:820px){.login-grid{grid-template-columns:1fr;max-width:460px}.login-hero{padding:28px}.login-panel{padding:28px}}";
    doc.head.appendChild(style);
  }

  /* ------------------------------------------------------------------------
     3. STATE TAMPILAN & KREDENSIAL LOGIN KETAT
     ------------------------------------------------------------------------ */
  var UI = {
    loggedIn: false,
    showPin: false,
    route: NAV.defaultRoute,
    collapsed: false,
    drawer: false,
    popover: false,
    paperWidth: RCP.paperWidthMm,
    dash: { filter: ORD.defaultFilter },
    orders: { search: "", filter: ORD.defaultFilter, status: "all", page: 1 },
    products: { search: "", category: "", status: "all" },
    members: { search: "", tier: "all" },
    expenses: { search: "", category: "", period: "month" },
    reports: { period: REP.defaultPeriod },
    staff: { search: "" }
  };

  var collapseKey = ST.prefix + LAYOUT.sidebarCollapsedStorageKey;
  var authSessionKey = ST.prefix + "ui.strictAuth.v2";
  var authPinKey = ST.prefix + "ui.pin";

  function loadCollapsed() {
    try {
      UI.collapsed = global.localStorage.getItem(collapseKey) === "1";
    } catch (e) {
      UI.collapsed = false;
    }
  }

  function saveCollapsed() {
    try {
      global.localStorage.setItem(collapseKey, UI.collapsed ? "1" : "0");
    } catch (e) {
      /* diabaikan */
    }
  }

  /* Memeriksa apakah nama pengguna cocok dengan Admin atau Staf Aktif. */
  function matchValidAccount(rawUsername) {
    var clean = String(rawUsername || "").trim();
    var staffList;
    var i;
    if (!clean) {
      return null;
    }
    if (clean.toLowerCase() === DEFAULT_AUTH.username.toLowerCase()) {
      return { name: DEFAULT_AUTH.username, role: APP.defaultCashierRole };
    }
    staffList = Core.staff.list({ activeOnly: true });
    for (i = 0; i < staffList.length; i += 1) {
      if (String(staffList[i].name).toLowerCase() === clean.toLowerCase()) {
        return { name: staffList[i].name, role: staffList[i].roleLabel };
      }
    }
    return null;
  }

  function loadAuthSession() {
    var currentCashier = Core.store.get().cashier;
    var validAcc = matchValidAccount(currentCashier);
    try {
      global.sessionStorage.removeItem(ST.prefix + "ui.loggedIn");
      if (global.sessionStorage.getItem(authSessionKey) === "1" && validAcc) {
        UI.loggedIn = true;
      } else {
        UI.loggedIn = false;
        global.sessionStorage.removeItem(authSessionKey);
        if (!validAcc) {
          Core.store.update({ cashier: DEFAULT_AUTH.username, cashierRole: APP.defaultCashierRole });
        }
      }
    } catch (e) {
      UI.loggedIn = false;
    }
  }

  function saveAuthSession(val) {
    UI.loggedIn = !!val;
    try {
      if (UI.loggedIn) {
        global.sessionStorage.setItem(authSessionKey, "1");
      } else {
        global.sessionStorage.removeItem(authSessionKey);
      }
    } catch (e) {
      /* diabaikan */
    }
  }

  function getActivePin() {
    try {
      var saved = global.localStorage.getItem(authPinKey);
      if (saved && /^\d{6}$/.test(saved)) {
        return saved;
      }
    } catch (e) {
      /* diabaikan */
    }
    return DEFAULT_AUTH.pin;
  }

  function saveActivePin(newPin) {
    if (!/^\d{6}$/.test(String(newPin || ""))) {
      return false;
    }
    try {
      global.localStorage.setItem(authPinKey, String(newPin));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------------
     4. TOAST
     ------------------------------------------------------------------------ */
  function toast(message, type) {
    var host = ensureHost("toast-host", "toast-host", { "aria-live": "polite" });
    var kind = type || "info";
    var icons = { success: "check_circle", error: "error", info: "info" };
    var el = doc.createElement("div");
    el.className = "toast toast--" + kind;
    el.setAttribute("role", kind === "error" ? "alert" : "status");
    el.innerHTML = "<span class=\"toast__icon\">" + ico(icons[kind] || "info", "icon-fill") + "</span>" +
      "<div class=\"toast__text\">" + esc(message) + "</div>";
    host.appendChild(el);
    global.setTimeout(function () {
      el.classList.add("is-leaving");
      global.setTimeout(function () {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      }, 180);
    }, LAYOUT.toastDurationMs);
  }

  function notify(res, fallbackOk) {
    if (res && res.ok) {
      toast(res.message || fallbackOk || MSG.success.saved, "success");
    } else {
      toast(res && res.error ? res.error : MSG.errors.storageFailed, "error");
    }
    return res;
  }

  /* ------------------------------------------------------------------------
     5. DIALOG (MODAL)
     ------------------------------------------------------------------------ */
  var modals = [];
  var modalSeq = 0;
  var FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])";

  function openModal(o) {
    var host = ensureHost("modal-host");
    var id = "m" + (modalSeq += 1);
    var back = doc.createElement("div");
    var rec;
    var api;
    var first;

    back.className = "modal-backdrop";
    back.setAttribute("data-modal-id", id);
    back.innerHTML =
      "<div class=\"modal" + (o.size ? " modal--" + o.size : "") + "\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"" + id + "-t\">" +
      "<div class=\"modal__header\"><div><h2 class=\"modal__title\" id=\"" + id + "-t\">" + esc(o.title) + "</h2>" +
      (o.subtitle ? "<p class=\"modal__subtitle\">" + esc(o.subtitle) + "</p>" : "") + "</div>" +
      "<button type=\"button\" class=\"btn btn--ghost btn--icon\" data-m-close aria-label=\"" + esc(MSG.buttons.close) + "\">" + ico("close") + "</button></div>" +
      "<div class=\"modal__body" + (o.flush ? " modal__body--flush" : "") + "\">" + (o.body || "") + "</div>" +
      (o.footer ? "<div class=\"modal__footer" + (o.footerBetween ? " modal__footer--between" : "") + "\">" + o.footer + "</div>" : "") +
      "</div>";

    rec = { id: id, el: back, closed: false, prevFocus: doc.activeElement, opts: o };

    function close() {
      var idx;
      if (rec.closed) {
        return;
      }
      rec.closed = true;
      idx = modals.indexOf(rec);
      if (idx >= 0) {
        modals.splice(idx, 1);
      }
      if (back.parentNode) {
        back.parentNode.removeChild(back);
      }
      if (!modals.length) {
        doc.body.classList.remove("no-scroll");
      }
      try {
        if (rec.prevFocus && typeof rec.prevFocus.focus === "function" && doc.body.contains(rec.prevFocus)) {
          rec.prevFocus.focus();
        }
      } catch (e) {
        /* diabaikan */
      }
      if (o.onClose) {
        o.onClose();
      }
    }

    api = {
      el: back,
      close: close,
      qs: function (sel) {
        return qs(sel, back);
      },
      qsa: function (sel) {
        return qsa(sel, back);
      }
    };
    rec.api = api;

    back.addEventListener("click", function (ev) {
      var t = ev.target;
      var closer;
      var act;
      if (t === back && o.backdropClose) {
        close();
        return;
      }
      closer = t.closest ? t.closest("[data-m-close]") : null;
      if (closer && back.contains(closer)) {
        close();
        return;
      }
      act = t.closest ? t.closest("[data-m-action]") : null;
      if (act && back.contains(act) && o.onClick) {
        o.onClick(act, ev, api);
      }
    });
    back.addEventListener("submit", function (ev) {
      var f = ev.target;
      if (f && f.tagName === "FORM") {
        ev.preventDefault();
        if (o.onSubmit) {
          o.onSubmit(f, ev, api);
        }
      }
    });
    back.addEventListener("input", function (ev) {
      var target = ev.target;
      if (target && target.getAttribute && target.getAttribute("data-pin-only") === "1") {
        var cleaned = String(target.value || "").replace(/\D/g, "").slice(0, 6);
        if (target.value !== cleaned) {
          target.value = cleaned;
        }
      }
      if (o.onInput) {
        o.onInput(target, ev, api);
      }
    });
    back.addEventListener("change", function (ev) {
      if (o.onChange) {
        o.onChange(ev.target, ev, api);
      }
    });
    back.addEventListener("keydown", function (ev) {
      if (o.onKeydown) {
        o.onKeydown(ev.target, ev, api);
      }
    });

    host.appendChild(back);
    modals.push(rec);
    doc.body.classList.add("no-scroll");

    first = qs("[autofocus]", back) || qs(".modal__body input:not([type=hidden]):not([type=checkbox]):not([type=radio]), .modal__body select, .modal__body textarea", back);
    if (first && typeof first.focus === "function") {
      first.focus();
    } else {
      first = qs("[data-m-close]", back);
      if (first) {
        first.focus();
      }
    }
    if (o.onOpen) {
      o.onOpen(api);
    }
    return api;
  }

  function closeTopModal() {
    var top = modals[modals.length - 1];
    if (top) {
      top.api.close();
      return true;
    }
    return false;
  }

  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var done = false;
      var tone = o.tone || "primary";
      var iconCls = "confirm__icon" + (tone === "danger" ? " confirm__icon--danger" : (tone === "warn" ? " confirm__icon--warn" : ""));
      function finish(v) {
        if (!done) {
          done = true;
          resolve(v);
        }
      }
      openModal({
        size: "sm",
        title: o.title,
        body: "<div class=\"confirm\"><div class=\"" + iconCls + "\">" + ico(o.icon || "help", "icon-lg") + "</div>" +
          "<p class=\"confirm__text\">" + esc(o.text || "") + "</p></div>",
        footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(o.cancelLabel || MSG.confirm.no) + "</button>" +
          "<button type=\"button\" class=\"btn " + (tone === "danger" ? "btn--danger" : "btn--primary") + "\" data-m-action=\"yes\" autofocus>" +
          esc(o.confirmLabel || MSG.confirm.yes) + "</button>",
        backdropClose: true,
        onClick: function (a, ev, api) {
          finish(true);
          api.close();
        },
        onClose: function () {
          finish(false);
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. FORMULIR: pembuat kolom, pembaca nilai, tampilan galat
     ------------------------------------------------------------------------ */
  function optionsHtml(list, selected) {
    return list.map(function (o) {
      return "<option value=\"" + esc(o.value) + "\"" + (String(o.value) === String(selected) ? " selected" : "") + ">" + esc(o.label) + "</option>";
    }).join("");
  }

  function fieldHtml(o) {
    var id = "f_" + o.name;
    var input;
    var hasValue = o.value !== undefined && o.value !== null;
    if (o.type === "select") {
      input = "<select class=\"select\" id=\"" + id + "\" name=\"" + o.name + "\">" + optionsHtml(o.options || [], o.value) + "</select>";
    } else if (o.type === "textarea") {
      input = "<textarea class=\"textarea\" id=\"" + id + "\" name=\"" + o.name + "\" placeholder=\"" + esc(o.placeholder || "") + "\" maxlength=\"" + (o.maxlength || 200) + "\">" +
        (hasValue ? esc(o.value) : "") + "</textarea>";
    } else {
      input = "<input class=\"input" + (o.num ? " input--num" : "") + "\" id=\"" + id + "\" name=\"" + o.name + "\" type=\"" + (o.type || "text") + "\"" +
        (hasValue ? " value=\"" + esc(o.value) + "\"" : "") +
        (o.placeholder ? " placeholder=\"" + esc(o.placeholder) + "\"" : "") +
        (o.inputmode ? " inputmode=\"" + o.inputmode + "\"" : "") +
        (o.maxlength ? " maxlength=\"" + o.maxlength + "\"" : "") +
        (o.list ? " list=\"" + o.list + "\"" : "") +
        " autocomplete=\"off\"" + (o.attrs ? " " + o.attrs : "") + ">";
    }
    if (o.prefix) {
      input = "<div class=\"input-group" + (o.member ? " input-group--member" : "") + "\"><span class=\"input-group__prefix\">" + esc(o.prefix) + "</span>" + input + "</div>";
    }
    return "<div class=\"field" + (o.full ? " field--full" : "") + "\"><label class=\"label\" for=\"" + id + "\">" + esc(o.label) +
      (o.optional ? "<span class=\"label__optional\">(opsional)</span>" : "") + "</label>" + input +
      (o.hint ? "<div class=\"field__hint\">" + esc(o.hint) + "</div>" : "") + "</div>";
  }

  function readForm(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) {
        return;
      }
      if (el.type === "checkbox") {
        data[el.name] = el.checked;
      } else if (el.type === "radio") {
        if (el.checked) {
          data[el.name] = el.value;
        }
      } else {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function clearFormErrors(root) {
    var box;
    qsa(".field--error", root).forEach(function (f) {
      f.classList.remove("field--error");
    });
    qsa(".field__error", root).forEach(function (n) {
      if (n.parentNode) {
        n.parentNode.removeChild(n);
      }
    });
    box = qs("[data-form-error]", root);
    if (box) {
      box.hidden = true;
      box.innerHTML = "";
    }
  }

  function showFormError(root, res) {
    var input = null;
    var field;
    var note;
    var box;
    clearFormErrors(root);
    if (res && res.field) {
      input = qs("[name=\"" + res.field + "\"]", root);
    }
    if (input) {
      field = input.closest(".field");
      if (field) {
        field.classList.add("field--error");
        note = doc.createElement("div");
        note.className = "field__error";
        note.innerHTML = ico("error", "icon-sm") + "<span>" + esc(res.error) + "</span>";
        field.appendChild(note);
      }
      input.focus();
      return;
    }
    box = qs("[data-form-error]", root);
    if (box) {
      box.hidden = false;
      box.innerHTML = ico("error", "icon-md") + "<span>" + esc(res && res.error ? res.error : MSG.errors.storageFailed) + "</span>";
    } else {
      toast(res && res.error ? res.error : MSG.errors.storageFailed, "error");
    }
  }

  function errorBox() {
    return "<div class=\"callout callout--danger\" data-form-error role=\"alert\" hidden></div>";
  }

  /* ------------------------------------------------------------------------
     7. KOMPONEN TAMPILAN KECIL
     ------------------------------------------------------------------------ */
  function emptyHtml(key, actionHtml, showDemoHint) {
    var e = MSG.emptyStates[key] || { icon: "inbox", title: "Belum ada data", text: "" };
    return "<div class=\"empty\"><div class=\"empty__icon\">" + ico(e.icon, "icon-xl") + "</div>" +
      "<div class=\"empty__title\">" + esc(e.title) + "</div><p class=\"empty__text\">" + esc(e.text) + "</p>" +
      (actionHtml ? "<div class=\"empty__action\">" + actionHtml + "</div>" : "") +
      (showDemoHint && Core.mode.isDemo() ? "<p class=\"empty__hint\">" + esc(MSG.emptyStates.demoHint) + "</p>" : "") + "</div>";
  }

  function noResultHtml() {
    return "<div class=\"empty\"><div class=\"empty__icon\">" + ico("search_off", "icon-xl") + "</div>" +
      "<div class=\"empty__title\">Tidak ada hasil</div>" +
      "<p class=\"empty__text\">Ubah kata kunci atau filter untuk melihat data lain.</p></div>";
  }

  function pageHead(title, subtitle, actions) {
    return "<div class=\"page-head\"><div><h1 class=\"page-head__title\">" + esc(title) + "</h1>" +
      (subtitle ? "<p class=\"page-head__subtitle\">" + esc(subtitle) + "</p>" : "") + "</div>" +
      (actions ? "<div class=\"page-head__actions\">" + actions + "</div>" : "") + "</div>";
  }

  function btn(o) {
    return "<button type=\"button\" class=\"btn " + (o.cls || "btn--outline") + "\" data-action=\"" + o.action + "\"" +
      (o.id ? " data-id=\"" + esc(o.id) + "\"" : "") + (o.attrs ? " " + o.attrs : "") + ">" +
      (o.icon ? ico(o.icon) : "") + esc(o.label) + "</button>";
  }

  function iconBtn(action, icon, label, id, cls) {
    return "<button type=\"button\" class=\"btn btn--icon btn--xs " + (cls || "btn--ghost") + "\" data-action=\"" + action + "\" data-id=\"" + esc(id) +
      "\" aria-label=\"" + esc(label) + "\" title=\"" + esc(label) + "\">" + ico(icon) + "</button>";
  }

  function segmented(path, items, active, extraCls) {
    return "<div class=\"segmented" + (extraCls ? " " + extraCls : "") + "\" role=\"group\">" + items.map(function (it) {
      return "<button type=\"button\" class=\"segmented__item" + (String(it.id) === String(active) ? " is-active" : "") + "\" data-action=\"set\" data-path=\"" + path +
        "\" data-value=\"" + esc(it.id) + "\" aria-pressed=\"" + (String(it.id) === String(active) ? "true" : "false") + "\">" +
        (it.icon ? ico(it.icon, "icon-fill") : "") + esc(it.label) + "</button>";
    }).join("") + "</div>";
  }

  function searchBox(id, bind, value, placeholder) {
    return "<div class=\"search\">" + ico("search") + "<input class=\"input\" id=\"" + id + "\" type=\"search\" data-bind=\"" + bind + "\" value=\"" + esc(value) +
      "\" placeholder=\"" + esc(placeholder) + "\" autocomplete=\"off\" aria-label=\"" + esc(placeholder) + "\"></div>";
  }

  function tierBadge(tierId) {
    var t = TIERS.list[tierId] || TIERS.list[TIERS.defaultTier];
    return "<span class=\"badge " + t.badgeClass + "\">" + ico(t.icon, "icon-fill") + esc(t.short) + "</span>";
  }

  function stockPill(p) {
    var cls = "stock-pill--ok";
    var text = "Stok: " + F.quantity(p.stock) + " " + p.unit;
    var icon = "";
    if (p.status === "low") {
      cls = "stock-pill--low";
      text = "Sisa " + F.quantity(p.stock) + " " + p.unit;
      icon = ico("warning");
    } else if (p.status === "out") {
      cls = "stock-pill--out";
      text = INV.outOfStockLabel;
      icon = ico("block");
    }
    return "<span class=\"stock-pill " + cls + "\">" + icon + esc(text) + "</span>";
  }

  function memberDiscountText(p) {
    if (p.memberLabel) {
      return p.memberLabel;
    }
    return "-" + p.memberDiscountPercent + "%";
  }

  function storageWarning() {
    var s = Core.status();
    if (s.persistent) {
      return "";
    }
    return "<div class=\"callout callout--warn page-banner\" role=\"alert\">" + ico("warning", "icon-md") +
      "<span>Penyimpanan permanen browser tidak tersedia. Data hanya bertahan selama halaman ini terbuka. " +
      "Gunakan Cadangan Data untuk menyimpan salinan.</span></div>";
  }

  function align(c) {
    return c.align === "right" ? " t-right" : (c.align === "center" ? " t-center" : "");
  }

  function currentShiftLabel() {
    var now = new Date();
    var mins = now.getHours() * 60 + now.getMinutes();
    var found = null;
    STF.shiftOrder.forEach(function (id) {
      var s = STF.shifts[id];
      var a = s.start.split(":");
      var b = s.end.split(":");
      var from = Number(a[0]) * 60 + Number(a[1]);
      var to = Number(b[0]) * 60 + Number(b[1]);
      if (!found && mins >= from && mins < to) {
        found = s.label;
      }
    });
    if (found) {
      return found;
    }
    return STF.shifts[STF.shiftOrder[now.getHours() < 12 ? 0 : STF.shiftOrder.length - 1]].label;
  }

  /* ------------------------------------------------------------------------
     8. KERANGKA: SIDEBAR, TOPBAR & HALAMAN LOGIN KETAT
     ------------------------------------------------------------------------ */
  function navBadge(item, badges) {
    if (item.badge === "ordersInProcess") {
      return badges.ordersInProcess > 0
        ? "<span class=\"nav-item__badge\">" + badges.ordersInProcess + "</span>" : "";
    }
    if (item.badge === "tagIcon") {
      return "<span class=\"nav-item__tail\">" + ico("sell", "icon-sm") + "</span>";
    }
    if (item.badge === "vipTag") {
      return "<span class=\"nav-item__badge nav-item__badge--member\">" + ico("star", "icon-sm icon-fill") + "VIP</span>";
    }
    return "";
  }

  function sidebarHtml() {
    var badges = Core.navigation.badges();
    return "<aside class=\"sidebar\" id=\"sidebar\" aria-label=\"Navigasi utama\">" +
      "<div class=\"brand\"><div class=\"brand__mark\">" + ico("point_of_sale", "icon-lg") + "</div>" +
      "<div class=\"brand__text\"><div class=\"brand__name\">" + esc(APP.productLine) + "</div><div class=\"brand__tag\">" + esc(APP.tagline) + "</div></div></div>" +
      "<nav class=\"sidebar__scroll\">" + NAV.groups.map(function (g) {
        return "<div class=\"nav-group\"><div class=\"nav-group__label\">" + esc(g.label) + "</div>" + g.items.map(function (it) {
          var active = it.path === UI.route;
          return "<a class=\"nav-item" + (active ? " nav-item--active" : "") + "\" href=\"#" + it.path + "\" data-action=\"nav\" title=\"" + esc(it.label) + "\"" +
            (active ? " aria-current=\"page\"" : "") + ">" + ico(it.icon, active ? "icon-fill" : "") +
            "<span class=\"nav-item__label\">" + esc(it.label) + "</span>" + navBadge(it, badges) + "</a>";
        }).join("") + "</div>";
      }).join("") + "</nav></aside>";
  }

  function notificationsHtml() {
    var list = FEAT.notifications ? Core.notifications.list() : [];
    var body;
    if (!list.length) {
      body = "<div class=\"popover__empty\">Tidak ada notifikasi baru.</div>";
    } else {
      body = list.map(function (n) {
        return "<div class=\"notif-item notif-item--" + esc(n.type) + "\"><div class=\"notif-item__icon\">" + ico(n.icon, "icon-md") + "</div>" +
          "<div><div class=\"notif-item__title\">" + esc(n.title) + "</div><div class=\"notif-item__text\">" + esc(n.text) + "</div></div></div>";
      }).join("");
    }
    return "<div class=\"popover\" role=\"region\" aria-label=\"Notifikasi\"><div class=\"popover__header\"><span>Notifikasi</span>" +
      "<span class=\"badge badge--neutral\">" + list.length + "</span></div>" + body + "</div>";
  }

  function topbarHtml() {
    var info = Core.store.get();
    var demo = Core.mode.isDemo();
    var notif = FEAT.notifications ? Core.notifications.list() : [];
    var modeBanner = demo ? HDR.banners.demo : HDR.banners.store;
    var left =
      "<button type=\"button\" class=\"topbar__toggle\" data-action=\"toggle-nav\" aria-label=\"Buka atau tutup menu\" aria-controls=\"sidebar\">" + ico("menu") + "</button>" +
      "<div><div class=\"store-title\"><span class=\"store-title__name\">" + esc(info.name) + "</span>" +
      "<button type=\"button\" class=\"btn btn--ghost btn--icon btn--xs\" data-action=\"rename-store\" aria-label=\"" + esc(HDR.renameStore.label) + "\" title=\"" + esc(HDR.renameStore.label) + "\">" +
      ico(HDR.renameStore.icon, "icon-sm") + "</button></div><div class=\"store-title__sub\">" + esc(APP.subtitle) + "</div></div>" +
      "<div class=\"topbar__chips\"><span class=\"chip " + (demo ? "chip--neutral" : "chip--primary") + "\">" + ico(modeBanner.icon, "icon-fill") + esc(modeBanner.label) + "</span>" +
      "<span class=\"chip chip--success\">" + ico(HDR.banners.pro.icon, "icon-fill") + esc(HDR.banners.pro.label) + "</span></div>";
    var right = "";
    if (demo) {
      right += "<button type=\"button\" class=\"btn btn--outline btn--sm\" data-action=\"load-demo\" title=\"" + esc(HDR.demoButtons.load.label) + "\">" +
        ico(HDR.demoButtons.load.icon) + "<span class=\"btn__label btn__label--wide\">" + esc(HDR.demoButtons.load.label) + "</span></button>";
    }
    right += "<button type=\"button\" class=\"btn btn--soft btn--sm\" data-action=\"switch-mode\" title=\"" + esc(demo ? HDR.ownStoreButton.label : HDR.ownStoreButton.activeLabel) + "\">" +
      ico(HDR.ownStoreButton.icon) + "<span class=\"btn__label btn__label--wide\">" + esc(demo ? HDR.ownStoreButton.label : HDR.ownStoreButton.activeLabel) + "</span></button>";
    if (demo) {
      right += "<button type=\"button\" class=\"btn btn--danger-ghost btn--sm\" data-action=\"reset-demo\" title=\"" + esc(HDR.demoButtons.reset.label) + "\">" +
        ico(HDR.demoButtons.reset.icon) + "<span class=\"btn__label btn__label--wide\">" + esc(HDR.demoButtons.reset.label) + "</span></button>";
    }
    if (FEAT.exportBackupJson || FEAT.importBackupJson) {
      right += "<button type=\"button\" class=\"icon-btn\" data-action=\"open-backup\" aria-label=\"Cadangan Data\" title=\"Cadangan Data\">" + ico("cloud_sync") + "</button>";
    }
    right += "<button type=\"button\" class=\"icon-btn\" data-action=\"open-pin-modal\" aria-label=\"Ubah PIN Kasir\" title=\"Ubah PIN Kasir (6 Angka)\">" + ico("key") + "</button>";
    if (FEAT.notifications) {
      right += "<div class=\"popover-anchor\"><button type=\"button\" class=\"icon-btn\" data-action=\"toggle-notif\" aria-label=\"Notifikasi\" aria-expanded=\"" + (UI.popover ? "true" : "false") + "\">" +
        ico(HDR.notificationsIcon) + (notif.length ? "<span class=\"icon-btn__dot\"></span>" : "") + "</button>" + (UI.popover ? notificationsHtml() : "") + "</div>";
    }
    right += "<div class=\"user-chip\"><div class=\"user-chip__text\"><div class=\"user-chip__name\">" + esc(info.cashier) + "</div><div class=\"user-chip__role\">" + esc(info.cashierRole) + "</div></div>" +
      "<div class=\"avatar\" aria-hidden=\"true\">" + esc(initials(info.cashier)) + "</div></div>" +
      "<button type=\"button\" class=\"btn btn--outline btn--sm\" data-action=\"logout\" title=\"Keluar / Kunci Sesi Kasir\">" +
      ico("logout") + "<span class=\"btn__label btn__label--wide\">Keluar</span></button>";
    return "<header class=\"topbar\"><div class=\"topbar__left\">" + left + "</div><div class=\"topbar__right\">" + right + "</div></header>";
  }

  /* Halaman Login Kasir & Admin (Wajib Username Admin/Staf & PIN 6 Angka). */
  function viewLogin() {
    var info = Core.store.get();
    var demo = Core.mode.isDemo();
    var staffList = Core.staff.list({ activeOnly: true });
    var staffQuickHtml = "<div class=\"field\"><span class=\"label\">Pilih Akun Terdaftar Cepat</span><div class=\"login-staff-chips\">" +
      "<button type=\"button\" class=\"login-staff-chip\" data-action=\"pick-staff-login\" data-name=\"Admin\">" +
        ico("admin_panel_settings", "icon-sm") + "Admin (Default)</button>" +
      staffList.map(function (s) {
        return "<button type=\"button\" class=\"login-staff-chip\" data-action=\"pick-staff-login\" data-name=\"" + esc(s.name) + "\">" +
          ico("badge", "icon-sm") + esc(s.name) + " (" + esc(s.roleLabel) + ")</button>";
      }).join("") + "</div></div>";

    return "<div class=\"login-shell\">" +
      "<div class=\"login-grid\">" +
        "<div class=\"login-hero\">" +
          "<div>" +
            "<div class=\"login-hero__badges\">" +
              "<span class=\"login-hero__pill\">" + ico("point_of_sale", "icon-sm") + esc(APP.productLine) + "</span>" +
              "<span class=\"login-hero__pill\">" + ico(HDR.banners.pro.icon, "icon-sm icon-fill") + esc(HDR.banners.pro.label) + "</span>" +
            "</div>" +
            "<h1 class=\"login-hero__title\">" + esc(APP.fullName) + "</h1>" +
            "<p class=\"login-hero__desc\">Kelola transaksi kasir cepat, pemotongan stok otomatis, perhitungan harga member bertingkat, dan laporan laba bersih dalam satu terminal terpadu.</p>" +
            "<div class=\"login-hero__list\">" +
              "<div class=\"login-hero__item\">" + ico("check_circle", "icon-md icon-fill") + "<span>Otomatis bedakan Harga Reguler &amp; Harga Member VIP</span></div>" +
              "<div class=\"login-hero__item\">" + ico("check_circle", "icon-md icon-fill") + "<span>Potong stok real-time &amp; cetak struk termal 58mm / 80mm</span></div>" +
              "<div class=\"login-hero__item\">" + ico("check_circle", "icon-md icon-fill") + "<span>Laporan Laba Bersih, HPP, Pengeluaran &amp; Manajemen Staf</span></div>" +
            "</div>" +
          "</div>" +
          "<div class=\"login-hero__foot\">" +
            "<span>Toko Aktif: <strong>" + esc(info.name) + "</strong> (" + esc(info.branch) + ")</span>" +
            "<span>v" + esc(APP.version) + "</span>" +
          "</div>" +
        "</div>" +
        "<div class=\"login-panel\">" +
          "<div class=\"row row--between row--wrap\" style=\"margin-bottom:16px\">" +
            "<div>" +
              "<h2 style=\"font-size:22px;font-weight:700\">Masuk Terminal Kasir</h2>" +
              "<p class=\"text-muted\" style=\"font-size:13px;margin-top:2px\">Wajib menggunakan akun terdaftar dan 6 digit angka PIN.</p>" +
            "</div>" +
            "<span class=\"chip " + (demo ? "chip--neutral" : "chip--primary") + "\">" +
              ico(demo ? HDR.banners.demo.icon : HDR.banners.store.icon, "icon-fill") +
              esc(demo ? HDR.banners.demo.label : HDR.banners.store.label) +
            "</span>" +
          "</div>" +
          "<div id=\"login-form\" class=\"stack\">" +
            errorBox() +
            "<div class=\"callout\" style=\"padding:10px 12px;font-size:12px\">" +
              ico("lock", "icon-sm") +
              "<span>Default &mdash; Username: <strong>Admin</strong> &bull; PIN (6 Angka): <strong>" + esc(getActivePin()) + "</strong></span>" +
            "</div>" +
            staffQuickHtml +
            fieldHtml({
              name: "login-username",
              label: "Username Terdaftar",
              placeholder: "mis. Admin",
              maxlength: 60,
              attrs: "autofocus",
              hint: "Nama bebas ditolak. Gunakan 'Admin' atau nama staf aktif."
            }) +
            "<div class=\"field\">" +
              "<label class=\"label\" for=\"f_login-pin\">PIN Keamanan (Wajib 6 Angka)</label>" +
              "<div class=\"pin-wrap\">" +
                "<input class=\"input\" id=\"f_login-pin\" name=\"login-pin\" type=\"" + (UI.showPin ? "text" : "password") + "\" inputmode=\"numeric\" pattern=\"[0-9]{6}\" maxlength=\"6\" data-pin-only=\"1\" oninput=\"this.value=this.value.replace(/[^0-9]/g,'').slice(0,6)\" placeholder=\"mis. 123456\" autocomplete=\"off\">" +
                "<button type=\"button\" class=\"pin-toggle\" data-action=\"toggle-pin\" aria-label=\"Tampilkan atau sembunyikan PIN\" title=\"Lihat PIN\">" +
                  ico(UI.showPin ? "visibility_off" : "visibility", "icon-md") +
                "</button>" +
              "</div>" +
              "<div class=\"field__hint\">Hanya menerima 6 digit angka (0-9). Input huruf otomatis ditolak.</div>" +
            "</div>" +
            "<button type=\"button\" class=\"btn btn--primary btn--block\" data-action=\"do-login\" style=\"min-height:44px;margin-top:4px\">" +
              ico("login") + "Masuk ke Sistem Kasir" +
            "</button>" +
            "<div class=\"divider\" style=\"margin:6px 0\"></div>" +
            "<div class=\"row row--between row--wrap\">" +
              "<button type=\"button\" class=\"btn btn--soft btn--sm\" data-action=\"switch-mode\">" +
                ico(HDR.ownStoreButton.icon) + esc(demo ? HDR.ownStoreButton.label : HDR.ownStoreButton.activeLabel) +
              "</button>" +
              (demo
                ? "<button type=\"button\" class=\"btn btn--outline btn--sm\" data-action=\"load-demo\">" +
                    ico(HDR.demoButtons.load.icon) + esc(HDR.demoButtons.load.label) +
                  "</button>"
                : "") +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>";
  }

  /* ------------------------------------------------------------------------
     9. TABEL PESANAN (dipakai Dashboard dan halaman Pesanan)
     ------------------------------------------------------------------------ */
  function orderCell(col, o) {
    switch (col.id) {
      case "number":
        return "<button type=\"button\" class=\"cell-link\" data-action=\"order-detail\" data-id=\"" + esc(o.id) + "\">" + esc(o.numberDisplay) + "</button>";
      case "customer":
        return "<div class=\"cell-title\">" + esc(o.customerName) + "</div>" +
          (o.isMember
            ? "<div class=\"cell-tier\">" + ico(o.tierIcon, "icon-fill") + esc(o.tierLabel) + "</div>"
            : "<div class=\"cell-sub\">" + esc(o.tierLabel) + "</div>");
      case "items":
        return "<div class=\"cell-items\"><div class=\"cell-items__text\" title=\"" + esc(o.itemsSummary) + "\">" + esc(o.itemsSummary) + "</div>" +
          "<div class=\"cell-sub num\">" + esc(o.timeLabel) + "</div></div>";
      case "total":
        return "<div class=\"cell-money\">" + money(o.total) + "</div><div class=\"cell-sub\">" + esc(o.paymentLabel) + "</div>";
      case "discount":
        return o.memberDiscount > 0
          ? "<span class=\"discount-pill\">-" + money(o.memberDiscount) + "</span>"
          : "<span class=\"text-faint\">-</span>";
      case "status":
        return "<span class=\"badge " + o.statusBadgeClass + "\">" + esc(o.statusLabel) + "</span>";
      case "action":
        return "<div class=\"table__actions\">" +
          (o.canPrint ? iconBtn("order-print", "print", "Cetak struk " + o.number, o.id) : "") +
          (o.canMarkPaid ? iconBtn("order-pay", "task_alt", MSG.buttons.markPaid, o.id, "btn--soft") : "") +
          (o.canVoid ? iconBtn("order-void", "cancel", MSG.buttons.void, o.id, "btn--danger-ghost") : "") + "</div>";
      default:
        return "";
    }
  }

  function ordersTable(items, colIds) {
    var cols = ORD.tableColumns.filter(function (c) {
      return colIds.indexOf(c.id) >= 0;
    });
    return "<div class=\"table-wrap\"><table class=\"table table--tall table--stack\"><thead><tr>" + cols.map(function (c) {
      return "<th scope=\"col\" class=\"" + align(c).trim() + "\">" + esc(c.label) + "</th>";
    }).join("") + "</tr></thead><tbody>" + items.map(function (o) {
      return "<tr>" + cols.map(function (c) {
        return "<td class=\"" + align(c).trim() + (c.id === "number" ? " t-nowrap" : "") + "\" data-label=\"" + esc(c.id === "action" ? "" : c.label) + "\">" + orderCell(c, o) + "</td>";
      }).join("") + "</tr>";
    }).join("") + "</tbody></table></div>";
  }

  /* ------------------------------------------------------------------------
     10. HALAMAN: DASHBOARD
     ------------------------------------------------------------------------ */
  function viewDashboard() {
    var st = Core.dashboard.stats();
    var info = st.store;
    var sess = st.session;
    var attention = st.lowStockCount + st.outOfStockCount;
    var change;
    var recent = Core.orders.query({ filter: UI.dash.filter, limit: ORD.dashboardRecentLimit });
    var hasAnyOrder = st.ordersTotal > 0;
    var html = "";

    if (st.revenueChangePercent === null) {
      change = "<span class=\"text-muted\">Belum ada pembanding kemarin</span>";
    } else {
      change = "<span class=\"badge " + (st.revenueChangePercent >= 0 ? "badge--info" : "badge--danger") + "\">" +
        ico(st.revenueChangePercent >= 0 ? "trending_up" : "trending_down") +
        (st.revenueChangePercent >= 0 ? "+" : "") + F.percent(st.revenueChangePercent, 1) + "</span><span>" + esc(DASH.cards.revenue.comparisonLabel) + "</span>";
    }

    html += storageWarning();
    html += "<section class=\"hero\" aria-label=\"Ringkasan shift\"><div class=\"hero__main\">" +
      "<div class=\"hero__meta\">" +
      (sess.openedLabel ? "<span class=\"chip chip--neutral\"><span class=\"live-dot\"></span>" + esc(sess.openedLabel) + "</span>" : "") +
      "<span class=\"chip chip--primary\">" + ico(sess.online ? "wifi" : "wifi_off") + esc(sess.onlineLabel) + "</span></div>" +
      "<div class=\"hero__store\">" + esc(info.name) + " (" + esc(info.branch) + ")</div>" +
      "<h1 class=\"hero__title\">" + esc(DASH.greeting + " " + info.cashier + ",") + "<br>" + esc(currentShiftLabel() + " " + STF.greetingSuffix) + "</h1>" +
      "<p class=\"hero__text\">" + esc(DASH.description) + "</p></div>" +
      "<div class=\"hero__actions\">" +
      (FEAT.barcodeQuickAdd
        ? "<div class=\"scan-field\">" + ico(INV.barcodeInputIcon) + "<input class=\"input\" id=\"scan-input\" type=\"text\" placeholder=\"" + esc(PH.barcode) + "\" autocomplete=\"off\" aria-label=\"" + esc(DASH.scanPlaceholderLabel) + "\"></div>"
        : "") +
      (FEAT.stockOpname ? btn({ action: "opname", icon: INV.opnameButton.icon, label: INV.opnameButton.label, cls: "btn--outline" }) : "") +
      btn({ action: "new-order", icon: ORD.newOrderButton.icon, label: stripPlus(ORD.newOrderButton.label), cls: "btn--primary" }) +
      "</div></section>";

    html += "<section class=\"grid grid--kpi\" aria-label=\"Indikator utama\">" +
      "<div class=\"kpi\"><div class=\"kpi__top\"><span class=\"kpi__label\">" + esc(DASH.cards.revenue.label) + "</span><span class=\"kpi__icon\">" + ico(DASH.cards.revenue.icon, "icon-fill") + "</span></div>" +
      "<div class=\"kpi__value num\">" + money(st.revenueToday) + "</div><div class=\"kpi__foot\">" + change + "</div></div>" +

      "<div class=\"kpi\"><div class=\"kpi__top\"><span class=\"kpi__label\">" + esc(DASH.cards.orders.label) + "</span><span class=\"kpi__icon\">" + ico(DASH.cards.orders.icon, "icon-fill") + "</span></div>" +
      "<div class=\"kpi__value num\">" + st.ordersToday + " " + esc(DASH.cards.orders.unit) + "</div><div class=\"kpi__foot\">" +
      "<span class=\"badge badge--info\">" + st.processingToday + " " + esc(DASH.cards.orders.processingSuffix) + "</span><span>" + st.paidToday + " " + esc(DASH.cards.orders.paidSuffix) + "</span></div></div>" +

      "<div class=\"kpi\"><div class=\"kpi__top\"><span class=\"kpi__label\">" + esc(DASH.cards.products.label) + "</span><span class=\"kpi__icon\">" + ico(DASH.cards.products.icon, "icon-fill") + "</span></div>" +
      "<div class=\"kpi__value num\">" + st.activeSku + " " + esc(DASH.cards.products.unit) + "</div><div class=\"kpi__foot\">" +
      (attention > 0
        ? "<span class=\"badge badge--danger\">" + ico("warning") + attention + " " + esc(DASH.cards.products.lowStockSuffix) + "</span><span>" + esc(DASH.cards.products.lowStockHint) + "</span>"
        : "<span class=\"badge badge--success\">" + ico("check_circle") + "Stok aman</span>") + "</div></div>" +

      "<div class=\"kpi\"><div class=\"kpi__top\"><span class=\"kpi__label\">" + esc(DASH.cards.members.label) + "</span><span class=\"kpi__icon kpi__icon--member\">" + ico(DASH.cards.members.icon, "icon-fill") + "</span></div>" +
      "<div class=\"kpi__value num\">" + st.memberCount + " " + esc(DASH.cards.members.unit) + "</div><div class=\"kpi__foot\">" +
      "<span class=\"badge badge--member\">" + ico("stars", "icon-fill") + st.memberTransactionsToday + " " + esc(DASH.cards.members.todaySuffix) + "</span></div></div></section>";

    html += "<div class=\"grid grid--dash\"><section class=\"card card--flush\" aria-label=\"" + esc(DASH.recentTitle) + "\">" +
      "<div class=\"card__header\"><div><div class=\"card__title\">" + esc(DASH.recentTitle) + "<span class=\"badge badge--info\">" + esc(DASH.recentLiveLabel) + "</span></div>" +
      "<div class=\"card__subtitle\">" + esc(DASH.recentSubtitle) + "</div></div>" +
      segmented("dash.filter", ORD.filters, UI.dash.filter) + "</div>";
    if (!hasAnyOrder) {
      html += emptyHtml("orders", btn({ action: "new-order", icon: ORD.newOrderButton.icon, label: stripPlus(ORD.newOrderButton.label), cls: "btn--primary" }), true);
    } else if (!recent.items.length) {
      html += noResultHtml();
    } else {
      html += ordersTable(recent.items, ["number", "customer", "items", "total", "discount"]);
    }
    html += "<div class=\"card__footer\"><a class=\"card__footer-link\" href=\"#pesanan-order\" data-action=\"nav\">" + esc(DASH.recentFooter) + ico("arrow_forward", "icon-sm") + "</a></div></section>";

    html += "<section class=\"card card--flush\" aria-label=\"" + esc(DASH.catalogTitle) + "\"><div class=\"card__header\"><div>" +
      "<div class=\"card__title\">" + esc(DASH.catalogTitle) + "<span class=\"badge badge--member\">" + esc(DASH.catalogBadge) + "</span></div>" +
      "<div class=\"card__subtitle\">" + esc(DASH.catalogSubtitle) + "</div></div></div>";
    if (!st.catalog.length) {
      html += emptyHtml("products", btn({ action: "product-add", icon: "add_box", label: stripPlus(INV.addButton.label), cls: "btn--outline" }), false);
    } else {
      html += "<div class=\"catalog-list\">" + st.catalog.map(function (p) {
        return "<div class=\"catalog-item\"><div class=\"catalog-item__head\"><div class=\"thumb\">" + ico("inventory_2", "icon-fill") + "</div>" +
          "<div class=\"catalog-item__info\"><div class=\"catalog-item__name\" title=\"" + esc(p.name) + "\">" + esc(p.name) + "</div>" +
          "<div class=\"catalog-item__meta\">" + esc(p.category) + " &bull; SKU: <span class=\"num\">" + esc(p.sku) + "</span></div></div>" + stockPill(p) + "</div>" +
          "<div class=\"catalog-item__prices\"><div class=\"price-col\"><span class=\"price-col__label\">" + esc(TIERS.priceSwitcherLabels.regular) + "</span>" +
          "<span class=\"price-col__value price-old\">" + money(p.priceRegular) + "</span></div>" +
          "<div class=\"price-col price-col--right\"><span class=\"price-col__label\">" + esc(TIERS.priceSwitcherLabels.member) + "</span>" +
          "<span class=\"price-col__value price-member\">" + money(p.priceMember) + "</span>" +
          "<span class=\"discount-pill\">" + esc(memberDiscountText(p)) + "</span></div></div></div>";
      }).join("") + "</div>";
    }
    html += "</section></div>";
    return html;
  }

  /* ------------------------------------------------------------------------
     11. HALAMAN: PESANAN
     ------------------------------------------------------------------------ */
  function viewOrders() {
    var o = UI.orders;
    var all = Core.orders.query({ limit: 1 });
    var q = Core.orders.query({ filter: o.filter, status: o.status, search: o.search, limit: ORD.pageSize, offset: (o.page - 1) * ORD.pageSize });
    var pages = Math.max(1, Math.ceil(q.total / ORD.pageSize));
    var from;
    var to;
    var statusOpts = [{ value: "all", label: "Semua status" }].concat(ORD.statusOrder.map(function (id) {
      return { value: id, label: statusOptionLabel(id) };
    }));
    var html = storageWarning();

    if (o.page > pages) {
      o.page = pages;
      q = Core.orders.query({ filter: o.filter, status: o.status, search: o.search, limit: ORD.pageSize, offset: (o.page - 1) * ORD.pageSize });
    }
    from = q.total ? q.offset + 1 : 0;
    to = q.offset + q.items.length;

    html += pageHead(navTitle("pesanan-order"), "Catat transaksi, tandai lunas, batalkan, dan cetak struk.",
      btn({ action: "new-order", icon: ORD.newOrderButton.icon, label: stripPlus(ORD.newOrderButton.label), cls: "btn--primary" }));
    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div class=\"toolbar w-full\"><div class=\"toolbar__group grow\">" +
      searchBox("orders-search", "orders.search", o.search, PH.search) +
      "<select class=\"select select--sm\" style=\"width:auto;min-width:150px\" data-bind=\"orders.status\" id=\"orders-status\" aria-label=\"Filter status\">" + optionsHtml(statusOpts, o.status) + "</select></div>" +
      segmented("orders.filter", ORD.filters, o.filter) + "</div></div>";
    if (all.total === 0) {
      html += emptyHtml("orders", btn({ action: "new-order", icon: ORD.newOrderButton.icon, label: stripPlus(ORD.newOrderButton.label), cls: "btn--primary" }), true);
    } else if (!q.items.length) {
      html += noResultHtml();
    } else {
      html += ordersTable(q.items, ORD.tableColumns.map(function (c) {
        return c.id;
      }));
      html += "<div class=\"table-foot\"><span>Menampilkan " + from + "-" + to + " dari " + q.total + " pesanan</span><div class=\"pager\">" +
        "<button type=\"button\" class=\"btn btn--outline btn--xs btn--icon\" data-action=\"page\" data-dir=\"-1\" aria-label=\"Halaman sebelumnya\"" + (o.page <= 1 ? " disabled" : "") + ">" + ico("chevron_left") + "</button>" +
        "<span class=\"num\" style=\"padding:0 8px\">" + o.page + " / " + pages + "</span>" +
        "<button type=\"button\" class=\"btn btn--outline btn--xs btn--icon\" data-action=\"page\" data-dir=\"1\" aria-label=\"Halaman berikutnya\"" + (o.page >= pages ? " disabled" : "") + ">" + ico("chevron_right") + "</button></div></div>";
    }
    html += "</section>";
    return html;
  }

  /* ------------------------------------------------------------------------
     12. HALAMAN: STOK PRODUK (Harga Reguler vs Harga Member)
     ------------------------------------------------------------------------ */
  function viewProducts() {
    var p = UI.products;
    var total = Core.products.list().length;
    var items = Core.products.list({ search: p.search, category: p.category, status: p.status });
    var cats = [{ value: "", label: "Semua kategori" }].concat(Core.products.categories().map(function (c) {
      return { value: c, label: c };
    }));
    var statusItems = [
      { id: "all", label: "Semua" },
      { id: "ok", label: INV.inStockLabel },
      { id: "low", label: INV.lowStockLabel },
      { id: "out", label: INV.outOfStockLabel }
    ];
    var html = storageWarning();
    var addBtn = btn({ action: "product-add", icon: INV.addButton.icon, label: stripPlus(INV.addButton.label), cls: "btn--primary" });

    html += pageHead(navTitle("stok-produk"), "Atur stok, Harga Reguler, dan Harga Member untuk setiap produk.",
      (FEAT.stockOpname ? btn({ action: "opname", icon: INV.opnameButton.icon, label: INV.opnameButton.label, cls: "btn--outline" }) : "") + addBtn);
    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div class=\"toolbar w-full\"><div class=\"toolbar__group grow\">" +
      searchBox("products-search", "products.search", p.search, "Cari nama, SKU, atau kategori...") +
      "<select class=\"select select--sm\" style=\"width:auto;min-width:160px\" data-bind=\"products.category\" id=\"products-category\" aria-label=\"Filter kategori\">" + optionsHtml(cats, p.category) + "</select></div>" +
      segmented("products.status", statusItems, p.status) + "</div></div>";
    if (!total) {
      html += emptyHtml("products", addBtn, true);
    } else if (!items.length) {
      html += noResultHtml();
    } else {
      html += "<div class=\"table-wrap\"><table class=\"table table--stack\"><thead><tr>" + INV.tableColumns.map(function (c) {
        return "<th scope=\"col\" class=\"" + align(c).trim() + "\">" + esc(c.label) + "</th>";
      }).join("") + "</tr></thead><tbody>" + items.map(function (it) {
        return "<tr>" +
          "<td data-label=\"" + esc(INV.tableColumns[0].label) + "\"><div class=\"product-cell\"><div class=\"thumb\">" + ico("inventory_2", "icon-fill") + "</div><div style=\"min-width:0\">" +
          "<div class=\"cell-title truncate\">" + esc(it.name) + "</div><div class=\"cell-sub\">" + esc(it.category) + (it.active ? "" : " &bull; Nonaktif") + "</div></div></div></td>" +
          "<td data-label=\"" + esc(INV.tableColumns[1].label) + "\"><span class=\"num\">" + esc(it.sku) + "</span></td>" +
          "<td class=\"t-right\" data-label=\"" + esc(INV.tableColumns[2].label) + "\">" + stockPill(it) + "</td>" +
          "<td class=\"t-right\" data-label=\"" + esc(INV.tableColumns[3].label) + "\"><span class=\"cell-money\">" + money(it.priceRegular) + "</span></td>" +
          "<td class=\"t-right\" data-label=\"" + esc(INV.tableColumns[4].label) + "\">" + (it.hasMemberPrice
            ? "<div class=\"price-member\">" + money(it.priceMember) + "</div><span class=\"discount-pill\">" + esc(memberDiscountText(it)) + "</span>"
            : "<span class=\"text-faint\">-</span>") + "</td>" +
          "<td class=\"t-center\" data-label=\"\"><div class=\"table__actions\">" +
          iconBtn("product-edit", "edit", "Ubah " + it.name, it.id) + iconBtn("product-delete", "delete", "Hapus " + it.name, it.id, "btn--danger-ghost") + "</div></td></tr>";
      }).join("") + "</tbody></table></div><div class=\"table-foot\"><span>" + items.length + " dari " + total + " produk</span></div>";
    }
    html += "</section>";
    return html;
  }

  /* ------------------------------------------------------------------------
     13. HALAMAN: MENU MEMBER
     ------------------------------------------------------------------------ */
  function viewMembers() {
    var m = UI.members;
    var all = Core.members.list();
    var items = Core.members.list({ search: m.search, tier: m.tier });
    var tierItems = [{ id: "all", label: "Semua" }].concat(Core.members.tiers().filter(function (t) {
      return t.id !== TIERS.defaultTier;
    }).map(function (t) {
      return { id: t.id, label: t.short };
    }));
    var addBtn = btn({ action: "member-add", icon: MEM.addButton.icon, label: stripPlus(MEM.addButton.label), cls: "btn--member" });
    var html = storageWarning();

    html += pageHead(navTitle("menu-member"), "Kelola pelanggan loyal. Member otomatis membayar Harga Member dan mengumpulkan poin.", addBtn);
    html += "<section class=\"grid grid--3\" aria-label=\"Ringkasan tingkat member\">" + Core.members.tiers().filter(function (t) {
      return t.id !== TIERS.defaultTier;
    }).map(function (t) {
      var count = all.filter(function (x) {
        return x.tier === t.id;
      }).length;
      return "<div class=\"card card--pad-md\"><div class=\"row row--md\"><div class=\"thumb thumb--member\">" + ico(t.icon, "icon-fill") + "</div>" +
        "<div class=\"grow\"><div class=\"cell-title\">" + esc(t.label) + "</div><div class=\"cell-sub\">" + t.pointsRate + " poin per Rp 1.000 belanja</div></div>" +
        "<div class=\"text-headline-md num\">" + count + "</div></div></div>";
    }).join("") + "</section>";

    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div class=\"toolbar w-full\"><div class=\"toolbar__group grow\">" +
      searchBox("members-search", "members.search", m.search, "Cari nama atau nomor HP...") + "</div>" +
      segmented("members.tier", tierItems, m.tier, "segmented--member") + "</div></div>";
    if (!all.length) {
      html += emptyHtml("members", addBtn, true);
    } else if (!items.length) {
      html += noResultHtml();
    } else {
      html += "<div class=\"table-wrap\"><table class=\"table table--stack\"><thead><tr>" + MEM.tableColumns.map(function (c) {
        return "<th scope=\"col\" class=\"" + align(c).trim() + "\">" + esc(c.label) + "</th>";
      }).join("") + "</tr></thead><tbody>" + items.map(function (it) {
        return "<tr>" +
          "<td data-label=\"" + esc(MEM.tableColumns[0].label) + "\"><div class=\"person\"><div class=\"avatar avatar--sm avatar--member\">" + esc(initials(it.name)) + "</div><div class=\"cell-title truncate\">" + esc(it.name) + "</div></div></td>" +
          "<td data-label=\"" + esc(MEM.tableColumns[1].label) + "\"><span class=\"num\">" + (it.phone ? esc(it.phone) : "<span class=\"text-faint\">-</span>") + "</span></td>" +
          "<td class=\"t-center\" data-label=\"" + esc(MEM.tableColumns[2].label) + "\">" + tierBadge(it.tier) + "</td>" +
          "<td class=\"t-right\" data-label=\"" + esc(MEM.tableColumns[3].label) + "\"><span class=\"cell-money\">" + F.number(it.points) + "</span></td>" +
          "<td class=\"t-right\" data-label=\"" + esc(MEM.tableColumns[4].label) + "\"><span class=\"cell-money\">" + money(it.totalSpent) + "</span><div class=\"cell-sub\">" + it.orderCount + " pesanan</div></td>" +
          "<td class=\"t-center\" data-label=\"\"><div class=\"table__actions\">" +
          iconBtn("member-edit", "edit", "Ubah " + it.name, it.id) + iconBtn("member-delete", "delete", "Hapus " + it.name, it.id, "btn--danger-ghost") + "</div></td></tr>";
      }).join("") + "</tbody></table></div><div class=\"table-foot\"><span>" + items.length + " dari " + all.length + " member</span></div>";
    }
    html += "</section>";
    return html;
  }

  /* ------------------------------------------------------------------------
     14. HALAMAN: LAPORAN LABA
     ------------------------------------------------------------------------ */
  function viewReports() {
    var sum = Core.reports.summary(UI.reports.period);
    var C = REP.cards;
    var days = sum.daily.slice(-31);
    var max = 1;
    var html = storageWarning();

    days.forEach(function (d) {
      if (d.revenue > max) {
        max = d.revenue;
      }
    });
    function pct(v) {
      return Math.max(0, Math.min(100, Math.round((v / max) * 100)));
    }

    html += pageHead(navTitle("laporan-laba"), "Omzet, modal, pengeluaran, dan laba bersih dari pesanan berstatus Lunas.",
      segmented("reports.period", REP.periods, UI.reports.period));

    if (!sum.hasData) {
      return html + "<section class=\"card\">" + emptyHtml("reports", btn({ action: "new-order", icon: ORD.newOrderButton.icon, label: stripPlus(ORD.newOrderButton.label), cls: "btn--primary" }), true) + "</section>";
    }

    html += "<section class=\"metric-grid\" aria-label=\"Ringkasan laba\">" +
      "<div class=\"metric metric--hero\"><div class=\"metric__label\">" + esc(C.revenue) + "</div><div class=\"metric__value\">" + money(sum.revenue) + "</div><div class=\"metric__sub\">" + sum.orderCount + " pesanan lunas, rata-rata " + money(sum.averageOrderValue) + "</div></div>" +
      "<div class=\"metric\"><div class=\"metric__label\">" + esc(C.cogs) + "</div><div class=\"metric__value\">" + money(sum.cogs) + "</div><div class=\"metric__sub\">Harga modal barang yang terjual</div></div>" +
      "<div class=\"metric" + (sum.grossProfit < 0 ? " metric--negative" : " metric--positive") + "\"><div class=\"metric__label\">" + esc(C.grossProfit) + "</div><div class=\"metric__value\">" + money(sum.grossProfit) + "</div><div class=\"metric__sub\">Margin kotor " + F.percent(sum.grossMarginPercent, 1) + "</div></div>" +
      "<div class=\"metric\"><div class=\"metric__label\">" + esc(C.expenses) + "</div><div class=\"metric__value\">" + money(sum.expenses) + "</div><div class=\"metric__sub\">Biaya operasional periode ini</div></div>" +
      "<div class=\"metric" + (sum.netProfit < 0 ? " metric--negative" : " metric--positive") + "\"><div class=\"metric__label\">" + esc(C.netProfit) + "</div><div class=\"metric__value\">" + money(sum.netProfit) + "</div><div class=\"metric__sub\">Laba kotor dikurangi pengeluaran</div></div>" +
      "<div class=\"metric\"><div class=\"metric__label\">" + esc(C.margin) + "</div><div class=\"metric__value\">" + F.percent(sum.marginPercent, 1) + "</div><div class=\"metric__sub\">Hemat member diberikan " + money(sum.memberDiscountTotal) + "</div></div></section>";

    html += "<div class=\"grid grid--dash\"><section class=\"card card--flush\"><div class=\"card__header\"><div><div class=\"card__title\">Tren Harian</div>" +
      "<div class=\"card__subtitle\">Omzet dan laba bersih per hari</div></div></div>" +
      "<div class=\"bar-chart\" role=\"img\" aria-label=\"Grafik batang omzet dan laba bersih harian\">" + days.map(function (d) {
        var label = d.date.slice(8, 10) + "/" + d.date.slice(5, 7);
        return "<div class=\"bar-chart__col\" title=\"" + esc(label + ": omzet " + money(d.revenue) + ", laba bersih " + money(d.net)) + "\"><div class=\"bar-chart__track\">" +
          "<div class=\"bar-chart__fill\" style=\"--h:" + pct(d.revenue) + "%\"></div>" +
          "<div class=\"bar-chart__fill bar-chart__fill--profit\" style=\"--h:" + pct(Math.max(0, d.net)) + "%\"></div></div>" +
          "<div class=\"bar-chart__label\">" + esc(label) + "</div></div>";
      }).join("") + "</div><div class=\"legend\"><span class=\"legend__item\"><span class=\"legend__swatch\"></span>Omzet</span>" +
      "<span class=\"legend__item\"><span class=\"legend__swatch legend__swatch--profit\"></span>Laba bersih</span></div></section>";

    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div><div class=\"card__title\">" + esc(REP.topProductsTitle) + "</div>" +
      "<div class=\"card__subtitle\">Berdasarkan jumlah terjual</div></div></div>";
    if (!sum.topProducts.length) {
      html += "<div class=\"popover__empty\">Belum ada penjualan lunas.</div>";
    } else {
      var topMax = sum.topProducts[0].qty || 1;
      html += "<div class=\"rank-list\">" + sum.topProducts.map(function (t, i) {
        return "<div class=\"rank-item\"><div class=\"rank-item__no\">" + (i + 1) + "</div><div class=\"grow\"><div class=\"row row--between\"><span class=\"cell-title truncate\">" + esc(t.name) + "</span>" +
          "<span class=\"cell-money\">" + money(t.revenue) + "</span></div><div class=\"cell-sub\">" + F.quantity(t.qty) + " " + esc(t.unit || INV.stockUnit) + " terjual, laba " + money(t.profit) + "</div>" +
          "<div class=\"progress mt-sm\"><div class=\"progress__bar\" style=\"--w:" + Math.round((t.qty / topMax) * 100) + "%\"></div></div></div></div>";
      }).join("") + "</div>";
    }
    html += "</section></div>";

    html += "<div class=\"grid grid--2\"><section class=\"card card--flush\"><div class=\"card__header\"><div><div class=\"card__title\">Metode Pembayaran</div>" +
      "<div class=\"card__subtitle\">Porsi omzet berdasarkan cara bayar</div></div></div><div class=\"card__body stack\">" + sum.byPayment.map(function (b) {
        var share = sum.revenue > 0 ? Math.round((b.total / sum.revenue) * 100) : 0;
        return "<div><div class=\"row row--between\"><span class=\"cell-title\">" + esc(b.label) + " <span class=\"cell-sub\">" + b.count + " transaksi</span></span><span class=\"cell-money\">" + money(b.total) + "</span></div>" +
          "<div class=\"progress mt-sm\"><div class=\"progress__bar progress__bar--member\" style=\"--w:" + share + "%\"></div></div></div>";
      }).join("") + "</div></section>";

    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div><div class=\"card__title\">Pengeluaran per Kategori</div>" +
      "<div class=\"card__subtitle\">Ke mana biaya operasional terpakai</div></div></div>";
    if (!sum.expensesByCategory.length) {
      html += "<div class=\"popover__empty\">Belum ada pengeluaran pada periode ini.</div>";
    } else {
      html += "<div class=\"card__body stack\">" + sum.expensesByCategory.map(function (e) {
        var share = sum.expenses > 0 ? Math.round((e.total / sum.expenses) * 100) : 0;
        return "<div><div class=\"row row--between\"><span class=\"cell-title\">" + esc(e.category) + "</span><span class=\"cell-money\">" + money(e.total) + "</span></div>" +
          "<div class=\"progress mt-sm\"><div class=\"progress__bar\" style=\"--w:" + share + "%\"></div></div></div>";
      }).join("") + "</div>";
    }
    html += "</section></div>";
    return html;
  }

  /* ------------------------------------------------------------------------
     15. HALAMAN: PENGELUARAN
     ------------------------------------------------------------------------ */
  function viewExpenses() {
    var e = UI.expenses;
    var allCount = Core.expenses.list().length;
    var items = Core.expenses.list({ search: e.search, category: e.category, period: e.period });
    var sum = 0;
    var cats = [{ value: "", label: "Semua kategori" }].concat(Core.expenses.categories().map(function (c) {
      return { value: c, label: c };
    }));
    var addBtn = btn({ action: "expense-add", icon: EXP.addButton.icon, label: stripPlus(EXP.addButton.label), cls: "btn--primary" });
    var html = storageWarning();

    items.forEach(function (x) {
      sum += x.amount;
    });
    html += pageHead(navTitle("pengeluaran"), "Catat biaya operasional agar laba bersih akurat.", addBtn);
    html += "<section class=\"grid grid--2\"><div class=\"metric\"><div class=\"metric__label\">Total pengeluaran (sesuai filter)</div><div class=\"metric__value\">" + money(sum) + "</div></div>" +
      "<div class=\"metric\"><div class=\"metric__label\">Jumlah catatan</div><div class=\"metric__value\">" + items.length + "</div></div></section>";
    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div class=\"toolbar w-full\"><div class=\"toolbar__group grow\">" +
      searchBox("expenses-search", "expenses.search", e.search, "Cari keterangan atau kategori...") +
      "<select class=\"select select--sm\" style=\"width:auto;min-width:160px\" data-bind=\"expenses.category\" id=\"expenses-category\" aria-label=\"Filter kategori\">" + optionsHtml(cats, e.category) + "</select></div>" +
      segmented("expenses.period", REP.periods, e.period) + "</div></div>";
    if (!allCount) {
      html += emptyHtml("expenses", addBtn, true);
    } else if (!items.length) {
      html += noResultHtml();
    } else {
      html += "<div class=\"table-wrap\"><table class=\"table table--stack\"><thead><tr>" + EXP.tableColumns.map(function (c) {
        return "<th scope=\"col\" class=\"" + align(c).trim() + "\">" + esc(c.label) + "</th>";
      }).join("") + "</tr></thead><tbody>" + items.map(function (it) {
        return "<tr><td data-label=\"" + esc(EXP.tableColumns[0].label) + "\"><span class=\"num t-nowrap\">" + esc(it.dateLabel) + "</span></td>" +
          "<td data-label=\"" + esc(EXP.tableColumns[1].label) + "\"><div class=\"cell-title\">" + esc(it.title) + "</div>" + (it.note ? "<div class=\"cell-sub\">" + esc(it.note) + "</div>" : "") + "</td>" +
          "<td class=\"t-center\" data-label=\"" + esc(EXP.tableColumns[2].label) + "\"><span class=\"badge badge--neutral\">" + esc(it.category) + "</span></td>" +
          "<td class=\"t-right\" data-label=\"" + esc(EXP.tableColumns[3].label) + "\"><span class=\"cell-money\">" + money(it.amount) + "</span></td>" +
          "<td class=\"t-center\" data-label=\"\"><div class=\"table__actions\">" + iconBtn("expense-edit", "edit", "Ubah " + it.title, it.id) +
          iconBtn("expense-delete", "delete", "Hapus " + it.title, it.id, "btn--danger-ghost") + "</div></td></tr>";
      }).join("") + "</tbody></table></div>";
    }
    html += "</section>";
    return html;
  }
  /* ------------------------------------------------------------------------
     16. HALAMAN: STAF & KASIR
     ------------------------------------------------------------------------ */
  function viewStaff() {
    var s = UI.staff;
    var all = Core.staff.list();
    var items = Core.staff.list({ search: s.search });
    var info = Core.store.get();
    var addBtn = btn({ action: "staff-add", icon: STF.addButton.icon, label: stripPlus(STF.addButton.label), cls: "btn--primary" });
    var html = storageWarning();

    html += pageHead(navTitle("staf-kasir"), "Kasir aktif saat ini: " + info.cashier + " (" + info.cashierRole + "). Nama staf aktif juga dapat dipakai login.",
      btn({ action: "open-pin-modal", icon: "key", label: "Ubah PIN 6 Angka", cls: "btn--outline" }) + addBtn);
    html += "<section class=\"card card--flush\"><div class=\"card__header\"><div class=\"toolbar w-full\"><div class=\"toolbar__group grow\">" +
      searchBox("staff-search", "staff.search", s.search, "Cari nama staf...") + "</div></div></div>";
    if (!all.length) {
      html += emptyHtml("staff", addBtn, true);
    } else if (!items.length) {
      html += noResultHtml();
    } else {
      html += "<div class=\"table-wrap\"><table class=\"table table--stack\"><thead><tr>" + STF.tableColumns.map(function (c) {
        return "<th scope=\"col\" class=\"" + align(c).trim() + "\">" + esc(c.label) + "</th>";
      }).join("") + "</tr></thead><tbody>" + items.map(function (it) {
        return "<tr><td data-label=\"" + esc(STF.tableColumns[0].label) + "\"><div class=\"person\"><div class=\"avatar avatar--sm\">" + esc(initials(it.name)) + "</div><div><div class=\"cell-title\">" + esc(it.name) + "</div>" +
          (it.phone ? "<div class=\"cell-sub num\">" + esc(it.phone) + "</div>" : "") + "</div>" +
          (it.isCurrentCashier ? "<span class=\"badge badge--success\">" + ico("point_of_sale") + "Kasir aktif</span>" : "") + "</div></td>" +
          "<td data-label=\"" + esc(STF.tableColumns[1].label) + "\">" + esc(it.roleLabel) + "</td>" +
          "<td class=\"t-center\" data-label=\"" + esc(STF.tableColumns[2].label) + "\"><div>" + esc(it.shiftLabel) + "</div><div class=\"cell-sub num\">" + esc(it.shiftTime) + "</div></td>" +
          "<td class=\"t-center\" data-label=\"" + esc(STF.tableColumns[3].label) + "\"><span class=\"badge " + (it.active ? "badge--success" : "badge--neutral") + "\">" + esc(it.statusLabel) + "</span></td>" +
          "<td class=\"t-center\" data-label=\"\"><div class=\"table__actions\">" +
          (it.active && !it.isCurrentCashier ? iconBtn("staff-activate", "how_to_reg", "Jadikan kasir aktif", it.id, "btn--soft") : "") +
          iconBtn("staff-edit", "edit", "Ubah " + it.name, it.id) + iconBtn("staff-delete", "delete", "Hapus " + it.name, it.id, "btn--danger-ghost") + "</div></td></tr>";
      }).join("") + "</tbody></table></div>";
    }
    html += "</section>";
    return html;
  }

  /* ------------------------------------------------------------------------
     17. RENDER UTAMA
     ------------------------------------------------------------------------ */
  var VIEWS = {
    "login": viewLogin,
    "dashboard": viewDashboard,
    "pesanan-order": viewOrders,
    "stok-produk": viewProducts,
    "menu-member": viewMembers,
    "laporan-laba": viewReports,
    "pengeluaran": viewExpenses,
    "staf-kasir": viewStaff
  };

  function viewHtml() {
    var fn = VIEWS[UI.route] || viewDashboard;
    try {
      return fn();
    } catch (e) {
      return "<div class=\"callout callout--danger\" role=\"alert\">" + ico("error", "icon-md") + "<span>Halaman gagal ditampilkan: " + esc(e && e.message ? e.message : e) + "</span></div>";
    }
  }

  function keepFocus(fn) {
    var a = doc.activeElement;
    var id = a && a.id ? a.id : "";
    var s = null;
    var e = null;
    var n;
    if (id) {
      try {
        s = a.selectionStart;
        e = a.selectionEnd;
      } catch (x) {
        s = null;
      }
    }
    fn();
    if (id) {
      n = doc.getElementById(id);
      if (n && n !== doc.activeElement) {
        n.focus();
        try {
          if (s !== null && s !== undefined) {
            n.setSelectionRange(s, e);
          }
        } catch (x2) {
          /* diabaikan */
        }
      }
    }
  }

  function shellHtml() {
    var currentCashier = Core.store.get().cashier;
    if (!UI.loggedIn || UI.route === "login" || !matchValidAccount(currentCashier)) {
      if (UI.loggedIn && !matchValidAccount(currentCashier)) {
        saveAuthSession(false);
      }
      return viewLogin();
    }
    return "<a class=\"skip-link\" href=\"#main\" data-action=\"skip\">Lewati ke konten</a>" +
      "<div class=\"app" + (UI.collapsed ? " is-collapsed" : "") + (UI.drawer ? " is-drawer-open" : "") + "\">" +
      sidebarHtml() + (UI.drawer ? "<div class=\"scrim\" data-action=\"close-drawer\"></div>" : "") + topbarHtml() +
      "<main class=\"app__main\" id=\"main\" tabindex=\"-1\"><div class=\"page\" id=\"view\">" + viewHtml() + "</div></main></div>";
  }

  function updateTitle() {
    var pageName = (!UI.loggedIn || UI.route === "login") ? "Login Kasir" : navTitle(UI.route);
    doc.title = pageName + " - " + Core.store.get().name + " | " + APP.name;
  }

  function renderApp() {
    var root = ensureHost("app");
    keepFocus(function () {
      root.innerHTML = shellHtml();
    });
    updateTitle();
  }

  function renderView() {
    var v = qs("#view");
    if (!v || !UI.loggedIn || UI.route === "login") {
      renderApp();
      return;
    }
    keepFocus(function () {
      v.innerHTML = viewHtml();
    });
  }

  var renderQueued = false;

  function queueRender() {
    if (renderQueued) {
      return;
    }
    renderQueued = true;
    var run = function () {
      renderQueued = false;
      renderApp();
    };
    if (typeof global.requestAnimationFrame === "function") {
      global.requestAnimationFrame(run);
    } else {
      global.setTimeout(run, 16);
    }
  }

  /* ------------------------------------------------------------------------
     18. STRUK: pratinjau dan cetak
     ------------------------------------------------------------------------ */
  function printReceipt(id, width) {
    var r = Core.receipt.build(id, { paperWidthMm: width });
    var win = null;
    var frame;
    var d;
    var html;
    if (!r.ok) {
      toast(r.error, "error");
      return;
    }
    try {
      win = global.open("", "_blank", "width=420,height=680");
    } catch (e) {
      win = null;
    }
    if (win && win.document) {
      win.document.open();
      win.document.write(r.data.html);
      win.document.close();
      return;
    }
    html = r.data.html.replace(/<script>[\s\S]*?<\/script>/, "");
    frame = doc.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    doc.body.appendChild(frame);
    d = frame.contentWindow.document;
    d.open();
    d.write(html);
    d.close();
    global.setTimeout(function () {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (e2) {
        toast("Browser memblokir pencetakan.", "error");
      }
      global.setTimeout(function () {
        if (frame.parentNode) {
          frame.parentNode.removeChild(frame);
        }
      }, 2000);
    }, 300);
  }

  function openReceiptModal(id) {
    var order = Core.orders.get(id);
    var width = UI.paperWidth;
    if (!order) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    function previewHtml() {
      var r = Core.receipt.build(id, { paperWidthMm: width });
      return r.ok
        ? "<div class=\"receipt-wrap\"><pre class=\"receipt-preview\" id=\"receipt-pre\">" + esc(r.data.text) + "</pre></div>"
        : "<div class=\"callout callout--danger\">" + esc(r.error) + "</div>";
    }
    function paperButtons() {
      return RCP.paperWidthOptions.map(function (w) {
        return "<button type=\"button\" class=\"segmented__item" + (w === width ? " is-active" : "") + "\" data-m-action=\"paper\" data-value=\"" + w + "\">" + w + " mm</button>";
      }).join("");
    }
    openModal({
      size: "sm",
      title: RCP.windowTitle,
      subtitle: order.numberDisplay + " - " + order.customerName,
      body: "<div class=\"stack\"><div class=\"row row--between row--wrap\"><span class=\"label\">Lebar kertas</span><div class=\"segmented\" id=\"paper-switch\">" + paperButtons() + "</div></div>" +
        "<div id=\"receipt-box\">" + previewHtml() + "</div></div>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.close) + "</button>" +
        "<button type=\"button\" class=\"btn btn--primary\" data-m-action=\"print\">" + ico(RCP.buttonIcon) + "Cetak Struk</button>",
      onClick: function (a, ev, api) {
        var act = a.getAttribute("data-m-action");
        if (act === "paper") {
          width = Number(a.getAttribute("data-value")) || RCP.paperWidthMm;
          UI.paperWidth = width;
          api.qs("#paper-switch").innerHTML = paperButtons();
          api.qs("#receipt-box").innerHTML = previewHtml();
        } else if (act === "print") {
          printReceipt(id, width);
        }
      }
    });
  }

  /* ------------------------------------------------------------------------
     19. DIALOG: DETAIL PESANAN, BAYAR, BATAL
     ------------------------------------------------------------------------ */
  function openOrderDetail(id) {
    var o = Core.orders.get(id);
    var body;
    var footer;
    if (!o) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    body = "<div class=\"stack\"><div class=\"grid grid--2\" style=\"gap:12px\">" +
      "<div class=\"kv\"><span class=\"kv__label\">Pelanggan</span><span class=\"kv__value\">" + esc(o.customerName) + "</span>" +
      (o.isMember ? "<span class=\"cell-tier\">" + ico(o.tierIcon, "icon-fill") + esc(o.tierLabel) + "</span>" : "<span class=\"cell-sub\">" + esc(o.tierLabel) + "</span>") + "</div>" +
      "<div class=\"kv\"><span class=\"kv__label\">Waktu</span><span class=\"kv__value num\">" + esc(o.dateLabel) + "</span><span class=\"cell-sub num\">" + esc(o.timeLabel) + "</span></div>" +
      "<div class=\"kv\"><span class=\"kv__label\">Pembayaran</span><span class=\"kv__value\">" + esc(o.paymentLabel) + "</span></div>" +
      "<div class=\"kv\"><span class=\"kv__label\">Status</span><span><span class=\"badge " + o.statusBadgeClass + "\">" + esc(o.statusLabel) + "</span></span></div>" +
      "<div class=\"kv\"><span class=\"kv__label\">Kasir</span><span class=\"kv__value\">" + esc(o.cashier || "-") + "</span></div>" +
      (o.isMember && o.pointsAwarded > 0 ? "<div class=\"kv\"><span class=\"kv__label\">Poin didapat</span><span class=\"kv__value text-member\">+" + F.number(o.pointsAwarded) + "</span></div>" : "") +
      "</div><div class=\"card card--flush\"><div class=\"table-wrap\"><table class=\"table table--tall\" style=\"min-width:480px\"><thead><tr><th>Produk</th><th class=\"t-right\">Qty</th><th class=\"t-right\">Harga</th><th class=\"t-right\">Subtotal</th></tr></thead><tbody>" +
      o.items.map(function (it) {
        return "<tr><td><div class=\"cell-title\">" + esc(it.name) + "</div><div class=\"cell-sub num\">" + esc(it.sku) + "</div></td><td class=\"t-right num\">" + F.quantity(it.qty) + "</td>" +
          "<td class=\"t-right num\">" + (it.unitPrice < it.regularPrice ? "<div class=\"price-old\">" + money(it.regularPrice) + "</div>" : "") + "<div class=\"" + (it.unitPrice < it.regularPrice ? "price-member" : "") + "\">" + money(it.unitPrice) + "</div></td>" +
          "<td class=\"t-right cell-money\">" + money(Math.round(it.unitPrice * it.qty)) + "</td></tr>";
      }).join("") + "</tbody></table></div></div>" +
      "<div class=\"totals\"><div class=\"totals__row\"><span>Subtotal</span><span>" + money(o.subtotalRegular) + "</span></div>" +
      (o.memberDiscount > 0 ? "<div class=\"totals__row totals__row--saving\"><span>Hemat Member</span><span>-" + money(o.memberDiscount) + "</span></div>" : "") +
      "<div class=\"totals__row totals__row--grand\"><span>Total</span><span>" + money(o.total) + "</span></div>" +
      (o.cashPaid !== null && o.cashPaid !== undefined ? "<div class=\"totals__row\"><span>Tunai diterima</span><span>" + money(o.cashPaid) + "</span></div><div class=\"totals__row\"><span>Kembalian</span><span>" + money(o.change) + "</span></div>" : "") +
      "</div>" + (o.note ? "<div class=\"callout\">" + ico("sticky_note_2", "icon-md") + "<span>" + esc(o.note) + "</span></div>" : "") + "</div>";
    footer = (o.canVoid ? "<button type=\"button\" class=\"btn btn--danger-ghost\" data-m-action=\"void\">" + ico("cancel") + esc(MSG.buttons.void) + "</button>" : "<span></span>") +
      "<div class=\"row\"><button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.close) + "</button>" +
      (o.canPrint ? "<button type=\"button\" class=\"btn btn--outline\" data-m-action=\"print\">" + ico(RCP.buttonIcon) + esc(RCP.buttonLabel) + "</button>" : "") +
      (o.canMarkPaid ? "<button type=\"button\" class=\"btn btn--primary\" data-m-action=\"pay\">" + ico("task_alt") + esc(MSG.buttons.markPaid) + "</button>" : "") + "</div>";
    openModal({
      size: "lg",
      title: "Pesanan " + o.numberDisplay,
      subtitle: o.customerName,
      body: body,
      footer: footer,
      footerBetween: true,
      onClick: function (a, ev, api) {
        var act = a.getAttribute("data-m-action");
        if (act === "print") {
          openReceiptModal(id);
        } else if (act === "pay") {
          api.close();
          payOrder(id);
        } else if (act === "void") {
          api.close();
          voidOrder(id);
        }
      }
    });
  }

  function payOrder(id) {
    var o = Core.orders.get(id);
    if (!o) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    if (o.payment !== "cash") {
      confirmDialog({
        title: "Tandai pesanan Lunas?",
        text: o.numberDisplay + " (" + o.paymentLabel + ") sebesar " + money(o.total) + " akan ditandai Lunas.",
        confirmLabel: MSG.buttons.markPaid,
        icon: "task_alt"
      }).then(function (yes) {
        if (yes) {
          notify(Core.orders.markPaid(id), MSG.success.orderPaid);
        }
      });
      return;
    }
    openModal({
      size: "sm",
      title: "Terima pembayaran tunai",
      subtitle: o.numberDisplay + " - total " + money(o.total),
      body: "<form id=\"cash-form\" novalidate><div class=\"stack\">" + errorBox() +
        fieldHtml({ name: "cashPaid", label: "Uang diterima", prefix: "Rp", num: true, inputmode: "numeric", placeholder: PH.order.cashPaid, optional: true, hint: "Kosongkan jika uang pas." }) +
        "<div class=\"totals__row\"><span>Kembalian</span><strong id=\"cash-change\">" + money(0) + "</strong></div></div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"cash-form\" class=\"btn btn--primary\">" + ico("task_alt") + esc(MSG.buttons.markPaid) + "</button>",
      onInput: function (el, ev, api) {
        var v;
        if (el.name === "cashPaid") {
          v = digitsNum(el.value);
          api.qs("#cash-change").textContent = money(v > o.total ? v - o.total : 0);
        }
      },
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var res = Core.orders.markPaid(id, { cashPaid: data.cashPaid });
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        notify(res, MSG.success.orderPaid);
      }
    });
  }

  function voidOrder(id) {
    var o = Core.orders.get(id);
    if (!o) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    confirmDialog({
      title: MSG.confirm.voidTitle,
      text: o.numberDisplay + ": " + MSG.confirm.voidText,
      confirmLabel: MSG.buttons.void,
      tone: "danger",
      icon: "cancel"
    }).then(function (yes) {
      if (yes) {
        notify(Core.orders.void(id), MSG.success.orderVoided);
      }
    });
  }

  /* ------------------------------------------------------------------------
     20. DIALOG: PESANAN BARU (kasir)
     ------------------------------------------------------------------------ */
  function openOrderModal(opts) {
    var options = opts || {};
    var cart = [];
    var members = Core.members.list({ activeOnly: true });
    var S = { memberId: "", search: "", payment: ORD.defaultPayment, status: "paid", cash: "" };

    if (options.addProductId) {
      cart.push({ productId: options.addProductId, qty: 1 });
    }

    function currentMember() {
      var i;
      for (i = 0; i < members.length; i += 1) {
        if (members[i].id === S.memberId) {
          return members[i];
        }
      }
      return null;
    }

    function usesMemberPrice() {
      var m = currentMember();
      return !!(m && FEAT.memberPricing && TIERS.list[m.tier] && TIERS.list[m.tier].usesMemberPrice);
    }

    function unitPriceFor(p) {
      return usesMemberPrice() && p.hasMemberPrice ? p.priceMember : p.priceRegular;
    }

    function cartIndex(id) {
      var i;
      for (i = 0; i < cart.length; i += 1) {
        if (cart[i].productId === id) {
          return i;
        }
      }
      return -1;
    }

    function addToCart(id) {
      var i = cartIndex(id);
      if (i >= 0) {
        cart[i].qty = Math.round((cart[i].qty + 1) * 1000) / 1000;
      } else {
        cart.push({ productId: id, qty: 1 });
      }
    }

    function payload() {
      return {
        memberId: S.memberId || null,
        payment: S.payment,
        status: S.status,
        items: cart.map(function (c) {
          return { productId: c.productId, qty: c.qty };
        })
      };
    }

    function paymentChoices() {
      return ORD.paymentOrder.map(function (id) {
        var pm = ORD.paymentMethods[id];
        return "<label class=\"choice" + (S.payment === id ? " is-active" : "") + "\"><input type=\"radio\" name=\"payment\" value=\"" + id + "\"" + (S.payment === id ? " checked" : "") + ">" +
          ico(pm.icon, "icon-md") + esc(pm.label) + "</label>";
      }).join("");
    }

    var body =
      "<form id=\"order-form\" novalidate><div class=\"pos\">" +
      "<div class=\"pos__products\"><div class=\"search\">" + ico("search") + "<input class=\"input\" id=\"pos-search\" type=\"search\" placeholder=\"Cari produk atau scan SKU lalu Enter...\" autocomplete=\"off\" aria-label=\"Cari produk\"></div>" +
      "<div class=\"product-grid\" id=\"pos-products\"></div></div>" +
      "<div class=\"pos__cart\">" + errorBox() +
      "<div class=\"field\"><label class=\"label\" for=\"pos-member\">Pelanggan</label><select class=\"select\" id=\"pos-member\" name=\"memberId\">" +
      optionsHtml([{ value: "", label: ORD.walkInCustomerLabel + " (Harga Reguler)" }].concat(members.map(function (m) {
        return { value: m.id, label: m.name + " - " + m.tierShort };
      })), "") + "</select></div><div id=\"pos-member-hint\"></div>" +
      "<div id=\"pos-cart\"></div>" +
      "<div class=\"field\"><span class=\"label\">Metode bayar</span><div class=\"choice-grid\" id=\"pos-payment\">" + paymentChoices() + "</div></div>" +
      "<div class=\"field\"><span class=\"label\">Status pembayaran</span><div class=\"choice-grid\" style=\"grid-template-columns:repeat(2,minmax(0,1fr))\" id=\"pos-status\">" +
      "<label class=\"choice is-active\"><input type=\"radio\" name=\"status\" value=\"paid\" checked>" + ico("task_alt", "icon-md") + "Bayar sekarang (Lunas)</label>" +
      "<label class=\"choice\"><input type=\"radio\" name=\"status\" value=\"processing\">" + ico("pending_actions", "icon-md") + "Simpan sebagai Diproses</label></div></div>" +
      "<div id=\"pos-cash\"></div>" +
      fieldHtml({ name: "note", label: "Catatan", optional: true, placeholder: PH.order.note, maxlength: 200 }) +
      "</div></div></form>";

    var modal = openModal({
      size: "xl",
      title: "Catat Pesanan Baru",
      subtitle: "Pilih produk, pilih member bila ada, lalu simpan. Stok berkurang otomatis.",
      body: body,
      footer: "<div class=\"grow\"><span class=\"cell-sub\">Total bayar</span><div class=\"text-headline-md num\" id=\"pos-footer-total\">" + money(0) + "</div></div>" +
        "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"order-form\" class=\"btn btn--primary\" id=\"pos-submit\" disabled>" + ico("save") + "Simpan Pesanan</button>",
      onClick: function (a, ev, api) {
        var act = a.getAttribute("data-m-action");
        var id = a.getAttribute("data-id");
        var i;
        if (act === "add") {
          addToCart(id);
          refresh();
        } else if (act === "inc" || act === "dec") {
          i = cartIndex(id);
          if (i >= 0) {
            cart[i].qty = Math.round((cart[i].qty + (act === "inc" ? 1 : -1)) * 1000) / 1000;
            if (cart[i].qty <= 0) {
              cart.splice(i, 1);
            }
            refresh();
          }
        } else if (act === "remove") {
          i = cartIndex(id);
          if (i >= 0) {
            cart.splice(i, 1);
            refresh();
          }
        } else if (act === "cash-quick") {
          S.cash = a.getAttribute("data-value") || "";
          renderCash();
        }
      },
      onInput: function (el, ev, api) {
        if (el.id === "pos-search") {
          S.search = el.value;
          renderProducts();
        } else if (el.name === "cashPaid") {
          S.cash = el.value;
          updateChange();
        }
      },
      onChange: function (el, ev, api) {
        var i;
        var qty;
        var id;
        if (el.id === "pos-member") {
          S.memberId = el.value;
          refresh();
        } else if (el.name === "payment") {
          S.payment = el.value;
          qsa("#pos-payment .choice", api.el).forEach(function (c) {
            c.classList.toggle("is-active", !!qs("input:checked", c));
          });
          renderCash();
        } else if (el.name === "status") {
          S.status = el.value;
          qsa("#pos-status .choice", api.el).forEach(function (c) {
            c.classList.toggle("is-active", !!qs("input:checked", c));
          });
          renderCash();
        } else if (el.hasAttribute("data-qty")) {
          id = el.getAttribute("data-id");
          i = cartIndex(id);
          qty = parseFloat(String(el.value).replace(",", "."));
          if (i >= 0) {
            if (!isFinite(qty) || qty <= 0) {
              cart.splice(i, 1);
            } else {
              cart[i].qty = Math.round(qty * 1000) / 1000;
            }
            refresh();
          }
        }
      },
      onKeydown: function (el, ev, api) {
        var found;
        if (el.id === "pos-search" && ev.key === "Enter") {
          ev.preventDefault();
          found = Core.products.findBySku(el.value);
          if (found && found.active && found.stock > 0) {
            addToCart(found.id);
            el.value = "";
            S.search = "";
            refresh();
          } else if (el.value.trim()) {
            toast("SKU \"" + el.value.trim() + "\" tidak ditemukan atau stok habis.", "error");
          }
        }
      },
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var req = payload();
        var res;
        req.cashPaid = S.payment === "cash" && S.status === "paid" ? S.cash : null;
        req.note = data.note;
        res = Core.orders.create(req);
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        toast(res.message || MSG.success.orderCreated, "success");
        if (res.data.status === "paid") {
          openReceiptModal(res.data.id);
        }
      }
    });

    function renderProducts() {
      var box = modal.qs("#pos-products");
      var list = Core.products.list({ activeOnly: true, search: S.search });
      if (!list.length) {
        box.innerHTML = "<div class=\"cart-empty\" style=\"grid-column:1/-1\">" + ico("search_off", "icon-lg") + "<span>Produk tidak ditemukan.</span></div>";
        return;
      }
      box.innerHTML = list.map(function (p) {
        var member = usesMemberPrice() && p.hasMemberPrice;
        return "<button type=\"button\" class=\"product-tile\" data-m-action=\"add\" data-id=\"" + esc(p.id) + "\"" + (p.stock <= 0 ? " disabled" : "") + ">" +
          "<span class=\"product-tile__name\" title=\"" + esc(p.name) + "\">" + esc(p.name) + "</span>" +
          "<span class=\"cell-sub num\">" + esc(p.sku) + "</span>" +
          (member
            ? "<span class=\"product-tile__price product-tile__price--member\">" + money(p.priceMember) + "</span><span class=\"product-tile__old\">" + money(p.priceRegular) + "</span>"
            : "<span class=\"product-tile__price\">" + money(p.priceRegular) + "</span>") +
          stockPill(p) + "</button>";
      }).join("");
    }

    function renderMemberHint() {
      var m = currentMember();
      var box = modal.qs("#pos-member-hint");
      if (!m) {
        box.innerHTML = "";
        return;
      }
      box.innerHTML = "<div class=\"member-picker\">" + tierBadge(m.tier) + "<div class=\"grow\"><div class=\"cell-title\">" + esc(m.name) + "</div>" +
        "<div class=\"cell-sub\">" + F.number(m.points) + " poin. Harga Member diterapkan otomatis.</div></div></div>";
    }

    function renderCart() {
      var box = modal.qs("#pos-cart");
      var prev = Core.orders.preview(payload());
      var rows = [];
      var subtotal = 0;
      var total = 0;
      var saving = 0;
      var points = 0;
      var errorHtml = "";
      var totals;

      cart.forEach(function (c) {
        var p = Core.products.get(c.productId);
        var unit;
        var regular;
        if (!p) {
          return;
        }
        unit = unitPriceFor(p);
        regular = p.priceRegular;
        rows.push({ p: p, c: c, unit: unit, regular: regular });
        subtotal += Math.round(regular * c.qty);
        total += Math.round(unit * c.qty);
      });
      saving = Math.max(0, subtotal - total);

      if (prev.ok) {
        subtotal = prev.data.subtotalRegular;
        total = prev.data.total;
        saving = prev.data.memberDiscount;
        points = prev.data.pointsToEarn;
      } else if (cart.length) {
        errorHtml = "<div class=\"callout callout--warn\" role=\"alert\">" + ico("warning", "icon-md") + "<span>" + esc(prev.error) + "</span></div>";
      }

      if (!rows.length) {
        box.innerHTML = "<div class=\"cart-empty\">" + ico("shopping_cart", "icon-lg") + "<span>" + esc(MSG.errors.emptyCart) + "</span></div>";
      } else {
        totals = "<div class=\"totals\"><div class=\"totals__row\"><span>Subtotal (Harga Reguler)</span><span>" + money(subtotal) + "</span></div>" +
          (saving > 0 ? "<div class=\"totals__row totals__row--saving\"><span>" + ico("card_membership", "icon-sm") + " Hemat Member</span><span>-" + money(saving) + "</span></div>" : "") +
          (points > 0 ? "<div class=\"totals__row\"><span>Poin yang didapat</span><span>+" + F.number(points) + "</span></div>" : "") +
          "<div class=\"totals__row totals__row--grand\"><span>Total</span><span>" + money(total) + "</span></div></div>";
        box.innerHTML = errorHtml + "<div class=\"cart-lines\">" + rows.map(function (r) {
          return "<div class=\"cart-line\"><div><div class=\"cart-line__name\" title=\"" + esc(r.p.name) + "\">" + esc(r.p.name) + "</div>" +
            "<div class=\"cart-line__price\">" + (r.unit < r.regular ? "<span class=\"price-old\">" + money(r.regular) + "</span> " : "") + money(r.unit) + " / " + esc(r.p.unit) + "</div></div>" +
            "<div class=\"cart-line__total\">" + money(Math.round(r.unit * r.c.qty)) + "</div>" +
            "<div class=\"cart-line__controls\"><div class=\"stepper\"><button type=\"button\" class=\"stepper__btn\" data-m-action=\"dec\" data-id=\"" + esc(r.p.id) + "\" aria-label=\"Kurangi\">" + ico("remove", "icon-sm") + "</button>" +
            "<input class=\"stepper__value\" data-qty data-id=\"" + esc(r.p.id) + "\" value=\"" + esc(F.quantity(r.c.qty)) + "\" inputmode=\"decimal\" aria-label=\"Jumlah " + esc(r.p.name) + "\">" +
            "<button type=\"button\" class=\"stepper__btn\" data-m-action=\"inc\" data-id=\"" + esc(r.p.id) + "\" aria-label=\"Tambah\">" + ico("add", "icon-sm") + "</button></div>" +
            "<button type=\"button\" class=\"btn btn--danger-ghost btn--icon btn--xs\" data-m-action=\"remove\" data-id=\"" + esc(r.p.id) + "\" aria-label=\"Hapus dari pesanan\">" + ico("delete") + "</button></div></div>";
        }).join("") + "</div>" + totals;
      }

      modal.qs("#pos-footer-total").textContent = money(total);
      modal.qs("#pos-submit").disabled = !(prev.ok && cart.length);
      S.total = total;
    }

    function updateChange() {
      var el = modal.qs("#pos-change");
      var v;
      if (!el) {
        return;
      }
      v = digitsNum(S.cash);
      el.textContent = money(S.cash && v > (S.total || 0) ? v - (S.total || 0) : 0);
    }

    function renderCash() {
      var box = modal.qs("#pos-cash");
      var total = S.total || 0;
      var quick = [];
      var seen = {};
      if (!(S.payment === "cash" && S.status === "paid")) {
        box.innerHTML = "";
        return;
      }
      [total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000].forEach(function (v) {
        if (v > 0 && !seen[v]) {
          seen[v] = true;
          quick.push(v);
        }
      });
      box.innerHTML = "<div class=\"field\"><label class=\"label\" for=\"f_cashPaid\">Uang diterima<span class=\"label__optional\">(kosongkan jika uang pas)</span></label>" +
        "<div class=\"input-group\"><span class=\"input-group__prefix\">Rp</span><input class=\"input input--num\" id=\"f_cashPaid\" name=\"cashPaid\" inputmode=\"numeric\" autocomplete=\"off\" placeholder=\"" + esc(PH.order.cashPaid) + "\" value=\"" + esc(S.cash) + "\"></div></div>" +
        (quick.length ? "<div class=\"row row--wrap mt-sm\">" + quick.map(function (v, i) {
          return "<button type=\"button\" class=\"btn btn--outline btn--xs\" data-m-action=\"cash-quick\" data-value=\"" + v + "\">" + (i === 0 ? "Uang pas" : money(v)) + "</button>";
        }).join("") + "</div>" : "") +
        "<div class=\"totals__row mt-sm\"><span>Kembalian</span><strong id=\"pos-change\">" + money(0) + "</strong></div>";
      updateChange();
    }

    function refresh() {
      renderProducts();
      renderMemberHint();
      renderCart();
      renderCash();
    }

    refresh();
  }

  /* ------------------------------------------------------------------------
     21. DIALOG: PRODUK
     ------------------------------------------------------------------------ */
  function openProductModal(id) {
    var p = id ? Core.products.get(id) : null;
    var cats = Core.products.categories();
    var units = INV.stockUnits.slice();
    var catList;
    var body;
    if (id && !p) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    if (p && units.indexOf(p.unit) < 0) {
      units.push(p.unit);
    }
    catList = "<datalist id=\"cat-list\">" + cats.map(function (c) {
      return "<option value=\"" + esc(c) + "\"></option>";
    }).join("") + "</datalist>";
    body = "<form id=\"product-form\" novalidate><div class=\"stack\">" + errorBox() + catList + "<div class=\"form-grid\">" +
      fieldHtml({ name: "name", label: "Nama produk", full: true, placeholder: PH.product.name, value: p ? p.name : undefined, maxlength: 80 }) +
      fieldHtml({ name: "sku", label: "SKU", optional: true, placeholder: PH.product.sku, value: p ? p.sku : undefined, hint: "Kosongkan untuk SKU otomatis.", maxlength: 30 }) +
      fieldHtml({ name: "category", label: "Kategori", placeholder: PH.product.category, value: p ? p.category : undefined, list: "cat-list", maxlength: 60 }) +
      fieldHtml({ name: "unit", label: "Satuan", type: "select", value: p ? p.unit : INV.stockUnit, options: units.map(function (u) {
        return { value: u, label: u };
      }) }) +
      fieldHtml({ name: "cost", label: "Harga modal (HPP)", prefix: "Rp", num: true, inputmode: "numeric", placeholder: PH.product.cost, value: p ? p.cost : undefined, optional: true }) +
      "</div><div class=\"form-section\"><div class=\"form-section__title\">" + ico("sell") + esc(TIERS.priceSwitcherLabels.regular) + "</div><div class=\"form-grid\">" +
      fieldHtml({ name: "priceRegular", label: "Harga jual reguler", prefix: "Rp", num: true, inputmode: "numeric", placeholder: PH.product.priceRegular, value: p ? p.priceRegular : undefined }) +
      "</div></div><div class=\"form-section form-section--member\"><div class=\"form-section__title\">" + ico("card_membership") + esc(TIERS.priceSwitcherLabels.member) + "</div><div class=\"form-grid\">" +
      fieldHtml({ name: "priceMember", label: "Harga jual member", prefix: "Rp", member: true, num: true, inputmode: "numeric", placeholder: PH.product.priceMember, value: p && p.priceMember !== null ? p.priceMember : undefined, optional: true, hint: "Kosongkan jika tidak ada harga khusus member." }) +
      fieldHtml({ name: "memberLabel", label: "Label diskon", optional: true, placeholder: PH.product.memberLabel, value: p ? p.memberLabel : undefined, maxlength: INV.memberDiscountBadge.customLabelMaxLength, hint: "Kosongkan untuk label persen otomatis." }) +
      "</div><div class=\"field__hint mt-sm\" id=\"price-insight\" aria-live=\"polite\"></div></div><div class=\"form-grid\">" +
      fieldHtml({ name: "stock", label: "Stok saat ini", num: true, inputmode: "decimal", placeholder: PH.product.stock, value: p ? p.stock : undefined, optional: true }) +
      fieldHtml({ name: "minStock", label: "Batas stok menipis", num: true, inputmode: "decimal", placeholder: PH.product.minStock, value: p ? p.minStock : undefined, optional: true, hint: "Default " + INV.defaultMinStock + "." }) +
      "</div><label class=\"check\"><input type=\"checkbox\" name=\"active\"" + (!p || p.active ? " checked" : "") + ">Produk aktif dan dijual</label></div></form>";

    openModal({
      size: "lg",
      title: p ? "Ubah Produk" : stripPlus(INV.addButton.label),
      subtitle: p ? p.name : "Isi harga reguler dan harga member sekaligus.",
      body: body,
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"product-form\" class=\"btn btn--primary\">" + ico("save") + esc(MSG.buttons.save) + "</button>",
      onOpen: function (api) {
        updateInsight(api);
      },
      onInput: function (el, ev, api) {
        if (el.name === "cost" || el.name === "priceRegular" || el.name === "priceMember") {
          updateInsight(api);
        }
      },
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var res = p ? Core.products.update(p.id, data) : Core.products.create(data);
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        notify(res, MSG.success.saved);
      }
    });

    function updateInsight(api) {
      var form = api.qs("#product-form");
      var box = api.qs("#price-insight");
      var cost = digitsNum(form.elements.cost.value);
      var reg = digitsNum(form.elements.priceRegular.value);
      var memRaw = form.elements.priceMember.value;
      var mem = digitsNum(memRaw);
      var parts = [];
      if (reg > 0) {
        parts.push("Margin reguler: " + money(reg - cost) + (reg > 0 ? " (" + F.percent(((reg - cost) / reg) * 100, 0) + ")" : ""));
      }
      if (String(memRaw).trim() === "") {
        parts.push("Tanpa harga member, member membayar Harga Reguler.");
      } else if (mem > reg && reg > 0) {
        parts.push("Harga member lebih tinggi dari harga reguler.");
      } else if (reg > 0) {
        parts.push("Member hemat " + money(reg - mem) + " (" + F.percent(((reg - mem) / reg) * 100, 0) + "), margin member " + money(mem - cost) + ".");
      }
      box.textContent = parts.join(" ");
    }
  }

  function deleteProduct(id) {
    var p = Core.products.get(id);
    if (!p) {
      return;
    }
    confirmDialog({
      title: MSG.confirm.deleteTitle,
      text: "Produk \"" + p.name + "\" akan dihapus. Riwayat pesanan lama tetap tersimpan. " + MSG.confirm.deleteText,
      confirmLabel: MSG.buttons.delete,
      tone: "danger",
      icon: "delete"
    }).then(function (yes) {
      if (yes) {
        notify(Core.products.remove(id), MSG.success.deleted);
      }
    });
  }

  /* ------------------------------------------------------------------------
     22. DIALOG: OPNAME STOK
     ------------------------------------------------------------------------ */
  function openOpnameModal() {
    var list = Core.products.list();
    if (!list.length) {
      toast(MSG.emptyStates.products.title + ". " + MSG.emptyStates.products.text, "info");
      return;
    }
    openModal({
      size: "lg",
      title: INV.opnameButton.label,
      subtitle: "Isi hasil hitung fisik hanya untuk produk yang ingin dikoreksi. Kolom kosong tidak diubah.",
      body: "<form id=\"opname-form\" novalidate>" + errorBox() + "<div class=\"table-wrap\"><table class=\"table\" style=\"min-width:520px\"><thead><tr>" +
        "<th>Produk</th><th class=\"t-right\">Stok sistem</th><th class=\"t-right\">Hasil hitung</th><th class=\"t-right\">Selisih</th></tr></thead><tbody>" + list.map(function (p) {
          return "<tr><td><div class=\"cell-title\">" + esc(p.name) + "</div><div class=\"cell-sub num\">" + esc(p.sku) + "</div></td>" +
            "<td class=\"t-right num\">" + F.quantity(p.stock) + " " + esc(p.unit) + "</td>" +
            "<td class=\"t-right\"><input class=\"input input--sm input--num opname-input\" data-opname data-id=\"" + esc(p.id) + "\" data-system=\"" + p.stock + "\" inputmode=\"decimal\" autocomplete=\"off\" placeholder=\"" + esc(PH.product.stock) + "\" aria-label=\"Hasil hitung " + esc(p.name) + "\"></td>" +
            "<td class=\"t-right num\" data-diff=\"" + esc(p.id) + "\"><span class=\"text-faint\">-</span></td></tr>";
        }).join("") + "</tbody></table></div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"opname-form\" class=\"btn btn--primary\">" + ico("inventory") + "Simpan Hasil Opname</button>",
      onInput: function (el, ev, api) {
        var cell;
        var raw;
        var diff;
        if (!el.hasAttribute("data-opname")) {
          return;
        }
        cell = api.qs("[data-diff=\"" + el.getAttribute("data-id") + "\"]");
        raw = String(el.value).trim();
        if (!cell) {
          return;
        }
        if (raw === "") {
          cell.innerHTML = "<span class=\"text-faint\">-</span>";
          return;
        }
        diff = parseFloat(raw.replace(",", ".")) - Number(el.getAttribute("data-system"));
        if (!isFinite(diff)) {
          cell.innerHTML = "<span class=\"text-faint\">-</span>";
        } else {
          cell.innerHTML = "<span class=\"" + (diff > 0 ? "diff-pos" : (diff < 0 ? "diff-neg" : "text-muted")) + "\">" + (diff > 0 ? "+" : "") + F.quantity(Math.round(diff * 1000) / 1000) + "</span>";
        }
      },
      onSubmit: function (form, ev, api) {
        var entries = [];
        var res;
        qsa("[data-opname]", form).forEach(function (el) {
          if (String(el.value).trim() !== "") {
            entries.push({ productId: el.getAttribute("data-id"), counted: el.value });
          }
        });
        if (!entries.length) {
          showFormError(form, { error: "Isi minimal satu hasil hitung." });
          return;
        }
        res = Core.products.opname(entries);
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        toast(res.message + " (" + entries.length + " produk)", "success");
      }
    });
  }

  /* ------------------------------------------------------------------------
     23. DIALOG: MEMBER
     ------------------------------------------------------------------------ */
  function openMemberModal(id) {
    var m = id ? Core.members.get(id) : null;
    var tiers = Core.members.tiers().filter(function (t) {
      return t.id !== TIERS.defaultTier;
    });
    if (id && !m) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    openModal({
      size: "md",
      title: m ? "Ubah Member" : stripPlus(MEM.addButton.label),
      subtitle: m ? m.name : "Member otomatis mendapat Harga Member dan poin.",
      body: "<form id=\"member-form\" novalidate><div class=\"stack\">" + errorBox() + "<div class=\"form-grid\">" +
        fieldHtml({ name: "name", label: "Nama member", full: true, placeholder: PH.member.name, value: m ? m.name : undefined, maxlength: 80 }) +
        fieldHtml({ name: "phone", label: "No. HP", optional: true, inputmode: "tel", placeholder: PH.member.phone, value: m ? m.phone : undefined, maxlength: 20 }) +
        fieldHtml({ name: "tier", label: "Tingkat", type: "select", value: m ? m.tier : tiers[0].id, options: tiers.map(function (t) {
          return { value: t.id, label: t.label };
        }) }) +
        (m ? fieldHtml({ name: "points", label: "Poin", num: true, inputmode: "numeric", value: m.points }) : "") +
        fieldHtml({ name: "note", label: "Catatan", full: true, optional: true, placeholder: PH.member.note, value: m ? m.note : undefined, maxlength: 200 }) +
        "</div>" + (m ? "<label class=\"check\"><input type=\"checkbox\" name=\"active\"" + (m.active ? " checked" : "") + ">Member aktif</label>" : "") + "</div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"member-form\" class=\"btn btn--member\">" + ico("save") + esc(MSG.buttons.save) + "</button>",
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var res = m ? Core.members.update(m.id, data) : Core.members.create(data);
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        notify(res, MSG.success.saved);
      }
    });
  }

  function deleteMember(id) {
    var m = Core.members.get(id);
    if (!m) {
      return;
    }
    confirmDialog({
      title: MSG.confirm.deleteTitle,
      text: "Member \"" + m.name + "\" akan dihapus. Riwayat pesanannya tetap tersimpan. " + MSG.confirm.deleteText,
      confirmLabel: MSG.buttons.delete,
      tone: "danger",
      icon: "delete"
    }).then(function (yes) {
      if (yes) {
        notify(Core.members.remove(id), MSG.success.deleted);
      }
    });
  }

  /* ------------------------------------------------------------------------
     24. DIALOG: PENGELUARAN
     ------------------------------------------------------------------------ */
  function openExpenseModal(id) {
    var e = id ? Core.expenses.get(id) : null;
    if (id && !e) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    openModal({
      size: "md",
      title: e ? "Ubah Pengeluaran" : stripPlus(EXP.addButton.label),
      subtitle: e ? e.title : "Biaya operasional akan mengurangi laba bersih.",
      body: "<form id=\"expense-form\" novalidate><div class=\"stack\">" + errorBox() + "<div class=\"form-grid\">" +
        fieldHtml({ name: "title", label: "Keterangan", full: true, placeholder: PH.expense.title, value: e ? e.title : undefined, maxlength: 100 }) +
        fieldHtml({ name: "category", label: "Kategori", type: "select", value: e ? e.category : EXP.defaultCategory, options: Core.expenses.categories().map(function (c) {
          return { value: c, label: c };
        }) }) +
        fieldHtml({ name: "date", label: "Tanggal", type: "date", value: e ? e.dateInput : todayInput() }) +
        fieldHtml({ name: "amount", label: "Jumlah", full: true, prefix: "Rp", num: true, inputmode: "numeric", placeholder: PH.expense.amount, value: e ? e.amount : undefined }) +
        fieldHtml({ name: "note", label: "Catatan", full: true, optional: true, placeholder: PH.expense.note, value: e ? e.note : undefined, maxlength: 200 }) +
        "</div></div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"expense-form\" class=\"btn btn--primary\">" + ico("save") + esc(MSG.buttons.save) + "</button>",
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var res = e ? Core.expenses.update(e.id, data) : Core.expenses.create(data);
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        notify(res, MSG.success.saved);
      }
    });
  }

  function deleteExpense(id) {
    var e = Core.expenses.get(id);
    if (!e) {
      return;
    }
    confirmDialog({
      title: MSG.confirm.deleteTitle,
      text: "Catatan \"" + e.title + "\" (" + money(e.amount) + ") akan dihapus. " + MSG.confirm.deleteText,
      confirmLabel: MSG.buttons.delete,
      tone: "danger",
      icon: "delete"
    }).then(function (yes) {
      if (yes) {
        notify(Core.expenses.remove(id), MSG.success.deleted);
      }
    });
  }

  /* ------------------------------------------------------------------------
     25. DIALOG: STAF
     ------------------------------------------------------------------------ */
  function openStaffModal(id) {
    var s = id ? Core.staff.get(id) : null;
    if (id && !s) {
      toast(MSG.errors.notFound, "error");
      return;
    }
    openModal({
      size: "md",
      title: s ? "Ubah Staf" : stripPlus(STF.addButton.label),
      subtitle: s ? s.name : "Tambahkan staf atau kasir yang bertugas.",
      body: "<form id=\"staff-form\" novalidate><div class=\"stack\">" + errorBox() + "<div class=\"form-grid\">" +
        fieldHtml({ name: "name", label: "Nama staf", full: true, placeholder: PH.staff.name, value: s ? s.name : undefined, maxlength: 60 }) +
        fieldHtml({ name: "role", label: "Peran", type: "select", value: s ? s.role : STF.defaultRole, options: STF.roleOrder.map(function (r) {
          return { value: r, label: STF.roles[r].label };
        }) }) +
        fieldHtml({ name: "shift", label: "Shift", type: "select", value: s ? s.shift : STF.defaultShift, options: STF.shiftOrder.map(function (k) {
          return { value: k, label: STF.shifts[k].label + " (" + STF.shifts[k].start + "-" + STF.shifts[k].end + ")" };
        }) }) +
        fieldHtml({ name: "phone", label: "No. HP", full: true, optional: true, inputmode: "tel", placeholder: PH.staff.phone, value: s ? s.phone : undefined, maxlength: 20 }) +
        "</div><label class=\"check\"><input type=\"checkbox\" name=\"active\"" + (!s || s.active ? " checked" : "") + ">Staf aktif</label></div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"staff-form\" class=\"btn btn--primary\">" + ico("save") + esc(MSG.buttons.save) + "</button>",
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var res = s ? Core.staff.update(s.id, data) : Core.staff.create(data);
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        notify(res, MSG.success.saved);
      }
    });
  }

  function deleteStaff(id) {
    var s = Core.staff.get(id);
    if (!s) {
      return;
    }
    confirmDialog({
      title: MSG.confirm.deleteTitle,
      text: "Staf \"" + s.name + "\" akan dihapus. " + MSG.confirm.deleteText,
      confirmLabel: MSG.buttons.delete,
      tone: "danger",
      icon: "delete"
    }).then(function (yes) {
      if (yes) {
        notify(Core.staff.remove(id), MSG.success.deleted);
      }
    });
  }

  /* ------------------------------------------------------------------------
     26. DIALOG: HEADER TOKO, CADANGAN & UBAH PIN 6 ANGKA
     ------------------------------------------------------------------------ */
  function openRenameModal() {
    var info = Core.store.get();
    openModal({
      size: "sm",
      title: HDR.renameStore.dialogTitle,
      body: "<form id=\"rename-form\" novalidate><div class=\"stack\">" + errorBox() +
        fieldHtml({ name: "name", label: HDR.renameStore.fieldLabel, placeholder: PH.storeName, value: info.name, maxlength: HDR.renameStore.maxLength }) +
        fieldHtml({ name: "branch", label: "Nama cabang", placeholder: PH.branchName, value: info.branch, maxlength: 60 }) + "</div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"rename-form\" class=\"btn btn--primary\">" + ico("save") + esc(MSG.buttons.save) + "</button>",
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var res = Core.store.update({ name: data.name, branch: data.branch });
        if (!res.ok) {
          showFormError(form, res);
          return;
        }
        api.close();
        toast(MSG.success.storeRenamed, "success");
      }
    });
  }

  function openPinModal() {
    openModal({
      size: "sm",
      title: "Ubah PIN Keamanan Kasir",
      subtitle: "PIN wajib terdiri dari tepat 6 digit angka (0-9).",
      body: "<form id=\"pin-form\" novalidate><div class=\"stack\">" + errorBox() +
        fieldHtml({
          name: "oldPin",
          label: "PIN Saat Ini (6 Angka)",
          type: "password",
          inputmode: "numeric",
          maxlength: 6,
          placeholder: "mis. 123456",
          attrs: "data-pin-only=\"1\" pattern=\"[0-9]{6}\" oninput=\"this.value=this.value.replace(/[^0-9]/g,'').slice(0,6)\" autofocus"
        }) +
        fieldHtml({
          name: "newPin",
          label: "PIN Baru (6 Angka)",
          type: "password",
          inputmode: "numeric",
          maxlength: 6,
          placeholder: "Masukkan 6 digit angka baru",
          attrs: "data-pin-only=\"1\" pattern=\"[0-9]{6}\" oninput=\"this.value=this.value.replace(/[^0-9]/g,'').slice(0,6)\""
        }) +
        fieldHtml({
          name: "confirmPin",
          label: "Ulangi PIN Baru",
          type: "password",
          inputmode: "numeric",
          maxlength: 6,
          placeholder: "Ketik ulang 6 digit angka baru",
          attrs: "data-pin-only=\"1\" pattern=\"[0-9]{6}\" oninput=\"this.value=this.value.replace(/[^0-9]/g,'').slice(0,6)\""
        }) +
        "</div></form>",
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.cancel) + "</button>" +
        "<button type=\"submit\" form=\"pin-form\" class=\"btn btn--primary\">" + ico("save") + "Simpan PIN</button>",
      onSubmit: function (form, ev, api) {
        var data = readForm(form);
        var current = getActivePin();
        var oldPin = String(data.oldPin || "").trim();
        var newPin = String(data.newPin || "").trim();
        var confirmPin = String(data.confirmPin || "").trim();

        if (oldPin !== current) {
          showFormError(form, { error: "PIN saat ini tidak sesuai.", field: "oldPin" });
          return;
        }
        if (!/^\d{6}$/.test(newPin)) {
          showFormError(form, { error: "PIN baru wajib tepat 6 digit angka (tanpa huruf).", field: "newPin" });
          return;
        }
        if (newPin !== confirmPin) {
          showFormError(form, { error: "Konfirmasi PIN baru tidak sama.", field: "confirmPin" });
          return;
        }
        if (!saveActivePin(newPin)) {
          showFormError(form, { error: MSG.errors.storageFailed });
          return;
        }
        api.close();
        toast("PIN keamanan 6 angka berhasil diperbarui.", "success");
      }
    });
  }

  function openBackupModal() {
    var body = "<div class=\"stack\">" + errorBox() + "<div class=\"callout\">" + ico("info", "icon-md") +
      "<span>Cadangan berisi semua data pada mode yang sedang aktif (" + esc(Core.mode.isDemo() ? "Mode Demo" : "Toko Sendiri") + ").</span></div>";
    if (FEAT.exportBackupJson) {
      body += "<div class=\"card card--pad-md\"><div class=\"row row--between row--wrap row--md\"><div><div class=\"cell-title\">Unduh cadangan</div>" +
        "<div class=\"cell-sub\">Simpan salinan data sebagai berkas JSON.</div></div>" +
        "<button type=\"button\" class=\"btn btn--primary\" data-m-action=\"export\">" + ico("download") + "Unduh JSON</button></div></div>";
    }
    if (FEAT.importBackupJson) {
      body += "<div class=\"card card--pad-md\"><div class=\"cell-title\">Pulihkan dari cadangan</div>" +
        "<div class=\"cell-sub\">Data pada mode ini akan diganti dengan isi berkas.</div>" +
        "<div class=\"row mt-md\"><input class=\"input\" type=\"file\" accept=\"application/json,.json\" id=\"backup-file\" aria-label=\"Pilih berkas cadangan\" style=\"padding-top:8px\"></div></div>";
    }
    body += "</div>";
    openModal({
      size: "md",
      title: "Cadangan Data",
      subtitle: "Unduh atau pulihkan data BizFlow.",
      body: body,
      footer: "<button type=\"button\" class=\"btn btn--outline\" data-m-close>" + esc(MSG.buttons.close) + "</button>",
      onClick: function (a, ev, api) {
        var res;
        var blob;
        var link;
        if (a.getAttribute("data-m-action") === "export") {
          res = Core.backup.export();
          if (!res.ok) {
            showFormError(api.el, res);
            return;
          }
          blob = new global.Blob([res.data.json], { type: "application/json" });
          link = doc.createElement("a");
          link.href = global.URL.createObjectURL(blob);
          link.download = res.data.filename;
          doc.body.appendChild(link);
          link.click();
          doc.body.removeChild(link);
          global.setTimeout(function () {
            global.URL.revokeObjectURL(link.href);
          }, 1000);
          toast("Cadangan diunduh: " + res.data.filename, "success");
        }
      },
      onChange: function (el, ev, api) {
        var file;
        var reader;
        if (el.id !== "backup-file" || !el.files || !el.files[0]) {
          return;
        }
        file = el.files[0];
        reader = new global.FileReader();
        reader.onload = function () {
          confirmDialog({
            title: "Pulihkan dari cadangan?",
            text: "Semua data pada mode ini akan diganti dengan isi berkas \"" + file.name + "\".",
            confirmLabel: "Pulihkan",
            tone: "warn",
            icon: "restore"
          }).then(function (yes) {
            var res;
            if (!yes) {
              el.value = "";
              return;
            }
            res = Core.backup.import(String(reader.result));
            if (!res.ok) {
              showFormError(api.el, res);
              el.value = "";
              return;
            }
            api.close();
            toast(res.message, "success");
          });
        };
        reader.onerror = function () {
          showFormError(api.el, { error: MSG.errors.storageFailed });
        };
        reader.readAsText(file);
      }
    });
  }

  /* ------------------------------------------------------------------------
     27. AKSI GLOBAL (delegasi klik & validasi login ketat)
     ------------------------------------------------------------------------ */
  function setPath(path, value) {
    var parts = String(path).split(".");
    var target = UI[parts[0]];
    if (!target || parts.length !== 2) {
      return false;
    }
    target[parts[1]] = value;
    if (target.page !== undefined) {
      target.page = 1;
    }
    return true;
  }

  function handleScan(input) {
    var code = input.value.trim();
    var found;
    if (!code) {
      return;
    }
    found = Core.products.findBySku(code);
    if (!found || !found.active) {
      toast("SKU \"" + code + "\" tidak ditemukan.", "error");
      return;
    }
    if (found.stock <= 0) {
      toast(found.name + " " + INV.outOfStockLabel.toLowerCase() + ".", "error");
      return;
    }
    input.value = "";
    openOrderModal({ addProductId: found.id });
  }

  function ensureValidCashierAfterSwitch() {
    var cur = Core.store.get().cashier;
    if (!matchValidAccount(cur)) {
      Core.store.update({
        cashier: DEFAULT_AUTH.username,
        cashierRole: APP.defaultCashierRole
      });
    }
  }

  function performLogin() {
    var container = qs("#login-form");
    var inputName = container ? qs("[name='login-username']", container) : null;
    var inputPin = container ? qs("[name='login-pin']", container) : null;
    var rawUser = inputName ? inputName.value.trim() : "";
    var rawPin = inputPin ? inputPin.value.trim() : "";
    var account;

    if (!container) {
      return;
    }
    clearFormErrors(container);

    if (!rawUser) {
      showFormError(container, {
        error: "Username wajib diisi (gunakan 'Admin' atau nama staf aktif).",
        field: "login-username"
      });
      return;
    }

    account = matchValidAccount(rawUser);
    if (!account) {
      showFormError(container, {
        error: "Username '" + rawUser + "' ditolak! Hanya 'Admin' atau nama staf aktif yang diizinkan.",
        field: "login-username"
      });
      return;
    }

    if (!/^\d{6}$/.test(rawPin)) {
      showFormError(container, {
        error: "PIN wajib berisi tepat 6 digit angka (huruf tidak diizinkan).",
        field: "login-pin"
      });
      return;
    }

    if (rawPin !== getActivePin()) {
      showFormError(container, {
        error: "PIN salah! Masukkan 6 digit angka PIN yang benar.",
        field: "login-pin"
      });
      return;
    }

    Core.store.update({
      cashier: account.name,
      cashierRole: account.role
    });
    saveAuthSession(true);
    UI.showPin = false;
    UI.route = NAV.defaultRoute;
    toast("Selamat bertugas, " + account.name + " (" + account.role + ")!", "success");

    if (global.location.hash !== "#" + NAV.defaultRoute) {
      global.location.hash = "#" + NAV.defaultRoute;
    } else {
      renderApp();
    }
  }

  var ACTIONS = {
    "do-login": function () {
      performLogin();
    },
    "pick-staff-login": function (el) {
      var container = qs("#login-form");
      var inputName = container ? qs("[name='login-username']", container) : null;
      var inputPin = container ? qs("[name='login-pin']", container) : null;
      if (container) {
        clearFormErrors(container);
      }
      if (inputName) {
        inputName.value = el.getAttribute("data-name") || "";
      }
      if (inputPin) {
        inputPin.focus();
      }
    },
    "toggle-pin": function () {
      var inputName = qs("[name='login-username']");
      var inputPin = qs("[name='login-pin']");
      var savedUser = inputName ? inputName.value : "";
      var savedPin = inputPin ? inputPin.value : "";
      UI.showPin = !UI.showPin;
      renderApp();
      inputName = qs("[name='login-username']");
      inputPin = qs("[name='login-pin']");
      if (inputName) {
        inputName.value = savedUser;
      }
      if (inputPin) {
        inputPin.value = savedPin;
        inputPin.focus();
      }
    },
    "open-pin-modal": openPinModal,
    "logout": function () {
      saveAuthSession(false);
      UI.route = "login";
      UI.popover = false;
      UI.drawer = false;
      toast("Sesi kasir telah dikunci.", "info");
      global.location.hash = "#login";
      renderApp();
    },
    "skip": function () {
      var main = qs("#main");
      if (main) {
        main.focus();
      }
    },
    "nav": function () {
      UI.drawer = false;
      renderApp();
    },
    "toggle-nav": function () {
      if (isMobile()) {
        UI.drawer = !UI.drawer;
      } else {
        UI.collapsed = !UI.collapsed;
        saveCollapsed();
      }
      renderApp();
    },
    "close-drawer": function () {
      UI.drawer = false;
      renderApp();
    },
    "toggle-notif": function () {
      UI.popover = !UI.popover;
      renderApp();
    },
    "set": function (el) {
      if (setPath(el.getAttribute("data-path"), el.getAttribute("data-value"))) {
        renderView();
      }
    },
    "page": function (el) {
      UI.orders.page = Math.max(1, UI.orders.page + Number(el.getAttribute("data-dir")));
      renderView();
    },
    "rename-store": openRenameModal,
    "open-backup": openBackupModal,
    "switch-mode": function () {
      if (Core.mode.isDemo()) {
        confirmDialog({
          title: HDR.ownStoreButton.confirmTitle,
          text: HDR.ownStoreButton.confirmText,
          confirmLabel: "Beralih",
          icon: "storefront"
        }).then(function (yes) {
          if (yes) {
            var res = Core.mode.set("store");
            ensureValidCashierAfterSwitch();
            notify(res, MSG.success.modeChanged);
          }
        });
      } else {
        var resDemo = Core.mode.set("demo");
        ensureValidCashierAfterSwitch();
        notify(resDemo, MSG.success.modeChanged);
      }
    },
    "load-demo": function () {
      confirmDialog({
        title: HDR.demoButtons.load.confirmTitle,
        text: HDR.demoButtons.load.confirmText,
        confirmLabel: HDR.demoButtons.load.label,
        icon: HDR.demoButtons.load.icon
      }).then(function (yes) {
        if (yes) {
          var res = Core.demo.load();
          ensureValidCashierAfterSwitch();
          notify(res, MSG.success.demoLoaded);
        }
      });
    },
    "reset-demo": function () {
      confirmDialog({
        title: HDR.demoButtons.reset.confirmTitle,
        text: HDR.demoButtons.reset.confirmText,
        confirmLabel: HDR.demoButtons.reset.label,
        tone: "danger",
        icon: HDR.demoButtons.reset.icon
      }).then(function (yes) {
        if (yes) {
          var res = Core.demo.reset();
          ensureValidCashierAfterSwitch();
          notify(res, MSG.success.demoReset);
        }
      });
    },
    "new-order": function () {
      openOrderModal();
    },
    "opname": openOpnameModal,
    "order-detail": function (el) {
      openOrderDetail(el.getAttribute("data-id"));
    },
    "order-print": function (el) {
      openReceiptModal(el.getAttribute("data-id"));
    },
    "order-pay": function (el) {
      payOrder(el.getAttribute("data-id"));
    },
    "order-void": function (el) {
      voidOrder(el.getAttribute("data-id"));
    },
    "product-add": function () {
      openProductModal(null);
    },
    "product-edit": function (el) {
      openProductModal(el.getAttribute("data-id"));
    },
    "product-delete": function (el) {
      deleteProduct(el.getAttribute("data-id"));
    },
    "member-add": function () {
      openMemberModal(null);
    },
    "member-edit": function (el) {
      openMemberModal(el.getAttribute("data-id"));
    },
    "member-delete": function (el) {
      deleteMember(el.getAttribute("data-id"));
    },
    "expense-add": function () {
      openExpenseModal(null);
    },
    "expense-edit": function (el) {
      openExpenseModal(el.getAttribute("data-id"));
    },
    "expense-delete": function (el) {
      deleteExpense(el.getAttribute("data-id"));
    },
    "staff-add": function () {
      openStaffModal(null);
    },
    "staff-edit": function (el) {
      openStaffModal(el.getAttribute("data-id"));
    },
    "staff-delete": function (el) {
      deleteStaff(el.getAttribute("data-id"));
    },
    "staff-activate": function (el) {
      notify(Core.store.setActiveStaff(el.getAttribute("data-id")));
    }
  };

  function onClick(ev) {
    var target = ev.target;
    var el;
    var name;
    if (!target || !target.closest) {
      return;
    }
    if (UI.popover && !target.closest(".popover-anchor")) {
      UI.popover = false;
      renderApp();
    }
    if (target.closest(".modal-backdrop")) {
      return;
    }
    el = target.closest("[data-action]");
    if (!el) {
      return;
    }
    name = el.getAttribute("data-action");
    if (!ACTIONS[name]) {
      return;
    }
    if (el.tagName === "A" && name !== "nav" && name !== "skip") {
      ev.preventDefault();
    }
    if (name === "skip") {
      ev.preventDefault();
    }
    ACTIONS[name](el, ev);
  }

  function onBind(ev) {
    var el = ev.target;
    var bind;
    var parts;
    if (!el || !el.getAttribute) {
      return;
    }
    if (el.getAttribute("data-pin-only") === "1") {
      var cleaned = String(el.value || "").replace(/\D/g, "").slice(0, 6);
      if (el.value !== cleaned) {
        el.value = cleaned;
      }
    }
    if (el.closest(".modal-backdrop")) {
      return;
    }
    bind = el.getAttribute("data-bind");
    if (!bind) {
      return;
    }
    parts = bind.split(".");
    if (UI[parts[0]] && UI[parts[0]][parts[1]] === el.value) {
      return;
    }
    if (setPath(bind, el.value)) {
      renderView();
    }
  }

  function onKeydown(ev) {
    var top;
    var nodes;
    var first;
    var last;
    var target = ev.target;

    if (target && target.getAttribute && target.getAttribute("data-pin-only") === "1") {
      if (ev.key && ev.key.length === 1 && !/[0-9]/.test(ev.key) && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
        ev.preventDefault();
        return;
      }
    }

    if (ev.key === "Escape") {
      if (closeTopModal()) {
        ev.preventDefault();
        return;
      }
      if (UI.popover) {
        UI.popover = false;
        renderApp();
        return;
      }
      if (UI.drawer) {
        UI.drawer = false;
        renderApp();
      }
      return;
    }
    if (ev.key === "Enter" && target && target.closest && target.closest("#login-form")) {
      ev.preventDefault();
      performLogin();
      return;
    }
    if (ev.key === "Enter" && target && target.id === "scan-input") {
      ev.preventDefault();
      handleScan(target);
      return;
    }
    if (ev.key === "Tab" && modals.length) {
      top = modals[modals.length - 1];
      nodes = qsa(FOCUSABLE, qs(".modal", top.el)).filter(function (n) {
        return n.offsetParent !== null;
      });
      if (!nodes.length) {
        return;
      }
      first = nodes[0];
      last = nodes[nodes.length - 1];
      if (ev.shiftKey && (doc.activeElement === first || !top.el.contains(doc.activeElement))) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && (doc.activeElement === last || !top.el.contains(doc.activeElement))) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  function routeFromHash() {
    var h = String(global.location.hash || "").replace(/^#/, "");
    if (!UI.loggedIn || !matchValidAccount(Core.store.get().cashier)) {
      return "login";
    }
    if (h === "login") {
      saveAuthSession(false);
      return "login";
    }
    return isValidRoute(h) ? h : NAV.defaultRoute;
  }

  function onHash() {
    UI.route = routeFromHash();
    UI.drawer = false;
    UI.popover = false;
    renderApp();
    try {
      global.scrollTo(0, 0);
    } catch (e) {
      /* diabaikan */
    }
  }

  /* ------------------------------------------------------------------------
     28. MULAI
     ------------------------------------------------------------------------ */
  var started = false;

  function start() {
    if (started) {
      return;
    }
    started = true;
    injectExtraStyles();
    ensureHost("app");
    ensureHost("modal-host");
    ensureHost("toast-host", "toast-host", { "aria-live": "polite" });
    loadCollapsed();
    loadAuthSession();
    UI.route = routeFromHash();
    renderApp();

    doc.addEventListener("click", onClick);
    doc.addEventListener("input", onBind);
    doc.addEventListener("change", onBind);
    doc.addEventListener("keydown", onKeydown);
    global.addEventListener("hashchange", onHash);
    global.addEventListener("online", queueRender);
    global.addEventListener("offline", queueRender);
    Core.subscribe(queueRender);
  }

  Object.defineProperty(global, "BizFlowUI", {
    value: Object.freeze({ start: start, version: APP.version }),
    writable: false,
    configurable: false,
    enumerable: true
  });

  onReady(start);
})(typeof window !== "undefined" ? window : this);