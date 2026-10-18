(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 60) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");

    var scrollTop = document.getElementById("scroll-top");
    if (scrollTop) {
      if (window.scrollY > 500) scrollTop.classList.add("is-visible");
      else scrollTop.classList.remove("is-visible");
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("navmenu");

  function closeNav() {
    if (!navMenu) return;
    navMenu.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
  }
  function openNav() {
    if (!navMenu) return;
    navMenu.classList.add("is-open");
    document.body.classList.add("nav-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "true");
    var firstLink = navMenu.querySelector("a");
    if (firstLink) firstLink.focus({ preventScroll: true });
  }
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      navMenu.classList.contains("is-open") ? closeNav() : openNav();
    });
    navMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Scroll-to-top ---------- */
  var scrollTopBtn = document.getElementById("scroll-top");
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Hero slider ---------- */
  var hero = document.querySelector(".hero");
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var current = slides.findIndex(function (s) { return s.classList.contains("is-active"); });
    if (current < 0) current = 0;
    var timer = null;
    var DELAY = 6500;

    function show(index) {
      slides[current].classList.remove("is-active");
      if (dots[current]) dots[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      if (dots[current]) dots[current].classList.add("is-active");
    }
    function next() { show(current + 1); }
    function prev() { show(current - 1); }
    function play() {
      if (reduceMotion || slides.length < 2) return;
      stop();
      timer = window.setInterval(next, DELAY);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    hero.querySelectorAll(".hero-arrow").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.dataset.dir === "next" ? next() : prev();
        play();
      });
    });
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () { show(i); play(); });
    });
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", play);
    hero.addEventListener("focusin", stop);
    hero.addEventListener("focusout", play);
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stop() : play();
    });

    play();
  }

  /* ---------- Cinema / video ---------- */
  document.querySelectorAll(".cinema").forEach(function (cinema) {
    var playBtn = cinema.querySelector(".play-btn");
    var frame = cinema.querySelector(".cinema-frame");
    if (!playBtn || !frame) return;
    playBtn.addEventListener("click", function () {
      var src = frame.getAttribute("data-src");
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = "DaNuts video";
      iframe.allow = "accelerated-3d-css; autoplay; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      frame.innerHTML = "";
      frame.appendChild(iframe);
      frame.classList.add("is-open");
    });
  });

  /* ---------- Contact form ---------- */
  document.querySelectorAll(".php-email-form").forEach(function (form) {
    var loading = form.querySelector(".form-status.loading");
    var errorEl = form.querySelector(".form-status.error");
    var successEl = form.querySelector(".form-status.success");

    function setState(state, message) {
      [loading, errorEl, successEl].forEach(function (el) {
        if (el) el.classList.remove("is-visible");
      });
      if (state === "loading" && loading) loading.classList.add("is-visible");
      if (state === "error" && errorEl) {
        errorEl.textContent = message || "Ndodhi një gabim. Provo përsëri.";
        errorEl.classList.add("is-visible");
      }
      if (state === "success" && successEl) successEl.classList.add("is-visible");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action");
      if (!action) { setState("error", "Formulari nuk është konfiguruar."); return; }
      setState("loading");

      fetch(action, {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Requested-With": "XMLHttpRequest" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status + " " + res.statusText);
          return res.text();
        })
        .then(function (data) {
          if (data.trim() === "OK") {
            setState("success");
            form.reset();
          } else {
            throw new Error(data || "Dërgimi dështoi.");
          }
        })
        .catch(function (err) {
          setState("error", String(err.message || err));
        });
    });
  });

  /* ---------- Product orders ---------- */
  var ORDER_ENDPOINT = "https://formsubmit.co/ajax/ramadansylejmani1992@gmail.com";
  var FREE_SHIPPING_OVER_KG = 5;
  var PRODUCTS = {
    lajthi: { name: "Lajthi", price: 5, image: "assets/img/product-lajthi-bowl.jpg", alt: "Lajthi në enë druri" },
    arra: { name: "Arra", price: 7, image: "assets/img/product-arra-bowl.jpg", alt: "Arra në enë druri" }
  };
  var orderForm = document.getElementById("order-form");
  if (orderForm) {
    var key = new URLSearchParams(window.location.search).get("p");
    var orderKey = PRODUCTS[key] ? key : "lajthi";
    var order = PRODUCTS[orderKey];
    var qtyInput = document.getElementById("order-qty");
    var totalEl = document.getElementById("order-total");
    var shipEl = document.getElementById("order-ship");
    var successEl2 = document.getElementById("order-success");
    var orderLoading = orderForm.querySelector(".form-status.loading");
    var orderError = orderForm.querySelector(".form-status.error");

    var img = document.getElementById("order-image");
    img.src = order.image; img.alt = order.alt;
    document.getElementById("order-product-name").textContent = order.name;
    document.getElementById("order-price").textContent = order.price + " €";
    document.getElementById("crumb-product").textContent = order.name;
    document.title = "Porosit " + order.name + " | DaNuts";
    document.querySelectorAll("[data-switch]").forEach(function (a) {
      if (a.dataset["switch"] === orderKey) a.classList.add("is-active");
    });

    function getQty() {
      var q = parseInt(qtyInput.value, 10);
      return isNaN(q) || q < 1 ? 0 : q;
    }
    function updateTotal() {
      var q = getQty();
      totalEl.textContent = (q * order.price) + " €";
      shipEl.hidden = !(q > FREE_SHIPPING_OVER_KG);
    }
    function setOrderState(state, msg) {
      orderLoading.classList.toggle("is-visible", state === "loading");
      orderError.classList.toggle("is-visible", state === "error");
      if (state === "error") orderError.textContent = msg;
    }
    qtyInput.addEventListener("input", updateTotal);
    updateTotal();

    orderForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = orderForm.elements;
      var qty = getQty();
      var name = f.name.value.trim(), phone = f.phone.value.trim(), address = f.address.value.trim();
      if (f._honey.value) return;
      if (!qty) return setOrderState("error", "Shkruani një sasi të vlefshme (të paktën 1 kg).");
      if (!name || !address) return setOrderState("error", "Plotësoni emrin dhe adresën.");
      if (phone.replace(/\D/g, "").length < 8) return setOrderState("error", "Shkruani një numër telefoni të vlefshëm.");

      var free = qty > FREE_SHIPPING_OVER_KG;
      setOrderState("loading");
      fetch(ORDER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          _subject: "Porosi e re: " + qty + " kg " + order.name + " — " + name,
          _template: "table",
          _captcha: "false",
          Produkti: order.name,
          "Sasia (kg)": qty,
          "Çmimi për kg": order.price + " €",
          Totali: (qty * order.price) + " €",
          Posta: free ? "Falas (mbi 5 kg)" : "Sipas marrëveshjes",
          Emri: name,
          Telefoni: phone,
          Adresa: address,
          "Shënime": f.notes.value.trim() || "—"
        })
      })
        .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, d: d }; }); })
        .then(function (r) {
          if (!r.ok || String(r.d.success) !== "true") throw new Error(r.d.message || "Dërgimi dështoi.");
          setOrderState("idle");
          orderForm.querySelectorAll("h2, .field, .order-total, .order-ship, .form-foot").forEach(function (el) { el.hidden = true; });
          successEl2.hidden = false;
        })
        .catch(function (err) {
          if (window.console) console.warn("Order not sent:", err && err.message);
          setOrderState("error", "Porosia nuk u dërgua. Provoni përsëri ose na telefononi: +383 49 794 177.");
        });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
