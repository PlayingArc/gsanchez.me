// Filter state lives in the query string, so any view of a demo dashboard can be linked.

export type Params = Record<string, string | null | undefined>;

export function readParams(): URLSearchParams {
  return new URLSearchParams(location.search);
}

/** Replaces the query string without adding history entries; empty values are dropped. */
export function writeParams(params: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  history.replaceState(null, '', s ? `${location.pathname}?${s}` : location.pathname);
}

/** Keeps the language switcher pointing at the same view in the other language. */
export function syncLangLinks(root: ParentNode = document) {
  root.querySelectorAll<HTMLAnchorElement>('a[data-keep-query]').forEach((a) => {
    const url = new URL(a.href, location.href);
    url.search = location.search;
    a.href = url.pathname + url.search;
  });
}
