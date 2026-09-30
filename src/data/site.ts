// Everything personal lives in this folder. Edit these files; the page reads from them.
// Profile, links and experience are real (#5); so are the projects on the TV's channels (#24).
// Every string a visitor reads exists in English and Spanish: `site(locale)` returns one language.

export type Locale = 'en' | 'es';
export const locales: Locale[] = ['en', 'es'];
export const otherLocale = (l: Locale): Locale => (l === 'en' ? 'es' : 'en');

// Language-neutral facts. Text that gets translated lives in `copy` below.
export const profile = {
  firstName: 'Gerardo',
  lastName: 'Sanchez',
  fullName: 'Gerardo Sánchez López', // full name, for search engines only (JSON-LD in OnePage.astro)
  role: 'Modern Engineer', // kept in English in both languages, as on the résumé
  timezone: 'America/Monterrey',
  available: true,
  email: 'hello@gsanchez.me',
  resumeUrl: '/gerardo-sanchez-resume.pdf', // public CV, no phone; source ~/Documents/CVs/build/cv_modern_engineer_2026.html
};

export type Link = { label: string; href: string; handle: string };

export type Experience = {
  start: string;
  end: string;
  role: string;
  company: string;
  href?: string;
  summary: string;
  tags: string[];
};

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

type Copy = {
  langName: string; // this language, in itself
  switchLabel: string; // short label for the switcher that leads here
  skip: string;
  nav: { about: string; experience: string; work: string; contact: string };
  header: { status: string; cta: string };
  location: string;
  pitch: string;
  statement: string[];
  about: string[];
  now: [string, string][];
  hero: {
    portfolio: string;
    onThisPage: string;
    notes: { about: string; experience: (roles: number, since: string) => string; work: (n: number) => string; contact: string };
    basedIn: string;
    local: string;
    scroll: string;
  };
  experience: { resume: string; tools: string; jobs: Experience[] };
  work: {
    liveDemos: string;
    stepInside: string;
    // The TV, its channel details and the pager that flips channels.
    set: {
      // The TV's name when it has focus, which is when its number keys work.
      label: (n: number) => string;
      channels: string;
      channelUp: string;
      channelDown: string;
      signal: string;
      liveNote: string;
      previewNote: string;
      tag: { live: string; preview: string; tuning: string };
      credit: string;
    };
    source: string;
    index: string;
    cols: { no: string; project: string; type: string; stack: string; year: string; link: string };
    stackLabel: string;
    projects: Project[];
  };
  contact: { links: Link[]; builtWith: string; palette: string; backToTop: string };
  notFound: { title: string; kicker: string; heading: string; back: string };
};

