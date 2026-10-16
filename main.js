/* ==========================================================================
   Hornetsch — cozy art portfolio
   Plain, readable JavaScript. No frameworks, no bundler, no minification.
   Sections:
     01. Tiny helpers
     02. Toast messages
     03. Preloader
     04. Theme (day / night)
     05. Background scenery
     06. Custom cursor & sparkle trail
     07. Scroll effects (reveal, sticky bar, progress, counting numbers)
     08. Navigation
     09. Gallery filtering & shuffling
     10. Lightbox viewer
     11. Sound effects (Web Audio, generated live)
     12. Starter Scramble minigame
     13. Extra toys (confetti, easter eggs, footer year)
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     01. Tiny helpers
     ------------------------------------------------------------------------ */

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;

  function pick(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function pickAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function store(key, value) {
    try {
      if (typeof value === "undefined") {
        return window.localStorage.getItem(key);
      }
      window.localStorage.setItem(key, value);
      return value;
    } catch (error) {
      return null;
    }
  }

  /* ------------------------------------------------------------------------
     02. Toast messages
     ------------------------------------------------------------------------ */

  var toastEl = pick("#toast");
  var toastTimer = null;

  function toast(message, duration) {
    if (!toastEl) {
      return;
    }
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, duration || 2600);
  }

  /* ------------------------------------------------------------------------
     03. Preloader
     ------------------------------------------------------------------------ */

  var preloader = pick("#preloader");

  function hidePreloader() {
    if (!preloader) {
      return;
    }
    preloader.classList.add("is-done");
    window.setTimeout(function () {
      preloader.setAttribute("hidden", "hidden");
    }, 700);
  }

  window.addEventListener("load", function () {
    window.setTimeout(hidePreloader, 620);
  });

  window.setTimeout(hidePreloader, 4200);

  /* ------------------------------------------------------------------------
     04. Theme (day / night)
     ------------------------------------------------------------------------ */

  /* Day mode only: clear any night theme saved by an earlier visit. */
  store("hornet-theme", "day");
  root.setAttribute("data-theme", "day");

  /* ------------------------------------------------------------------------
     05. Background scenery
     ------------------------------------------------------------------------ */

  function buildStars() {
    var holder = pick("#bgStars");
    if (!holder || reduceMotion) {
      return;
    }
    var count = 70;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i += 1) {
      var star = document.createElement("span");
      star.style.left = random(0, 100).toFixed(2) + "%";
      star.style.top = random(0, 100).toFixed(2) + "%";
      star.style.animationDelay = (-random(0, 4)).toFixed(2) + "s";
      star.style.animationDuration = random(2.4, 6).toFixed(2) + "s";
      star.style.transform = "scale(" + random(0.5, 1.6).toFixed(2) + ")";
      frag.appendChild(star);
    }
    holder.appendChild(frag);
  }

  function buildFireflies() {
    var holder = pick("#bgFireflies");
    if (!holder || reduceMotion) {
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 18; i += 1) {
      var bug = document.createElement("span");
      bug.style.left = random(2, 96).toFixed(2) + "%";
      bug.style.top = random(4, 92).toFixed(2) + "%";
      bug.style.animationDelay = (-random(0, 14)).toFixed(2) + "s";
      bug.style.animationDuration = random(9, 18).toFixed(2) + "s";
      frag.appendChild(bug);
    }
    holder.appendChild(frag);
  }

  var stickerShapes = [
    '<svg viewBox="0 0 24 24"><path d="M12 2.6l2.9 6 6.6.6-5 4.3 1.5 6.5L12 16.6 6 20l1.5-6.5-5-4.3 6.6-.6z" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-7-10a4.6 4.6 0 0 1 7-3.9A4.6 4.6 0 0 1 19 11c0 5.4-7 10-7 10z" fill="currentColor"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 3l9 16H3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M4 14c0-4 4-7 8-7s8 3 8 7-4 5-8 5-8-1-8-5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 7V4M15 7V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 4c3 4 6 6 6 10a6 6 0 0 1-12 0c0-4 3-6 6-10z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M5 19c2-8 6-12 14-14-2 8-6 12-14 14z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  ];

  function buildStickers() {
    var holder = pick("#bgStickers");
    if (!holder || reduceMotion) {
      return;
    }
    var spots = [
      [6, 12, 46, -3], [22, 4, 34, -7], [88, 10, 40, -5], [72, 26, 30, -9],
      [10, 42, 38, -4], [92, 48, 44, -6], [4, 70, 34, -8], [80, 68, 42, -3],
      [30, 86, 36, -5], [58, 92, 30, -6], [46, 22, 26, -7], [66, 54, 28, -4]
    ];
    var frag = document.createDocumentFragment();
    spots.forEach(function (spot, index) {
      var node = document.createElement("span");
      node.style.left = spot[0] + "%";
      node.style.top = spot[1] + "%";
      node.style.setProperty("--size", spot[2] + "px");
      node.style.animationDelay = spot[3] + "s";
      node.style.animationDuration = random(12, 22).toFixed(2) + "s";
      node.innerHTML = stickerShapes[index % stickerShapes.length];
      frag.appendChild(node);
    });
    holder.appendChild(frag);
  }

  buildStars();
  buildFireflies();
  buildStickers();

  /* ------------------------------------------------------------------------
     06. Custom cursor & sparkle trail
     ------------------------------------------------------------------------ */

  var cursor = pick("#cursor");
  var cursorTrail = pick("#cursorTrail");
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  var cursorPos = { x: mouse.x, y: mouse.y };
  var lastSparkle = 0;

  if (canHover && !reduceMotion && cursor && cursorTrail) {
    document.body.classList.add("has-custom-cursor");

    document.addEventListener("mousemove", function (event) {
      mouse.x = event.clientX;
      mouse.y = event.clientY;

      var now = performance.now();
      if (now - lastSparkle > 46) {
        lastSparkle = now;
        var sparkle = document.createElement("i");
        sparkle.style.left = mouse.x + random(-4, 4).toFixed(1) + "px";
        sparkle.style.top = mouse.y + random(-4, 4).toFixed(1) + "px";
        sparkle.style.background = ["#ffc94d", "#ef7d9a", "#a98fe0", "#7fd8bf"][randomInt(0, 3)];
        cursorTrail.appendChild(sparkle);
        window.setTimeout(function () {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        }, 820);
      }
    });

    document.addEventListener("mouseover", function (event) {
      var target = event.target;
      var interactive = target.closest("a, button, .card, .hole, input, kbd");
      cursor.classList.toggle("is-hot", Boolean(interactive));
    });

    document.addEventListener("mouseleave", function () {
      cursor.style.opacity = "0";
    });

    document.addEventListener("mouseenter", function () {
      cursor.style.opacity = "1";
    });

    (function animateCursor() {
      cursorPos.x += (mouse.x - cursorPos.x) * 0.22;
      cursorPos.y += (mouse.y - cursorPos.y) * 0.22;
      cursor.style.transform = "translate3d(" + cursorPos.x.toFixed(2) + "px," + cursorPos.y.toFixed(2) + "px,0)";
      window.requestAnimationFrame(animateCursor);
    }());
  }

  /* ------------------------------------------------------------------------
     07. Scroll effects
     ------------------------------------------------------------------------ */

  var revealItems = pickAll(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -60px 0px" });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index % 6, 5) * 70 + "ms";
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  var topbar = pick("#topbar");
  var progressBar = pick("#scrollProgress span");
  var backToTop = pick("#backToTop");

  var nav = pick("#nav");
  var navToggle = pick("#navToggle");
  var navLinks = pickAll(".nav__link");
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("href");
      return id && id.charAt(0) === "#" ? pick(id) : null;
    })
    .filter(Boolean);

  function onScroll() {
    var scrolled = window.scrollY || window.pageYOffset;
    var height = document.documentElement.scrollHeight - window.innerHeight;
    if (topbar) {
      topbar.classList.toggle("is-stuck", scrolled > 24);
    }
    if (progressBar) {
      progressBar.style.width = (height > 0 ? clamp(scrolled / height, 0, 1) * 100 : 0) + "%";
    }
    updateActiveLink();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  var counters = pickAll("[data-count]");

  function runCounter(el) {
    var target = Number(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = 1400;
    var start = performance.now();

    function step(now) {
      var progress = clamp((now - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + (progress === 1 ? suffix : "");
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }

    window.requestAnimationFrame(step);
  }

  if (counters.length && "IntersectionObserver" in window && !reduceMotion) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (counter) {
      counterObserver.observe(counter);
    });
  } else {
    counters.forEach(function (counter) {
      counter.textContent = counter.getAttribute("data-count") + (counter.getAttribute("data-suffix") || "");
    });
  }

  /* ------------------------------------------------------------------------
     08. Navigation (the nav variables themselves are set up in section 07 so
     that the very first scroll update already knows about them)
     ------------------------------------------------------------------------ */

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        if (navToggle) {
          navToggle.setAttribute("aria-expanded", "false");
        }
      }
    });
  });

  function updateActiveLink() {
    if (!sections || !sections.length) {
      return;
    }
    var anchor = window.scrollY + window.innerHeight * 0.32;
    var current = null;
    sections.forEach(function (section) {
      if (section.offsetTop <= anchor) {
        current = section.id;
      }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + current);
    });
  }

  /* ------------------------------------------------------------------------
     09. Gallery filtering & shuffling
     ------------------------------------------------------------------------ */

  var galleryGrid = pick("#galleryGrid");
  var galleryEmpty = pick("#galleryEmpty");
  var filterButtons = pickAll("[data-filter]");
  var allCards = galleryGrid ? pickAll(".card", galleryGrid) : [];

  function activeFilter() {
    var current = filterButtons.filter(function (button) {
      return button.classList.contains("chip--active");
    })[0];
    return current ? current.getAttribute("data-filter") : "all";
  }

  function cardMatches(card, filter) {
    if (filter === "all") {
      return true;
    }
    var categories = (card.getAttribute("data-category") || "").split(/\s+/);
    return categories.indexOf(filter) !== -1;
  }

  /* Masonry: each card spans as many 4px grid rows as its height needs
     (margin included), so columns pack tightly and end level. */
  function sizeCard(card) {
    var rowUnit = 4;
    var style = window.getComputedStyle(card);
    var margin = parseFloat(style.marginBottom) || 0;
    var height = card.getBoundingClientRect().height;
    if (!height) {
      return;
    }
    card.style.gridRowEnd = "span " + Math.ceil((card.offsetHeight + margin) / rowUnit);
  }

  if (galleryGrid) {
    var sizeAll = function () {
      allCards.forEach(sizeCard);
    };
    if (window.ResizeObserver) {
      var cardObserver = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          sizeCard(entry.target);
        });
      });
      allCards.forEach(function (card) {
        cardObserver.observe(card);
      });
    }
    window.addEventListener("load", sizeAll);
    window.addEventListener("resize", sizeAll);
    sizeAll();
  }

  /* Chip counts are computed from the cards so they never go stale. */
  filterButtons.forEach(function (button) {
    var badge = pick(".chip__count", button);
    if (badge) {
      var total = allCards.filter(function (card) {
        return cardMatches(card, button.getAttribute("data-filter"));
      }).length;
      badge.textContent = String(total);
    }
  });

  function applyFilter(filter) {
    var shown = 0;
    allCards.forEach(function (card, index) {
      var match = cardMatches(card, filter);
      card.classList.toggle("is-hidden", !match);
      if (match) {
        shown += 1;
        card.style.animation = "none";
        void card.offsetWidth;
        card.style.animation = "card-in 0.5s cubic-bezier(0.2, 1.2, 0.4, 1) " + Math.min(index, 12) * 35 + "ms backwards";
      }
    });
    if (galleryEmpty) {
      galleryEmpty.hidden = shown !== 0;
    }
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterButtons.forEach(function (other) {
        other.classList.remove("chip--active");
      });
      button.classList.add("chip--active");
      applyFilter(button.getAttribute("data-filter"));
      var label = button.textContent.replace(/\s+/g, " ").trim();
      toast("Showing: " + label);
    });
  });

  allCards.forEach(function (card, index) {
    card.style.animationDelay = Math.min(index, 14) * 55 + "ms";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Open artwork: " + (card.getAttribute("data-title") || "untitled"));
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(card);
      }
    });
  });

  /* ------------------------------------------------------------------------
     10. Lightbox viewer
     ------------------------------------------------------------------------ */

  var lightbox = pick("#lightbox");
  var lightboxImage = pick("#lightboxImage");
  var lightboxTitle = pick("#lightboxTitle");
  var lightboxMeta = pick("#lightboxMeta");
  var lightboxIndex = pick("#lightboxIndex");
  var lightboxLoader = pick("#lightboxLoader");
  var lightboxClose = pick("#lightboxClose");
  var lightboxPrev = pick("#lightboxPrev");
  var lightboxNext = pick("#lightboxNext");
  var currentIndex = 0;
  var lastFocused = null;

  function visibleCards() {
    return allCards.filter(function (card) {
      return !card.classList.contains("is-hidden");
    });
  }

  function showCard(card, list) {
    if (!card || !lightbox) {
      return;
    }
    var items = list || visibleCards();
    currentIndex = items.indexOf(card);
    var full = card.getAttribute("data-title") || "Artwork";
    var meta = pick(".card__info p", card);
    var image = pick("img", card);

    lightboxTitle.textContent = full;
    lightboxMeta.textContent = meta ? meta.textContent : "";
    lightboxIndex.textContent = (currentIndex + 1) + " / " + items.length;
    lightboxLoader.classList.add("is-active");
    lightboxImage.classList.remove("is-loaded");
    lightboxImage.alt = image ? image.alt : full;

    var source = image.getAttribute("data-full") || image.getAttribute("src");
    var loader = new Image();
    loader.onload = function () {
      lightboxImage.src = source;
      lightboxLoader.classList.remove("is-active");
      lightboxImage.classList.add("is-loaded");
    };
    loader.onerror = function () {
      lightboxImage.src = image.getAttribute("src");
      lightboxLoader.classList.remove("is-active");
      lightboxImage.classList.add("is-loaded");
      toast("That file was too big to load, showing the smaller one.");
    };
    loader.src = source;
  }

  function openLightbox(card) {
    if (!lightbox) {
      return;
    }
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add("is-locked");
    window.requestAnimationFrame(function () {
      lightbox.classList.add("is-open");
    });
    showCard(card);
    if (lightboxClose) {
      lightboxClose.focus();
    }
    if (window.audio) {
      window.audio.blip(720, 0.08, "triangle", 0.06);
    }
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) {
      return;
    }
    lightbox.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    window.setTimeout(function () {
      lightbox.hidden = true;
    }, 320);
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }

  function stepLightbox(direction) {
    var items = visibleCards();
    if (!items.length) {
      return;
    }
    currentIndex = (currentIndex + direction + items.length) % items.length;
    var nextCard = items[currentIndex];
    showCard(nextCard, items);
    var thumbs = pickAll(".card", galleryGrid);
    if (thumbs.indexOf(nextCard) !== -1) {
      nextCard.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  allCards.forEach(function (card) {
    card.addEventListener("click", function () {
      openLightbox(card);
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }
  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", function () {
      stepLightbox(-1);
    });
  }
  if (lightboxNext) {
    lightboxNext.addEventListener("click", function () {
      stepLightbox(1);
    });
  }
  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  document.addEventListener("keydown", function (event) {
    if (lightbox && !lightbox.hidden) {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        stepLightbox(-1);
      } else if (event.key === "ArrowRight") {
        stepLightbox(1);
      }
      return;
    }
    if (event.key === "Escape" && nav && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
      }
    }
  });

  /* ------------------------------------------------------------------------
     11. Sound effects — generated live with the Web Audio API
     ------------------------------------------------------------------------ */

  var soundToggle = pick("#soundToggle");
  var soundEnabled = store("hornet-sound") !== "off";

  var audio = (function () {
    var context = null;
    var master = null;

    /* The context itself is created on the first user gesture no matter what,
       because browsers only allow audio to start from inside a gesture. The
       sound button simply turns the master gain up or down, so flipping it on
       works instantly instead of needing a second click. */
    function unlock() {
      if (!context) {
        var Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) {
          return null;
        }
        context = new Ctor();
        master = context.createGain();
        master.gain.value = soundEnabled ? 0.34 : 0;
        master.connect(context.destination);
      }
      if (context.state === "suspended") {
        context.resume();
      }
      return context;
    }

    function ensure() {
      if (!context) {
        return null;
      }
      return context;
    }

    function setEnabled(on) {
      soundEnabled = on;
      unlock();
      if (master) {
        master.gain.value = on ? 0.34 : 0;
      }
    }

    function tone(options) {
      var ctx = ensure();
      if (!ctx) {
        return;
      }
      var start = ctx.currentTime + (options.delay || 0);
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = options.type || "sine";
      osc.frequency.setValueAtTime(options.from, start);
      if (options.to && options.to !== options.from) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, options.to), start + options.duration);
      }
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(options.volume || 0.22, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + options.duration);
      osc.connect(gain);
      gain.connect(master);
      osc.start(start);
      osc.stop(start + options.duration + 0.03);
    }

    function noise(options) {
      var ctx = ensure();
      if (!ctx) {
        return;
      }
      var frames = Math.floor(ctx.sampleRate * options.duration);
      var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < frames; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      }
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      var filter = ctx.createBiquadFilter();
      filter.type = options.filter || "bandpass";
      filter.frequency.value = options.frequency || 900;
      var gain = ctx.createGain();
      gain.gain.value = options.volume || 0.2;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
    }

    return {
      blip: function (frequency, duration, type, volume) {
        tone({
          from: frequency,
          to: frequency * 0.94,
          duration: duration || 0.12,
          type: type || "triangle",
          volume: volume || 0.2
        });
      },
      ui: function () {
        tone({ from: 640, to: 880, duration: 0.09, type: "sine", volume: 0.12 });
      },
      fuecoco: function () {
        tone({ from: 320, to: 168, duration: 0.22, type: "sawtooth", volume: 0.2 });
        tone({ from: 640, to: 420, duration: 0.16, type: "triangle", volume: 0.12, delay: 0.03 });
      },
      quaxly: function () {
        tone({ from: 620, to: 1180, duration: 0.14, type: "square", volume: 0.13 });
        tone({ from: 980, to: 1420, duration: 0.14, type: "square", volume: 0.11, delay: 0.11 });
      },
      sprigatito: function () {
        tone({ from: 1180, to: 1900, duration: 0.1, type: "triangle", volume: 0.15 });
        tone({ from: 1500, to: 2300, duration: 0.1, type: "triangle", volume: 0.12, delay: 0.08 });
        tone({ from: 1900, to: 2600, duration: 0.09, type: "triangle", volume: 0.1, delay: 0.16 });
      },
      shiny: function () {
        [880, 1100, 1320, 1760].forEach(function (note, index) {
          tone({ from: note, to: note * 1.02, duration: 0.16, type: "sine", volume: 0.16, delay: index * 0.07 });
        });
      },
      miss: function () {
        noise({ duration: 0.16, frequency: 260, volume: 0.22, filter: "lowpass" });
      },
      count: function () {
        tone({ from: 520, to: 520, duration: 0.09, type: "square", volume: 0.12 });
      },
      finish: function () {
        [523, 659, 784, 1047].forEach(function (note, index) {
          tone({ from: note, to: note, duration: 0.34, type: "triangle", volume: 0.16, delay: index * 0.12 });
        });
      },
      unlock: unlock,
      setEnabled: setEnabled,
      get enabled() {
        return soundEnabled;
      }
    };
  }());

  window.audio = audio;

  /* Sound is on by default, but browsers block audio until the visitor
     interacts, so the context is unlocked on the very first gesture. */
  ["pointerdown", "keydown", "touchstart"].forEach(function (name) {
    window.addEventListener(name, function unlockOnce() {
      audio.unlock();
      window.removeEventListener(name, unlockOnce);
    }, { passive: true });
  });

  function renderSoundButton() {
    if (soundToggle) {
      soundToggle.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    }
  }

  renderSoundButton();

  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      var turningOn = !soundEnabled;
      store("hornet-sound", turningOn ? "on" : "off");
      audio.setEnabled(turningOn);
      renderSoundButton();
      if (turningOn) {
        audio.blip(880, 0.14, "sine", 0.18);
        toast("Sound on! The starters have voices now.");
      } else {
        toast("Sound off. Very peaceful.");
      }
    });
  }

  /* ------------------------------------------------------------------------
     12. Starter Scramble minigame
     ------------------------------------------------------------------------ */

  var starters = {
    fuecoco: {
      key: "fuecoco",
      name: "Fuecoco",
      sprite: "assets/sprites/fuecoco.png",
      ratio: 378 / 440,
      points: 10,
      rise: 0.34,
      life: [1800, 2300],
      sound: "fuecoco",
      weight: 38,
      colour: "#ff7a5c"
    },
    quaxly: {
      key: "quaxly",
      name: "Quaxly",
      sprite: "assets/sprites/Quaxly.png",
      ratio: 331 / 440,
      points: 20,
      rise: 0.27,
      life: [1350, 1800],
      sound: "quaxly",
      weight: 34,
      colour: "#5bc8e8"
    },
    sprigatito: {
      key: "sprigatito",
      name: "Sprigatito",
      sprite: "assets/sprites/sprigatito.png",
      ratio: 275 / 440,
      points: 30,
      rise: 0.22,
      life: [950, 1350],
      sound: "sprigatito",
      weight: 28,
      colour: "#7fd88f"
    }
  };

  var starterList = [starters.fuecoco, starters.quaxly, starters.sprigatito];

  var board = pick("#gameBoard");
  var fxLayer = pick("#gameFx");
  var holes = board ? pickAll(".hole", board) : [];
  var hudScore = pick("#hudScore");
  var hudCombo = pick("#hudCombo");
  var hudTime = pick("#hudTime");
  var hudBest = pick("#hudBest");
  var hudComboChip = pick("#hudComboChip");
  var hudTimeChip = hudTime ? hudTime.closest(".hud-chip") : null;
  var overlayStart = pick("#gameStart");
  var overlayPause = pick("#gamePaused");
  var overlayOver = pick("#gameOver");
  var gameToast = pick("#gameToast");
  var startButton = pick("#gameStartBtn");
  var resumeButton = pick("#gameResumeBtn");
  var againButton = pick("#gameAgainBtn");
  var closeButton = pick("#gameCloseBtn");
  var pauseButton = pick("#gamePause");
  var resetBestButton = pick("#gameResetBest");

  var DURATION = 45;
  var TICK = 90;

  var game = {
    state: "idle",
    score: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    misses: 0,
    hitsSinceShiny: 0,
    elapsed: 0,
    remaining: DURATION,
    lastTick: 0,
    accumulator: 0,
    nextSpawn: 700,
    active: 0
  };

  var highScore = Number(store("hornet-scramble-best") || 0);

  if (hudBest) {
    hudBest.textContent = highScore;
  }

  function setToggle(element, on, className) {
    if (element) {
      element.classList.toggle(className, on);
    }
  }

  function showGameToast(message, duration) {
    if (!gameToast) {
      return;
    }
    gameToast.textContent = message;
    gameToast.classList.add("is-visible");
    window.clearTimeout(showGameToast.timer);
    showGameToast.timer = window.setTimeout(function () {
      gameToast.classList.remove("is-visible");
    }, duration || 1500);
  }

  function difficulty() {
    var progress = clamp(game.elapsed / DURATION, 0, 1);
    return {
      interval: 660 - progress * 400,
      lifeScale: 1 - progress * 0.34,
      maxActive: 2 + Math.round(progress * 2)
    };
  }

  function makeSprite(starter, shiny) {
    var image = document.createElement("img");
    image.src = starter.sprite;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    image.setAttribute("decoding", "async");
    image.draggable = false;
    image.style.aspectRatio = starter.ratio.toFixed(3);
    if (shiny) {
      image.classList.add("is-shiny");
    }
    return image;
  }

  function spawn() {
    if (game.active >= difficulty().maxActive) {
      return;
    }
    var free = holes.filter(function (hole) {
      return !hole.__sprite;
    });
    if (!free.length) {
      return;
    }
    var hole = free[randomInt(0, free.length - 1)];
    var shiny = game.hits > 0 && game.hits % 11 === 0 && !game.shinyGiven;
    var starter;

    if (shiny) {
      starter = starterList[randomInt(0, 2)];
      game.shinyGiven = true;
    } else {
      var roll = random(0, 100);
      var running = 0;
      starter = starters.fuecoco;
      for (var i = 0; i < starterList.length; i += 1) {
        running += starterList[i].weight;
        if (roll <= running) {
          starter = starterList[i];
          break;
        }
      }
    }

    var image = makeSprite(starter, shiny);
    var slot = pick(".hole__slot", hole);
    slot.appendChild(image);

    var factor = difficulty().lifeScale;
    var lifetime = random(starter.life[0], starter.life[1]) * factor;
    if (shiny) {
      lifetime = 1500;
    }

    hole.__sprite = {
      element: image,
      starter: starter,
      shiny: shiny,
      upAt: performance.now(),
      dieAt: performance.now() + lifetime,
      points: shiny ? 150 : starter.points
    };

    game.active += 1;
    window.requestAnimationFrame(function () {
      image.classList.add("is-up");
    });
    if (shiny) {
      audio.shiny();
      showGameToast("A sparkly guest appeared! Worth 150!");
    }
  }

  function clearSprite(hole, keepElement) {
    var data = hole.__sprite;
    if (!data) {
      return null;
    }
    if (!keepElement && data.element && data.element.parentNode) {
      data.element.parentNode.removeChild(data.element);
    }
    hole.__sprite = null;
    game.active = Math.max(0, game.active - 1);
    return data;
  }

  function removeAfterAnimation(element, delay) {
    window.setTimeout(function () {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, delay);
  }

  function bumpChip(chip) {
    if (!chip) {
      return;
    }
    chip.classList.remove("is-bumped");
    void chip.offsetWidth;
    chip.classList.add("is-bumped");
  }

  function spawnParticles(x, y, colour, amount) {
    if (!fxLayer || reduceMotion) {
      return;
    }
    for (var i = 0; i < amount; i += 1) {
      var spark = document.createElement("i");
      spark.className = "fx-spark";
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      spark.style.background = colour;
      spark.style.setProperty("--dx", random(-90, 90).toFixed(0) + "px");
      spark.style.setProperty("--dy", random(-110, 40).toFixed(0) + "px");
      spark.style.animationDelay = random(0, 0.08).toFixed(2) + "s";
      fxLayer.appendChild(spark);
      removeAfterAnimation(spark, 900);
    }
  }

  function popText(x, y, text, variant) {
    if (!fxLayer) {
      return;
    }
    var node = document.createElement("span");
    node.className = "fx-pop" + (variant ? " fx-pop--" + variant : "");
    node.textContent = text;
    node.style.left = x + "px";
    node.style.top = y + "px";
    fxLayer.appendChild(node);
    removeAfterAnimation(node, 950);
  }

  function holeCentre(hole) {
    var stage = pick(".game__stage");
    var box = hole.getBoundingClientRect();
    var stageBox = stage ? stage.getBoundingClientRect() : { left: 0, top: 0 };
    return {
      x: box.left - stageBox.left + box.width / 2,
      y: box.top - stageBox.top + box.height * 0.42
    };
  }

  function updateHud() {
    if (hudScore) {
      hudScore.textContent = game.score;
    }
    if (hudCombo) {
      hudCombo.textContent = game.combo;
    }
    if (hudTime) {
      hudTime.textContent = Math.ceil(Math.max(0, game.remaining));
    }
    setToggle(hudTimeChip, game.remaining <= 10 && game.state === "playing", "is-urgent");
  }

  function registerMiss(hole) {
    if (game.state !== "playing") {
      return;
    }
    game.misses += 1;
    if (game.combo > 0) {
      showGameToast("Combo broken at " + game.combo + "!");
    }
    game.combo = 0;
    audio.miss();
    if (hole) {
      setToggle(hole, true, "is-missed");
      window.setTimeout(function () {
        hole.classList.remove("is-missed");
      }, 420);
    }
    updateHud();
  }

  function whack(hole) {
    if (game.state !== "playing") {
      return;
    }
    var data = hole.__sprite;
    var now = performance.now();

    if (!data || now - data.upAt < 110 || now > data.dieAt) {
      registerMiss(hole);
      return;
    }

    var centre = holeCentre(hole);
    var gained = Math.round(data.points * (1 + game.combo * 0.1));
    game.score += gained;
    game.hits += 1;
    game.combo += 1;
    game.hitsSinceShiny += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);

    if (data.shiny) {
      audio.shiny();
      popText(centre.x, centre.y, "+" + gained + " SHINY!", "shiny");
      spawnParticles(centre.x, centre.y, "#ffd7f0", 26);
      showGameToast("Sparkly catch! +" + gained);
    } else {
      audio[data.starter.sound]();
      popText(centre.x, centre.y, "+" + gained);
      spawnParticles(centre.x, centre.y, data.starter.colour, 12);
    }

    if (game.combo >= 3) {
      popText(centre.x, centre.y - 34, "combo x" + game.combo + "!", "combo");
    }

    data.element.classList.remove("is-up");
    data.element.classList.add("is-hit");
    hole.classList.add("is-whacked");
    window.setTimeout(function () {
      hole.classList.remove("is-whacked");
    }, 420);

    var element = data.element;
    clearSprite(hole, true);
    removeAfterAnimation(element, 520);

    bumpChip(hudComboChip);
    if (game.combo === 5) {
      toast("Five in a row! The hornets are buzzing.");
    }
    updateHud();
  }

  function tick() {
    if (game.state !== "playing") {
      return;
    }
    var now = performance.now();
    var delta = now - game.lastTick;
    game.lastTick = now;
    game.elapsed += delta / 1000;
    game.remaining -= delta / 1000;
    game.accumulator += delta;

    if (game.remaining <= 10 && Math.ceil(game.remaining) !== game.lastCountdown) {
      game.lastCountdown = Math.ceil(game.remaining);
      if (game.lastCountdown >= 1 && game.lastCountdown <= 5) {
        audio.count();
      }
    }

    holes.forEach(function (hole) {
      var data = hole.__sprite;
      if (data && now > data.dieAt) {
        data.element.classList.remove("is-up");
        data.element.classList.add("is-hiding");
        var element = data.element;
        clearSprite(hole, true);
        removeAfterAnimation(element, 320);
      }
    });

    if (game.accumulator >= game.nextSpawn) {
      game.accumulator = 0;
      var settings = difficulty();
      game.nextSpawn = settings.interval * random(0.75, 1.25);
      spawn();
    }

    updateHud();

    if (game.remaining <= 0) {
      finishGame();
      return;
    }

    window.setTimeout(tick, TICK);
  }

  function resetBoard() {
    holes.forEach(function (hole) {
      clearSprite(hole, false);
      hole.classList.remove("is-missed", "is-whacked");
      var slot = pick(".hole__slot", hole);
      if (slot) {
        slot.innerHTML = "";
      }
    });
  }

  function showOverlay(overlay) {
    [overlayStart, overlayPause, overlayOver].forEach(function (item) {
      if (item) {
        item.classList.toggle("game__overlay--active", item === overlay);
      }
    });
  }

  function startGame() {
    audio.unlock();
    game.state = "playing";
    game.score = 0;
    game.combo = 0;
    game.bestCombo = 0;
    game.hits = 0;
    game.misses = 0;
    game.hitsSinceShiny = 0;
    game.shinyGiven = false;
    game.elapsed = 0;
    game.remaining = DURATION;
    game.accumulator = 0;
    game.nextSpawn = 420;
    game.lastTick = performance.now();
    game.lastCountdown = null;

    resetBoard();
    showOverlay(null);
    updateHud();
    showGameToast("Go! Boop them!");
    audio.blip(760, 0.14, "sine", 0.18);
    window.setTimeout(tick, TICK);
  }

  function pauseGame(showMessage) {
    if (game.state !== "playing") {
      return;
    }
    game.state = "paused";
    showOverlay(overlayPause);
    if (showMessage) {
      audio.blip(420, 0.16, "sine", 0.14);
    }
  }

  function resumeGame() {
    if (game.state !== "paused") {
      return;
    }
    game.state = "playing";
    game.lastTick = performance.now();
    showOverlay(null);
    audio.blip(620, 0.12, "sine", 0.14);
    window.setTimeout(tick, TICK);
  }

  function rankFor(score) {
    if (score >= 2600) {
      return { rank: "S+", title: "Absolutely scrambled!", verdict: "The starters have formed a fan club in your honour." };
    }
    if (score >= 1900) {
      return { rank: "S", title: "Sprigatito speed!", verdict: "You barely missed a single one. Very impressive paws." };
    }
    if (score >= 1300) {
      return { rank: "A", title: "Great scrambling!", verdict: "Sharp eyes and quick hands. The bushes are nervous." };
    }
    if (score >= 800) {
      return { rank: "B", title: "Solid booping!", verdict: "A very respectable haul of startled starters." };
    }
    if (score >= 350) {
      return { rank: "C", title: "Getting the hang of it", verdict: "A few got away, but the vibes were excellent." };
    }
    return { rank: "D", title: "The starters won this round", verdict: "They were faster than you today. Rematch?" };
  }

  function finishGame() {
    game.state = "over";
    var total = game.hits + game.misses;
    var accuracy = total > 0 ? Math.round((game.hits / total) * 100) : 0;
    var result = rankFor(game.score);
    var newBest = game.score > highScore;

    if (newBest) {
      highScore = game.score;
      store("hornet-scramble-best", String(highScore));
      if (hudBest) {
        hudBest.textContent = highScore;
      }
    }

    var rankEl = pick("#resultRank");
    var titleEl = pick("#resultTitle");
    var scoreEl = pick("#resultScore");
    var comboEl = pick("#resultCombo");
    var accuracyEl = pick("#resultAccuracy");
    var bestEl = pick("#resultBest");
    var verdictEl = pick("#resultVerdict");

    if (rankEl) {
      rankEl.textContent = result.rank;
    }
    if (titleEl) {
      titleEl.textContent = result.title;
    }
    if (scoreEl) {
      scoreEl.textContent = game.score;
    }
    if (comboEl) {
      comboEl.textContent = game.bestCombo;
    }
    if (accuracyEl) {
      accuracyEl.textContent = accuracy + "%";
    }
    if (bestEl) {
      bestEl.textContent = highScore;
    }
    if (verdictEl) {
      verdictEl.textContent = newBest ? "A brand new high score! " + result.verdict : result.verdict;
    }

    resetBoard();
    showOverlay(overlayOver);
    audio.finish();
    if (newBest) {
      burstConfetti(60);
      toast("New high score: " + highScore + "! \u2728");
    }
    updateHud();
  }

  holes.forEach(function (hole) {
    hole.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      if (game.state === "playing") {
        whack(hole);
      } else if (game.state === "idle" || game.state === "over") {
        showGameToast("Press start when you are ready!");
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    var gameSection = pick("#game");
    var visible = gameSection && gameSection.getBoundingClientRect().top < window.innerHeight && gameSection.getBoundingClientRect().bottom > 0;
    if (!visible) {
      return;
    }
    if (event.key === " " && (game.state === "idle" || game.state === "over")) {
      event.preventDefault();
      startGame();
      return;
    }
    var digit = Number(event.key);
    if (digit >= 1 && digit <= 9) {
      var hole = holes[digit - 1];
      if (hole && game.state === "playing") {
        whack(hole);
      }
    }
  });

  if (startButton) {
    startButton.addEventListener("click", startGame);
  }
  if (againButton) {
    againButton.addEventListener("click", startGame);
  }
  if (resumeButton) {
    resumeButton.addEventListener("click", resumeGame);
  }
  if (closeButton) {
    closeButton.addEventListener("click", function () {
      game.state = "idle";
      resetBoard();
      updateHud();
      showOverlay(overlayStart);
      var gameSection = pick("#game");
      if (gameSection) {
        gameSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  }
  if (pauseButton) {
    pauseButton.addEventListener("click", function () {
      if (game.state === "playing") {
        pauseGame(true);
      } else if (game.state === "paused") {
        resumeGame();
      }
    });
  }
  if (resetBestButton) {
    resetBestButton.addEventListener("click", function () {
      highScore = 0;
      store("hornet-scramble-best", "0");
      if (hudBest) {
        hudBest.textContent = "0";
      }
      toast("High score cleared. Fresh start!");
      audio.blip(340, 0.2, "sine", 0.16);
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && game.state === "playing") {
      pauseGame(false);
    }
  });

  updateHud();

  /* ------------------------------------------------------------------------
     13. Extra toys
     ------------------------------------------------------------------------ */

  /* Confetti lives in a fixed, full-screen layer so it rains across whatever
     part of the page you are actually looking at — the button that fires it is
     right down at the bottom of the page. */
  function burstConfetti(amount) {
    if (reduceMotion) {
      return;
    }
    var holder = pick("#confettiLayer");
    if (!holder) {
      return;
    }
    var colours = ["#ffc94d", "#ef7d9a", "#a98fe0", "#7fd8bf", "#ffb35c", "#fff0b8"];
    for (var i = 0; i < amount; i += 1) {
      var piece = document.createElement("i");
      piece.style.left = random(0, 100).toFixed(2) + "%";
      piece.style.background = colours[randomInt(0, colours.length - 1)];
      piece.style.animationDuration = random(2.6, 5.4).toFixed(2) + "s";
      piece.style.animationDelay = random(0, 0.6).toFixed(2) + "s";
      piece.style.width = random(8, 16).toFixed(0) + "px";
      piece.style.height = random(11, 22).toFixed(0) + "px";
      piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "3px";
      piece.style.animationIterationCount = "1";
      piece.style.top = "-8%";
      holder.appendChild(piece);
      removeAfterAnimation(piece, 6600);
    }
  }

  var confettiButton = pick("#confettiBtn");
  if (confettiButton) {
    confettiButton.addEventListener("click", function () {
      burstConfetti(90);
      audio.unlock();
      audio.blip(900, 0.12, "triangle", 0.16);
      window.setTimeout(function () {
        audio.blip(1200, 0.14, "triangle", 0.14);
      }, 110);
      toast("Confetti! Thanks for scrolling all the way down.");
    });
  }

  var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var konamiIndex = 0;

  document.addEventListener("keydown", function (event) {
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (key === konami[konamiIndex]) {
      konamiIndex += 1;
      if (konamiIndex === konami.length) {
        konamiIndex = 0;
        burstConfetti(140);
        audio.unlock();
        audio.shiny();
        toast("You found the secret! \u2728 Hornetsch approves of your curiosity.");
      }
    } else {
      konamiIndex = key === konami[0] ? 1 : 0;
    }
  });

  var yearEl = pick("#year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener(
    "pointerdown",
    function () {
      audio.unlock();
    },
    { once: true }
  );

  toast("Welcome! Click any piece to see it big.", 3400);
}());
