(function () {
  var supported = ["en", "ru", "es", "de", "fr"];
  var labels = { en: "EN", ru: "RU", es: "ES", de: "DE", fr: "FR" };

  function currentLang(path) {
    for (var i = 1; i < supported.length; i++) {
      var l = supported[i];
      if (path === "/" + l || path.indexOf("/" + l + "/") === 0) return l;
    }
    return "en";
  }

  function stripPrefix(path) {
    for (var i = 1; i < supported.length; i++) {
      var l = supported[i];
      if (path === "/" + l) return "/";
      if (path.indexOf("/" + l + "/") === 0) return path.slice(("/" + l).length) || "/";
    }
    return path || "/";
  }

  function toLangPath(lang, path) {
    var core = stripPrefix(path || "/");
    if (!core.startsWith("/")) core = "/" + core;
    if (lang === "en") return core;
    if (core === "/") return "/" + lang + "/";
    return "/" + lang + core;
  }

  function isBot() {
    var ua = (navigator.userAgent || "").toLowerCase();
    return /bot|crawler|spider|slurp|bingpreview|mediapartners/.test(ua);
  }

  function preferredLang() {
    var b = (navigator.language || "en").toLowerCase();
    if (b.startsWith("ru")) return "ru";
    if (b.startsWith("es")) return "es";
    if (b.startsWith("de")) return "de";
    if (b.startsWith("fr")) return "fr";
    return "en";
  }

  function autoRedirect() {
    try {
      if (isBot()) return;
      if (localStorage.getItem("site_lang_selected") === "1") return;
      var cur = currentLang(location.pathname);
      if (cur !== "en") return;
      var pl = preferredLang();
      if (pl === "en") return;
      var np = toLangPath(pl, location.pathname) + location.search + location.hash;
      if (np !== location.pathname + location.search + location.hash) location.replace(np);
    } catch (e) {}
  }

  function injectSwitcher() {
    if (document.getElementById("lang-switcher")) return;

    var wrap = document.createElement("div");
    wrap.id = "lang-switcher-wrap";
    wrap.style.position = "fixed";
    wrap.style.top = "14px";
    wrap.style.right = "16px";
    wrap.style.zIndex = "100000";

    var sel = document.createElement("select");
    sel.id = "lang-switcher";
    sel.style.background = "rgba(20,16,36,0.95)";
    sel.style.color = "#fff";
    sel.style.border = "1px solid rgba(255,255,255,0.38)";
    sel.style.borderRadius = "10px";
    sel.style.padding = "8px 10px";
    sel.style.fontWeight = "800";
    sel.style.fontSize = "13px";
    sel.style.minWidth = "74px";
    sel.style.lineHeight = "1.2";
    sel.style.cursor = "pointer";

    supported.forEach(function (l) {
      var o = document.createElement("option");
      o.value = l;
      o.textContent = labels[l] || l.toUpperCase();
      sel.appendChild(o);
    });

    sel.value = currentLang(location.pathname);
    sel.addEventListener("change", function () {
      try { localStorage.setItem("site_lang_selected", "1"); } catch (e) {}
      var np = toLangPath(sel.value, location.pathname) + location.search + location.hash;
      location.href = np;
    });

    wrap.appendChild(sel);
    document.body.appendChild(wrap);
  }

  autoRedirect();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectSwitcher);
  } else {
    injectSwitcher();
  }
})();
