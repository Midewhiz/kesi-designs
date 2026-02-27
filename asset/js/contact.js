document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-contact");
  if (!form) return;

  const iframe = document.getElementById("gform_iframe");
  const nameEl = document.getElementById("name");
  const mailEl = document.getElementById("mail");
  const phoneEl = document.getElementById("phone");
  const messageEl = document.getElementById("message");
  const budgetEl = document.getElementById("budget");

  const submitBtn = document.getElementById("contactSubmitBtn");
  const waBtn = form?.querySelector(".wa-contact-btn");
  const budgetItems = document.querySelectorAll("#budget-choices .choose-item");

  // Dialog
  const dialog = document.getElementById("contactDialog");
  const dialogBadgeText = document.querySelector("#contactDialogBadge .contact-dialog-badge-text");
  const dialogTitle = document.getElementById("contactDialogTitle");
  const dialogText = document.getElementById("contactDialogText");
  const dialogCloseBtn = document.getElementById("contactDialogCloseBtn");

  let submitted = false;

  function openDialog(title, text) {
    const isError = title.toLowerCase() === "error";

    if (dialog) {
      dialog.dataset.state = isError ? "error" : "success";
    }
    if (dialogBadgeText) {
      dialogBadgeText.textContent = isError ? "Fix this" : "All set";
    }
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    if (dialog?.showModal) dialog.showModal();
    else alert(`${title}\n\n${text}`);
  }

  dialogCloseBtn?.addEventListener("click", () => dialog.close());

  function selectBudget(item) {
    budgetItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    budgetEl.value = item.textContent.trim();
  }

  budgetItems.forEach((item) => {
    item.addEventListener("click", () => selectBudget(item));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectBudget(item);
      }
    });
  });

  function resetContactForm() {
    form.reset();
    budgetItems.forEach(i => i.classList.remove("active"));
    budgetEl.value = "";
  }

  function setSubmitState(isLoading) {
    if (!submitBtn) return;

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.7";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.dataset.oldText = submitBtn.innerText;
      submitBtn.innerText = "Sending...";
      return;
    }

    submitBtn.disabled = false;
    submitBtn.style.opacity = "";
    submitBtn.style.cursor = "";
    submitBtn.innerText = submitBtn.dataset.oldText || "Get Started";
  }

  iframe?.addEventListener("load", () => {
    if (!submitted) return;
    submitted = false;

    resetContactForm();
    openDialog("Success", "Message sent successfully. I'll get back to you soon.");
  });

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validateContactFields() {
    const name = nameEl.value.trim();
    const email = mailEl.value.trim();
    const phone = phoneEl.value.trim();
    const message = messageEl.value.trim();

    if (!name) {
      openDialog("Error", "Please enter your name.");
      nameEl.focus();
      return false;
    }
    if (!email || !isValidEmail(email)) {
      openDialog("Error", "Please enter a valid email.");
      mailEl.focus();
      return false;
    }
    if (!phone || phone.replace(/[^\d]/g, "").length < 8) {
      openDialog("Error", "Please enter a valid phone number.");
      phoneEl.focus();
      return false;
    }
    if (!message) {
      openDialog("Error", "Please enter a message.");
      messageEl.focus();
      return false;
    }

    return true;
  }

  function buildWhatsAppMessage() {
    const name = nameEl.value.trim() || "-";
    const email = mailEl.value.trim() || "-";
    const phone = phoneEl.value.trim() || "-";
    const message = messageEl.value.trim() || "-";
    const budget = budgetEl.value.trim() || "-";

    return [
      "Hello Kesi, I would like to discuss a project.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Budget: ${budget}`,
      "Project details:",
      message
    ].join("\n");
  }

  waBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!validateContactFields()) return;

    const baseUrl = waBtn.getAttribute("href") || "https://wa.me/2347072352162";
    const message = buildWhatsAppMessage();
    const sep = baseUrl.includes("?") ? "&" : "?";
    const waUrl = `${baseUrl}${sep}text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
  });

  form.addEventListener("submit", (e) => {
    if (!validateContactFields()) {
      e.preventDefault();
      return;
    }

    setSubmitState(true);
    submitted = true;

    setTimeout(() => {
      setSubmitState(false);
    }, 2000);
  });
});
