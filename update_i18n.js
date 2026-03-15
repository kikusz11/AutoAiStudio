const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'lib', 'i18n.ts');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  {
    find: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "AI Solutions for Small Business & Automation WebApps",
      cta: "Get a Demo",
      ctaSecondary: "Learn More",
    },`,
    replace: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "AI Solutions for Small Business & Automation WebApps",
      mainHeadline: "Still running your business from Excel and messy paperwork?",
      subHeadline1: "No clarity. No control. No profit insight.",
      subHeadline2: "MindForge turns your operations into one powerful system.",
      cta: "Get a Demo",
      ctaSecondary: "Learn More",
    },`
  },
  {
    find: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "AI Megoldások Kisvállalkozásoknak és Automatizációs Webalkalmazások",
      cta: "Demó Kérése",
      ctaSecondary: "Tudj meg többet",
    },`,
    replace: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "AI Megoldások Kisvállalkozásoknak és Automatizációs Webalkalmazások",
      mainHeadline: "Még mindig Excelből és rendetlen papírokból vezeted a céged?",
      subHeadline1: "Nincs átláthatóság. Nincs kontroll. Nincs rálátásod a profitra.",
      subHeadline2: "A MindForge egyetlen, erős rendszerré alakítja a működésed.",
      cta: "Demó Kérése",
      ctaSecondary: "Tudj meg többet",
    },`
  },
  {
    find: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "KI-Lösungen für kleine Unternehmen & Automatisierungs-WebApps",
      cta: "Demo anfordern",
      ctaSecondary: "Mehr erfahren",
    },`,
    replace: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "KI-Lösungen für kleine Unternehmen & Automatisierungs-WebApps",
      mainHeadline: "Führen Sie Ihr Unternehmen immer noch mit Excel und Papierkram?",
      subHeadline1: "Keine Klarheit. Keine Kontrolle. Kein Gewinneinblick.",
      subHeadline2: "MindForge verwandelt Ihre Abläufe in ein leistungsstarkes System.",
      cta: "Demo anfordern",
      ctaSecondary: "Mehr erfahren",
    },`
  },
  {
    find: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "Solutions IA pour PME & WebApps d'Automatisation",
      cta: "Demander une démo",
      ctaSecondary: "En savoir plus",
    },`,
    replace: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "Solutions IA pour PME & WebApps d'Automatisation",
      mainHeadline: "Vous gérez toujours votre entreprise avec Excel et de la paperasse ?",
      subHeadline1: "Pas de clarté. Pas de contrôle. Pas de vision des bénéfices.",
      subHeadline2: "MindForge transforme vos opérations en un système puissant.",
      cta: "Demander une démo",
      ctaSecondary: "En savoir plus",
    },`
  },
  {
    find: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "Soluciones de IA para Pymes y WebApps de Automatización",
      cta: "Solicitar Demo",
      ctaSecondary: "Saber más",
    },`,
    replace: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "Soluciones de IA para Pymes y WebApps de Automatización",
      mainHeadline: "¿Aún diriges tu negocio con Excel y papeleo desordenado?",
      subHeadline1: "Sin claridad. Sin control. Sin visión de ganancias.",
      subHeadline2: "MindForge convierte tus operaciones en un sistema potente.",
      cta: "Solicitar Demo",
      ctaSecondary: "Saber más",
    },`
  },
  {
    find: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "Soluzioni IA per Piccole Imprese & WebApp di Automazione",
      cta: "Richiedi Demo",
      ctaSecondary: "Scopri di più",
    },`,
    replace: `    hero: {
      badge: "",
      title1: "MindForge Studio",
      titleHighlight: "",
      subtitle: "Soluzioni IA per Piccole Imprese & WebApp di Automazione",
      mainHeadline: "Gestisci ancora la tua attività con Excel e scartoffie caotiche?",
      subHeadline1: "Nessuna chiarezza. Nessun controllo. Nessuna visione dei profitti.",
      subHeadline2: "MindForge trasforma le tue operazioni in un sistema potente.",
      cta: "Richiedi Demo",
      ctaSecondary: "Scopri di più",
    },`
  }
];

replacements.forEach(({find, replace}, index) => {
  if (content.includes(find)) {
    content = content.replace(find, replace);
    console.log('Replaced', index);
  } else {
    console.error('Could not find', index);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
