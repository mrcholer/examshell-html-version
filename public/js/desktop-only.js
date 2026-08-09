/* ===========================================================================
   Desktop-only gate for /examshell.
   The exam shell is a keyboard workspace: Monaco, a real terminal, split panes
   and hand-typed C. There is no usable phone layout, so phones and tablets are
   turned away rather than served something broken.

   "Request desktop site" must not get through, so device detection never
   trusts the UA string alone:
     · navigator.userAgentData.mobile stays true on Android in desktop mode
     · iOS/iPadOS desktop mode reports a Mac UA but keeps multi-touch
     · a coarse, hover-less primary pointer means a touchscreen is the only
       input — true on phones/tablets whatever the UA claims
   A touchscreen laptop still has a fine, hovering primary pointer, so it is
   correctly treated as a desktop.

   Loaded blocking in <head> so the app never boots on a blocked device.
   =========================================================================== */
(function () {
  "use strict";

  var MIN_WIDTH = 1000;

  function isMobileDevice() {
    var nav = window.navigator || {};
    var ua = nav.userAgent || "";

    // 1. Client Hints — survives Chrome for Android's "Desktop site"
    var uaData = nav.userAgentData;
    if (uaData && typeof uaData.mobile === "boolean") {
      if (uaData.mobile) return true;
    }

    // 2. Plain UA sniff — catches everything not spoofing
    if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(ua)) return true;

    // 3. iPad / iPhone asking for the desktop site claims to be a Mac,
    //    but no Mac has a multi-touch screen
    if (/Mac|iPad/i.test(nav.platform || "") && (nav.maxTouchPoints || 0) > 1) return true;

    // 4. Primary input is a finger — a phone or tablet regardless of the UA
    if (window.matchMedia) {
      var coarse = window.matchMedia("(pointer: coarse)").matches;
      var noHover = window.matchMedia("(hover: none)").matches;
      if (coarse && noHover && (nav.maxTouchPoints || 0) > 0) return true;
    }

    return false;
  }

  function gate(kind) {
    var narrow = kind === "narrow";
    var el = document.createElement("div");
    el.className = "gate" + (narrow ? " gate-narrow" : "");
    el.id = "device-gate";
    el.innerHTML =
      '<div class="gate-card">' +
      '<div class="gate-logo">42</div>' +
      '<h1>' + (narrow ? "Window too narrow" : "Desktop only") + "</h1>" +
      '<p class="gate-lede">' +
      (narrow
        ? "The exam shell needs at least " + MIN_WIDTH +
          "px of width for the editor, subject pane and terminal. Widen this window to continue."
        : "Poolers Exam Shell runs on a computer only. It is a keyboard workspace — " +
          "a code editor, a real terminal and a subject pane side by side — and there is no " +
          "phone or tablet layout, in desktop mode or otherwise.") +
      "</p>" +
      '<div class="gate-req">' +
      '<div><span class="gate-req-k">Need</span><span class="gate-req-v">a laptop or desktop</span></div>' +
      '<div><span class="gate-req-k">Input</span><span class="gate-req-v">physical keyboard</span></div>' +
      '<div><span class="gate-req-k">Width</span><span class="gate-req-v">' + MIN_WIDTH + "px or more</span></div>" +
      "</div>" +
      '<a class="gate-back" href="/">← Back to the landing page</a>' +
      "</div>";
    return el;
  }

  function mount(kind) {
    var existing = document.getElementById("device-gate");
    if (existing) {
      if (existing.classList.contains("gate-narrow") === (kind === "narrow")) return;
      existing.remove();
    }
    document.body.appendChild(gate(kind));
    document.documentElement.classList.add("is-gated");
  }

  function unmount() {
    var existing = document.getElementById("device-gate");
    if (existing) existing.remove();
    document.documentElement.classList.remove("is-gated");
  }

  var blocked = isMobileDevice();

  // Hard block: the app must not boot at all. examshell.js checks this.
  window.__EXAM_BLOCKED = blocked;

  function sync() {
    if (blocked) return mount("device");
    if (window.innerWidth < MIN_WIDTH) return mount("narrow");
    unmount();
  }

  function start() {
    sync();
    if (!blocked) window.addEventListener("resize", sync, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
