// src/back/utils/normalize-countries.js
// Uso: node normalize-countries.js <ruta_csv> <columna_pais>
// Ejemplo: node normalize-countries.js ../data/active-satellites.csv country

const csv     = require('csvtojson');
const { stringify } = require('csv-stringify/sync');
const fs      = require('fs');
const path    = require('path');

// ── Diccionario completo: variante local → nombre Highcharts ──────────────────
const COUNTRY_MAP = {
    // América
    'USA':                          'United States of America',
    'US':                           'United States of America',
    'United States':                'United States of America',
    'U.S.A.':                       'United States of America',
    'U.S.':                         'United States of America',
    'Brasil':                       'Brazil',
    'México':                       'Mexico',
    'Bolivia':                      'Bolivia',
    'Venezuela':                    'Venezuela',
    'Trinidad':                     'Trinidad and Tobago',

    // Europa
    'UK':                           'United Kingdom',
    'Great Britain':                'United Kingdom',
    'England':                      'United Kingdom',
    'Russia':                       'Russia',
    'Czech Republic':               'Czechia',
    'Czechia':                      'Czechia',
    'Macedonia':                    'North Macedonia',
    'Slovakia':                     'Slovakia',

    // Asia
    'South Korea':                  'South Korea',
    'North Korea':                  'North Korea',
    'Iran':                         'Iran',
    'Syria':                        'Syrian Arab Republic',
    'Vietnam':                      'Vietnam',
    'Laos':                         'Lao PDR',
    'Burma':                        'Myanmar',
    'Taiwan':                       'Taiwan',

    // África
    'Ivory Coast':                  "Côte d'Ivoire",
    "Cote d'Ivoire":                "Côte d'Ivoire",
    'DR Congo':                     'Democratic Republic of the Congo',
    'DRC':                          'Democratic Republic of the Congo',
    'Congo':                        'Republic of the Congo',
    'Tanzania':                     'United Republic of Tanzania',
    'Libya':                        'Libya',
    'Egypt':                        'Egypt',

    // Oceanía
    'New Zealand':                  'New Zealand',
};

// ── Normaliza un nombre de país ───────────────────────────────────────────────
function normalizeCountry(raw) {
    if (!raw || raw.trim() === '') return '';
    const trimmed = raw.trim();
    return COUNTRY_MAP[trimmed] ?? trimmed;   // Si no está en el mapa, lo deja igual
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    const [,, inputFile, countryColumn = 'country'] = process.argv;

    if (!inputFile) {
        console.error('❌  Uso: node normalize-countries.js <ruta_csv> [columna_pais]');
        console.error('   Ejemplo: node normalize-countries.js ../data/satellites.csv country');
        process.exit(1);
    }

    const inputPath  = path.resolve(inputFile);
    const outputPath = inputPath.replace(/\.csv$/i, '-normalized.csv');

    if (!fs.existsSync(inputPath)) {
        console.error(`❌  No se encuentra el archivo: ${inputPath}`);
        process.exit(1);
    }

    console.log(`📂  Leyendo:   ${inputPath}`);
    console.log(`🌍  Columna:   "${countryColumn}"`);

    const rows = await csv().fromFile(inputPath);

    if (rows.length === 0) {
        console.error('❌  El CSV está vacío.');
        process.exit(1);
    }

    if (!Object.keys(rows[0]).includes(countryColumn)) {
        console.error(`❌  La columna "${countryColumn}" no existe.`);
        console.error(`   Columnas disponibles: ${Object.keys(rows[0]).join(', ')}`);
        process.exit(1);
    }

    // Estadísticas de lo que se va a cambiar
    const cambios = {};

    const normalized = rows.map(row => {
        const original   = row[countryColumn];
        const normalizado = normalizeCountry(original);
        if (original !== normalizado) {
            cambios[original] = normalizado;
        }
        return { ...row, [countryColumn]: normalizado };
    });

    // Escribir CSV normalizado
    const output = stringify(normalized, { header: true });
    fs.writeFileSync(outputPath, output, 'utf8');

    // Resumen
    console.log(`\n✅  CSV normalizado guardado en:`);
    console.log(`   ${outputPath}`);
    console.log(`\n📊  Resumen:`);
    console.log(`   Total filas:    ${rows.length}`);
    console.log(`   Países cambiados: ${Object.keys(cambios).length}`);

    if (Object.keys(cambios).length > 0) {
        console.log('\n🔄  Cambios aplicados:');
        Object.entries(cambios).forEach(([antes, despues]) => {
            console.log(`   "${antes}"  →  "${despues}"`);
        });
    }

    // Países que no están en el mapa (aviso para añadirlos si hacen falta)
    const sinMapear = [...new Set(
        normalized
            .map(r => r[countryColumn])
            .filter(c => c && !Object.values(COUNTRY_MAP).includes(c) && !Object.keys(COUNTRY_MAP).includes(c))
    )].sort();

    if (sinMapear.length > 0) {
        console.log('\n⚠️   Países sin mapear (probablemente ya correctos, verifica si no aparecen en el mapa):');
        sinMapear.forEach(c => console.log(`   - ${c}`));
    }
}

main().catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
});