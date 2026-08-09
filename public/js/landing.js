/* Landing page interactions — nav state, scroll reveals, hero parallax + tilt.
   Everything here is progressive: the page is fully readable with JS off. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktop = window.matchMedia("(min-width: 900px) and (pointer: fine)");

  /* ---------------------------------------------------------------- nav */
  var nav = document.getElementById("nav");
  var stuck = false;

  function syncNav() {
    var next = window.scrollY > 12;
    if (next !== stuck) {
      stuck = next;
      nav.classList.toggle("is-stuck", stuck);
    }
  }

  /* ------------------------------------------------------------ reveals
     The hidden state lives behind .js-anim on <html>, added only once we know
     we can undo it — so a missing/blocked script can never leave the page
     blank. A late sweep also catches anything the observer missed. */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));

  var pending = reveals;

  function revealAllInView() {
    if (!pending.length) return;
    pending = pending.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add("in");
        return false;
      }
      return true;
    });
  }

  if ("IntersectionObserver" in window && !reduced) {
    document.documentElement.classList.add("js-anim");

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });

    // failsafe — never leave on-screen content stuck at opacity 0
    setTimeout(revealAllInView, 1500);
    window.addEventListener("load", revealAllInView, { once: true });
  }

  /* ------------------------------------------------- hero parallax/tilt */
  var stage = document.getElementById("stage");
  var space = document.getElementById("stageSpace");
  var hero = document.getElementById("hero");
  var ticking = false;
  var parallaxOn = false;

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        syncNav();
        revealAllInView();
        if (!parallaxOn) return;
        var h = hero.offsetHeight || 1;
        var y = Math.min(window.scrollY, h);
        // one shared value; each layer multiplies it by its own --f factor
        stage.style.setProperty("--p", y + "px");
      });
    }
  }

  var tiltRaf = 0;
  function onPointer(ev) {
    if (tiltRaf) return;
    tiltRaf = requestAnimationFrame(function () {
      tiltRaf = 0;
      var mx = (ev.clientX / window.innerWidth - 0.5) * 2;   // -1 .. 1
      var my = (ev.clientY / window.innerHeight - 0.5) * 2;
      space.style.setProperty("--mx", mx.toFixed(3));
      space.style.setProperty("--my", (-my).toFixed(3));
    });
  }

  function enableParallax(on) {
    parallaxOn = on;
    if (on) {
      window.addEventListener("pointermove", onPointer, { passive: true });
    } else {
      window.removeEventListener("pointermove", onPointer);
      if (space) {
        space.style.removeProperty("--mx");
        space.style.removeProperty("--my");
      }
      if (stage) stage.style.removeProperty("--p");
    }
  }

  if (stage && space && hero && !reduced) {
    enableParallax(desktop.matches);
    var onChange = function (e) {
      enableParallax(e.matches);
    };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else desktop.addListener(onChange); // Safari < 14
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  syncNav();
})();
