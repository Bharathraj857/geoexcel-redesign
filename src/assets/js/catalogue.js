/* Category filter + search for product grids marked with [data-catalogue].
   Cards are rendered at build time; this only shows/hides them. */
(function () {
  "use strict";

  document.querySelectorAll("[data-catalogue]").forEach(function (root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll(".card"));
    var chips = root.querySelectorAll("[data-cat]");
    var search = root.querySelector("[data-search]");
    var count = root.querySelector("[data-result-count]");
    var empty = root.querySelector("[data-empty]");
    var state = { cat: "all", q: "" };

    // Allow deep links such as products.html?category=spices
    var params = new URLSearchParams(window.location.search);
    var initialCat = params.get("category");
    if (initialCat && root.querySelector('[data-cat="' + CSS.escape(initialCat) + '"]')) state.cat = initialCat;

    function apply() {
      var terms = state.q.split(/\s+/).filter(Boolean);
      var visible = 0;
      cards.forEach(function (card) {
        var text = card.dataset.search || "";
        var match = (state.cat === "all" || card.dataset.category === state.cat) &&
          terms.every(function (t) { return text.indexOf(t) !== -1; });
        card.hidden = !match;
        if (match) visible++;
      });
      chips.forEach(function (chip) { chip.setAttribute("aria-pressed", String(chip.dataset.cat === state.cat)); });
      if (count) count.textContent = visible + (visible === 1 ? " product" : " products");
      if (empty) empty.hidden = visible > 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { state.cat = chip.dataset.cat; apply(); });
    });

    if (search) {
      search.addEventListener("input", function () { state.q = search.value.trim().toLowerCase(); apply(); });
    }

    apply();
  });
})();
