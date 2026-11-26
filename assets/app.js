// BNPD : outils partagés par les trois pages (API, filières, thème, couvertures, sécurité).

const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
export const API_ROOT = LOCAL ? "http://127.0.0.1:8000" : "https://bn-polytechnique-douala-api.onrender.com";
export const API = `${API_ROOT}/api/memoires/`;

export const FILIERES = {
  GIT: "Génie Informatique et Télécommunications",
  GCI: "Génie Civil",
  GPH: "Génie Physique",
  GM: "Génie Mécanique",
  GE: "Génie Énergétique",
  GP: "Génie des Procédés",
  GMP: "Génie Maritime et Portuaire",
  GAM: "Génie Automobile et Mécatronique",
  QHSE: "Qualité, Hygiène, Sécurité, Environnement",
  MP: "Master Professionnel",
};

export const AXES = {
  GIT: ["Génie Logiciel", "Réseaux et Télécommunications", "Intelligence Artificielle"],
  GCI: ["Bâtiment", "Travaux Publics", "Géotechnique", "Hydraulique"],
  GPH: ["Physique des Matériaux", "Physique Nucléaire", "Électronique"],
  GM: ["Conception Mécanique", "Énergétique", "Production"],
  GE: ["Énergies Renouvelables", "Efficacité Énergétique", "Réseaux Électriques"],
  GP: ["Génie Chimique", "Génie Alimentaire", "Environnement"],
  GMP: ["Logistique Portuaire", "Ingénierie Maritime", "Gestion des Opérations"],
  GAM: ["Mécatronique", "Moteurs et Propulsion", "Systèmes Embarqués"],
  QHSE: ["Qualité", "Hygiène", "Sécurité", "Environnement"],
  MP: ["Biologie Appliquée", "Informatique de Gestion", "Management de Projet", "Autre"],
};

// Tout texte venu de l'API passe par ici avant d'entrer dans la page
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// N'accepte que des adresses http(s) pour les liens et les images
export function safeUrl(url) {
  if (!url) return "";
  try {
    const u = new URL(url, location.href);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

export function normalize(s) {
  return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function keywords(m) {
  return String(m.mots_cles || "").split(",").map((k) => k.trim()).filter(Boolean);
}

// Couverture : la première page du PDF, imprimée sur le carton de couleur de sa filière (voir bnpd.css).
// Sans image, une couverture typographique sur le même carton.
export function coverHTML(m, eager = false) {
  const img = safeUrl(m.couverture);
  const badge = m.exemple ? '<span class="badge-ex">Exemple</span>' : "";
  if (img) {
    return `<div class="cover" data-f="${esc(m.filiere)}">${badge}<img src="${esc(img)}" alt="Couverture : ${esc(m.titre)}" loading="${eager ? "eager" : "lazy"}" decoding="async"></div>`;
  }
  return `<div class="cover" data-f="${esc(m.filiere)}">${badge}<div class="tcover">
    <span class="tcover-top">ENSPD / Mémoire / ${esc(m.filiere)}</span>
    <span class="tcover-title">${esc(m.titre)}</span>
    <span class="tcover-rule"></span>
    <span class="tcover-author">${esc(m.auteur)}</span>
    <span class="tcover-year">${esc(m.annee)}</span>
  </div></div>`;
}

// Le serveur gratuit s'endort : on patiente, on réessaie, et on prévient si c'est long
export async function fetchJSON(url, { onSlow, retries = 2, timeout = 60000 } = {}) {
  const slow = onSlow ? setTimeout(onSlow, 4000) : null;
  try {
    for (let attempt = 0; ; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      try {
        const r = await fetch(url, { signal: ctrl.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return await r.json();
      } catch (err) {
        if (attempt >= retries) throw err;
        await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
      } finally {
        clearTimeout(t);
      }
    }
  } finally {
    clearTimeout(slow);
  }
}

export function citation(m) {
  return `${esc(m.auteur)} (${esc(m.annee)}). <i>${esc(m.titre)}</i>. Mémoire de fin d'études, ${esc(FILIERES[m.filiere] || m.filiere)}, École Nationale Supérieure Polytechnique de Douala.`;
}

// Thème clair ou sombre, retenu d'une visite à l'autre
export function initTheme() {
  const btn = document.getElementById("theme-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("bnpd-theme", next);
  });
}
