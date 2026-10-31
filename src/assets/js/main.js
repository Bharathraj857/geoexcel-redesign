/* Shared behaviour on every page: navigation, header state, scroll reveal,
   and the enquiry list ("Add to enquiry") stored in localStorage. */
(function () {
  "use strict";

  /* ---------- Enquiry store ---------- */
  var STORAGE_KEY = "gx-enquiry";
  var listeners = [];

  function read() {
    try {
      var items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(items) ? items.filter(function (i) { return i && i.slug && i.name; }) : [];
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* storage unavailable: keep in memory only */ }
    memory = items;
    listeners.forEach(function (fn) { fn(items); });
  }

  var memory = read();

  var enquiry = {
    items: function () { return memory.slice(); },
    has: function (slug) { return memory.some(function (i) { return i.slug === slug; }); },
    add: function (slug, name) { if (!enquiry.has(slug)) write(memory.concat([{ slug: slug, name: name }])); },
    remove: function (slug) { write(memory.filter(function (i) { return i.slug !== slug; })); },
    toggle: function (slug, name) { enquiry.has(slug) ? enquiry.remove(slug) : enquiry.add(slug, name); },
    subscribe: function (fn) { listeners.push(fn); fn(memory.slice()); }
  };
  window.GXEnquiry = enquiry;

  // Keep tabs in sync.
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) { memory = read(); listeners.forEach(function (fn) { fn(memory.slice()); }); }
  });

  /* ---------- "Add to enquiry" buttons and counters ---------- */
  var isContactPage = !!document.getElementById("quote-form");

  function syncButtons(items) {
    document.querySelectorAll("[data-add]").forEach(function (btn) {
      var added = items.some(function (i) { return i.slug === btn.dataset.add; });
      btn.setAttribute("aria-pressed", String(added));
      btn.textContent = added ? "✓ Added" : "Add to enquiry";
      btn.setAttribute("aria-label", (added ? "Remove " : "Add ") + btn.dataset.name + (added ? " from enquiry" : " to enquiry"));
    });
    document.querySelectorAll("[data-enquiry-count]").forEach(function (el) {
      el.textContent = items.length ? "(" + items.length + ")" : "";
    });
    var pill = document.querySelector("[data-enquiry-pill]");
    if (pill) pill.hidden = isContactPage || items.length === 0;
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add]");
    if (btn) enquiry.toggle(btn.dataset.add, btn.dataset.name);
  });

  enquiry.subscribe(syncButtons);

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var mobileQuery = window.matchMedia("(max-width: 900px)");

  function isOpen() { return toggle.getAttribute("aria-expanded") === "true"; }

  function setNav(open, returnFocus) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (open) {
      // Wait a frame so the drawer is no longer visibility:hidden, which blocks focus.
      requestAnimationFrame(function () {
        var first = nav.querySelector("a");
        if (first) first.focus();
      });
    } else if (returnFocus) {
      toggle.focus();
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () { setNav(!isOpen()); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a") && isOpen()) setNav(false); });

    document.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") {
        setNav(false, true);
      } else if (e.key === "Tab") {
        // Keep focus inside the open drawer (toggle button + nav links).
        var focusables = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll("a")));
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // Close the drawer if the viewport grows to desktop size.
    var onBreakpoint = function (mq) { if (!mq.matches && isOpen()) setNav(false); };
    if (mobileQuery.addEventListener) mobileQuery.addEventListener("change", onBreakpoint);
    else if (mobileQuery.addListener) mobileQuery.addListener(onBreakpoint);
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
