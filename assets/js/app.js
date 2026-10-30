/* ============================================================================
   L'EMPREINTE — comportements (JS vanilla, zéro dépendance, zéro réseau)
   Tout est une amélioration progressive : sans JS, le site reste lisible.
   ========================================================================== */
(function () {
  "use strict";
  var d = document;
  var reduceOs = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var reduceUser = localStorage.getItem("empreinte-reduce") === "1";
  if (reduceUser) d.documentElement.classList.add("reduce");
  var reduce = reduceOs || reduceUser;

  /* ── menu mobile ─────────────────────────────────────────────────────── */
  var burger = d.querySelector("[data-burger]");
  var nav = d.querySelector(".hd__nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.getAttribute("data-open") === "true";
      nav.setAttribute("data-open", String(!open));
      burger.setAttribute("aria-expanded", String(!open));
      burger.textContent = open ? "Menu" : "Fermer";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.setAttribute("data-open", "false"); burger.textContent = "Menu"; }
    });
  }

  /* ── barre de progression + en-tête ──────────────────────────────────── */
  var prog = d.querySelector(".progress i");
  var hd = d.querySelector(".hd");
  function onScroll() {
    var h = d.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    if (prog) prog.style.width = (p * 100).toFixed(2) + "%";
    if (hd) hd.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ── mouvement réduit (bouton) ───────────────────────────────────────── */
  d.querySelectorAll("[data-reduce]").forEach(function (btn) {
    btn.setAttribute("aria-pressed", reduceUser ? "true" : "false");
    btn.addEventListener("click", function () {
      var on = d.documentElement.classList.toggle("reduce");
      localStorage.setItem("empreinte-reduce", on ? "1" : "0");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  /* ── révélations (repli sans animation-timeline) ─────────────────────── */
  var supportsTimeline = CSS.supports("animation-timeline: view()");
  var rv = d.querySelectorAll("[data-rv]");
  if (!supportsTimeline && "IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ── jauges de précision ─────────────────────────────────────────────── */
  d.querySelectorAll(".jauge").forEach(function (j) {
    var v = j.getAttribute("data-v") || "100";
    j.style.setProperty("--v", v + "%");
    if ("IntersectionObserver" in window) {
      var o = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { j.classList.add("is-in"); o.disconnect(); } }, { threshold: .3 });
      o.observe(j);
    } else { j.classList.add("is-in"); }
  });

  /* ── compteurs ───────────────────────────────────────────────────────── */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = (el.getAttribute("data-dec") || "0") | 0;
    if (isNaN(target)) return;
    if (reduce) { el.textContent = target.toFixed(dec).replace(".", ","); return; }
    var t0 = performance.now(), dur = 1400;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = (target * e).toFixed(dec).replace(".", ",");
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); co.unobserve(en.target); }
      });
    }, { threshold: .5 });
    d.querySelectorAll("[data-count]").forEach(function (el) { co.observe(el); });
  } else {
    d.querySelectorAll("[data-count]").forEach(animateCount);
  }

  /* ── quiz ────────────────────────────────────────────────────────────── */
  var scoreEl = d.querySelector("[data-quiz-score]");
  if (scoreEl) {
    var good = 0, answered = 0, total = d.querySelectorAll(".quiz__q").length;
    scoreEl.textContent = "0 / " + total;
    d.querySelectorAll(".quiz__q").forEach(function (q) {
      q.querySelectorAll(".quiz__opt").forEach(function (opt) {
        opt.addEventListener("click", function () {
          if (q.dataset.done) return;
          q.dataset.done = "1";
          answered++;
          var ok = opt.dataset.i === q.dataset.a;
          opt.dataset.state = ok ? "ok" : "no";
          if (!ok) {
            var right = q.querySelector('.quiz__opt[data-i="' + q.dataset.a + '"]');
            if (right) right.dataset.state = "ok";
          } else { good++; }
          var src = q.querySelector(".quiz__src");
          if (src) src.hidden = false;
          scoreEl.textContent = good + " / " + total + (answered === total ? " — terminé" : "");
        });
      });
    });
  }

  /* ── calculateur des 70 semaines (Daniel 9) ──────────────────────────── */
  var sem = d.querySelector("[data-calc-semaines]");
  if (sem) {
    var out = d.querySelector("[data-semaines-out]");
    var dep = d.querySelector("[data-semaines-dep]");
    function renderSemaines() {
      var start = parseInt(dep.value, 10); /* année négative = av. n. è. */
      function toYear(n) { /* n années écoulées depuis le 1er janvier de start */
        var y = start + n;
        if (start < 0 && y >= 0) y += 1; /* pas d'année zéro */
        return y;
      }
      function fmt(y) { return y < 0 ? Math.abs(y) + " av. n. è." : y + " de n. è."; }
      out.innerHTML =
        "<strong>Départ :</strong> " + fmt(start) +
        " · <strong>+ 7 semaines (49 ans) :</strong> " + fmt(toYear(49)) + " — Jérusalem rebâtie" +
        " · <strong>+ 62 semaines (483 ans) :</strong> " + fmt(toYear(483)) + " — le Messie paraît" +
        " · <strong>+ 70 semaines (490 ans) :</strong> " + fmt(toYear(490)) + " — fin de la période";
      if (dep) dep.setAttribute("aria-valuetext", fmt(start));
    }
    if (dep) { dep.addEventListener("input", renderSemaines); renderSemaines(); }
    else { var dep0 = d.querySelector("[data-semaines-dep]"); if (dep0) renderSemaines(); }
  }

  /* ── calculateur des sept temps (Daniel 4) ───────────────────────────── */
  var st = d.querySelector("[data-calc-sept]");
  if (st) {
    var res = d.querySelector("[data-sept-out]");
    function renderSept() {
      var start = parseInt(st.value, 10);
      var total = 7 * 360; /* sept années prophétiques */
      var y = start + total;
      if (start < 0 && y >= 0) y += 1;
      res.innerHTML = "De <strong>" + (start < 0 ? Math.abs(start) + " av. n. è." : start + " de n. è.") +
        "</strong>, " + total + " ans plus tard : <strong>" +
        (y < 0 ? Math.abs(y) + " av. n. è." : y + " de n. è.") + "</strong> — sans année zéro.";
      st.setAttribute("aria-valuetext", String(start));
    }
    st.addEventListener("input", renderSept); renderSept();
  }

  /* ── filtres (preuves, prophéties, frise) ────────────────────────────── */
  d.querySelectorAll("[data-filter-group]").forEach(function (group) {
    var targetSel = group.getAttribute("data-filter-group");
    var items = d.querySelectorAll(targetSel);
    group.querySelectorAll("button[data-f]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-f");
        group.querySelectorAll("button[data-f]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        items.forEach(function (it) {
          var keep = f === "tout" || (it.getAttribute("data-kind") || "").split(" ").indexOf(f) !== -1;
          it.hidden = !keep;
        });
      });
    });
  });

  /* ── recherche plein texte ───────────────────────────────────────────── */
  var searchInput = d.querySelector("[data-search]");
  if (searchInput) {
    var box = d.querySelector("[data-search-res]");
    var index = [];
    var inline = d.getElementById("search-data");
    if (inline) {
      try { index = JSON.parse(inline.textContent); } catch (e) { index = []; }
    }
    if (!index.length) {
      fetch("search-index.json").then(function (r) { return r.json(); }).then(function (data) {
        index = data; var qs = new URLSearchParams(location.search).get("q");
        if (qs) { searchInput.value = qs; run(qs); }
      }).catch(function () { /* file:// : l'index embarqué suffit */ });
    } else {
      var qs0 = new URLSearchParams(location.search).get("q");
      if (qs0) { searchInput.value = qs0; run(qs0); }
    }
    function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
    function run(q) {
      var nq = norm(q).trim();
      if (nq.length < 2) { box.innerHTML = "<p class='muted'>Tapez au moins deux lettres.</p>"; return; }
      var hits = index.map(function (it) {
        var t = norm(it.t), x = norm(it.x);
        var score = 0;
        if (t.indexOf(nq) !== -1) score += 6;
        if (x.indexOf(nq) !== -1) score += 2;
        nq.split(/\s+/).forEach(function (w) { if (w.length > 2 && x.indexOf(w) !== -1) score += 1; });
        return { it: it, score: score };
      }).filter(function (h) { return h.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 24);
      box.innerHTML = hits.length ? hits.map(function (h) {
        return '<a class="search__hit" href="' + h.it.u + '"><b>' + h.it.t + '</b><span>' + h.it.x.slice(0, 150) + '…</span></a>';
      }).join("") : "<p class='muted'>Aucun résultat. Essayez « Cyrus », « cerveau », « eau », « Tyr ».</p>";
    }
    var timer;
    searchInput.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { run(searchInput.value); }, 140);
    });
  }

  /* ── frise : navigation clavier ──────────────────────────────────────── */
  d.querySelectorAll("[data-frise]").forEach(function (f) {
    f.setAttribute("tabindex", "0");
    f.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { f.scrollLeft += 220; e.preventDefault(); }
      if (e.key === "ArrowLeft") { f.scrollLeft -= 220; e.preventDefault(); }
    });
  });

  /* ── ciel étoilé en canvas (accueil) ─────────────────────────────────── */
  var cv = d.querySelector("[data-stars]");
  if (cv && !reduce) {
    var ctx = cv.getContext("2d"), stars = [], w, h, raf;
    function size() {
      var r = cv.getBoundingClientRect();
      w = cv.width = Math.max(320, r.width * devicePixelRatio);
      h = cv.height = Math.max(240, r.height * devicePixelRatio);
      stars = [];
      var n = Math.min(420, Math.round(w * h / 9000));
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + .35, a: Math.random() * .6 + .2, s: Math.random() * .12 + .02 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(function (s) {
        s.a += s.s * .02; if (s.a > .95 || s.a < .15) s.s *= -1;
        ctx.beginPath();
        ctx.fillStyle = "rgba(247,243,234," + s.a.toFixed(3) + ")";
        ctx.arc(s.x, s.y, s.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    size();
    window.addEventListener("resize", size);
    draw();
    d.addEventListener("visibilitychange", function () {
      if (d.hidden) cancelAnimationFrame(raf); else draw();
    });
  }

  /* ── parallaxe légère (images de salle) ──────────────────────────────── */
  var par = d.querySelectorAll("[data-parallax]");
  if (par.length && !reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        par.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
          var k = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          el.style.transform = "translate3d(0," + (k * -26).toFixed(1) + "px,0)";
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ── audio : mémorisation de la position ─────────────────────────────── */
  d.querySelectorAll("audio[data-remember]").forEach(function (a) {
    var key = "empreinte-audio-" + a.getAttribute("data-remember");
    var t = parseFloat(localStorage.getItem(key) || "0");
    if (t > 3) a.currentTime = t;
    a.addEventListener("timeupdate", function () { localStorage.setItem(key, String(a.currentTime)); });
  });
})();
