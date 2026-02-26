/* =========================================================
   Brand Work Page — app.js (Upgraded)
   - Post modal (single + carousel, swipe/drag, animated transitions)
   - Tabs: Posts / Carousels / System with smooth transitions
   - Highlights: Story modal with progress + auto-advance
   - Per-brand accent via CSS vars (optional: data-accent on .brand-page)
   ========================================================= */

(() => {
  "use strict";

  /* -------------------------
     Helpers
  ------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const normalize = (s) => String(s || "").toLowerCase().trim();

  const splitPipe = (pipeString) =>
    normalize(pipeString).length
      ? pipeString.split("|").map((s) => s.trim()).filter(Boolean)
      : [];

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  /* -------------------------
     Elements (Core)
  ------------------------- */
  const brandPage = $("#brandPage") || $(".brand-page") || document.body;

  // Posts grid + posts
  const grid = $("#flyerGrid");
  const posts = grid ? $$(".post", grid) : [];

  // Stats
  const statPosts = $("#stat-posts");

  // Tabs
  const tabButtons = $$("[data-tab]");
  const systemSection = $("#results") || $(".case"); // system panel target
  const searchInput = $('[data-action="search"]');

  // Post Modal
  const modal = $("#modal");
  const modalPanel = modal ? $(".modal__panel", modal) : null;
  const backdrop = modal ? $(".modal__backdrop", modal) : null;
  const closeButtons = modal ? $$('[data-action="close"]', modal) : [];

  const viewer = modal ? $(".viewer", modal) : null;
  const viewerMedia = modal ? $("#viewerMedia", modal) : null;
  const viewerDots = modal ? $("#viewerDots", modal) : null;
  const btnPrev = modal ? $('[data-action="prev"]', modal) : null;
  const btnNext = modal ? $('[data-action="next"]', modal) : null;

  const detailsTitle = modal ? $("#detailsTitle") : null;
  const detailsClient = modal ? $("#detailsClient") : null;
  const detailsCaption = modal ? $("#detailsCaption") : null;
  const detailsType = modal ? $("#detailsType") : null;
  const detailsYear = modal ? $("#detailsYear") : null;
  const detailsTags = modal ? $("#detailsTags") : null;
  const copyLinkBtn = modal ? $('[data-action="copyLink"]', modal) : null;

  /* -------------------------
     Per-brand accent (optional)
     You can set:
       <div class="brand-page" data-accent="#7c3aed" data-accent2="#22c55e">
     Or inline style:
       style="--accent:#7c3aed; --accent2:#22c55e;"
  ------------------------- */
  function applyBrandAccentFromData() {
    if (!brandPage?.dataset) return;
    const a1 = brandPage.dataset.accent;
    const a2 = brandPage.dataset.accent2;
    if (a1) brandPage.style.setProperty("--accent", a1);
    if (a2) brandPage.style.setProperty("--accent2", a2);
  }
  applyBrandAccentFromData();

  /* =========================================================
     1) POST MODAL (Single + Carousel)
     ========================================================= */
  let activePostEl = null;
  let activeImages = [];
  let activeIndex = 0;
  let activeType = "single";
  let lastFocusedEl = null;
  let isTransitioning = false;

  function setViewerMode() {
    if (!viewer) return;
    if (activeType === "single" || activeImages.length <= 1) viewer.classList.add("is-single");
    else viewer.classList.remove("is-single");
  }

  function renderDots() {
    if (!viewerDots) return;
    viewerDots.innerHTML = "";
    if (activeType !== "carousel" || activeImages.length <= 1) return;

    activeImages.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      if (i === activeIndex) dot.classList.add("is-active");
      dot.addEventListener("click", () => {
        if (isTransitioning || i === activeIndex) return;
        const dir = i > activeIndex ? "next" : "prev";
        activeIndex = i;
        syncCarouselUI({ withAnim: true, dir });
      });
      viewerDots.appendChild(dot);
    });
  }

  function setNavDisabledStates() {
    if (!btnPrev || !btnNext) return;
    if (activeType !== "carousel" || activeImages.length <= 1) {
      btnPrev.classList.add("is-disabled");
      btnNext.classList.add("is-disabled");
      return;
    }
    btnPrev.classList.remove("is-disabled");
    btnNext.classList.remove("is-disabled");
  }

  function renderMedia({ withAnim = false, dir = "next" } = {}) {
    if (!viewerMedia) return;
    const src = activeImages[activeIndex];
    if (!src) return;

    if (!withAnim || prefersReducedMotion) {
      viewerMedia.innerHTML = "";
      const img = document.createElement("img");
      img.alt = `${detailsTitle?.textContent || "Flyer"} — slide ${activeIndex + 1}`;
      img.src = src;
      img.loading = "eager";
      viewerMedia.appendChild(img);
      return;
    }

    const current = viewerMedia.querySelector("img");

    const incoming = document.createElement("img");
    incoming.alt = `${detailsTitle?.textContent || "Flyer"} — slide ${activeIndex + 1}`;
    incoming.src = src;
    incoming.loading = "eager";
    incoming.classList.add("is-in");

    viewerMedia.dataset.dir = dir;
    viewerMedia.classList.add("is-animating");
    viewerMedia.appendChild(incoming);

    if (current) current.classList.add("is-out");

    requestAnimationFrame(() => {
      incoming.classList.remove("is-in");

      const done = () => {
        viewerMedia.classList.remove("is-animating");
        const imgs = $$("img", viewerMedia);
        imgs.slice(0, -1).forEach((img) => img.remove());
        viewerMedia.querySelector("img")?.classList.remove("is-out");
        isTransitioning = false;
      };

      viewerMedia.addEventListener("transitionend", done, { once: true });
      setTimeout(() => { if (isTransitioning) done(); }, 420);
    });
  }

  function syncCarouselUI({ withAnim = false, dir = "next" } = {}) {
    activeIndex = clamp(activeIndex, 0, Math.max(0, activeImages.length - 1));
    renderMedia({ withAnim, dir });
    renderDots();
    setViewerMode();
    setNavDisabledStates();
    updateUrlHash();
  }

  function openModalFromPost(postEl) {
    if (!modal || !postEl) return;

    activePostEl = postEl;
    lastFocusedEl = document.activeElement;

    const type = postEl.dataset.type || "single";
    const title = postEl.dataset.title || "Untitled";
    const client = postEl.dataset.client || "Client";
    const year = postEl.dataset.year || "";
    const caption = postEl.dataset.caption || "";
    const tags = postEl.dataset.tags || "";

    detailsTitle && (detailsTitle.textContent = title);
    detailsClient && (detailsClient.textContent = client);
    detailsYear && (detailsYear.textContent = year);
    detailsCaption && (detailsCaption.textContent = caption);
    detailsTags && (detailsTags.textContent = tags);
    detailsType && (detailsType.textContent = type === "carousel" ? "Carousel" : "Flyer");

    activeType = type;

    if (type === "carousel") {
      activeImages = splitPipe(postEl.dataset.images);
      if (!activeImages.length && postEl.dataset.image) activeImages = [postEl.dataset.image];
    } else {
      activeImages = [postEl.dataset.image].filter(Boolean);
    }

    activeIndex = 0;
    isTransitioning = false;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    syncCarouselUI({ withAnim: false });

    $(".modal__close", modal)?.focus?.({ preventScroll: true });
  }

  function closeModal() {
    if (!modal?.classList.contains("is-open")) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    viewerMedia && (viewerMedia.innerHTML = "");
    viewerDots && (viewerDots.innerHTML = "");

    activePostEl = null;
    activeImages = [];
    activeIndex = 0;
    activeType = "single";
    isTransitioning = false;

    if (lastFocusedEl?.focus) lastFocusedEl.focus({ preventScroll: true });
    clearUrlHash();
  }

  function nextSlide() {
    if (activeType !== "carousel" || activeImages.length <= 1) return;
    if (isTransitioning) return;
    isTransitioning = true;

    activeIndex = (activeIndex + 1) % activeImages.length;
    syncCarouselUI({ withAnim: true, dir: "next" });
  }

  function prevSlide() {
    if (activeType !== "carousel" || activeImages.length <= 1) return;
    if (isTransitioning) return;
    isTransitioning = true;

    activeIndex = (activeIndex - 1 + activeImages.length) % activeImages.length;
    syncCarouselUI({ withAnim: true, dir: "prev" });
  }

  // Drag/Swipe (pointer)
  let dragActive = false;
  let startX = 0, currentX = 0, startY = 0;
  const DRAG_THRESHOLD = 50;
  const VERTICAL_TOL = 18;

  function setImgTransform(x) {
    const img = viewerMedia?.querySelector("img");
    if (!img) return;
    img.style.transform = `translateX(${x}px)`;
  }
  function resetImgTransform() {
    const img = viewerMedia?.querySelector("img");
    if (!img) return;
    img.style.transform = "";
  }

  function onPointerDown(e) {
    if (!modal?.classList.contains("is-open")) return;
    if (activeType !== "carousel" || activeImages.length <= 1) return;
    if (isTransitioning) return;

    dragActive = true;
    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;

    viewerMedia?.classList.add("is-grabbing");
    viewerMedia?.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e) {
    if (!dragActive) return;

    currentX = e.clientX;
    const dx = currentX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dy) > Math.abs(dx) + VERTICAL_TOL) {
      dragActive = false;
      viewerMedia?.classList.remove("is-grabbing");
      resetImgTransform();
      return;
    }

    setImgTransform(dx * 0.85);
  }

  function onPointerUp() {
    if (!dragActive) return;
    const dx = currentX - startX;
    dragActive = false;

    viewerMedia?.classList.remove("is-grabbing");

    if (dx <= -DRAG_THRESHOLD) { resetImgTransform(); nextSlide(); return; }
    if (dx >= DRAG_THRESHOLD)  { resetImgTransform(); prevSlide(); return; }

    const img = viewerMedia?.querySelector("img");
    if (img) {
      img.style.transition = "transform .18s ease";
      resetImgTransform();
      setTimeout(() => { img.style.transition = ""; }, 200);
    }
  }

  // Focus trap (simple)
  function trapFocus(e) {
    if (!modalPanel) return;
    const focusables = $$(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      modalPanel
    ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onKeyDown(e) {
    // Post modal keys
    if (modal?.classList.contains("is-open")) {
      if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
      if (activeType === "carousel") {
        if (e.key === "ArrowRight") { e.preventDefault(); nextSlide(); }
        if (e.key === "ArrowLeft")  { e.preventDefault(); prevSlide(); }
      }
      if (e.key === "Tab") trapFocus(e);
    }

    // Story modal keys handled later
  }

  document.addEventListener("keydown", onKeyDown);

  // Wire posts
  posts.forEach((post) => {
    post.addEventListener("click", () => openModalFromPost(post));
    post.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModalFromPost(post);
      }
    });
  });

  // Wire modal
  closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));
  backdrop?.addEventListener("click", closeModal);
  btnNext?.addEventListener("click", nextSlide);
  btnPrev?.addEventListener("click", prevSlide);
  viewerMedia?.addEventListener("pointerdown", onPointerDown);
  viewerMedia?.addEventListener("pointermove", onPointerMove);
  viewerMedia?.addEventListener("pointerup", onPointerUp);
  viewerMedia?.addEventListener("pointercancel", onPointerUp);

  /* -------------------------
     Deep link hash for posts
  ------------------------- */
  function postSlug(postEl) {
    const title = normalize(postEl.dataset.title)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const year = normalize(postEl.dataset.year).replace(/[^0-9]+/g, "");
    const idx = posts.indexOf(postEl);
    return `${title || "post"}-${year || "0000"}-${idx}`;
  }

  function updateUrlHash() {
    if (!activePostEl) return;
    const slug = postSlug(activePostEl);
    const slide = activeType === "carousel" ? `s${activeIndex + 1}` : "s1";
    history.replaceState(null, "", `#p=${encodeURIComponent(slug)}&${slide}`);
  }

  function clearUrlHash() {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }

  async function copyCurrentLink() {
    const url = location.href;
    try {
      await navigator.clipboard.writeText(url);
      flashButton(copyLinkBtn, "Copied ✓");
    } catch {
      const temp = document.createElement("input");
      temp.value = url;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      temp.remove();
      flashButton(copyLinkBtn, "Copied ✓");
    }
  }

  function flashButton(btn, text) {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 900);
  }

  copyLinkBtn?.addEventListener("click", copyCurrentLink);

  function tryOpenFromHash() {
    if (!location.hash.startsWith("#p=")) return;

    const hash = location.hash.slice(1);
    const parts = hash.split("&");
    const pPart = parts.find((x) => x.startsWith("p="));
    const sPart = parts.find((x) => x.startsWith("s"));
    if (!pPart) return;

    const slug = decodeURIComponent(pPart.slice(2));
    const slideNum = sPart ? parseInt(sPart.replace(/[^\d]/g, ""), 10) : 1;

    const target = posts.find((p) => postSlug(p) === slug);
    if (!target) return;

    openModalFromPost(target);

    if ((target.dataset.type || "single") === "carousel") {
      activeIndex = clamp((slideNum || 1) - 1, 0, Math.max(0, activeImages.length - 1));
      syncCarouselUI({ withAnim: false });
    }
  }

  tryOpenFromHash();
  window.addEventListener("hashchange", () => {
    if (!location.hash && modal?.classList.contains("is-open")) closeModal();
    if (location.hash.startsWith("#p=") && !modal?.classList.contains("is-open")) tryOpenFromHash();
  });

  /* =========================================================
     2) TABS: Posts / Carousels / System
     ========================================================= */
  let activeTab = "posts";
  let activeQuery = "";

  function setActiveTab(btn) {
    tabButtons.forEach((b) => {
      b.classList.remove("is-active");
      b.setAttribute("aria-selected", "false");
    });

    btn.classList.add("is-active");
    btn.setAttribute("aria-selected", "true");
    activeTab = btn.dataset.tab || "posts";

    animatePanelSwitch();
    applyTabAndSearch();
  }

  function animatePanelSwitch() {
    // Fade out panels quickly, then update, then fade in
    grid?.classList.add("is-switching-panel");
    systemSection?.classList.add("is-switching-panel");

    setTimeout(() => {
      grid?.classList.remove("is-switching-panel");
      systemSection?.classList.remove("is-switching-panel");
    }, prefersReducedMotion ? 0 : 180);
  }

  function matchesQuery(postEl, query) {
    if (!query) return true;
    const hay = [
      postEl.dataset.title,
      postEl.dataset.client,
      postEl.dataset.caption,
      postEl.dataset.tags,
      postEl.dataset.category,
      postEl.dataset.year,
    ].map(normalize).join(" ");
    return hay.includes(query);
  }

  function matchesTab(postEl, tab) {
    const cat = normalize(postEl.dataset.category);
    const type = normalize(postEl.dataset.type);

    if (tab === "posts") return cat.includes("posts") || type === "single";
    if (tab === "carousels") return cat.includes("carousels") || type === "carousel";
    if (tab === "system") return false;
    return true;
  }

  function applyTabAndSearch() {
    // System tab: hide grid, show system section
    if (activeTab === "system") {
      if (grid) grid.style.display = "none";
      if (systemSection) systemSection.style.display = "";
      if (statPosts) statPosts.textContent = "—";
      return;
    }

    if (grid) grid.style.display = "";
    if (systemSection) systemSection.style.display = "none";

    let visibleCount = 0;

    posts.forEach((post) => {
      const show = matchesTab(post, activeTab) && matchesQuery(post, activeQuery);
      post.style.display = show ? "" : "none";
      if (show) visibleCount++;
    });

    if (statPosts) statPosts.textContent = String(visibleCount);
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => setActiveTab(btn));
  });

  searchInput?.addEventListener("input", (e) => {
    activeQuery = normalize(e.target.value);
    applyTabAndSearch();
  });

  // Default state on load
  // If your HTML sets Posts as active already, this keeps it aligned
  applyTabAndSearch();

  /* =========================================================
     3) STORIES MODAL FOR HIGHLIGHTS
     ========================================================= */

  // Build story modal once (no HTML changes needed)
  const story = document.createElement("div");
  story.className = "story";
  story.innerHTML = `
    <div class="story__backdrop" data-story-close="1"></div>

    <div class="story__panel" role="dialog" aria-label="Highlight story" aria-hidden="true">
      <button class="story__close" type="button" aria-label="Close story" data-story-close="1">✕</button>

      <div class="story__top">
        <div class="story__progress" id="storyProgress"></div>

        <div class="story__meta">
          <div class="story__avatar" aria-hidden="true">
            <img id="storyAvatar" src="" alt="">
          </div>
          <div>
            <div class="story__title" id="storyTitle">Highlight</div>
            <div class="story__subtitle" id="storySubtitle">Tap to advance</div>
          </div>
        </div>
      </div>

      <div class="story__media" id="storyMedia"></div>

      <div class="story__tap story__tap--prev" data-story-prev="1" aria-hidden="true"></div>
      <div class="story__tap story__tap--next" data-story-next="1" aria-hidden="true"></div>

      <div class="story__caption" id="storyCaption" style="display:none"></div>
    </div>
  `;
  document.body.appendChild(story);

  const storyPanel = $(".story__panel", story);
  const storyProgress = $("#storyProgress", story);
  const storyMedia = $("#storyMedia", story);
  const storyTitle = $("#storyTitle", story);
  const storySubtitle = $("#storySubtitle", story);
  const storyAvatar = $("#storyAvatar", story);
  const storyCaption = $("#storyCaption", story);

  const highlightButtons = $$("[data-highlight]"); // your existing markup

  let storySlides = [];
  let storyIndex = 0;
  let storyTimer = null;
  let storyStart = 0;
  const STORY_DURATION = 5200; // ms per slide (IG-ish)

  function buildProgressBars(count) {
    storyProgress.innerHTML = "";
    for (let i = 0; i < count; i++) {
      const bar = document.createElement("div");
      bar.className = "story__bar";
      bar.innerHTML = `<i></i>`;
      storyProgress.appendChild(bar);
    }
  }

  function setProgress(i, pct) {
    const bars = $$(".story__bar > i", storyProgress);
    bars.forEach((b, idx) => {
      if (idx < i) b.style.width = "100%";
      else if (idx === i) b.style.width = `${pct}%`;
      else b.style.width = "0%";
    });
  }

  function renderStorySlide() {
    const slide = storySlides[storyIndex];
    if (!slide) return;

    storyMedia.innerHTML = "";
    const img = document.createElement("img");
    img.src = slide.src;
    img.alt = slide.alt || `Story slide ${storyIndex + 1}`;
    storyMedia.appendChild(img);

    if (slide.caption) {
      storyCaption.style.display = "";
      storyCaption.textContent = slide.caption;
    } else {
      storyCaption.style.display = "none";
      storyCaption.textContent = "";
    }

    setProgress(storyIndex, 0);
  }

  function tickStory() {
    const now = performance.now();
    const elapsed = now - storyStart;
    const pct = clamp((elapsed / STORY_DURATION) * 100, 0, 100);
    setProgress(storyIndex, pct);

    if (elapsed >= STORY_DURATION) {
      nextStory();
    } else {
      storyTimer = requestAnimationFrame(tickStory);
    }
  }

  function startStoryTimer() {
    stopStoryTimer();
    storyStart = performance.now();
    if (prefersReducedMotion) return; // don’t auto-advance if reduced motion
    storyTimer = requestAnimationFrame(tickStory);
  }

  function stopStoryTimer() {
    if (storyTimer) cancelAnimationFrame(storyTimer);
    storyTimer = null;
  }

  function openStory({ title, subtitle, avatarSrc, slides }) {
    storySlides = slides || [];
    storyIndex = 0;

    storyTitle.textContent = title || "Highlight";
    storySubtitle.textContent = subtitle || "Tap to advance";
    storyAvatar.src = avatarSrc || "";

    buildProgressBars(storySlides.length || 1);

    story.classList.add("is-open");
    storyPanel.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    renderStorySlide();
    startStoryTimer();
  }

  function closeStory() {
    if (!story.classList.contains("is-open")) return;
    stopStoryTimer();

    story.classList.remove("is-open");
    storyPanel.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    storySlides = [];
    storyIndex = 0;
    storyMedia.innerHTML = "";
    storyProgress.innerHTML = "";
  }

  function nextStory() {
    stopStoryTimer();
    if (storyIndex < storySlides.length - 1) {
      storyIndex++;
      renderStorySlide();
      startStoryTimer();
    } else {
      closeStory();
    }
  }

  function prevStory() {
    stopStoryTimer();
    if (storyIndex > 0) {
      storyIndex--;
      renderStorySlide();
      startStoryTimer();
    } else {
      // restart current
      renderStorySlide();
      startStoryTimer();
    }
  }

  // Wire highlight buttons:
  // Recommended: add data-story="img1|img2|img3" and optional data-captions="cap1|cap2|cap3"
  // If data-story is missing, it will use the highlight’s <img src> as a single slide.
  function getHighlightSlides(btn) {
    const storyPipe = btn.dataset.story;         // optional
    const capsPipe = btn.dataset.captions;       // optional

    const sources = storyPipe ? splitPipe(storyPipe) : [];
    const captions = capsPipe ? splitPipe(capsPipe) : [];

    // fallback: use highlight image inside ring
    if (!sources.length) {
      const img = $("img", btn);
      if (img?.src) sources.push(img.src);
    }

    return sources.map((src, i) => ({
      src,
      caption: captions[i] || "",
      alt: `${btn.dataset.highlight || "highlight"} slide ${i + 1}`
    }));
  }

  highlightButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const title = btn.dataset.highlight || "Highlight";
      const avatar = $(".hero__avatar img")?.src || $("img", btn)?.src || "";
      const slides = getHighlightSlides(btn);

      openStory({
        title: title.charAt(0).toUpperCase() + title.slice(1),
        subtitle: slides.length > 1 ? "Tap / click to advance" : "Tap to close",
        avatarSrc: avatar,
        slides
      });
    });
  });

  // Story controls
  story.addEventListener("click", (e) => {
    const t = e.target;

    if (t?.dataset?.storyClose) { closeStory(); return; }
    if (t?.dataset?.storyNext)  { nextStory(); return; }
    if (t?.dataset?.storyPrev)  { prevStory(); return; }
  });

  // Keyboard for story
  document.addEventListener("keydown", (e) => {
    if (!story.classList.contains("is-open")) return;

    if (e.key === "Escape") { e.preventDefault(); closeStory(); }
    if (e.key === "ArrowRight") { e.preventDefault(); nextStory(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prevStory(); }
  });

})();