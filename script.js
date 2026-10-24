(() => {
  "use strict";

  const scene = document.getElementById("scene");
  const letter = document.getElementById("letter");
  const envelope = document.getElementById("envelope");
  const openBtn = document.getElementById("openBtn");
  const replayBtn = document.getElementById("replayBtn");
  const reveals = Array.from(document.querySelectorAll(".reveal"));

  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCaption = document.getElementById("lbCaption");
  const lbClose = document.getElementById("lbClose");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PETAL_COLORS = ["#f2766b", "#d6455d", "#ef8fa0", "#f6c453", "#f59a7a"];

  let isOpening = false;
  let lastFocused = null;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  /* ---------- Pétalas caindo (rápido e leve) ---------- */
  function launchPetals(amount = 22) {
    if (reduceMotion) return;
    for (let i = 0; i < amount; i++) {
      const petal = document.createElement("span");
      const width = 10 + Math.random() * 10;
      petal.className = "petal";
      petal.style.left = Math.random() * 100 + "vw";
      petal.style.setProperty("--w", width + "px");
      petal.style.setProperty("--col", PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]);
      petal.style.setProperty("--dx", (Math.random() - 0.5) * 120 + "px");
      petal.style.setProperty("--rot", (Math.random() > 0.5 ? 1 : -1) * (240 + Math.random() * 300) + "deg");
      petal.style.setProperty("--t", 3.2 + Math.random() * 2 + "s");
      petal.style.setProperty("--dl", Math.random() * 0.9 + "s");
      petal.addEventListener("animationend", () => petal.remove());
      document.body.appendChild(petal);
    }
  }

  /* ---------- Revelação ao rolar: fotos e textos aparecem em sequência ---------- */
  let observer = null;
  function startReveals() {
    reveals.forEach((el) => { el.classList.remove("in"); el.style.animationDelay = ""; });
    if (observer) observer.disconnect();
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("in"));
      return;
    }
    observer = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry, index) => {
        entry.target.style.animationDelay = index * 0.16 + "s";
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => observer.observe(el));
  }

  /* ---------- Abrir a cartinha ---------- */
  function openLetter() {
    if (isOpening) return;
    isOpening = true;
    openBtn.disabled = true;
    openBtn.classList.add("pressed");
    later(() => openBtn.classList.remove("pressed"), 220);
    later(() => envelope.classList.add("open"), 200);
    later(launchPetals, 700);

    later(() => {
      scene.classList.add("leave");
      letter.inert = false;
      letter.classList.add("show");
      window.scrollTo(0, 0);
      startReveals();
    }, reduceMotion ? 150 : 2300);
  }

  /* ---------- Ler de novo ---------- */
  function replay() {
    timers.splice(0).forEach(clearTimeout);
    if (observer) observer.disconnect();
    letter.classList.remove("show");
    letter.inert = true;
    reveals.forEach((el) => el.classList.remove("in"));
    window.scrollTo({ top: 0, behavior: "auto" });
    scene.classList.remove("leave");
    envelope.classList.remove("open");
    later(() => {
      openBtn.disabled = false;
      isOpening = false;
      openBtn.focus({ preventScroll: true });
    }, 950);
  }

  /* ---------- Fotos: se faltar o arquivo, mostra o espaço decorado ---------- */
  document.querySelectorAll(".photo-frame").forEach((frame) => {
    const img = frame.querySelector("img");
    const markMissing = () => frame.classList.add("no-photo");
    img.addEventListener("error", markMissing);
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
      // pode ser que ainda não tenha começado a carregar (loading="lazy")
      img.addEventListener("load", () => frame.classList.remove("no-photo"), { once: true });
    }
  });

  /* ---------- Foto ampliada ---------- */
  function openLightbox(button) {
    const frame = button.querySelector(".photo-frame");
    const img = frame.querySelector("img");
    if (frame.classList.contains("no-photo")) return;
    const caption = button.parentElement.querySelector("figcaption");
    lastFocused = button;
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCaption.textContent = caption ? caption.textContent : "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus({ preventScroll: true });
  }

  document.querySelectorAll(".photo-btn").forEach((button) => {
    button.addEventListener("click", () => openLightbox(button));
  });
  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "Tab") { event.preventDefault(); lbClose.focus(); } // mantém o foco no botão de fechar
  });

  openBtn.addEventListener("click", openLetter);
  replayBtn.addEventListener("click", replay);
})();