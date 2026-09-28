// Build-time ASCII lettering (figlet "ANSI Shadow", the block style of the
// Claude Code banner). Runs in Astro frontmatter only; never shipped to the client.

import figlet from 'figlet';

const escape = (c: string) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);

export function asciiRows(text: string) {
  const rows = figlet.textSync(text.toUpperCase(), { font: 'ANSI Shadow' }).split('\n');
  while (rows.length && !rows.at(-1)!.trim()) rows.pop();
  const cols = Math.max(...rows.map((r) => [...r].length));
  return { rows: rows.map((r) => r.padEnd(cols)), cols };
}

// Solid blocks become <i> cells (the client script shimmers them under the
// pointer); the box-drawing "shadow" runs are grouped into <b> so they can be toned down.
export function asciiHtml(rows: string[]) {
  return rows
    .map((row) => {
      let html = '';
      let shadow = '';
      const flush = () => {
        if (shadow) html += `<b>${shadow}</b>`;
        shadow = '';
      };
      for (const c of row) {
        if (c === '█') {
          flush();
          html += '<i>█</i>';
        } else if (c === ' ') {
          flush();
          html += ' ';
        } else shadow += escape(c);
      }
      flush();
      return `<span class="ascii__row">${html}</span>`;
    })
    .join('');
}
