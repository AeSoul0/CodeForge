const fs = require('fs');

// 1. Particle Canvas Adaptive Loading
let particleContent = fs.readFileSync('frontend/src/components/ParticleCanvas.astro', 'utf8');

const replacementParticleLogic = `
        // Check for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        let particleCount = 55;
        if (prefersReducedMotion) {
            particleCount = 0;
        } else if (window.innerWidth <= 768) {
            particleCount = 20; // Mobile
        } else if (window.innerWidth <= 1024) {
            particleCount = 35; // Tablet
        }

        // Allocate network particles allocation load
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }`;

particleContent = particleContent.replace(
    `        // Allocate network particles allocation load\n        for (let i = 0; i < 55; i++) {\n            particles.push(new Particle());\n        }`,
    replacementParticleLogic
);

fs.writeFileSync('frontend/src/components/ParticleCanvas.astro', particleContent, 'utf8');


// 2. Layout SEO and A11y
let layoutContent = fs.readFileSync('frontend/src/layout/Layout.astro', 'utf8');

// Add canonical and missing meta tags if not perfectly aligned
if (!layoutContent.includes('application/ld+json')) {
    const jsonLd = `
        <!-- JSON-LD SEO -->
        <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "AeSoul",
              "url": "https://codeforge.aesoul.dev",
              "jobTitle": "Full-Stack Developer",
              "worksFor": {
                "@type": "Organization",
                "name": "CodeForge"
              }
            }
        </script>`;
    layoutContent = layoutContent.replace('</head>', jsonLd + '\n    </head>');
}

fs.writeFileSync('frontend/src/layout/Layout.astro', layoutContent, 'utf8');


// 3. DevOps Pipeline
const ciYaml = \`name: CodeForge Pipeline

on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build_and_test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [22.12.0]
        
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm install && cd backend && npm install && cd ../frontend && npm install
      
    - name: Lint
      run: |
        npm run lint --prefix backend
      
    - name: Typecheck
      run: |
        npm run typecheck --prefix backend
        
    - name: Backend Tests
      run: npm run test:cov --prefix backend
      
    - name: Build Frontend
      run: npm run build --prefix frontend
      
    - name: Build Backend
      run: npm run build --prefix backend
      
    - name: Docker Build Check
      run: |
        docker build -t codeforge-backend ./backend
        docker build -t codeforge-frontend ./frontend
\`;

fs.mkdirSync('.github/workflows', { recursive: true });
fs.writeFileSync('.github/workflows/ci.yml', ciYaml, 'utf8');

console.log("P2 Frontend + DevOps Pipeline + Particle fixes applied.");
