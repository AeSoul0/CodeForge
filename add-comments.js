const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.astro')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('/**') && !content.includes('* @file')) {
                // Determine description based on path
                let desc = "Core module for CodeForge application.";
                if (fullPath.includes('controllers')) desc = "Controller handling incoming HTTP requests and responses.";
                if (fullPath.includes('services')) desc = "Service layer implementing core business logic.";
                if (fullPath.includes('routes')) desc = "Fastify route definitions and API schema validation.";
                if (fullPath.includes('repositories')) desc = "Database repository for interacting with MongoDB.";
                if (fullPath.includes('models')) desc = "Mongoose database schema definitions.";
                if (fullPath.includes('dtos')) desc = "Data Transfer Objects (DTO) and TypeScript interfaces.";
                if (fullPath.endsWith('.astro')) desc = "Astro UI component or page layout.";
                
                // Get relative path for the @file tag
                const relPath = fullPath.replace(/\\/g, '/').split('CodeForge/')[1] || path.basename(fullPath);

                let header = `/**\n * @file ${relPath}\n * @description ${desc}\n */\n\n`;
                
                if (fullPath.endsWith('.astro')) {
                    // Prepend after the first `---`
                    if (content.startsWith('---')) {
                        content = content.replace(/^---\r?\n/, `---\n${header}`);
                    } else {
                        // If no frontmatter, add it
                        content = `---\n${header}---\n${content}`;
                    }
                } else {
                    content = header + content;
                }
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Added comments to: ${relPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'backend', 'src'));
processDir(path.join(__dirname, 'frontend', 'src'));
console.log("Done.");
