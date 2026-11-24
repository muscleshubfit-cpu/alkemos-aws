import Image from "next/image";
import Link from "next/link";
import styles from "./DesignPreview.module.css";

type Props = { lang?: "en" | "ar" };

const copy = {
  en: {
    nav: ["Training", "Nutrition", "Tools", "Coaching"],
    eyebrow: "THE SCIENCE OF YOUR STRONGER SELF",
    title: <>Built around <em>your progress.</em></>,
    body: "Training, nutrition and intelligent tools — brought together in one focused system that helps you make every decision count.",
    primary: "Explore the platform",
    secondary: "Meet your AI coach",
    proof: [["868+", "Exercises"], ["8,162+", "Food entries"], ["8", "Smart tools"]],
    sectionEyebrow: "ONE SYSTEM. EVERY ADVANTAGE.",
    sectionTitle: "Everything works better together.",
    sectionBody: "Move between the essentials without losing sight of the bigger picture.",
    cards: [
      ["01", "Train with purpose", "Build a routine around your goals, experience and available equipment.", "Explore training", "/exercises"],
      ["02", "Fuel with precision", "Understand what you eat and shape nutrition around the result you want.", "Explore nutrition", "/foods"],
      ["03", "Make data useful", "Turn the numbers that matter into clear next steps with practical tools.", "Open the tools", "/tools"],
    ],
    coachEyebrow: "A SMARTER WAY TO STAY CONSISTENT",
    coachTitle: "Your next step, clearer than ever.",
    coachBody: "EVO brings your training and nutrition questions into one natural conversation — with guidance shaped around your goals.",
    coachCta: "Discover EVO",
    close: "A stronger relationship with your progress starts here.",
    footer: "Built for the long game.",
    language: "العربية",
    langHref: "/ar/design-preview",
  },
  ar: {
    nav: ["التدريب", "التغذية", "الأدوات", "التدريب الخاص"],
    eyebrow: "رحلتك نحو نسخة أقوى منك",
    title: <>كل خطوة محسوبة <em>نحو تقدمك.</em></>,
    body: "التدريب والتغذية والأدوات الذكية في منظومة واحدة تساعدك على اتخاذ قرارات أفضل، وملاحظة تطورك بوضوح.",
    primary: "اكتشف المنصة",
    secondary: "تعرّف على EVO",
    proof: [["868+", "تمرين"], ["8,162+", "صنف غذائي"], ["8", "أدوات ذكية"]],
    sectionEyebrow: "منظومة واحدة. إمكانات أكثر.",
    sectionTitle: "كل ما تحتاجه يعمل معًا.",
    sectionBody: "انتقل بين أساسيات رحلتك دون أن تفقد الصورة الكاملة.",
    cards: [
      ["01", "تدرّب لهدف واضح", "خطط تدريبية تناسب أهدافك وخبرتك والمعدات المتاحة لديك.", "اكتشف التدريب", "/ar/exercises"],
      ["02", "تغذَّ بوعي ودقة", "افهم اختياراتك الغذائية، واضبط تغذيتك بما يخدم النتيجة التي تسعى إليها.", "اكتشف التغذية", "/ar/foods"],
      ["03", "حوّل بياناتك إلى قرارات", "استخدم الأدوات العملية لفهم الأرقام وتحديد خطوتك التالية.", "استكشف الأدوات", "/ar/tools"],
    ],
    coachEyebrow: "استمر بثبات ووعي أكبر",
    coachTitle: "خطوتك التالية أصبحت أوضح.",
    coachBody: "يجمع EVO أسئلتك عن التدريب والتغذية في حوار طبيعي، ويقدم لك إرشادًا يرتبط بأهدافك وتقدمك.",
    coachCta: "اكتشف EVO",
    close: "علاقتك بتقدمك تبدأ من هنا.",
    footer: "صُممت رحلتك لتستمر.",
    language: "English",
    langHref: "/design-preview",
  },
};

export default function DesignPreview({ lang = "en" }: Props) {
  const c = copy[lang];
  const ar = lang === "ar";
  return (
    <main className={styles.page} dir={ar ? "rtl" : "ltr"} lang={lang}>
      <div className={styles.topline}><span>ALKEMOS <i> / </i> DESIGN STUDY 01</span><Link href={c.langHref}>{c.language}</Link></div>
      <header className={styles.header}>
        <Link href={ar ? "/ar" : "/"} className={styles.brand} aria-label="Alkemos home">
          <Image src="/images/brand/logo-hero-light.webp" alt="Alkemos" width={152} height={54} priority />
        </Link>
        <nav className={styles.nav}>{c.nav.map((item, i) => <a key={item} href={(ar ? ["/ar/exercises","/ar/foods","/ar/tools","/ar/coaching"] : ["/exercises","/foods","/tools","/coaching"])[i]}>{item}</a>)}</nav>
        <Link className={styles.headerCta} href={ar ? "/ar/memberships" : "/memberships"}>{ar ? "ابدأ رحلتك" : "Get started"} <span>↗</span></Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroVisual}>
          <Image src="/images/brand/hero-light.webp" alt="" fill priority sizes="(max-width: 800px) 100vw, 58vw" className={styles.heroImage} />
          <div className={styles.imageShade} />
          <span className={styles.visualLabel}>01 — PERFORMANCE, REDEFINED</span>
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span />{c.eyebrow}</p>
          <h1>{c.title}</h1>
          <p className={styles.intro}>{c.body}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href={ar ? "/ar/tools" : "/tools"}>{c.primary}<span>↗</span></Link>
            <Link className={styles.textLink} href="/evo">{c.secondary}<span>→</span></Link>
          </div>
          <div className={styles.proof}>{c.proof.map(([n, label]) => <div key={label}><strong>{n}</strong><span>{label}</span></div>)}</div>
        </div>
        <div className={styles.heroIndex}>A / 001</div>
      </section>

      <section className={styles.system}>
        <div className={styles.sectionHead}>
          <div><p className={styles.eyebrow}><span />{c.sectionEyebrow}</p><h2>{c.sectionTitle}</h2></div>
          <p>{c.sectionBody}</p>
        </div>
        <div className={styles.cards}>{c.cards.map(([num,title,body,cta,href],i) => <article className={styles.card} key={num}>
          <div className={styles.cardTop}><span>{num} / 03</span><span className={styles.cardMark}>{["↗","◒","⌁"][i]}</span></div>
          <div className={styles.cardBody}><h3>{title}</h3><p>{body}</p><Link href={href}>{cta}<span>↗</span></Link></div>
        </article>)}</div>
      </section>

      <section className={styles.coach}>
        <div className={styles.coachOrb}><span> E </span><small>EVOLUTION / INTELLIGENCE</small></div>
        <div className={styles.coachCopy}><p className={styles.eyebrow}><span />{c.coachEyebrow}</p><h2>{c.coachTitle}</h2><p>{c.coachBody}</p><Link className={styles.coachLink} href="/evo">{c.coachCta}<span>↗</span></Link></div>
      </section>
      <footer className={styles.footer}><strong>{c.close}</strong><span>ALKEMOS® — {c.footer}</span></footer>
      <div className={styles.previewNote}>PRIVATE DESIGN PREVIEW · NOT LIVE ON THE MAIN SITE</div>
    </main>
  );
}
