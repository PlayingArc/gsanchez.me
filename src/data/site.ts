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

// `href` is where the CRT screen takes you. Point these at the live demos when they exist.
export const projects: Project[] = [
  {
    slug: 'retail-pulse',
    title: 'Retail Pulse',
    kind: 'Web app',
    year: '2025',
    summary: 'Placeholder. Real-time sales and margin tracking across stores, with drill-down by region and product.',
    stack: ['TypeScript', 'React', 'SQL'],
    href: '#demo/retail-pulse',
    repo: '#',
    preview: 'sales',
  },
  {
    slug: 'ops-overview',
    title: 'Ops Overview',
    kind: 'Power BI',
    year: '2024',
    summary: 'Placeholder. Operations KPIs for a warehouse network: throughput, backlog and SLA breaches at a glance.',
    stack: ['Power BI', 'DAX', 'SQL Server'],
    href: '#demo/ops-overview',
    preview: 'ops',
  },
  {
    slug: 'funnel-lens',
    title: 'Funnel Lens',
    kind: 'Looker Studio',
    year: '2024',
    summary: 'Placeholder. Marketing funnel from first touch to purchase, with channel attribution and cohort retention.',
    stack: ['Looker Studio', 'BigQuery', 'GA4'],
    href: '#demo/funnel-lens',
    preview: 'funnel',
  },
  {
    slug: 'transit-flow',
    title: 'Transit Flow',
    kind: 'Web demo',
    year: '2026',
    summary: 'Placeholder for a new demo. Ridership by line and hour, built from open transit data.',
    stack: ['TypeScript', 'D3'],
    href: '#demo/transit-flow',
    preview: 'transit',
  },
  {
    slug: 'grid-load',
    title: 'Grid Load',
    kind: 'Web demo',
    year: '2026',
    summary: 'Placeholder for a new demo. Electricity demand versus generation mix, updated as if live.',
    stack: ['TypeScript', 'Canvas'],
    href: '#demo/grid-load',
    preview: 'energy',
  },
];
