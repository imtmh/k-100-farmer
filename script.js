const state = {
  site: null,
  updates: null,
  activities: [],
  category: "All",
  query: ""
};

const byId = (id) => document.getElementById(id);

function getPathValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node && value) node.textContent = value;
}

function card(title, body, extraClass = "") {
  const article = document.createElement("article");
  article.className = `info-card ${extraClass}`.trim();
  article.innerHTML = `<h3></h3><p></p>`;
  article.querySelector("h3").textContent = title;
  article.querySelector("p").textContent = body;
  return article;
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function renderSiteText(site) {
  document.querySelectorAll("[data-site]").forEach((node) => {
    const value = getPathValue(site, node.dataset.site);
    if (value) node.textContent = Array.isArray(value) ? value.join(", ") : value;
  });

  const heroImage = document.querySelector("[data-site-image='hero']");
  if (heroImage) {
    heroImage.src = site.hero.image;
    heroImage.alt = site.hero.imageAlt;
  }

  setText("#phone-link", site.project.phone.join(", "));
  byId("phone-link").href = `tel:${site.project.phone[0]}`;
  setText("#email-link", site.project.email);
  byId("email-link").href = `mailto:${site.project.email}`;

  const stats = byId("stats");
  stats.replaceChildren(...site.stats.map((item) => {
    const stat = document.createElement("article");
    stat.className = "stat-card";
    stat.innerHTML = `<strong></strong><span></span>`;
    stat.querySelector("strong").textContent = item.value;
    stat.querySelector("span").textContent = item.label;
    return stat;
  }));

  byId("about-cards").replaceChildren(...site.about.cards.map((item) => card(item.title, item.body)));
  byId("department-grid").replaceChildren(...site.departments.map((item) => card(item.sector, item.department)));
  byId("outcome-grid").replaceChildren(...site.outcomes.map((item) => card(item.title, item.body)));

  byId("implementation-list").replaceChildren(...site.implementation.map((item) => {
    const article = card(item.title, item.body, "timeline-item");
    article.dataset.step = item.step;
    return article;
  }));

  byId("mela-list").replaceChildren(...site.mela.items.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
}

function renderUpdates(updates) {
  byId("updates-grid").replaceChildren(...updates.news.map((item) => {
    const article = card(item.title, item.body);
    const tag = document.createElement("p");
    tag.className = "tag";
    tag.textContent = `${item.type} · ${item.status}`;
    article.prepend(tag);
    return article;
  }));

  byId("media-stack").replaceChildren(...updates.media.map((item) => {
    const figure = document.createElement("figure");
    figure.className = "media-card";
    figure.innerHTML = `<img><span></span>`;
    figure.querySelector("img").src = item.image;
    figure.querySelector("img").alt = item.alt;
    figure.querySelector("span").textContent = item.title;
    return figure;
  }));
}

function setupFilters() {
  const select = byId("category-filter");
  const toolbar = document.querySelector(".directory-toolbar");
  const categories = ["All", ...new Set(state.activities.map((item) => item.category))].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    return a.localeCompare(b);
  });

  select.replaceChildren(...categories.map((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    return option;
  }));

  toolbar.addEventListener("submit", (event) => event.preventDefault());

  byId("activity-search").addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderActivities();
  });

  select.addEventListener("change", (event) => {
    state.category = event.target.value;
    renderActivities();
  });

  byId("reset-filters").addEventListener("click", () => {
    state.query = "";
    state.category = "All";
    byId("activity-search").value = "";
    select.value = "All";
    renderActivities();
  });
}

function renderActivities() {
  const grid = byId("activity-grid");
  const empty = byId("activity-empty");
  const visible = state.activities.filter((item) => {
    const matchesCategory = state.category === "All" || item.category === state.category;
    const haystack = `${item.title} ${item.category} ${item.notes}`.toLowerCase();
    return matchesCategory && haystack.includes(state.query);
  });

  grid.replaceChildren(...visible.map((item) => {
    const article = document.createElement("article");
    article.className = "activity-card";
    article.innerHTML = `
      <span class="activity-number"></span>
      <h3></h3>
      <p></p>
      <span class="category"></span>
    `;
    article.querySelector(".activity-number").textContent = String(item.id).padStart(3, "0");
    article.querySelector("h3").textContent = item.title;
    article.querySelector("p").textContent = item.notes || "Project K-100 demonstration activity";
    article.querySelector(".category").textContent = item.category;
    return article;
  }));

  byId("activity-count").textContent = `${visible.length} ${visible.length === 1 ? "activity" : "activities"}`;
  byId("active-filter").textContent = state.category === "All" ? "All categories" : state.category;
  empty.hidden = visible.length !== 0;

  if (document.body.classList.contains("motion-ready")) {
    grid.querySelectorAll(".activity-card").forEach((node, index) => {
      node.classList.add("activity-enter");
      node.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 35}ms`);
    });
  }
}

function setupMotion() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("motion-ready");

  const revealTargets = [
    ".section-head",
    ".stat-card",
    ".info-card",
    ".activity-card",
    ".timeline-item",
    ".media-card",
    ".mela-panel",
    ".contact-card"
  ];

  document.querySelectorAll(revealTargets.join(",")).forEach((node, index) => {
    node.classList.add("reveal");
    node.style.setProperty("--reveal-delay", `${Math.min(index % 8, 6) * 55}ms`);
    if (reduceMotion) node.classList.add("is-visible");
  });

  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
  } else {
    document.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
  }

  animateStats(reduceMotion);
}

function animateStats(reduceMotion) {
  document.querySelectorAll(".stat-card strong").forEach((node) => {
    const finalText = node.textContent;
    const match = finalText.match(/^(\d+)(.*)$/);
    if (!match || reduceMotion) return;

    const target = Number(match[1]);
    const suffix = match[2] || "";
    const duration = 950;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = `${Math.round(target * eased)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
      else node.textContent = finalText;
    }

    node.textContent = `0${suffix}`;
    requestAnimationFrame(tick);
  });
}

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = byId("site-nav");
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
  });

  nav.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation menu");
      toggle.focus();
    }
  });
}

async function init() {
  setupNavigation();
  try {
    const [site, updates, activities] = await Promise.all([
      loadJson("content/site.json"),
      loadJson("content/updates.json"),
      loadJson("content/activities.json")
    ]);

    state.site = site;
    state.updates = updates;
    state.activities = activities;
    renderSiteText(site);
    renderUpdates(updates);
    setupFilters();
    renderActivities();
    setupMotion();
  } catch (error) {
    console.error(error);
    byId("activity-empty").hidden = false;
    byId("activity-empty").textContent = "Content could not be loaded. Run this site through a local web server so the JSON files can be fetched.";
  }
}

init();
