// Everything personal lives in this folder. Edit these files; the page reads from them.
// Profile, links and experience are real (#5). Projects are placeholders until the wall tickets land.

export const profile = {
  firstName: 'Gerardo',
  lastName: 'Sanchez',
  role: 'Modern Engineer',
  location: 'Monterrey, Mexico',
  timezone: 'America/Monterrey',
  available: true,
  email: 'hello@gsanchez.me',
  resumeUrl: '/gerardo-sanchez-resume.pdf', // public CV, no phone; source ~/Documents/CVs/build/cv_modern_engineer_2026.html
  pitch:
    'I turn scattered business data into dashboards and AI tools people actually use, from the warehouse to the screen.',
  statement: ['I build', 'data systems', 'that turn', 'operations', 'into', 'answers.'],
  about: [
    'I trained as a physicist at UANL, where my thesis simulated gravitational microlensing to build a 223k light-curve dataset for a machine-learning classifier. Then I went into industry and found the same problem everywhere: the data exists, but nobody can see it.',
    'At a Monterrey food-manufacturing group I led the data side of an ERP rollout and gave management its first live view of sales, production and costs. Now I freelance: warehouses on Google Cloud, dashboards, and LLM-powered tools, like Money on Rails, my budgeting app built on the YNAB API.',
  ],
  now: [
    ['Currently', 'Freelance data & AI engineering'],
    ['Building', 'Money on Rails'],
    ['Based in', 'Monterrey, Mexico · open to remote & relocation'],
  ] as [string, string][],
};

export const links = [
  { label: 'GitHub', href: 'https://github.com/PlayingArc', handle: '@PlayingArc' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gerardo-s-4ab806105', handle: 'in/gerardo-s-4ab806105' },
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

// Internal work (Power BI production dashboard, Looker Studio dashboard, Dashboard de
// Mantenimiento) is described here only, never linked. See CONTEXT.md.
export const experience: Experience[] = [
  {
    start: '2025',
    end: 'Now',
    role: 'Independent Data & AI Engineer',
    company: 'Corporate clients',
    summary:
      'Build serverless data platforms on Google Cloud for corporate clients: Cloud Functions, Pub/Sub and BigQuery, modelled with dbt, with a Looker Studio dashboard for leadership on top. Shipped a Meta Conversions API service that feeds offline sales back to Meta, in production within a week. I run and maintain what I ship on monthly service agreements.',
    tags: ['GCP', 'BigQuery', 'dbt', 'Python', 'Looker Studio', 'Meta CAPI'],
  },
  {
    start: '2024',
    end: '2025',
    role: 'Lead Data Analyst',
    company: 'TortiRegias · Nyjisa · Chilokia',
    summary:
      'Led the data side of an Alpha ERP rollout across the whole group, working with every department head. Built the Power BI production dashboard and Dashboard de Mantenimiento, the first live view of operations management had. Shipped App Tarimas, which cut Walmart pallet labelling to about two minutes, and automated reports worth roughly two months of manual work a year.',
    tags: ['SQL', 'Power BI', 'Python', 'Streamlit', 'React'],
  },
  {
    start: '2022',
    end: '2023',
    role: 'Undergraduate Researcher',
    company: 'UANL · Facultad de Ciencias Físico Matemáticas',
    summary:
      'Thesis on gravitational microlensing. Derived the lensing model from first principles, simulated it in Fortran across a wide parameter sweep, and produced 223k labelled light curves to train a classifier that detects microlensing events.',
    tags: ['Fortran', 'Python', 'Machine learning'],
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
