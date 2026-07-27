// hash 기반 SPA 라우터. #/page?a=b 형태만 사용한다.
export function parseHash(hash) {
  const h = (hash || '').replace(/^#\/?/, '');
  if (!h) return { page: 'home', params: {} };
  const [page, query] = h.split('?');
  const params = {};
  if (query) {
    for (const pair of query.split('&')) {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
  }
  return { page: page || 'home', params };
}

let currentRoutes = null;
let currentPage = null;

export function initRouter(routes) {
  currentRoutes = routes;
  window.addEventListener('hashchange', render);
  render();
}

export function go(page, params = {}) {
  const q = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  location.hash = `#/${page}${q ? '?' + q : ''}`;
}

function render() {
  const { page, params } = parseHash(location.hash);
  const el = document.getElementById('app');
  if (currentPage && currentPage.unmount) currentPage.unmount();
  const route = currentRoutes[page] || currentRoutes.home;
  currentPage = route;
  el.innerHTML = '';
  el.className = `page-${page}`;
  route.mount(el, params);
  window.scrollTo(0, 0);
}
