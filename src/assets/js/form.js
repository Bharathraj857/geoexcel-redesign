/* Request-for-quote form: enquiry-list prefill, validation and submission.
   If the form has a data-endpoint, the enquiry is POSTed as JSON to that form service.
   Without one, nothing is sent: the user gets an email draft and a copyable summary,
   and the page says plainly that the enquiry has not been sent yet. */
(function () {
  "use strict";

  var form = document.getElementById("quote-form");
  if (!form || !window.GXEnquiry) return;

  var enquiry = window.GXEnquiry;
  var endpoint = (form.dataset.endpoint || "").trim();
  var recipient = form.dataset.recipient;
  var status = form.querySelector("[data-form-status]");
  var submitBtn = form.querySelector('button[type="submit"]');
  var trayList = form.querySelector("[data-tray]");
  var trayEmpty = form.querySelector("[data-tray-empty]");
  var productsField = form.elements.products;
  var productsEdited = false;

  var productNames = {};
  try { productNames = JSON.parse(document.getElementById("gx-products").textContent); } catch (e) { /* no map */ }

  if (endpoint) {
    submitBtn.textContent = "Send enquiry";
    var note = form.querySelector("[data-form-note]");
    if (note) note.hidden = true;
  }

  /* ---------- Prefill from ?product=slug ---------- */
  var slug = new URLSearchParams(window.location.search).get("product");
  if (slug && productNames[slug]) enquiry.add(slug, productNames[slug]);

  /* ---------- Enquiry list ---------- */
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  function renderTray(items) {
    trayList.textContent = "";
    items.forEach(function (item) {
      var li = el("li");
      li.appendChild(el("span", null, item.name));
      li.appendChild(el("button", { type: "button", "data-remove": item.slug, "aria-label": "Remove " + item.name }, "×"));
      trayList.appendChild(li);
    });
    trayList.hidden = items.length === 0;
    trayEmpty.hidden = items.length > 0;
    if (!productsEdited) productsField.value = items.map(function (i) { return i.name; }).join(", ");
  }

  trayList.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (btn) enquiry.remove(btn.dataset.remove);
  });
  productsField.addEventListener("input", function () { productsEdited = true; });
  enquiry.subscribe(renderTray);

  /* ---------- Validation ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = {
    products: function (f) { return f.products.value.trim() ? "" : "Add at least one product, or describe what you need."; },
    quantity: function (f) { return Number(f.quantity.value) > 0 ? "" : "Enter a quantity greater than 0."; },
    country: function (f) { return f.country.value.trim() ? "" : "Enter the destination country."; },
    company: function (f) { return f.company.value.trim() ? "" : "Enter your company name."; },
    name: function (f) { return f.name.value.trim() ? "" : "Enter your name."; },
    email: function (f) { return EMAIL.test(f.email.value.trim()) ? "" : "Enter a valid email address, e.g. name@company.com."; },
    consent: function (f) { return f.consent.checked ? "" : "Please confirm we may use your details to respond."; }
  };

  function validate(name) {
    var input = form.elements[name];
    var message = rules[name](form.elements);
    var error = document.getElementById(name + "-error");
    error.textContent = message;
    input.setAttribute("aria-invalid", String(!!message));
    if (message) input.setAttribute("aria-describedby", name + "-error");
    else input.removeAttribute("aria-describedby");
    return !message;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    var evt = input.type === "checkbox" ? "change" : "blur";
    input.addEventListener(evt, function () {
      if (input.type === "checkbox" || input.value || input.getAttribute("aria-invalid") === "true") validate(name);
    });
  });

  /* ---------- Summary helpers ---------- */
  function data() {
    var f = form.elements;
    return {
      products: f.products.value.trim(),
      quantity: f.quantity.value + " " + f.unit.value,
      destination: f.country.value.trim(),
      incoterm: f.incoterm.value || "Not sure yet",
      packaging: f.packaging.value.trim() || "Not specified",
      requiredBy: f.timeline.value || "Not specified",
      notes: f.message.value.trim(),
      company: f.company.value.trim(),
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: f.phone.value.trim()
    };
  }

  var LABELS = [
    ["products", "Products"], ["quantity", "Quantity"], ["destination", "Destination"],
    ["incoterm", "Incoterm"], ["packaging", "Packaging"], ["requiredBy", "Required by"],
    ["company", "Company"], ["name", "Name"], ["email", "Email"], ["phone", "Phone / WhatsApp"], ["notes", "Notes"]
  ];

  function summaryText(d) {
    return LABELS.filter(function (l) { return d[l[0]]; })
      .map(function (l) { return l[1] + ": " + d[l[0]]; })
      .join("\n");
  }

  function mailtoHref(d) {
    var subject = "Quote request: " + d.company;
    var body = "Hello Geo Excel team,\n\nPlease send a quotation for the following requirement.\n\n" + summaryText(d) + "\n\nThank you,\n" + d.name;
    if (body.length > 1800) body = body.slice(0, 1800) + "…";
    return "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function showStatus(kind, title, d, extra) {
    status.className = "notice notice--" + kind;
    status.textContent = "";
    status.appendChild(el("h3", null, title));
    if (d) {
      var ul = el("ul");
      LABELS.slice(0, 6).forEach(function (l) { ul.appendChild(el("li", null, l[1] + ": " + d[l[0]])); });
      status.appendChild(ul);
    }
    if (extra) extra(status);
    status.hidden = false;
    status.focus();
  }

  function draftActions(d) {
    return function (box) {
      box.appendChild(el("p", null, "Open the email draft below and press Send in your email app, or copy the enquiry and send it to " + recipient + "."));
      var actions = el("div", { "class": "notice__actions" });
      var mail = el("a", { "class": "btn btn--primary btn--sm", href: mailtoHref(d) }, "Open email draft");
      var copy = el("button", { type: "button", "class": "btn btn--ghost btn--sm" }, "Copy enquiry text");
      copy.addEventListener("click", function () {
        copyText(summaryText(d)).then(
          function () { copy.textContent = "Copied ✓"; },
          function () { copy.textContent = "Copy failed: select the text manually"; }
        );
      });
      actions.appendChild(mail);
      actions.appendChild(copy);
      box.appendChild(actions);
    };
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var ta = el("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error("copy failed"));
    });
  }

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.website.value) return; // honeypot: likely a bot

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      if (!validate(name) && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) {
      status.hidden = true;
      firstInvalid.focus();
      return;
    }

    var d = data();

    if (!endpoint) {
      showStatus("info", "Your enquiry is ready, but it has not been sent yet", d, draftActions(d));
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(Object.assign({ subject: "Quote request: " + d.company }, d))
    })
      .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); })
      .then(function () {
        showStatus("success", "Thank you, " + d.name + ". Your enquiry has been sent.", d, function (box) {
          box.appendChild(el("p", null, "The Geo Excel team will review your requirement and reply to " + d.email + "."));
        });
        enquiry.items().forEach(function (i) { enquiry.remove(i.slug); });
        form.reset();
        productsEdited = false;
      })
      .catch(function () {
        showStatus("error", "We couldn't send your enquiry", d, draftActions(d));
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send enquiry";
      });
  });
})();
