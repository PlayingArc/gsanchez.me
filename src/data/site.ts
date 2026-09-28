// Everything personal lives in this folder. Edit these files; the page reads from them.
// All copy below is placeholder text.

export const profile = {
  firstName: 'Gerardo',
  lastName: 'Sanchez',
  role: 'Data Analyst & Dashboard Developer',
  location: 'City, Country',
  timezone: 'America/Mexico_City',
  available: true,
  email: 'hello@example.com',
  resumeUrl: '#',
  pitch:
    'I turn messy data into dashboards people actually open — clear, fast, and built to answer the question behind the question.',
  statement: ['I build', 'dashboards', 'that make', 'numbers', 'read like', 'sentences.'],
  about: [
    'Placeholder bio. A couple of sentences about where you come from, what kind of problems you like, and the tools you reach for first.',
    'A second short paragraph: what you are learning right now, what you want to do next, and the kind of team you want to do it with.',
  ],
  now: [
    ['Currently', 'Placeholder role @ Company'],
    ['Learning', 'TypeScript, D3, web development'],
    ['Based in', 'City, Country'],
  ] as [string, string][],
};

export const links = [
  { label: 'GitHub', href: 'https://github.com/', handle: '@username' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/', handle: 'in/username' },
  { label: 'Email', href: `mailto:${profile.email}`, handle: profile.email },
  { label: 'Résumé', href: profile.resumeUrl, handle: 'PDF' },
];

export type Experience = {
  start: string;
  end: string;
  role: string;
  company: string;
  href?: string;
  summary: string;
  tags: string[];
};

export const experience: Experience[] = [
  {
    start: '2024',
    end: 'Now',
    role: 'Data Analyst',
    company: 'Company One',
    href: '#',
    summary:
      'Placeholder. Built and maintained the reporting layer for a team of 40. Replaced a weekly spreadsheet ritual with a live dashboard and cut report prep from a day to minutes.',
    tags: ['SQL', 'Power BI', 'Python'],
  },
  {
    start: '2022',
    end: '2024',
    role: 'Business Intelligence Intern',
    company: 'Company Two',
    href: '#',
    summary:
      'Placeholder. Modelled sales and inventory data, shipped the first Looker Studio suite for regional managers, and documented the metrics so everyone agreed on one number.',
    tags: ['Looker Studio', 'BigQuery', 'dbt'],
  },
  {
    start: '2021',
    end: '2022',
    role: 'Research Assistant',
    company: 'University Lab',
    href: '#',
    summary:
      'Placeholder. Cleaned survey datasets, automated figures for two papers, and built a small Streamlit tool the lab still uses.',
    tags: ['Python', 'Pandas', 'Streamlit'],
  },
];

export type Preview = 'sales' | 'ops' | 'funnel' | 'transit' | 'energy';

export type Project = {
  slug: string;
  title: string;
  kind: string;
  year: string;
  summary: string;
  stack: string[];
  href: string;
  repo?: string;
  preview: Preview;
};

// The TV wall: two case studies, then two demo dashboards. `href` is where the
// TV screen takes you; point these at the live demos when they exist. Copy and
// demo subjects are placeholders until the real content is collected.
export const projects: Project[] = [
  {
    slug: 'money-on-rails',
    title: 'Money on Rails',
    kind: 'Case study',
    year: '2026',
    summary: 'Placeholder. What Money on Rails is, who it is for, and what the public demo lets you try.',
    stack: ['Placeholder'],
    href: '#demo/money-on-rails',
    preview: 'sales',
  },
  {
    slug: 'tarimas',
    title: 'App Tarimas',
    kind: 'Case study',
    year: '2026',
    summary: 'Placeholder. What App Tarimas does, the problem it solved, and what you can open in the demo.',
    stack: ['Placeholder'],
    href: '#demo/tarimas',
    preview: 'ops',
  },
  {
    slug: 'funnel-lens',
    title: 'Funnel Lens',
    kind: 'Demo dashboard',
    year: '2026',
    summary: 'Placeholder demo dashboard. Marketing funnel from first touch to purchase, with channel attribution.',
    stack: ['TypeScript', 'SVG'],
    href: '#demo/funnel-lens',
    preview: 'funnel',
  },
  {
    slug: 'grid-load',
    title: 'Grid Load',
    kind: 'Demo dashboard',
    year: '2026',
    summary: 'Placeholder demo dashboard. Electricity demand versus generation mix, updated as if live.',
    stack: ['TypeScript', 'Canvas'],
    href: '#demo/grid-load',
    preview: 'energy',
  },
];
