// Wedding: Saturday 23 January 2027, 9:42 AM Sri Lanka time (UTC+05:30)
const WEDDING = new Date("2027-01-23T09:42:00+05:30");

/* ---------- Scroll animations (started once the envelope is opened) ---------- */
function startScrollAnimations() {
  const items = document.querySelectorAll(".anim");

  // Auto-stagger items inside the same section unless a delay is set inline
  document.querySelectorAll(".panel").forEach(panel => {
    panel.querySelectorAll(".anim").forEach((el, i) => {
      if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", `${Math.min(i, 4) * 0.08}s`);
    });
  });

  // The cover is always fully on screen when the envelope opens
  document.querySelectorAll(".cover .anim").forEach(el => el.classList.add("in"));
  document.querySelector(".cover")?.classList.add("open");

  if (!("IntersectionObserver" in window)) {
    items.forEach(el => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -40px 0px" });

  items.forEach(el => io.observe(el));
}

/* ---------- Envelope intro: the page stays locked until the seal is tapped ---------- */
(function initEnvelope() {
  const intro = document.getElementById("intro");
  const envelope = document.getElementById("envelope");
  const envTop = envelope.querySelector(".env-top");
  const seal = document.getElementById("seal");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.documentElement.classList.add("locked");
  window.scrollTo(0, 0);

  // Tuck the letter just below the flap's hinge
  const setHinge = () => envelope.style.setProperty("--hinge", `${envTop.offsetHeight}px`);
  setHinge();
  addEventListener("resize", setHinge);
  document.fonts?.ready.then(setHinge);

  seal.addEventListener("click", () => {
    if (envelope.classList.contains("opening")) return;
    envelope.classList.add("opening");

    setTimeout(() => {
      document.documentElement.classList.remove("locked");
      window.scrollTo(0, 0);
      intro.classList.add("done");
      startScrollAnimations();
      setTimeout(() => intro.remove(), 800);
    }, reduced ? 50 : 3500);
  });
})();

/* ---------- Falling petals over the cover ---------- */
(function initCoverPetals() {
  const box = document.getElementById("coverPetals");
  if (!box) return;
  const tints = ["#f6c9d2", "#f9dde3", "#f3b8c4", "#fdeef1", "#ead7f0"];
  const rand = (min, max) => min + Math.random() * (max - min);

  for (let i = 0; i < 18; i++) {
    const dur = rand(9, 16);
    const petal = document.createElement("span");
    petal.className = "cp";
    petal.style.left = `${rand(-2, 98)}%`;
    petal.style.setProperty("--dur", `${dur}s`);
    petal.style.setProperty("--delay", `${-rand(0, dur)}s`);   // start mid-fall so the sky is never empty
    petal.style.setProperty("--size", `${rand(8, 15)}px`);
    petal.style.setProperty("--tint", tints[i % tints.length]);
    petal.appendChild(document.createElement("i"));
    box.appendChild(petal);
  }
})();

/* ---------- Countdown ---------- */
(function initCountdown() {
  const units = {
    d: document.querySelector('[data-unit="d"]'),
    h: document.querySelector('[data-unit="h"]'),
    m: document.querySelector('[data-unit="m"]'),
    s: document.querySelector('[data-unit="s"]'),
  };

  const set = (el, value) => {
    const text = String(value).padStart(2, "0");
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove("tick");
    void el.offsetWidth;
    el.classList.add("tick");
  };

  function update() {
    let diff = Math.max(0, WEDDING - Date.now());
    const d = Math.floor(diff / 86400000); diff %= 86400000;
    const h = Math.floor(diff / 3600000);  diff %= 3600000;
    const m = Math.floor(diff / 60000);    diff %= 60000;
    const s = Math.floor(diff / 1000);
    set(units.d, d); set(units.h, h); set(units.m, m); set(units.s, s);
  }

  update();
  setInterval(update, 1000);
})();

/* ---------- Calendar (Monday-first) ---------- */
(function buildCalendar() {
  const cal = document.getElementById("calendar");
  const year = 2027, month = 0, weddingDay = 23;
  const dows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  let html = dows.map(d => `<span class="dow">${d}</span>`).join("");
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < offset; i++) html += `<span></span>`;
  for (let day = 1; day <= days; day++) {
    const col = (offset + day - 1) % 7;
    const cls = ["day"];
    if (col >= 5) cls.push("weekend");
    if (day === weddingDay) cls.push("wedding");
    const heart = day === weddingDay ? `<svg viewBox="0 0 24 24"><use href="#heart"/></svg>` : "";
    html += `<span class="${cls.join(" ")}">${heart}${day}</span>`;
  }
  cal.innerHTML = html;
})();

/* ---------- Music player ---------- */
(function initPlayer() {
  const audio = document.getElementById("song");
  const btn = document.getElementById("playBtn");
  const bar = document.getElementById("progressBar");

  btn.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        btn.classList.add("playing");
      } catch {
        toast("Add your song as music/song.mp3 🎵");
      }
    } else {
      audio.pause();
      btn.classList.remove("playing");
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) bar.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
  });
})();