const copy: Record<Locale, Copy> = {
  en: {
    langName: 'English',
    switchLabel: 'EN',
    skip: 'Skip to content',
    nav: { about: 'About', experience: 'Experience', work: 'Work', contact: 'Contact' },
    header: { status: '(Open to new roles)', cta: 'Get in touch →' },
    location: 'Monterrey, Mexico',
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
    ],
    hero: {
      portfolio: 'Portfolio',
      onThisPage: 'On this page',
      notes: {
        about: 'Who I am, what I work with',
        experience: (roles, since) => `${roles} roles, ${since}–now`,
        work: (n) => `${n} live demos`, // matches the Work header's count
        contact: 'Email, GitHub, LinkedIn',
      },
      basedIn: 'Based in',
      local: 'local',
      scroll: 'Scroll ↓',
    },
    experience: {
      resume: 'Full résumé ↗',
      tools: 'Tools',
      // Internal work (Power BI production dashboard, Looker Studio dashboard, Dashboard de
      // Mantenimiento) is described here only, never linked. See CONTEXT.md.
      jobs: [
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
      ],
    },
    work: {
      liveDemos: 'live demos',
      stepInside: 'Step inside ↗',
      set: {
        label: (n) => `TV: keys 1 to ${n} pick a channel, plus and minus flip through them`,
        channels: 'Channels',
        channelUp: 'Channel up',
        channelDown: 'Channel down',
        signal: 'Signal',
        liveNote: 'Live · hover the screen to try it',
        previewNote: 'Preview · runs on its own site',
        tag: { live: 'Live', preview: 'Preview', tuning: 'Tuning in…' },
        credit: 'TV: “IBM PCjr 4863 Computer” by Freepoly.org, CC BY 4.0',
      },
      source: 'Source',
      index: 'Index',
      cols: { no: 'No.', project: 'Project', type: 'Type', stack: 'Stack', year: 'Year', link: 'Link' },
      stackLabel: 'Stack',
      // The TV's channels: two case studies, then two demo dashboards. `href` is where
      // the channel takes you (a same-site href also plays live on the screen); `preview`
      // picks its static screen in src/scripts/dashboards.ts.
      projects: [
        {
          slug: 'money-on-rails',
          title: 'Money on Rails',
          kind: 'Case study',
          year: '2026',
          summary:
            "Analytics for YNAB that YNAB itself doesn't give you: how closely you followed your plan, how well the plan is built, and where each month's money went. The demo runs on an invented household, no sign-in.",
          stack: ['Next.js', 'TypeScript', 'YNAB API', 'Postgres', 'ECharts', 'OpenAI'],
          href: '/en/demos/money-on-rails/overview',
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
          href: '/en/demos/retail/',
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
          href: '/en/demos/clinic/',
          preview: 'clinic',
        },
      ],
    },
    contact: {
      links: [
        { label: 'GitHub', href: 'https://github.com/PlayingArc', handle: '@PlayingArc' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gerardo-s-4ab806105', handle: 'in/gerardo-s-4ab806105' },
        { label: 'Email', href: `mailto:${profile.email}`, handle: profile.email },
        { label: 'Résumé', href: profile.resumeUrl, handle: 'PDF' },
      ],
      builtWith: 'Built with Astro · ASCII after play.core',
      palette: 'Palette after',
      backToTop: 'Back to top ↑',
    },
    notFound: {
      title: '404 — Not found',
      kicker: 'Error 404 · No signal',
      heading: 'This channel is off the air.',
      back: '← Back to gsanchez.me',
    },
  },

  es: {
    langName: 'Español',
    switchLabel: 'ES',
    skip: 'Saltar al contenido',
    nav: { about: 'Sobre mí', experience: 'Experiencia', work: 'Trabajo', contact: 'Contacto' },
    header: { status: '(Abierto a nuevos roles)', cta: 'Escríbeme →' },
    location: 'Monterrey, México',
    pitch:
      'Convierto datos de negocio dispersos en dashboards y herramientas de IA que la gente sí usa, del data warehouse a la pantalla.',
    statement: ['Construyo', 'sistemas de datos', 'que convierten', 'la operación', 'en', 'respuestas.'],
    about: [
      'Me formé como físico en la UANL, donde mi tesis simuló microlentes gravitacionales para construir un dataset de 223 mil curvas de luz para un clasificador de machine learning. Luego entré a la industria y encontré el mismo problema en todos lados: los datos existen, pero nadie los puede ver.',
      'En un grupo de manufactura de alimentos en Monterrey dirigí la parte de datos de la implementación de un ERP y le di a la dirección su primera vista en vivo de ventas, producción y costos. Ahora trabajo como freelance: data warehouses en Google Cloud, dashboards y herramientas con LLMs, como Money on Rails, mi app de presupuestos construida sobre la API de YNAB.',
    ],
    now: [
      ['Actualmente', 'Ingeniería de datos e IA, freelance'],
      ['Construyendo', 'Money on Rails'],
      ['Desde', 'Monterrey, México · abierto a remoto y reubicación'],
    ],
    hero: {
      portfolio: 'Portafolio',
      onThisPage: 'En esta página',
      notes: {
        about: 'Quién soy, con qué trabajo',
        experience: (roles, since) => `${roles} roles, ${since}–hoy`,
        work: (n) => `${n} demos en vivo`,
        contact: 'Correo, GitHub, LinkedIn',
      },
      basedIn: 'Desde',
      local: 'hora local',
      scroll: 'Desliza ↓',
    },
    experience: {
      resume: 'CV completo ↗',
      tools: 'Herramientas',
      jobs: [
        {
          start: '2025',
          end: 'Hoy',
          role: 'Ingeniero de Datos e IA independiente',
          company: 'Clientes corporativos',
          summary:
            'Construyo plataformas de datos serverless en Google Cloud para clientes corporativos: Cloud Functions, Pub/Sub y BigQuery, modeladas con dbt, con un dashboard en Looker Studio para la dirección. Entregué un servicio de Meta Conversions API que envía las ventas offline de vuelta a Meta, en producción en una semana. Opero y mantengo lo que entrego con contratos de servicio mensuales.',
          tags: ['GCP', 'BigQuery', 'dbt', 'Python', 'Looker Studio', 'Meta CAPI'],
        },
        {
          start: '2024',
          end: '2025',
          role: 'Lead Data Analyst',
          company: 'TortiRegias · Nyjisa · Chilokia',
          summary:
            'Dirigí la parte de datos de la implementación del ERP Alpha en todo el grupo, trabajando con cada jefe de área. Construí el dashboard de producción en Power BI y el Dashboard de Mantenimiento, la primera vista en vivo de la operación que tuvo la dirección. Entregué App Tarimas, que redujo el etiquetado de tarimas de Walmart a unos dos minutos, y automaticé reportes que equivalían a unos dos meses de trabajo manual al año.',
          tags: ['SQL', 'Power BI', 'Python', 'Streamlit', 'React'],
        },
        {
          start: '2022',
          end: '2023',
          role: 'Investigador de licenciatura',
          company: 'UANL · Facultad de Ciencias Físico Matemáticas',
          summary:
            'Tesis sobre microlentes gravitacionales. Derivé el modelo de la lente desde primeros principios, lo simulé en Fortran sobre un amplio barrido de parámetros y generé 223 mil curvas de luz etiquetadas para entrenar un clasificador que detecta eventos de microlente.',
          tags: ['Fortran', 'Python', 'Machine learning'],
        },
      ],
    },
    work: {
      liveDemos: 'demos en vivo',
      stepInside: 'Entrar ↗',
      set: {
        label: (n) => `TV: las teclas 1 a ${n} eligen el canal; más y menos los recorren`,
        channels: 'Canales',
        channelUp: 'Canal siguiente',
        channelDown: 'Canal anterior',
        signal: 'Señal',
        liveNote: 'En vivo · pasa sobre la pantalla para probarla',
        previewNote: 'Vista previa · vive en su propio sitio',
        tag: { live: 'En vivo', preview: 'Vista previa', tuning: 'Sintonizando…' },
        credit: 'TV: “IBM PCjr 4863 Computer” de Freepoly.org, CC BY 4.0',
      },
      source: 'Código',
      index: 'Índice',
      cols: { no: 'No.', project: 'Proyecto', type: 'Tipo', stack: 'Stack', year: 'Año', link: 'Enlace' },
      stackLabel: 'Stack',
      // App Tarimas is Spanish-only, so both languages open the same build.
      projects: [
        {
          slug: 'money-on-rails',
          title: 'Money on Rails',
          kind: 'Caso de estudio',
          year: '2026',
          summary:
            'Análisis para YNAB que YNAB no te da: qué tanto seguiste tu plan, qué tan bien está armado y a dónde se fue el dinero de cada mes. La demo usa un hogar inventado, sin iniciar sesión.',
          stack: ['Next.js', 'TypeScript', 'YNAB API', 'Postgres', 'ECharts', 'OpenAI'],
          href: '/es/demos/money-on-rails/overview',
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
          href: '/es/demos/retail/',
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
          href: '/es/demos/clinic/',
          preview: 'clinic',
        },
      ],
    },
    contact: {
      links: [
        { label: 'GitHub', href: 'https://github.com/PlayingArc', handle: '@PlayingArc' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gerardo-s-4ab806105', handle: 'in/gerardo-s-4ab806105' },
        { label: 'Correo', href: `mailto:${profile.email}`, handle: profile.email },
        { label: 'CV', href: profile.resumeUrl, handle: 'PDF' },
      ],
      builtWith: 'Hecho con Astro · ASCII a partir de play.core',
      palette: 'Paleta a partir de',
      backToTop: 'Volver arriba ↑',
    },
    notFound: {
      title: '404 — No encontrado',
      kicker: 'Error 404 · Sin señal',
      heading: 'Este canal está fuera del aire.',
      back: '← Volver a gsanchez.me',
    },
  },
};

export const site = (locale: Locale) => copy[locale];
