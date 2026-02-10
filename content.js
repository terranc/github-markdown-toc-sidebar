(() => {
  'use strict';

  const SIDEBAR_ID = 'gmtoc-sidebar';
  const WRAPPER_ID = 'gmtoc-wrapper';
  const MARKDOWN_SELECTORS = [
    '#readme .markdown-body',
    '.wiki-body .markdown-body',
    '.markdown-body',
  ];
  const STORAGE_KEY_POSITION = 'gmtoc_position';
  const STORAGE_KEY_COLLAPSED = 'gmtoc_collapsed';
  const STORAGE_KEY_MAX_LEVEL = 'gmtoc_max_level';
  const DEBOUNCE_MS = 200;

  let sidebarEl = null;
  let wrapperEl = null;
  let bodyEl = null;
  let modalEl = null;
  let overlayEl = null;
  let modalBodyEl = null;
  let currentHeaders = [];
  let currentMdBody = null;
  let mountHost = null; // element wrapper is appended to (may differ from currentMdBody)
  let resizeObserver = null;
  let stickyHeaderObserver = null;
  let activeId = null;
  let settings = { position: 'right', collapsed: false, maxLevel: 4 };

  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function buildHeaderSelector() {
    return Array.from({ length: settings.maxLevel }, (_, i) => `h${i + 1}`).join(', ');
  }

  function findMarkdownBody() {
    for (const sel of MARKDOWN_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  /**
   * Walk up from mdBody to find the best mount point for the wrapper.
   * If any ancestor between mdBody and <body> clips overflow, mount the
   * wrapper on that ancestor's parent so the sidebar is not clipped.
   * Falls back to mdBody itself when no clipping ancestor exists.
   */
  function findMountHost(mdBody) {
    const layoutMain = document.querySelector('.Layout-main');
    if (layoutMain && layoutMain.contains(mdBody)) {
      return layoutMain;
    }

    let el = mdBody.parentElement;
    while (el && el !== document.body) {
      const cs = window.getComputedStyle(el);
      const isClipping = cs.overflow !== 'visible' ||
                         cs.overflowX !== 'visible' ||
                         cs.overflowY !== 'visible';
      if (isClipping && el.parentElement) {
        return el.parentElement;
      }
      el = el.parentElement;
    }
    return mdBody;
  }

  function findReadmeContainer(mdBody, host) {
    let el = mdBody.parentElement;
    while (el && el !== host) {
      if (parseFloat(window.getComputedStyle(el).borderTopWidth) > 0) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  function extractHeaders(mdBody) {
    const headers = [];
    if (!mdBody) return headers;

    const selector = buildHeaderSelector();
    mdBody.querySelectorAll(selector).forEach((el) => {
      const level = parseInt(el.tagName.charAt(1), 10);
      const text = el.textContent.trim();
      if (!text) return;

      let id = el.id;
      if (!id) {
        const anchor = el.querySelector('a.anchor');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href && href.startsWith('#')) {
            id = href.slice(1);
          }
        }
      }
      if (!id) {
        id = 'gmtoc-' + text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
        el.id = id;
      }

      headers.push({ level, text, id, el });
    });

    return headers;
  }

  /**
   * When the top-level heading only appears once, skip it and promote the
   * next level as the display root. E.g. a single H1 + multiple H2s →
   * H2 becomes display-level-1. Applies recursively (single H2 → check H3…).
   * Returns a new array with a `displayLevel` property on each item.
   */
  function normalizeHeaders(headers) {
    if (headers.length === 0) return [];

    const minLevel = Math.min(...headers.map((h) => h.level));
    const topLevelCount = headers.filter((h) => h.level === minLevel).length;

    let skipLevel = minLevel;
    if (topLevelCount === 1) {
      const remaining = headers.filter((h) => h.level !== minLevel);
      if (remaining.length > 0) {
        return normalizeHeaders(remaining);
      }
    }

    const effectiveMin = Math.min(...headers.map((h) => h.level));
    return headers.map((h) => ({
      ...h,
      displayLevel: h.level - effectiveMin + 1,
    }));
  }

  const ICONS = {
    toc: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3.5h12v1H2zm0 4h8v1H2zm0 4h10v1H2zm12-4h-1.5v1H14zm0 4h-1.5v1H14z"/></svg>`,
    collapse: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12 8.5H4v-1h8z"/></svg>`,
    expand: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 4v3.5H12v1H8.5V12h-1V8.5H4v-1h3.5V4z"/></svg>`,
    close: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/></svg>`,
    panelLeft: `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0112.25 14h-8.5A1.75 1.75 0 012 12.25zM3.75 3.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25H5.5v-9zm3.25 0v9h5.25a.25.25 0 00.25-.25v-8.5a.25.25 0 00-.25-.25z"/></svg>`,
    panelRight: `<svg viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M14 3.75A1.75 1.75 0 0012.25 2h-8.5A1.75 1.75 0 002 3.75v8.5c0 .966.784 1.75 1.75 1.75h8.5A1.75 1.75 0 0014 12.25zM12.25 3.5a.25.25 0 01.25.25v8.5a.25.25 0 01-.25.25H10.5v-9zm-3.25 0v9H3.75a.25.25 0 01-.25-.25v-8.5a.25.25 0 01.25-.25z"/></svg>`,
  };

  /* ------------------------------------------------------------------ */
  /*  Sidebar positioning relative to .markdown-body                     */
  /* ------------------------------------------------------------------ */
  const FALLBACK_STICKY_HEIGHT = 224; // 兜底值：224 + gap(26) = 250px 距顶距离

  function getFixedHeaderHeight() {
    const stickyHeader = document.querySelector('#repos-sticky-header > div');
    if (stickyHeader) return stickyHeader.getBoundingClientRect().height;

    let maxBottom = 0;
    document.querySelectorAll('header, nav').forEach((el) => {
      const cs = window.getComputedStyle(el);
      if (cs.position === 'fixed' || cs.position === 'sticky') {
        const bottom = el.getBoundingClientRect().bottom;
        if (bottom > 0 && bottom < 200) {
          maxBottom = Math.max(maxBottom, bottom);
        }
      }
    });
    return maxBottom;
  }

  const TIER_FULL = 260;
  const TIER_NARROW = 160;

  function applyResponsiveTier(sidebar, availableWidth) {
    sidebar.classList.remove('gmtoc-narrow', 'gmtoc-mini-fab');

    if (availableWidth < TIER_NARROW) {
      sidebar.classList.add('gmtoc-mini-fab');
      return;
    }

    if (availableWidth < TIER_FULL) {
      sidebar.classList.add('gmtoc-narrow');
      sidebar.style.width = Math.max(160, Math.min(availableWidth, 259)) + 'px';
    } else {
      sidebar.style.width = Math.max(200, Math.min(availableWidth, 320)) + 'px';
    }

    const btn = sidebar.querySelector('.gmtoc-btn-collapse');
    if (btn) btn.innerHTML = settings.collapsed ? ICONS.expand : ICONS.collapse;
  }

  function positionSidebar() {
    if (!sidebarEl || !wrapperEl || !currentMdBody || !mountHost) return;

    const defaultGap = 26;
    const stickyTop = getFixedHeaderHeight() + defaultGap;
    sidebarEl.style.top = stickyTop + 'px';

    const mdRect = currentMdBody.getBoundingClientRect();
    const hostRect = mountHost.getBoundingClientRect();
    const mdOffsetLeft = mdRect.left - hostRect.left;
    const mdWidth = currentMdBody.offsetWidth;

    if (mountHost !== currentMdBody) {
      const anchor = findReadmeContainer(currentMdBody, mountHost) || currentMdBody;
      const anchorRect = anchor.getBoundingClientRect();
      wrapperEl.style.top = (anchorRect.top - hostRect.top) + 'px';
      wrapperEl.style.height = anchor.offsetHeight + 'px';
    }

    const layout = document.querySelector('.Layout');
    const layoutMain = document.querySelector('.Layout-main');
    let layoutGap = 0;
    const hasLayout = layout && layoutMain;
    if (hasLayout) {
      layoutGap = parseFloat(getComputedStyle(layout).columnGap) || defaultGap;
    }

    const effectiveGap = hasLayout ? layoutGap : defaultGap;

    const availableWidth = settings.position === 'right'
      ? window.innerWidth - mdRect.right - effectiveGap * 2
      : mdRect.left - effectiveGap * 2;

    const isCollapsed = sidebarEl.classList.contains('gmtoc-collapsed');

    // When collapsed, clear inline width so CSS `width: auto` takes effect;
    // skip responsive-tier logic (the 32 px icon needs no tier adjustment).
    if (isCollapsed) {
      sidebarEl.style.width = '';
    } else {
      applyResponsiveTier(sidebarEl, availableWidth);
    }

    if (sidebarEl.classList.contains('gmtoc-mini-fab')) {
      wrapperEl.style.left = 'auto';
      wrapperEl.style.right = '12px';
    } else {
      wrapperEl.style.right = 'auto';

      if (settings.position === 'right') {
        sidebarEl.style.transform = '';
        if (hasLayout) {
          const mainRect = layoutMain.getBoundingClientRect();
          wrapperEl.style.left = (mainRect.right - hostRect.left + layoutGap) + 'px';
        } else {
          wrapperEl.style.left = (mdOffsetLeft + mdWidth + effectiveGap) + 'px';
        }
      } else {
        sidebarEl.style.transform = 'translateX(-100%)';
        if (hasLayout) {
          const mainRect = layoutMain.getBoundingClientRect();
          wrapperEl.style.left = (mainRect.left - hostRect.left - layoutGap) + 'px';
        } else {
          wrapperEl.style.left = (mdOffsetLeft - effectiveGap) + 'px';
        }
      }
    }
  }

  const debouncedPosition = debounce(positionSidebar, 100);

  function setupPositionTracking() {
    destroyPositionTracking();

    if (currentMdBody) {
      resizeObserver = new ResizeObserver(debouncedPosition);
      resizeObserver.observe(currentMdBody);
      resizeObserver.observe(document.documentElement);

      if (mountHost && mountHost !== currentMdBody) {
        resizeObserver.observe(mountHost);
      }

      const stickyHeader = document.querySelector('#repos-sticky-header');
      if (stickyHeader) {
        resizeObserver.observe(stickyHeader);
        // 同时观察 sticky header 的直接子 div，确保高度变化时更新位置
        const stickyDiv = stickyHeader.querySelector(':scope > div');
        if (stickyDiv) {
          resizeObserver.observe(stickyDiv);
        }
      }
    }

    // 观察 #repos-sticky-header 元素出现（GitHub 可能延迟渲染该元素）
    if (!document.querySelector('#repos-sticky-header')) {
      stickyHeaderObserver = new MutationObserver(() => {
        const stickyHeader = document.querySelector('#repos-sticky-header');
        if (stickyHeader) {
          if (resizeObserver) {
            resizeObserver.observe(stickyHeader);
            const stickyDiv = stickyHeader.querySelector(':scope > div');
            if (stickyDiv) resizeObserver.observe(stickyDiv);
          }
          debouncedPosition();
          if (stickyHeaderObserver) {
            stickyHeaderObserver.disconnect();
            stickyHeaderObserver = null;
          }
        }
      });
      stickyHeaderObserver.observe(document.body, { childList: true, subtree: true });
    }

    window.addEventListener('resize', debouncedPosition, { passive: true });
  }

  function destroyPositionTracking() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (stickyHeaderObserver) {
      stickyHeaderObserver.disconnect();
      stickyHeaderObserver = null;
    }
    window.removeEventListener('resize', debouncedPosition);
  }

  /* ------------------------------------------------------------------ */
  /*  Sidebar DOM                                                        */
  /* ------------------------------------------------------------------ */
  function createSidebar() {
    if (sidebarEl) return sidebarEl;
    if (!currentMdBody) return null;

    mountHost = findMountHost(currentMdBody);

    const hostStyle = window.getComputedStyle(mountHost);
    if (hostStyle.position === 'static') {
      mountHost.style.position = 'relative';
    }

    const wrapper = document.createElement('div');
    wrapper.id = WRAPPER_ID;

    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;
    if (settings.collapsed) sidebar.classList.add('gmtoc-collapsed');

    const positionIcon = settings.position === 'right' ? ICONS.panelLeft : ICONS.panelRight;
    const positionTitle = settings.position === 'right'
      ? chrome.i18n.getMessage('move_to_left')
      : chrome.i18n.getMessage('move_to_right');

    sidebar.innerHTML = `
      <div class="gmtoc-header">
        <div class="gmtoc-header-left">
          <span class="gmtoc-icon">${ICONS.toc}</span>
          <span class="gmtoc-title-text">${chrome.i18n.getMessage('navigation')}</span>
        </div>
        <div class="gmtoc-header-right">
          <button class="gmtoc-btn gmtoc-btn-position" title="${positionTitle}">
            ${positionIcon}
          </button>
          <button class="gmtoc-btn gmtoc-btn-collapse" title="${chrome.i18n.getMessage('collapse_expand')}">
            ${settings.collapsed ? ICONS.expand : ICONS.collapse}
          </button>
        </div>
      </div>
      <div class="gmtoc-body"></div>
    `;

    sidebar.querySelector('.gmtoc-btn-position').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePosition();
    });

    sidebar.querySelector('.gmtoc-btn-collapse').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCollapse();
    });

    sidebar.querySelector('.gmtoc-header').addEventListener('click', (e) => {
      if (sidebarEl.classList.contains('gmtoc-mini-fab') || sidebarEl.classList.contains('gmtoc-collapsed')) {
        e.stopPropagation();
        toggleCollapse();
      }
    });


    wrapper.appendChild(sidebar);
    mountHost.appendChild(wrapper);
    wrapperEl = wrapper;
    sidebarEl = sidebar;
    bodyEl = sidebar.querySelector('.gmtoc-body');

    return sidebar;
  }

  function removeSidebar() {
    if (wrapperEl) {
      wrapperEl.remove();
      wrapperEl = null;
    }
    sidebarEl = null;
    bodyEl = null;
    currentMdBody = null;
    mountHost = null;
    destroyModal();
    destroyObserver();
    destroyPositionTracking();
  }

  function hideSidebar() {
    removeSidebar();
  }

  function togglePosition() {
    settings.position = settings.position === 'right' ? 'left' : 'right';
    chrome.storage.sync.set({ [STORAGE_KEY_POSITION]: settings.position });
    removeSidebar();
    update();
  }

  function toggleCollapse() {
    if (!sidebarEl) return;

    if (sidebarEl.classList.contains('gmtoc-mini-fab')) {
      openModal();
      return;
    }

    settings.collapsed = !settings.collapsed;
    sidebarEl.classList.toggle('gmtoc-collapsed', settings.collapsed);

    const btn = sidebarEl.querySelector('.gmtoc-btn-collapse');
    if (btn) btn.innerHTML = settings.collapsed ? ICONS.expand : ICONS.collapse;

    chrome.storage.sync.set({ [STORAGE_KEY_COLLAPSED]: settings.collapsed });

    // 等待 CSS 布局更新后重新计算位置（收起时宽度从全尺寸变为 32px）
    requestAnimationFrame(() => positionSidebar());
  }

  function createModal() {
    if (modalEl) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'gmtoc-overlay';
    overlayEl.addEventListener('click', closeModal);

    modalEl = document.createElement('div');
    modalEl.className = 'gmtoc-modal';

    modalEl.innerHTML = `
      <div class="gmtoc-modal-header">
        <div class="gmtoc-modal-header-left">
          <span class="gmtoc-icon">${ICONS.toc}</span>
          <span class="gmtoc-title-text">${chrome.i18n.getMessage('navigation')}</span>
        </div>
        <button class="gmtoc-btn gmtoc-btn-collapse" title="${chrome.i18n.getMessage('close')}">
          ${ICONS.close}
        </button>
      </div>
      <div class="gmtoc-modal-body"></div>
    `;

    modalEl.querySelector('.gmtoc-btn-collapse').addEventListener('click', (e) => {
      e.stopPropagation();
      closeModal();
    });

    modalBodyEl = modalEl.querySelector('.gmtoc-modal-body');

    document.body.appendChild(overlayEl);
    document.body.appendChild(modalEl);
  }

  function openModal() {
    createModal();
    renderModalTOC();
    overlayEl.classList.add('gmtoc-overlay-visible');
    modalEl.classList.add('gmtoc-modal-visible');

    const activeItem = modalBodyEl && modalBodyEl.querySelector('.gmtoc-active');
    if (activeItem) {
      requestAnimationFrame(() => activeItem.scrollIntoView({ block: 'nearest' }));
    }
  }

  function closeModal() {
    if (overlayEl) overlayEl.classList.remove('gmtoc-overlay-visible');
    if (modalEl) modalEl.classList.remove('gmtoc-modal-visible');
  }

  function destroyModal() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    if (modalEl) { modalEl.remove(); modalEl = null; }
    modalBodyEl = null;
  }

  function renderModalTOC() {
    if (!modalBodyEl) return;
    modalBodyEl.innerHTML = '';

    const normalized = normalizeHeaders(currentHeaders);

    if (normalized.length === 0) {
      modalBodyEl.innerHTML = `<div class="gmtoc-empty">${chrome.i18n.getMessage('no_headers_found')}</div>`;
      return;
    }

    normalized.forEach((h) => {
      const item = document.createElement('a');
      item.className = `gmtoc-item gmtoc-level-${h.displayLevel}`;
      if (h.id === activeId) item.classList.add('gmtoc-active');
      item.textContent = h.text;
      item.title = h.text;
      item.dataset.id = h.id;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
          history.replaceState(null, '', `#${h.id}`);
          setActive(h.id);
        }
      });

      modalBodyEl.appendChild(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Render TOC items                                                   */
  /* ------------------------------------------------------------------ */
  function renderTOC(headers) {
    if (!bodyEl) return;
    bodyEl.innerHTML = '';

    const normalized = normalizeHeaders(headers);

    if (normalized.length === 0) {
      bodyEl.innerHTML = `<div class="gmtoc-empty">${chrome.i18n.getMessage('no_headers_found')}</div>`;
      return;
    }

    normalized.forEach((h) => {
      const item = document.createElement('a');
      item.className = `gmtoc-item gmtoc-level-${h.displayLevel}`;
      item.textContent = h.text;
      item.title = h.text;
      item.dataset.id = h.id;

      item.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
          history.replaceState(null, '', `#${h.id}`);
          setActive(h.id);
        }
      });

      bodyEl.appendChild(item);
    });
  }

  function setActive(id) {
    if (activeId === id) return;
    activeId = id;

    [bodyEl, modalBodyEl].forEach((container) => {
      if (!container) return;
      container.querySelectorAll('.gmtoc-item').forEach((item) => {
        item.classList.toggle('gmtoc-active', item.dataset.id === id);
      });
      const activeItem = container.querySelector('.gmtoc-active');
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Scroll tracking                                                    */
  /* ------------------------------------------------------------------ */
  let scrollRafId = null;

  function setupObserver(headers) {
    destroyObserver();
    if (headers.length === 0) return;

    const onScroll = () => {
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null;
        updateActiveHeader();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveHeader();
  }

  function updateActiveHeader() {
    if (currentHeaders.length === 0) return;

    const offset = 80;
    let active = currentHeaders[0];

    for (const h of currentHeaders) {
      const rect = h.el.getBoundingClientRect();
      if (rect.top <= offset) {
        active = h;
      } else {
        break;
      }
    }

    if (active) setActive(active.id);
  }

  function destroyObserver() {
    if (scrollRafId) {
      cancelAnimationFrame(scrollRafId);
      scrollRafId = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Main flow                                                          */
  /* ------------------------------------------------------------------ */
  function update() {
    // 检测 stale DOM 引用：SPA 导航后旧 sidebar 已不在 DOM 中
    if (sidebarEl && !sidebarEl.isConnected) {
      removeSidebar();
    }

    const mdBody = findMarkdownBody();

    if (!mdBody) {
      removeSidebar();
      return;
    }

    const headers = extractHeaders(mdBody);

    if (headers.length === 0) {
      removeSidebar();
      return;
    }

    currentHeaders = headers;
    currentMdBody = mdBody;
    createSidebar();
    renderTOC(headers);
    setupObserver(headers);
    positionSidebar();
    setupPositionTracking();
  }

  const debouncedUpdate = debounce(update, DEBOUNCE_MS);

  /* ------------------------------------------------------------------ */
  /*  SPA navigation detection (GitHub Turbo)                            */
  /* ------------------------------------------------------------------ */
  function setupNavigationListener() {
    document.addEventListener('turbo:load', debouncedUpdate);
    document.addEventListener('turbo:render', debouncedUpdate);
    document.addEventListener('soft-nav:end', debouncedUpdate);
    window.addEventListener('popstate', debouncedUpdate);

    const mo = new MutationObserver(
      debounce(() => {
        const mdBody = findMarkdownBody();
        if (mdBody) {
          if (!sidebarEl) {
            debouncedUpdate();
            return;
          }
          const newHeaders = extractHeaders(mdBody);
          const newSig = newHeaders.map((h) => `${h.level}:${h.id}`).join('|');
          const oldSig = currentHeaders.map((h) => `${h.level}:${h.id}`).join('|');
          if (newSig !== oldSig) {
            debouncedUpdate();
          }
        } else if (sidebarEl) {
          removeSidebar();
        }
      }, 500)
    );

    mo.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Settings                                                           */
  /* ------------------------------------------------------------------ */
  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        {
          [STORAGE_KEY_POSITION]: 'right',
          [STORAGE_KEY_COLLAPSED]: false,
          [STORAGE_KEY_MAX_LEVEL]: 4,
        },
        (result) => {
          settings.position = result[STORAGE_KEY_POSITION] || 'right';
          settings.collapsed = result[STORAGE_KEY_COLLAPSED] || false;
          settings.maxLevel = result[STORAGE_KEY_MAX_LEVEL] || 3;
          resolve();
        }
      );
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;

    let needsRebuild = false;

    if (changes[STORAGE_KEY_POSITION]) {
      settings.position = changes[STORAGE_KEY_POSITION].newValue;
      needsRebuild = true;
    }

    if (changes[STORAGE_KEY_MAX_LEVEL]) {
      settings.maxLevel = changes[STORAGE_KEY_MAX_LEVEL].newValue;
      needsRebuild = true;
    }

    if (changes[STORAGE_KEY_COLLAPSED]) {
      settings.collapsed = changes[STORAGE_KEY_COLLAPSED].newValue;
      if (sidebarEl) {
        sidebarEl.classList.toggle('gmtoc-collapsed', settings.collapsed);
        const btn = sidebarEl.querySelector('.gmtoc-btn-collapse');
        if (btn) btn.innerHTML = settings.collapsed ? ICONS.expand : ICONS.collapse;
      }
    }

    if (needsRebuild) {
      removeSidebar();
      update();
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Init                                                               */
  /* ------------------------------------------------------------------ */
  async function init() {
    await loadSettings();
    update();
    setupNavigationListener();
    // 兜底：等待浏览器完成首次布局后再次校正 sidebar 位置
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        positionSidebar();
      });
    });
  }

  if (!window.__gmtocInitialized) {
    window.__gmtocInitialized = true;
    init();
  }
})();
