/* TIAT home page behavior. No libraries. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var lang = "bn";
  try { lang = localStorage.getItem("tiat-lang") || "bn"; } catch (e) {}
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var TITLE = {
    bn: "টিএমএসএস ইনস্টিটিউট অব এগ্রিকালচার টেকনোলজি (টিআইএটি), ঠেঙ্গামারা, বগুড়া",
    en: "TMSS Institute of Agriculture Technology (TIAT), Thengamara, Bogura"
  };
  var loc = function () { return lang === "bn" ? "bn-BD" : "en-GB"; };
  var nf = function (n) { return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-US", { useGrouping: true }).format(n); };
  var T = function (bn, en) { return lang === "bn" ? bn : en; };

  /* ---------- toast ---------- */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("on"); }, 2200);
  }
  $$("a[data-soon]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      toast(T("এই পাতাটি শীঘ্রই যুক্ত হবে", "This page will be added soon"));
    });
  });

  /* ---------- image slots: try jpg, jpeg, png, webp ---------- */
  var EXT = ["jpg", "png", "webp"];
  function loadSlot(el) {
    var base = el.getAttribute("data-img"), i = 0;
    if (!base) return;
    (function next() {
      if (i >= EXT.length) return;
      var src = "images/" + base + "." + EXT[i++];
      var im = new Image();
      im.onload = function () {
        im.alt = el.getAttribute("data-alt") || "";
        im.loading = "lazy";
        el.appendChild(im); el.classList.add("loaded");
      };
      im.onerror = next;
      im.src = src;
    })();
  }
  $$(".ph[data-img]").forEach(loadSlot);

  /* ---------- language ---------- */
  function setLang(l) {
    lang = l; root.lang = l;
    try { localStorage.setItem("tiat-lang", l); } catch (e) {}
    document.title = TITLE[l];
    $$(".lang button").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.lang === l ? "true" : "false"); });
    $$("[data-ph-bn]").forEach(function (el) { el.placeholder = l === "bn" ? el.dataset.phBn : el.dataset.phEn; });
    $$("[data-al-bn]").forEach(function (el) { el.setAttribute("aria-label", l === "bn" ? el.dataset.alBn : el.dataset.alEn); });
    renderDates(); renderToday(); renderCal(); renderStats(true);
    $("#year").textContent = new Intl.NumberFormat(loc(), { useGrouping: false }).format(new Date().getFullYear());
  }
  $$(".lang button").forEach(function (b) { b.addEventListener("click", function () { setLang(b.dataset.lang); }); });

  /* font size */
  $$(".fsz button").forEach(function (b) {
    b.addEventListener("click", function () {
      root.classList.remove("fs-s", "fs-l");
      if (b.dataset.fs === "s") root.classList.add("fs-s");
      if (b.dataset.fs === "l") root.classList.add("fs-l");
    });
  });

  /* ---------- menu ---------- */
  var menu = $("#menu"), tog = $(".nav-toggle");
  tog.addEventListener("click", function () {
    var o = menu.classList.toggle("open"); tog.setAttribute("aria-expanded", o ? "true" : "false");
  });

  /* ---------- hero ---------- */
  var slides = $$(".slide"), dotsBox = $(".dots"), cur = 0, timer;
  slides.forEach(function (s, i) {
    var d = document.createElement("button"); d.type = "button";
    d.setAttribute("aria-label", "Slide " + (i + 1));
    d.addEventListener("click", function () { go(i); restart(); });
    dotsBox.appendChild(d);
  });
  function go(n) {
    cur = (n + slides.length) % slides.length;
    slides.forEach(function (s, i) { s.classList.toggle("on", i === cur); });
    $$("button", dotsBox).forEach(function (d, i) { d.setAttribute("aria-current", i === cur ? "true" : "false"); });
  }
  function restart() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go(cur + 1); }, 6500); }
  $(".hero-prev").addEventListener("click", function () { go(cur - 1); restart(); });
  $(".hero-next").addEventListener("click", function () { go(cur + 1); restart(); });
  $(".hero").addEventListener("mouseenter", function () { clearInterval(timer); });
  $(".hero").addEventListener("mouseleave", restart);
  go(0); restart();

  /* ---------- dates ---------- */
  function fmtDate(iso, opt) { return new Date(iso + "T00:00:00").toLocaleDateString(loc(), opt); }
  function renderDates() {
    $("#today-date").textContent = new Date().toLocaleDateString(loc(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $$("[data-date]").forEach(function (el) {
      var iso = el.dataset.date;
      el.querySelector("b").textContent = nf(new Date(iso + "T00:00:00").getDate());
      el.querySelector("small").textContent = fmtDate(iso, { month: "short", year: "numeric" });
    });
    $$("[data-ndate]").forEach(function (el) { el.textContent = fmtDate(el.dataset.ndate, { day: "numeric", month: "long", year: "numeric" }); });
  }

  /* ---------- holidays (demo list) ---------- */
  var HOL = {
    "2026-12-16": ["বিজয় দিবস", "Victory Day"],
    "2026-12-25": ["বড়দিন", "Christmas Day"],
    "2027-02-21": ["শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস", "Language Martyrs' Day"],
    "2027-03-26": ["স্বাধীনতা দিবস", "Independence Day"],
    "2027-04-14": ["পহেলা বৈশাখ", "Pohela Boishakh"],
    "2027-05-01": ["মে দিবস", "May Day"]
  };
  function isoOf(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function isOff(d) { var w = d.getDay(); return w === 5 || w === 6; } /* Friday and Saturday */

  function renderToday() {
    var now = new Date(), iso = isoOf(now), box = $("#today-state"), h = $("#today-head");
    var hol = HOL[iso], off = isOff(now), closed = !!hol || off;
    h.classList.toggle("closed", closed);
    $("#today-main").textContent = closed ? T("আজ বন্ধ", "Closed today") : T("আজ খোলা", "Open today");
    $("#today-why").textContent = hol ? hol[lang === "bn" ? 0 : 1] : off ? T("সাপ্তাহিক ছুটি", "Weekly off day") : T("সকল ক্লাস ও অফিস চালু", "Classes and office running");
    var next = Object.keys(HOL).sort().filter(function (k) { return k > iso; })[0];
    $("#next-hol").textContent = next ? fmtDate(next, { day: "numeric", month: "long" }) + " (" + HOL[next][lang === "bn" ? 0 : 1] + ")" : "-";
  }

  /* ---------- calendar ---------- */
  var cm = new Date(); cm.setDate(1);
  function renderCal() {
    var g = $("#cal-g"); if (!g) return;
    g.innerHTML = "";
    var first = new Date(cm), y = first.getFullYear(), m = first.getMonth();
    $("#cal-title").textContent = first.toLocaleDateString(loc(), { month: "long", year: "numeric" });
    var base = new Date(2023, 0, 1); /* a Sunday */
    for (var i = 0; i < 7; i++) {
      var dd = new Date(base); dd.setDate(base.getDate() + i);
      var el = document.createElement("div"); el.className = "dow";
      el.textContent = dd.toLocaleDateString(loc(), { weekday: "short" }); g.appendChild(el);
    }
    for (var s = 0; s < first.getDay(); s++) { var e = document.createElement("div"); e.className = "e d"; g.appendChild(e); }
    var days = new Date(y, m + 1, 0).getDate(), todayIso = isoOf(new Date());
    for (var d = 1; d <= days; d++) {
      var dt = new Date(y, m, d), c = document.createElement("div"), key = isoOf(dt);
      c.className = "d"; c.textContent = nf(d);
      if (HOL[key]) { c.classList.add("hol"); c.title = HOL[key][lang === "bn" ? 0 : 1]; }
      else if (isOff(dt)) c.classList.add("off");
      if (key === todayIso) c.classList.add("today");
      g.appendChild(c);
    }
  }
  $("#cal-prev").addEventListener("click", function () { cm.setMonth(cm.getMonth() - 1); renderCal(); });
  $("#cal-next").addEventListener("click", function () { cm.setMonth(cm.getMonth() + 1); renderCal(); });

  /* ---------- stats counters ---------- */
  var statsEls = $$("[data-count]"), statsDone = false;
  function renderStats(final) {
    statsEls.forEach(function (el) {
      var n = +el.dataset.count, suf = el.dataset.suffix || "";
      if (final || statsDone) el.textContent = nf(n) + suf;
    });
  }
  function animateStats() {
    if (statsDone) return; statsDone = true;
    if (reduce) { renderStats(true); return; }
    var t0 = performance.now(), dur = 1400;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      statsEls.forEach(function (el) { el.textContent = nf(Math.round(+el.dataset.count * e)) + (p === 1 ? (el.dataset.suffix || "") : ""); });
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { animateStats(); io.disconnect(); } }, { threshold: .3 });
    io.observe($(".stats"));
  } else { animateStats(); }

  /* ---------- notice tabs ---------- */
  var ntabs = $$("#ntabs button");
  ntabs.forEach(function (b) {
    b.addEventListener("click", function () {
      ntabs.forEach(function (x) { x.setAttribute("aria-selected", x === b ? "true" : "false"); });
      var cat = b.dataset.cat;
      $$("#nlist li").forEach(function (li) { li.hidden = !(cat === "all" || li.dataset.cat === cat); });
    });
  });

  /* ---------- result demo ---------- */
  var STUDENTS = {
    "TIAT-0001|101": { n: ["শিক্ষার্থী ১", "Student 1"], c: ["ম্যাসনারি (লেভেল-২)", "Masonry (Level-2)"], s: "2026-27", r: "pass", g: "A", m: 84 },
    "TIAT-0002|102": { n: ["শিক্ষার্থী ২", "Student 2"], c: ["ড্রাইভিং (লেভেল-৩)", "Driving (Level-3)"], s: "2026-27", r: "pass", g: "B+", m: 76 },
    "TIAT-0003|103": { n: ["শিক্ষার্থী ৩", "Student 3"], c: ["ম্যাসনারি (লেভেল-২)", "Masonry (Level-2)"], s: "2026-27", r: "fail", g: "F", m: 31 }
  };
  $("#rform").addEventListener("submit", function (e) {
    e.preventDefault();
    var id = $("#r-id").value.trim().toUpperCase(), roll = $("#r-roll").value.trim(), out = $("#rout");
    var s = STUDENTS[id + "|" + roll], i = lang === "bn" ? 0 : 1;
    out.classList.add("show");
    if (!s) {
      out.innerHTML = "<b class='res-bad'>" + T("কোনো ফলাফল পাওয়া যায়নি। আইডি ও রোল আবার দেখুন।", "No result found. Check the ID and roll.") + "</b>";
      return;
    }
    var ok = s.r === "pass";
    out.innerHTML = "<table>" +
      row(T("নাম", "Name"), s.n[i]) + row(T("কোর্স", "Course"), s.c[i]) + row(T("সেশন", "Session"), s.s) +
      row(T("প্রাপ্ত নম্বর", "Marks"), nf(s.m)) + row(T("গ্রেড", "Grade"), s.g) +
      row(T("ফলাফল", "Result"), "<span class='" + (ok ? "res-ok" : "res-bad") + "'>" + (ok ? T("উত্তীর্ণ", "Passed") : T("অনুত্তীর্ণ", "Failed")) + "</span>") +
      "</table>";
  });
  function row(a, b) { return "<tr><td>" + a + "</td><td>" + b + "</td></tr>"; }
  $("#r-fill").addEventListener("click", function () { $("#r-id").value = "TIAT-0001"; $("#r-roll").value = "101"; });

  /* ---------- contact form (mock) ---------- */
  $("#cf").addEventListener("submit", function (e) {
    e.preventDefault(); $("#cf-ok").classList.add("show"); e.target.reset();
  });

  /* ---------- lightbox ---------- */
  var lb = $("#lb");
  $$(".gal .ph").forEach(function (p) {
    p.addEventListener("click", function () {
      var im = $("img", p); if (!im) return;
      $("img", lb).src = im.src; lb.classList.add("on");
    });
  });
  lb.addEventListener("click", function () { lb.classList.remove("on"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") lb.classList.remove("on"); });

  /* ---------- back to top ---------- */
  var top = $("#totop");
  window.addEventListener("scroll", function () { top.classList.toggle("on", window.scrollY > 600); }, { passive: true });
  top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  setLang(lang);
})();
