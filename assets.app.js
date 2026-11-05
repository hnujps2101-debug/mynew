/* 个人网站交互脚本：零依赖，可离线运行 */
(function () {
  'use strict';

  var doc = document;
  var $  = function (s, ctx) { return (ctx || doc).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(s)); };

  /* 1. 自动更新页脚年份 */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* 2. 移动端 / 窄屏菜单 */
  var toggle = $('#navToggle');
  var navLinks = $('#navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '收起菜单' : '展开菜单');
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    doc.addEventListener('click', function (e) {
      if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* 3. 滚动淡入（不支持 IntersectionObserver 时直接全部显示） */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.animationDelay = (Math.min(i % 3, 2) * 70) + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* 4. 作品分类筛选 */
  var filterBtns = $$('.filter-btn');
  var cards = $$('.work-card');
  var emptyTip = $('#worksEmpty');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');
      filterBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      var shown = 0;
      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.classList.toggle('is-hidden', !match);
        if (match) {
          shown++;
          /* 重新触发一次进入动画，切换分类时更顺眼 */
          card.classList.remove('is-visible');
          void card.offsetWidth;
          card.classList.add('is-visible');
        }
      });
      if (emptyTip) emptyTip.hidden = shown !== 0;
    });
  });

  /* 5. 滚动进度条 + 回到顶部按钮 */
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var ticking = false;
  function onScroll() {
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = Math.min(100, Math.max(0, pct)) + '%';
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > 500);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
