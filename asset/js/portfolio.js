/* =========================================================
   Instagram Replica JS
   - Click post -> open modal
   - Carousel posts -> swipe/arrow keys/buttons/dots
   - Tabs filter: posts / carousels / system
   - Search filter
   - Copy link + copy brand link + back to top
   ========================================================= */

(() => {
  const grid = document.getElementById("flyerGrid");
  const modal = document.getElementById("modal");
  const viewerMedia = document.getElementById("viewerMedia");
  const viewerDots = document.getElementById("viewerDots");

  const detailsTitle = document.getElementById("detailsTitle");
  const detailsCaption = document.getElementById("detailsCaption");
  const detailsType = document.getElementById("detailsType");
  const detailsYear = document.getElementById("detailsYear");
  const detailsTags = document.getElementById("detailsTags");
  const detailsClient = document.getElementById("detailsClient");

  const prevBtn = modal?.querySelector('[data-action="prev"]');
  const nextBtn = modal?.querySelector('[data-action="next"]');

  const statPosts = document.getElementById("stat-posts");

  const tabs = Array.from(document.querySelectorAll(".ig-tab"));
  const searchInput = document.querySelector('[data-action="search"]');

  if (!grid || !modal) return;

  const posts = Array.from(grid.querySelectorAll(".post"));
  if (statPosts) statPosts.textContent = String(posts.length);

  let activePostEl = null;
  let activeIndex = 0;
  let slides = [];
  let slideIndex = 0;
  let wheelCooldownUntil = 0;

  // ---------- Helpers ----------
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function isModalOpen() {
    return modal.classList.contains("is-open");
  }

  function openModal() {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    updateCarouselViewport();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    activePostEl = null;
    slides = [];
    slideIndex = 0;
    viewerMedia.innerHTML = "";
    viewerDots.innerHTML = "";
    viewerMedia.classList.remove("is-carousel");
    viewerMedia.style.width = "";
    viewerMedia.style.height = "";
  }

  function updateCarouselViewport() {
    if (!viewerMedia.classList.contains("is-carousel")) {
      viewerMedia.style.width = "";
      viewerMedia.style.height = "";
      return;
    }

    const stage = viewerMedia.closest(".ig-viewer__stage");
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    if (!stageRect.width || !stageRect.height) return;

    const ratio = 1080 / 1350; // 4:5 portrait
    let width = stageRect.height * ratio;
    let height = stageRect.height;

    if (width > stageRect.width) {
      width = stageRect.width;
      height = width / ratio;
    }

    viewerMedia.style.width = `${Math.floor(width)}px`;
    viewerMedia.style.height = `${Math.floor(height)}px`;
  }

  function setNavDisabled() {
    const single = slides.length <= 1;
    if (prevBtn) prevBtn.classList.toggle("is-disabled", single);
    if (nextBtn) nextBtn.classList.toggle("is-disabled", single);
    if (viewerDots) viewerDots.style.display = single ? "none" : "flex";
  }

  function renderDots() {
    viewerDots.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = i === slideIndex ? "is-active" : "";
      b.addEventListener("click", () => goToSlide(i));
      viewerDots.appendChild(b);
    });
  }

  function renderSlide() {
    const imageAlt = (activePostEl?.dataset.title || "Post") + " - full view";
    let track = viewerMedia.querySelector(".ig-viewer__track");
    const needsRebuild = !track || track.children.length !== slides.length;

    if (needsRebuild) {
      viewerMedia.innerHTML = "";
      track = document.createElement("div");
      track.className = "ig-viewer__track";

      slides.forEach((src) => {
        const slide = document.createElement("div");
        slide.className = "ig-viewer__slide";

        const img = document.createElement("img");
        img.alt = imageAlt;
        img.src = src;

        slide.appendChild(img);
        track.appendChild(slide);
      });

      viewerMedia.appendChild(track);
    }

    track.style.transform = `translateX(-${slideIndex * 100}%)`;

    if (slides.length > 1) {
      Array.from(viewerDots.children).forEach((dot, i) => {
        dot.classList.toggle("is-active", i === slideIndex);
      });
    }

    setNavDisabled();
  }

  function goToSlide(i) {
    if (!slides.length) return;
    slideIndex = clamp(i, 0, slides.length - 1);
    renderSlide();
  }

  function nextSlide() {
    if (slides.length <= 1) return;
    slideIndex = (slideIndex + 1) % slides.length;
    renderSlide();
  }

  function prevSlide() {
    if (slides.length <= 1) return;
    slideIndex = (slideIndex - 1 + slides.length) % slides.length;
    renderSlide();
  }

  function setDetailsFromPost(el) {
    const type = el.dataset.type || "single";
    const title = el.dataset.title || "Untitled";
    const client = el.dataset.client || "";
    const year = el.dataset.year || "";
    const caption = el.dataset.caption || "";
    const tags = el.dataset.tags || "";

    if (detailsTitle) detailsTitle.textContent = title;
    if (detailsCaption) detailsCaption.textContent = caption;
    if (detailsClient) detailsClient.textContent = client;
    if (detailsYear) detailsYear.textContent = year;
    if (detailsType) detailsType.textContent = type === "carousel" ? "Carousel" : "Flyer";
    if (detailsTags) detailsTags.textContent = tags;
  }

  function setSlidesFromPost(el) {
    const type = el.dataset.type || "single";
    if (type === "carousel") {
      const raw = (el.dataset.images || "").split("|").map(s => s.trim()).filter(Boolean);
      slides = raw.length ? raw : (el.dataset.image ? [el.dataset.image] : []);
    } else {
      slides = el.dataset.image ? [el.dataset.image] : [];
    }
    viewerMedia.classList.toggle("is-carousel", slides.length > 1);
    updateCarouselViewport();
    slideIndex = 0;

    renderDots();
    renderSlide();
  }

  function openPost(el) {
    activePostEl = el;
    activeIndex = posts.indexOf(el);

    setDetailsFromPost(el);
    setSlidesFromPost(el);
    openModal();
  }

  // ---------- Click open ----------
  posts.forEach((p) => {
    p.addEventListener("click", () => openPost(p));
    p.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPost(p);
      }
    });
  });

  // ---------- Modal controls ----------
  modal.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;

    const action = target.getAttribute("data-action");
    if (action === "close") closeModal();
    if (action === "next") nextSlide();
    if (action === "prev") prevSlide();
    if (action === "copyLink") {
      const url = new URL(window.location.href);
      if (activePostEl?.dataset.title) url.hash = "#work";
      navigator.clipboard?.writeText(url.toString());
      target.textContent = "Copied!";
      setTimeout(() => (target.textContent = "Copy link"), 900);
    }
    if (action === "copyBrandLink") {
      navigator.clipboard?.writeText(window.location.href);
    }
    if (action === "scrollTop") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Esc + arrows
  window.addEventListener("keydown", (e) => {
    if (!isModalOpen()) return;

    if (e.key === "Escape") closeModal();
    if (e.key === "ArrowRight") nextSlide();
    if (e.key === "ArrowLeft") prevSlide();
  });

  window.addEventListener("resize", updateCarouselViewport);

  // Global action buttons outside modal
  document.querySelectorAll('[data-action="scrollTop"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll('[data-action="copyBrandLink"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard?.writeText(window.location.href);
        const original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = original || "Copy brand page";
        }, 900);
      } catch (_) {
        // no-op fallback
      }
    });
  });

  // ---------- Swipe (mobile) ----------
  let touchStartX = 0;
  let touchStartY = 0;
  let touching = false;

  viewerMedia.addEventListener("touchstart", (e) => {
    if (!isModalOpen()) return;
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touching = true;
  }, { passive: true });

  viewerMedia.addEventListener("touchend", (e) => {
    if (!touching || !isModalOpen()) return;
    touching = false;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;

    // horizontal swipe only
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) nextSlide();
      else prevSlide();
    }
  }, { passive: true });

  viewerMedia.addEventListener("wheel", (e) => {
    if (!isModalOpen() || slides.length <= 1) return;

    const deltaX = e.deltaX || 0;
    const deltaY = e.deltaY || 0;
    const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    if (Math.abs(delta) < 18) return;

    e.preventDefault();

    const now = Date.now();
    if (now < wheelCooldownUntil) return;
    wheelCooldownUntil = now + 280;

    if (delta > 0) nextSlide();
    else prevSlide();
  }, { passive: false });

  // ---------- Tabs filter ----------
  function setActiveTab(tabName) {
    tabs.forEach((b) => {
      const isActive = b.dataset.tab === tabName;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    posts.forEach((p) => {
      const cat = (p.dataset.category || "").toLowerCase();
      let show = true;

      if (tabName === "posts") show = cat.includes("posts");
      if (tabName === "carousels") show = cat.includes("carousels");
      if (tabName === "system") show = false; // IG replica: no system panel in this version

      p.style.display = show ? "" : "none";
    });
  }

  tabs.forEach((b) => {
    b.addEventListener("click", () => setActiveTab(b.dataset.tab));
  });

  // ---------- Search filter ----------
  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function applySearch(q) {
    const query = normalize(q);

    posts.forEach((p) => {
      const hay = [
        p.dataset.title,
        p.dataset.caption,
        p.dataset.tags,
        p.dataset.category,
        p.dataset.client,
        p.dataset.year
      ].map(normalize).join(" ");

      const matches = !query || hay.includes(query);
      // only hide if it was previously visible by tab
      if (p.style.display === "none") return;
      p.style.opacity = matches ? "1" : ".15";
      p.style.pointerEvents = matches ? "" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => applySearch(e.target.value));
  }

  // defaults
  setActiveTab("posts");
})();
