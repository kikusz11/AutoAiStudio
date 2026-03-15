const fs = require('fs');

let file = fs.readFileSync('src/lib/i18n.ts', 'utf8');

// The pattern left behind by the bad replace looks like:
//         {
//           title: "Efficiency", (or Hatékonyság, or whatever the 2nd column was)
// ...
//         },
//       ],
//     },
// occurring right after `      ]\n    },` which was the end of about object

// We can just find the end of `about` object and delete until the start of `contact: {`
file = file.replace(/    about: \{[\s\S]*?      \]\n    \},[\s\S]*?    contact: \{/g, (match) => {
    // Keep everything from 'about: {' to '      ]\n    },'
    const aboutContent = match.match(/    about: \{[\s\S]*?      \]\n    \},/)[0];
    return aboutContent + "\n    contact: {";
});

fs.writeFileSync('src/lib/i18n.ts', file);
console.log('Fixed i18n.ts');
