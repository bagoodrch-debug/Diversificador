document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".main-nav a").forEach((a) => {
    if (a.getAttribute("href") === path) a.setAttribute("aria-current", "page");
  });

  const reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
});
