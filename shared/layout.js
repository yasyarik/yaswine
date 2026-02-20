(function(){
  const path = window.location.pathname || '/';
  const m = path.match(/^\/(ru|es|de|fr)(\/|$)/);
  const locale = m ? m[1] : 'en';
  const base = locale === 'en' ? '' : '/' + locale;

  const dict = {
    en: {home:'Home', blog:'Blog', terms:'Terms of Service', privacy:'Privacy Policy', refund:'Refund Policy', rights:'All rights reserved.'},
    ru: {home:'Главная', blog:'Блог', terms:'Условия использования', privacy:'Политика конфиденциальности', refund:'Политика возврата', rights:'Все права защищены.'},
    es: {home:'Inicio', blog:'Blog', terms:'Términos de servicio', privacy:'Política de privacidad', refund:'Política de reembolso', rights:'Todos los derechos reservados.'},
    de: {home:'Startseite', blog:'Blog', terms:'Nutzungsbedingungen', privacy:'Datenschutz', refund:'Rückerstattungsrichtlinie', rights:'Alle Rechte vorbehalten.'},
    fr: {home:'Accueil', blog:'Blog', terms:'Conditions d\'utilisation', privacy:'Politique de confidentialité', refund:'Politique de remboursement', rights:'Tous droits réservés.'}
  };
  const t = dict[locale] || dict.en;

  const css = [
    '.shared-site-nav{padding:24px 0;display:flex;justify-content:space-between;align-items:center;position:fixed;top:0;left:0;right:0;z-index:2000;transition:.25s;background:transparent}',
    '.shared-site-nav.nav-scrolled{background:rgba(18,7,12,.85);backdrop-filter:blur(12px);padding:15px 0;border-bottom:1px solid rgba(255,255,255,.08)}',
    '.shared-nav-container{max-width:1280px;margin:0 auto;padding:0 24px;display:flex;justify-content:space-between;align-items:center;width:100%}',
    '.shared-logo{display:flex;align-items:center;text-decoration:none}',
    '.shared-logo-img{height:64px;width:auto;object-fit:contain}',
    '.shared-nav-links{display:flex;gap:22px;align-items:center}',
    '.shared-nav-links a{color:var(--dim,#cfbec5);text-decoration:none;font-size:14px;font-weight:600}',
    '.shared-nav-links a:hover,.shared-nav-links a.active{color:#fff}',
    '.shared-site-footer{border-top:1px solid rgba(255,255,255,.12);padding:40px 0;text-align:center;color:var(--dim,#cfbec5);font-size:14px;margin-top:28px}',
    '.shared-site-footer a{color:var(--dim,#cfbec5);text-decoration:none;margin:0 10px}',
    '.shared-layout-ready nav:not(.shared-site-nav),.shared-layout-ready #mainNav,.shared-layout-ready .site-nav{display:none !important}',
    '@media (max-width:740px){.shared-logo-img{height:52px}.shared-nav-links{gap:14px}}'
  ].join('');

  if (!document.getElementById('shared-layout-style')) {
    const style = document.createElement('style');
    style.id = 'shared-layout-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  const nav = document.createElement('nav');
  nav.className = 'shared-site-nav';
  nav.innerHTML =
    '<div class="shared-nav-container">' +
      '<a class="shared-logo" href="' + (base || '/') + '"><img class="shared-logo-img" src="/logo-yas-wine.png" alt="YAS Wine Logo" /></a>' +
      '<div class="shared-nav-links">' +
        '<a href="' + (base || '/') + '" data-link="home">' + t.home + '</a>' +
        '<a href="' + base + '/blog/" data-link="blog">' + t.blog + '</a>' +
        '<div id="lang-switcher-host"></div>' +
      '</div>' +
    '</div>';

  document.body.insertBefore(nav, document.body.firstChild);

  const aHome = nav.querySelector('[data-link="home"]');
  const aBlog = nav.querySelector('[data-link="blog"]');
  if (path === base + '/' || (base === '' && path === '/')) aHome.classList.add('active');
  if ((base ? path.indexOf(base + '/blog') === 0 : path.indexOf('/blog') === 0)) aBlog.classList.add('active');

  const existingFooters = Array.from(document.querySelectorAll('footer'));
  const footer = document.createElement('footer');
  footer.className = 'shared-site-footer';
  footer.innerHTML =
    '<p>© 2026 YAS Wine. ' + t.rights + '</p>' +
    '<div style="margin-top:15px">' +
      '<a href="' + base + '/policy/terms/">' + t.terms + '</a> | ' +
      '<a href="' + base + '/policy/privacy/">' + t.privacy + '</a> | ' +
      '<a href="' + base + '/policy/refund/">' + t.refund + '</a>' +
    '</div>';

  if (existingFooters.length) {
    const last = existingFooters[existingFooters.length - 1];
    last.parentNode.replaceChild(footer, last);
  } else {
    document.body.appendChild(footer);
  }

  document.body.classList.add('shared-layout-ready');

  window.addEventListener('scroll', function(){
    if (window.scrollY > 20) nav.classList.add('nav-scrolled');
    else nav.classList.remove('nav-scrolled');
  }, {passive:true});
})();
