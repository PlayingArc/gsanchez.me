// Everything personal lives in this folder. Edit these files; the page reads from them.
// Profile, links and experience are real (#5); so are the projects on the TV wall (#24).

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

// What a TV's screen shows; each one is drawn in src/scripts/dashboards.ts.
export type Preview = 'money' | 'tarimas' | 'retail' | 'clinic';

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

// The TV wall, in each language: two case studies, then two demo dashboards.
// `href` is where the TV takes you. App Tarimas is Spanish-only, so both
// languages open the same build.
export const projectsByLocale: Record<'en' | 'es', Project[]> = {
  en: [
    {
      slug: 'money-on-rails',
      title: 'Money on Rails',
      kind: 'Case study',
      year: '2026',
      summary:
        "Analytics for YNAB that YNAB itself doesn't give you: how closely you followed your plan, how well the plan is built, and where each month's money went. The demo runs on an invented household, no sign-in.",
      stack: ['Next.js', 'TypeScript', 'YNAB API', 'Postgres', 'ECharts', 'OpenAI'],
      href: 'https://moneyonrails.app/demo/en/overview',
      preview: 'money',
    },
    {
      slug: 'tarimas',
      title: 'App Tarimas',
      kind: 'Case study',
      year: '2025',
      summary:
        'Builds the logistics label for every pallet of a Walmart order: capture the order, drag its boxes onto pallets, print. It cut labelling to about two minutes. The demo uses sample products and is in Spanish, as the app is.',
      stack: ['React', 'Ant Design', 'dnd-kit', 'Barcodes'],
      href: '/demos/tarimas/',
      preview: 'tarimas',
    },
    {
      slug: 'casa-zenzontle',
      title: 'Casa Zenzontle',
      kind: 'Demo dashboard',
      year: '2026',
      summary:
        'Sales for an invented home-goods retailer with eight stores and an online shop: net sales against target by month, store, category and product, with filters that read as a sentence and charts that filter each other.',
      stack: ['TypeScript', 'SVG', 'Astro'],
      href: '/en/demos/retail',
      preview: 'retail',
    },
    {
      slug: 'molara-dental',
      title: 'Molara Dental',
      kind: 'Demo dashboard',
      year: '2026',
      summary:
        'Chairs, no-shows and revenue for an invented chain of five dental clinics: when the chairs are full, where and how far ahead no-shows happen, where revenue comes from, and which patients are due back.',
      stack: ['TypeScript', 'SVG', 'Astro'],
      href: '/en/demos/clinic',
      preview: 'clinic',
    },
  ],
  es: [
    {
      slug: 'money-on-rails',
      title: 'Money on Rails',
      kind: 'Caso de estudio',
      year: '2026',
      summary:
        'Análisis para YNAB que YNAB no te da: qué tanto seguiste tu plan, qué tan bien está armado y a dónde se fue el dinero de cada mes. La demo usa un hogar inventado, sin iniciar sesión.',
      stack: ['Next.js', 'TypeScript', 'YNAB API', 'Postgres', 'ECharts', 'OpenAI'],
      href: 'https://moneyonrails.app/demo/es/overview',
      preview: 'money',
    },
    {
      slug: 'tarimas',
      title: 'App Tarimas',
      kind: 'Caso de estudio',
      year: '2025',
      summary:
        'Genera la etiqueta logística de cada tarima de un pedido de Walmart: capturas el pedido, arrastras sus cajas a las tarimas e imprimes. Bajó el etiquetado a unos dos minutos. La demo usa productos de ejemplo.',
      stack: ['React', 'Ant Design', 'dnd-kit', 'Códigos de barras'],
      href: '/demos/tarimas/',
      preview: 'tarimas',
    },
    {
      slug: 'casa-zenzontle',
      title: 'Casa Zenzontle',
      kind: 'Dashboard de demostración',
      year: '2026',
      summary:
        'Ventas de una tienda inventada de artículos para el hogar, con ocho sucursales y tienda en línea: ventas netas contra meta por mes, tienda, categoría y producto, con filtros que se leen como una frase y gráficas que se filtran entre sí.',
      stack: ['TypeScript', 'SVG', 'Astro'],
      href: '/es/demos/retail',
      preview: 'retail',
    },
    {
      slug: 'molara-dental',
      title: 'Molara Dental',
      kind: 'Dashboard de demostración',
      year: '2026',
      summary:
        'Sillones, inasistencias e ingresos de una cadena inventada de cinco clínicas dentales: cuándo se llenan los sillones, dónde y con cuánta anticipación faltan los pacientes, de dónde vienen los ingresos y quién debe volver.',
      stack: ['TypeScript', 'SVG', 'Astro'],
      href: '/es/demos/clinic',
      preview: 'clinic',
    },
  ],
};

// The one-page site is English until the bilingual pages land (#23), which
// will read `projectsByLocale[locale]` instead.
export const projects = projectsByLocale.en;
