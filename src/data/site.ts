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
  role: 'Data & AI Engineer', // kept in English in both languages, as on the résumé
  timezone: 'America/Monterrey',
  available: true,
  email: 'hello@gsanchez.me',
  resumeUrl: '/gerardo-sanchez-resume.pdf', // public CV, no phone; source resume/resume.html (npm run resume)
  sourceUrl: 'https://github.com/PlayingArc/gsanchez.me', // public mirror of this repo (scripts/publish-mirror.sh)
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
      tryNote: string; // how to try a live demo on the screen; not shown on touch screens
      previewNote: string;
      tag: { live: string; preview: string; tuning: string };
      credit: string;
    };
    source: string;
    index: string;
    cols: { no: string; project: string; type: string; stack: string; year: string; link: string };
    stackLabel: string;
    projects: Project[];
    // This site, shown as work of its own under the index so nobody assumes it was bought.
    thisSite: { heading: string; title: string; summary: string; built: string; builtValue: string; stack: string[]; notes: string[] };
  };
  contact: { links: Link[]; builtWith: string; source: string; palette: string; backToTop: string };
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
      'I turn scattered business data into dashboards and AI tools that people actually use, from the warehouse to the screen.',
    statement: ['I build', 'data systems', 'that turn', 'operations', 'into', 'answers.'],
    about: [
      'I studied physics at UANL. For my thesis I simulated gravitational microlensing and built a dataset of 223k light curves to train a machine-learning classifier. In industry I kept running into the same problem: the data exists, but nobody can see it.',
      'At a food-manufacturing group in Monterrey, I led the data side of an ERP rollout and gave management its first live view of sales, production and costs. Now I freelance, building data warehouses on Google Cloud, dashboards and LLM-powered tools. On my own time I build Money on Rails, a budget analysis app on top of the YNAB API.',
    ],
    now: [
      ['Currently', 'Freelance data & AI engineering'],
      ['Building', 'Money on Rails'],
      ['Based in', 'Monterrey, Mexico · open to remote work or relocation'],
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
            'I build serverless data platforms on Google Cloud: Cloud Functions, Pub/Sub and BigQuery, modelled with dbt, with a Looker Studio dashboard for leadership on top. I shipped a Meta Conversions API service that sends offline sales back to Meta; it was in production within a week. I run and maintain what I ship under monthly service agreements.',
          tags: ['GCP', 'BigQuery', 'dbt', 'Python', 'Looker Studio', 'Meta CAPI'],
        },
        {
          start: '2024',
          end: '2025',
          role: 'Lead Data Analyst',
          company: 'TortiRegias · Nyjisa · Chilokia',
          summary:
            'Led the data side of the Alpha ERP rollout across the group, working with every department head. Built a Power BI production dashboard and a maintenance dashboard (Dashboard de Mantenimiento) that gave management its first live view of operations. Shipped App Tarimas, which cut Walmart pallet labelling to about two minutes, and automated reports that took roughly two months of manual work a year.',
          tags: ['SQL', 'Power BI', 'Python', 'Streamlit', 'React'],
        },
        {
          start: '2022',
          end: '2023',
          role: 'Undergraduate Researcher',
          company: 'UANL · Facultad de Ciencias Físico Matemáticas',
          summary:
            'Thesis on gravitational microlensing. Derived the lensing model from first principles, simulated it in Fortran over a wide parameter sweep, and produced 223k labelled light curves to train a classifier that detects microlensing events.',
          tags: ['Fortran', 'Python', 'Machine learning'],
        },
      ],
    },
    work: {
      liveDemos: 'live demos',
      stepInside: 'Step inside →',
      set: {
        label: (n) => `TV: keys 1 to ${n} pick a channel, plus and minus flip through them`,
        channels: 'Channels',
        channelUp: 'Channel up',
        channelDown: 'Channel down',
        signal: 'Signal',
        liveNote: 'Live',
        tryNote: 'hover the screen to try it',
        previewNote: 'Preview · runs on its own site',
        tag: { live: 'Live', preview: 'Preview', tuning: 'Tuning in…' },
        credit: 'TV: “IBM PCjr 4863 Computer” by Freepoly.org, CC BY 4.0',
      },
      source: 'Source',
      index: 'Index',
      cols: { no: 'No.', project: 'Project', type: 'Type', stack: 'Stack', year: 'Year', link: 'Link' },
      stackLabel: 'Stack',
      // The TV's channels: two case studies, then two demo dashboards, which are titled by
      // what they show (the fictional company is named in the summary). `href` is where
      // the channel takes you (a same-site href also plays live on the screen); `preview`
      // picks its static screen in src/scripts/dashboards.ts.
      projects: [
        {
          slug: 'money-on-rails',
          title: 'Money on Rails',
          kind: 'Case study',
          year: '2026',
          summary:
            "Money on Rails connects to YNAB and tells you what YNAB won't: an adherence rating for how closely you followed your plan, a plan-quality score for how well it's built (needs, wants and savings split, emergency fund, true expenses), and a chart of where each month's money went. The invite-only 1.0 shipped in September 2026. Try it on an invented household, no sign-in.",
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
            'The pallet-labelling app I built for Walmart orders at a food-manufacturing group in Monterrey (tarima is Spanish for pallet). Capture the order, drag its boxes onto pallets, and it prints the logistics label for each one. It cut labelling to about two minutes. The demo uses sample products and is in Spanish, like the app.',
          stack: ['React', 'Ant Design', 'dnd-kit', 'Barcodes'],
          href: '/demos/tarimas/',
          preview: 'tarimas',
        },
        {
          slug: 'casa-zenzontle',
          title: 'Sales dashboard',
          kind: 'Demo dashboard',
          year: '2026',
          summary:
            'Built for Casa Zenzontle, an invented home-goods retailer with eight stores and an online shop. It shows whether sales are on target, which stores and products are falling behind, and which stock isn’t moving. The filters read as a plain sentence, and clicking any chart filters the rest.',
          stack: ['TypeScript', 'SVG', 'Astro'],
          href: '/en/demos/retail/',
          preview: 'retail',
        },
        {
          slug: 'molara-dental',
          title: 'Appointments dashboard',
          kind: 'Demo dashboard',
          year: '2026',
          summary:
            'Built for Molara Dental, an invented chain of five dental clinics. It shows when the chairs sit empty, which bookings turn into no-shows and what they cost, which dentists and treatments bring in the revenue, and whether patients come back for their six-month check-up. Click a cell or a bar and every view follows.',
          stack: ['TypeScript', 'SVG', 'Astro'],
          href: '/en/demos/clinic/',
          preview: 'clinic',
        },
      ],
      thisSite: {
        heading: 'This site',
        title: 'gsanchez.me',
        summary:
          'I designed and built this site myself, the TV included. It is a static Astro site on Cloudflare Workers, in English and Spanish, and the dashboards on the TV are real code running live, not screenshots.',
        built: 'Built',
        builtValue: 'By me, with AI coding agents working from GitHub issues; every pull request gets its own preview deploy before it merges',
        stack: ['Astro', 'TypeScript', 'SVG filters', 'Cloudflare Workers'],
        notes: [
          'The TV is a render of an IBM PCjr monitor with the live page behind its glass. An SVG displacement filter bends the picture like a curved tube and pulls the three colour guns slightly apart.',
          'On iPhones that filter turned the live screen black: WebKit can’t draw it over an iframe. I traced it on a real phone and shipped the fix.',
        ],
      },
    },
    contact: {
      links: [
        { label: 'GitHub', href: 'https://github.com/PlayingArc', handle: '@PlayingArc' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gerardo-s-4ab806105', handle: 'in/gerardo-s-4ab806105' },
        { label: 'Email', href: `mailto:${profile.email}`, handle: profile.email },
        { label: 'Résumé', href: profile.resumeUrl, handle: 'PDF' },
      ],
      builtWith: 'Designed and built by me · Astro on Cloudflare Workers · ASCII based on play.core',
      source: 'Source code',
      palette: 'Palette sampled from',
      backToTop: 'Back to top ↑',
    },
    notFound: {
      title: 'Not found',
      kicker: 'Error 404 · No signal',
      heading: 'This channel is off the air.',
      back: '← Back to gsanchez.me',
    },
  },

  es: {
    langName: 'Español',
    switchLabel: 'ES',
    skip: 'Saltar al contenido',
    nav: { about: 'Sobre mí', experience: 'Experiencia', work: 'Proyectos', contact: 'Contacto' },
    header: { status: '(Abierto a ofertas de trabajo)', cta: 'Escríbeme →' },
    location: 'Monterrey, México',
    pitch:
      'Convierto los datos dispersos de una empresa en dashboards y herramientas de IA que la gente sí usa, desde el data warehouse hasta la pantalla.',
    statement: ['Construyo', 'sistemas de datos', 'que convierten', 'la operación', 'en', 'respuestas.'],
    about: [
      'Estudié Física en la UANL. En mi tesis simulé microlentes gravitacionales y generé un dataset de 223 mil curvas de luz para entrenar un clasificador de machine learning. Ya en la industria me topé una y otra vez con el mismo problema: los datos existen, pero nadie los puede ver.',
      'En un grupo de manufactura de alimentos en Monterrey dirigí la parte de datos de la implementación de un ERP, y por primera vez la dirección pudo ver ventas, producción y costos en tiempo real. Hoy trabajo como freelance: data warehouses en Google Cloud, dashboards y herramientas basadas en LLMs. Por mi cuenta desarrollo Money on Rails, una app de análisis de presupuestos que se conecta a la API de YNAB.',
    ],
    now: [
      ['Actualmente', 'Ingeniería de datos e IA como freelance'],
      ['Desarrollando', 'Money on Rails'],
      ['Ubicación', 'Monterrey, México · disponible para remoto o reubicación'],
    ],
    hero: {
      portfolio: 'Portafolio',
      onThisPage: 'En esta página',
      notes: {
        about: 'Quién soy, con qué trabajo',
        experience: (roles, since) => `${roles} puestos, ${since}–hoy`,
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
            'Construyo plataformas de datos serverless en Google Cloud: Cloud Functions, Pub/Sub y BigQuery, con modelado en dbt y un dashboard en Looker Studio para la dirección. Desarrollé un servicio con la Meta Conversions API que envía las ventas offline de regreso a Meta; quedó en producción en una semana. Opero y doy mantenimiento a lo que entrego mediante contratos de servicio mensuales.',
          tags: ['GCP', 'BigQuery', 'dbt', 'Python', 'Looker Studio', 'Meta CAPI'],
        },
        {
          start: '2024',
          end: '2025',
          role: 'Lead Data Analyst',
          company: 'TortiRegias · Nyjisa · Chilokia',
          summary:
            'Dirigí la parte de datos de la implementación del ERP Alpha en todo el grupo, de la mano de cada jefe de área. Construí un dashboard de producción en Power BI y el Dashboard de Mantenimiento, con los que la dirección vio la operación en tiempo real por primera vez. Desarrollé App Tarimas, que redujo a unos dos minutos el etiquetado de tarimas para Walmart, y automaticé reportes que sumaban unos dos meses de trabajo manual al año.',
          tags: ['SQL', 'Power BI', 'Python', 'Streamlit', 'React'],
        },
        {
          start: '2022',
          end: '2023',
          role: 'Tesista de licenciatura',
          company: 'UANL · Facultad de Ciencias Físico Matemáticas',
          summary:
            'Tesis sobre microlentes gravitacionales. Derivé el modelo de la lente a partir de primeros principios, lo simulé en Fortran con un amplio barrido de parámetros y generé 223 mil curvas de luz etiquetadas para entrenar un clasificador que detecta eventos de microlente.',
          tags: ['Fortran', 'Python', 'Machine learning'],
        },
      ],
    },
    work: {
      liveDemos: 'demos en vivo',
      stepInside: 'Entrar →',
      set: {
        label: (n) => `TV: las teclas del 1 al ${n} eligen un canal; más y menos cambian de canal`,
        channels: 'Canales',
        channelUp: 'Canal siguiente',
        channelDown: 'Canal anterior',
        signal: 'Señal',
        liveNote: 'En vivo',
        tryNote: 'pasa el cursor sobre la pantalla para probarla',
        previewNote: 'Vista previa · se abre en su propio sitio',
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
            'Money on Rails se conecta a YNAB y te dice lo que YNAB no: una calificación de apego (qué tanto seguiste tu plan), una de calidad del plan (qué tan bien está armado: reparto entre necesidades, gustos y ahorro, fondo de emergencia y gastos reales) y una gráfica de a dónde se fue el dinero de cada mes. La versión 1.0, por invitación, salió en septiembre de 2026. Pruébala con un hogar inventado, sin iniciar sesión.',
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
            'La app para etiquetar las tarimas de los pedidos de Walmart que desarrollé en un grupo de manufactura de alimentos en Monterrey. Capturas el pedido, arrastras sus cajas a las tarimas y la app imprime la etiqueta logística de cada una. Redujo el etiquetado a unos dos minutos. La demo usa productos de ejemplo.',
          stack: ['React', 'Ant Design', 'dnd-kit', 'Códigos de barras'],
          href: '/demos/tarimas/',
          preview: 'tarimas',
        },
        {
          slug: 'casa-zenzontle',
          title: 'Dashboard de ventas',
          kind: 'Dashboard de demostración',
          year: '2026',
          summary:
            'Hecho para Casa Zenzontle, una tienda inventada de artículos para el hogar con ocho sucursales y tienda en línea. Muestra si las ventas van en meta, qué tiendas y productos se están quedando atrás y qué inventario no se mueve. Los filtros se leen como una frase, y un clic en cualquier gráfica filtra las demás.',
          stack: ['TypeScript', 'SVG', 'Astro'],
          href: '/es/demos/retail/',
          preview: 'retail',
        },
        {
          slug: 'molara-dental',
          title: 'Dashboard de citas',
          kind: 'Dashboard de demostración',
          year: '2026',
          summary:
            'Hecho para Molara Dental, una cadena inventada de cinco clínicas dentales. Muestra a qué horas se quedan vacíos los sillones, qué citas terminan en inasistencia y cuánto cuestan, qué dentistas y tratamientos generan los ingresos y si los pacientes regresan a su revisión de seis meses. Un clic en una celda o una barra filtra todas las vistas.',
          stack: ['TypeScript', 'SVG', 'Astro'],
          href: '/es/demos/clinic/',
          preview: 'clinic',
        },
      ],
      thisSite: {
        heading: 'Este sitio',
        title: 'gsanchez.me',
        summary:
          'Diseñé y construí este sitio yo mismo, incluida la TV. Es un sitio estático en Astro sobre Cloudflare Workers, en inglés y español, y los dashboards de la TV son código real corriendo en vivo, no capturas de pantalla.',
        built: 'Hecho',
        builtValue: 'Por mí, con agentes de IA que trabajan a partir de issues de GitHub; cada pull request tiene su propio deploy de prueba antes de integrarse',
        stack: ['Astro', 'TypeScript', 'Filtros SVG', 'Cloudflare Workers'],
        notes: [
          'La TV es un render de un monitor IBM PCjr con la página en vivo detrás del cristal. Un filtro de desplazamiento SVG curva la imagen como un tubo de rayos catódicos y separa un poco los tres cañones de color.',
          'En iPhone ese filtro dejaba la pantalla en negro: WebKit no lo puede dibujar sobre un iframe. Lo rastreé en un teléfono real y publiqué la corrección.',
        ],
      },
    },
    contact: {
      links: [
        { label: 'GitHub', href: 'https://github.com/PlayingArc', handle: '@PlayingArc' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/gerardo-s-4ab806105', handle: 'in/gerardo-s-4ab806105' },
        { label: 'Correo', href: `mailto:${profile.email}`, handle: profile.email },
        { label: 'CV', href: profile.resumeUrl, handle: 'PDF' },
      ],
      builtWith: 'Diseñado y hecho por mí · Astro sobre Cloudflare Workers · ASCII basado en play.core',
      source: 'Código fuente',
      palette: 'Paleta tomada de',
      backToTop: 'Volver arriba ↑',
    },
    notFound: {
      title: 'Página no encontrada',
      kicker: 'Error 404 · Sin señal',
      heading: 'Este canal salió del aire.',
      back: '← Volver a gsanchez.me',
    },
  },
};

export const site = (locale: Locale) => copy[locale];
