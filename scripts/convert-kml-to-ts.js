const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const KML_DIR = path.join(ROOT, 'Kml Files');
const OUT_DIR = path.join(ROOT, 'assets', 'routes');

function safeName(name) {
  return name
    .replace(/\.kml$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();
}

function parseCoordinatesBlock(text) {
  const coords = [];
  const tokens = text.trim().split(/\s+/);
  for (const t of tokens) {
    const parts = t.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const lon = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!Number.isNaN(lon) && !Number.isNaN(lat)) coords.push([lon, lat]);
    }
  }
  return coords;
}

if (!fs.existsSync(KML_DIR)) {
  console.error('Kml Files directory not found:', KML_DIR);
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(KML_DIR).filter(f => f.toLowerCase().endsWith('.kml'));
if (files.length === 0) {
  console.log('No .kml files found in', KML_DIR);
  process.exit(0);
}

const indexImports = [];
const indexEntries = [];

for (const file of files) {
  const full = path.join(KML_DIR, file);
  const content = fs.readFileSync(full, 'utf8');

  const base = safeName(file);
  const outFile = path.join(OUT_DIR, `${base}.ts`);

  // Find all <coordinates>...</coordinates> blocks
  const regex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
  const features = [];
  let m;
  while ((m = regex.exec(content)) !== null) {
    const block = m[1];
    const coords = parseCoordinatesBlock(block);
    if (coords.length > 0) {
      features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
    }
  }

  if (features.length === 0) {
    console.warn(`No coordinates parsed for ${file}, skipping output.`);
    continue;
  }

  const outContent = `// Auto-generated from ../Kml Files/${file}\n` +
    `const route = {\n  type: 'FeatureCollection',\n  features: ${JSON.stringify(features, null, 2)}\n};\n\nexport default route;\n`;

  fs.writeFileSync(outFile, outContent, 'utf8');
  console.log('Wrote', outFile);

  const varName = `route_${base.replace(/-/g, '_')}`;
  indexImports.push(`import ${varName} from './${base}';`);
  indexEntries.push(`  '${base}': ${varName}`);
}

// Write index.ts that exports routesMap
const indexPath = path.join(OUT_DIR, 'index.ts');
const indexContent = `// Auto-generated index of routes\n${indexImports.join('\n')}\n\nexport const routesMap = {\n${indexEntries.join(',\n')}\n};\n\nexport default routesMap;\n`;
fs.writeFileSync(indexPath, indexContent, 'utf8');
console.log('Wrote', indexPath);

console.log('Done. Run this script again when KML files change.');
