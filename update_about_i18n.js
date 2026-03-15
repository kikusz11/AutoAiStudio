const fs = require('fs');

const enAbout = `    about: {
      label: "ABOUT US",
      title: "The people behind",
      titleHighlight: "MindForge",
      story: [
        "Two friends who have been building ideas, experimenting with technology and solving problems together since kindergarten.",
        "What started as childhood mischief, curiosity and constant experimentation slowly turned into a shared passion for technology, systems and creation.",
        "As we grew older, our paths continued in the same direction — even while living in two different countries. Despite the distance, our collaboration and friendship remained strong and constant.",
        "Today we combine our skills, knowledge and experience to build modern AI-powered systems and automation solutions for businesses.",
        "MindForge Studio is the natural result of that journey."
      ],
      founders: [
        {
          initials: "TB",
          name: "Balázs Takács",
          role: "Co-Founder & AI Systems Designer",
          description: "Balázs bridges engineering thinking with modern AI solutions. With a background in design, digital systems and workflow optimization, he focuses on building tools that simplify complex business processes. He connects automation, technology and practical problem solving. His goal is to turn ambitious ideas into powerful real-world solutions."
        },
        {
          initials: "MK",
          name: "Mihálovics Krisztián",
          role: "Co-Founder & Tech Lead",
          description: "Krisztián has a deep understanding of systems, technologies and digital infrastructures. He seamlessly navigates complex architectures, file structures and data formats. From code to integrations, he ensures everything works smoothly and reliably. His focus is building powerful, scalable systems behind the scenes."
        }
      ]
    },`;

const huAbout = `    about: {
      label: "RÓLUNK",
      title: "Kik állnak a",
      titleHighlight: "MindForge mögött?",
      story: [
        "Két barát, akik már az óvoda óta együtt építenek, kísérleteznek a technológiával és oldanak meg problémákat.",
        "Ami gyerekkori csínytevésként, kíváncsiságként és folyamatos kísérletezésként indult, lassan közös szenvedéllyé nőtte ki magát a technológia, a rendszerek és az alkotás iránt.",
        "Ahogy felnőttünk, útjaink továbbra is egy irányba haladtak — még akkor is, amikor két különböző országban éltünk. A távolság ellenére az együttműködésünk és a barátságunk erős és állandó maradt.",
        "Ma a képességeinket, tudásunkat és tapasztalatainkat ötvözve építünk modern, AI-alapú rendszereket és automatizációs megoldásokat vállalkozások számára.",
        "A MindForge Studio ennek az útnak a természetes eredménye."
      ],
      founders: [
        {
          initials: "TB",
          name: "Balázs Takács",
          role: "Társalapító & AI Rendszertervező",
          description: "Balázs összeköti a mérnöki gondolkodást a modern AI megoldásokkal. Dizájn, digitális rendszerek és munkafolyamat-optimalizálás hátterével fókuszál olyan eszközök építésére, amelyek egyszerűsítik a komplex üzleti folyamatokat. Összekapcsolja az automatizációt a technológiával és a gyakorlati problémamegoldással. Célja, hogy az ambiciózus ötleteket valós megoldásokká alakítsa."
        },
        {
          initials: "MK",
          name: "Mihálovics Krisztián",
          role: "Társalapító & Tech Lead",
          description: "Krisztián mélyen érti a rendszereket, technológiákat és digitális infrastruktúrákat. Zökkenőmentesen navigál a komplex architektúrák, fájlstruktúrák és adatformátumok világában. A kódtól az integrációkig biztosítja, hogy minden simán és megbízhatóan működjön. Fókusza a háttérben futó erős, skálázható rendszerek építése."
        }
      ]
    },`;

const file = fs.readFileSync('src/lib/i18n.ts', 'utf8');

// Replace EN about
let result = file.replace(/    about: \{\s*label: "",\s*title: "Business",[\s\S]*?      \],\s*\},/, enAbout);
// Replace HU about
result = result.replace(/    about: \{\s*label: "",\s*title: "Üzleti",[\s\S]*?      \],\s*\},/, huAbout);
// Replace the rest (DE, FR, ES, IT) with English fallback for now
result = result.replace(/    about: \{\s*label: "",\s*title: "Geschäfts",[\s\S]*?      \],\s*\},/, enAbout);
result = result.replace(/    about: \{\s*label: "",\s*title: "Aperçu des",[\s\S]*?      \],\s*\},/, enAbout);
result = result.replace(/    about: \{\s*label: "",\s*title: "Visión General",[\s\S]*?      \],\s*\},/, enAbout);
result = result.replace(/    about: \{\s*label: "",\s*title: "Panoramica",[\s\S]*?      \],\s*\},/, enAbout);

fs.writeFileSync('src/lib/i18n.ts', result);
console.log('i18n.ts updated successfully.');