/* ---------- Copy bank account ---------- */
document.getElementById("copyAcc").addEventListener("click", async e => {
  try {
    await navigator.clipboard.writeText(e.currentTarget.dataset.copy);
    toast("Account number copied");
  } catch {
    toast("A/C 8001 234 567");
  }
});

/* ---------- Toast ---------- */
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
}

/* ---------- Moments gallery lightbox ---------- */
(function initLightbox() {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lbImg");
  const cap = document.getElementById("lbCap");
  let current = 0;

  // Only photos that actually loaded are viewable
  const photos = () => [...document.querySelectorAll(".moment:not(.no-img)")];

  function show(i) {
    const list = photos();
    if (!list.length) return;
    current = (i + list.length) % list.length;
    const src = list[current].querySelector("img");
    img.src = src.src;
    img.alt = src.alt;
    cap.textContent = list[current].querySelector("figcaption").textContent;
  }

  function open(fig) {
    show(photos().indexOf(fig));
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add("open"));
    document.body.style.overflow = "hidden";
  }

  function close() {
    box.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => (box.hidden = true), 350);
  }

  document.querySelectorAll(".moment").forEach(fig => {
    fig.tabIndex = 0;
    const openIfLoaded = () => { if (!fig.classList.contains("no-img")) open(fig); };
    fig.addEventListener("click", openIfLoaded);
    fig.addEventListener("keydown", e => { if (e.key === "Enter") openIfLoaded(); });
  });

  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
  box.addEventListener("click", e => { if (e.target === box) close(); });

  document.addEventListener("keydown", e => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  // Swipe on touch screens
  let startX = null;
  box.addEventListener("touchstart", e => (startX = e.touches[0].clientX), { passive: true });
  box.addEventListener("touchend", e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();

/* ---------- RSVP form ----------
   Paste a Formspree (or similar) endpoint here to collect responses by email,
   e.g. "https://formspree.io/f/abcdwxyz". Leave it empty and the RSVP opens
   WhatsApp with the answers pre-filled, sent to RSVP_WHATSAPP. */
const RSVP_ENDPOINT = "";
const RSVP_WHATSAPP = "94771234567";

(function initRsvp() {
  const form = document.getElementById("rsvpForm");
  const extra = document.getElementById("attendingOnly");
  const error = document.getElementById("formError");
  const thanks = document.getElementById("rsvpThanks");
  const thanksText = document.getElementById("thanksText");

  // Guests & meal only matter if the guest is coming
  form.addEventListener("change", e => {
    if (e.target.name === "attending") extra.classList.toggle("show", e.target.value.startsWith("Joyfully"));
    e.target.closest(".field")?.classList.remove("invalid");
  });
  form.addEventListener("input", e => e.target.closest(".field")?.classList.remove("invalid"));

  function validate() {
    let firstBad = null;
    const mark = (el, bad) => {
      el.closest(".field").classList.toggle("invalid", bad);
      if (bad && !firstBad) firstBad = el;
    };
    const f = form.elements;
    mark(f.namedItem("name"), !f.namedItem("name").value.trim());
    mark(f.namedItem("phone"), !f.namedItem("phone").checkValidity());
    mark(form.querySelector('[name="attending"]'), !f.namedItem("attending").value);
    if (firstBad) {
      error.textContent = "Please fill in your name, phone number and whether you can attend.";
      firstBad.focus();
      return false;
    }
    error.textContent = "";
    return true;
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!validate()) return;

    const data = Object.fromEntries(new FormData(form));
    const coming = data.attending.startsWith("Joyfully");
    if (!coming) { delete data.guests; delete data.meal; }

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;

    try {
      if (RSVP_ENDPOINT) {
        const res = await fetch(RSVP_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Request failed");
      } else {
        const lines = [
          "💌 *Wedding RSVP — Kavindu & Tharushi*",
          `Name: ${data.name}`,
          `Phone: ${data.phone}`,
          `Response: ${data.attending}`,
          coming ? `Guests: ${data.guests}` : "",
          coming ? `Meal: ${data.meal}` : "",
          data.message ? `Wishes: ${data.message}` : "",
        ].filter(Boolean);
        window.open(`https://wa.me/${RSVP_WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
      }

      thanksText.textContent = coming
        ? `We can't wait to celebrate with you, ${data.name.split(" ")[0]}!`
        : `We'll miss you, ${data.name.split(" ")[0]} — thank you for letting us know.`;
      form.hidden = true;
      thanks.hidden = false;
    } catch {
      error.textContent = "Something went wrong — please try again.";
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("rsvpAgain").addEventListener("click", () => {
    thanks.hidden = true;
    form.hidden = false;
  });
})();
