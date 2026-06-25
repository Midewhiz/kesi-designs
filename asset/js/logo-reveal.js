(() => {
  const root = document.querySelector(".lr-page");
  const toast = document.querySelector(".lr-toast");
  if (!root) return;

  document.body.classList.add("lr-ready");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = Array.from(document.querySelectorAll(".reveal-on-scroll"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  function setProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    root.style.setProperty("--lr-scroll", `${Math.min(100, Math.max(0, pct))}%`);
  }

  setProgress();
  window.addEventListener("scroll", setProgress, { passive: true });

  if (!reduceMotion) {
    window.addEventListener("pointermove", (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      root.style.setProperty("--lr-mouse-x", x.toFixed(3));
      root.style.setProperty("--lr-mouse-y", y.toFixed(3));
    }, { passive: true });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1800);
  }

  const lightbox = document.createElement("div");
  lightbox.className = "lr-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <div class="lr-lightbox__panel" role="dialog" aria-modal="true" aria-label="Expanded image viewer">
      <button class="lr-lightbox__close" type="button" aria-label="Close expanded image">&times;</button>
      <img class="lr-lightbox__image" alt="" />
      <div class="lr-lightbox__caption"></div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImage = lightbox.querySelector(".lr-lightbox__image");
  const lightboxCaption = lightbox.querySelector(".lr-lightbox__caption");
  const lightboxClose = lightbox.querySelector(".lr-lightbox__close");

  function openLightbox(image) {
    if (!image || !lightboxImage) return;
    const src = image.currentSrc || image.src;
    if (!src) return;

    lightboxImage.src = src;
    lightboxImage.alt = image.alt || "Expanded brand identity image";
    if (lightboxCaption) lightboxCaption.textContent = image.alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    if (lightboxImage) lightboxImage.src = "";
  }

  document.addEventListener("click", (event) => {
    const image = event.target.closest(".lr-logo-card img, .lr-frame img, .lr-application img");
    if (!image) return;
    event.preventDefault();
    openLightbox(image);
  });

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox || event.target.closest(".lr-lightbox__close")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-page]");
    if (!button) return;

    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Page link copied");
    } catch (error) {
      showToast("Copy unavailable");
    }
  });
})();
