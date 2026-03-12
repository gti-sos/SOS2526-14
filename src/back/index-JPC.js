// 1. Inicializamos el array con datos de ejemplo (sustituyendo el CSV por un array de objetos)
const meteoritos = [
  { name: 'Aachen', id: 1, name_type: 'Valid', class: 'L5', mass: 21.0, fall: 'Fell', year: 1880, country: 'Belgium' },
  { name: 'Aarhus', id: 2, name_type: 'Valid', class: 'H6', mass: 720.0, fall: 'Fell', year: 1951, country: 'Denmark' },
  { name: 'Abee', id: 6, name_type: 'Valid', class: 'EH4', mass: 107000.0, fall: 'Fell', year: 1952, country: 'Canada' },
  { name: 'Acapulco', id: 10, name_type: 'Valid', class: 'Acapulcoite', mass: 1914.0, fall: 'Fell', year: 1976, country: 'Mexico' },
  { name: 'Achiras', id: 370, name_type: 'Valid', class: 'L6', mass: 780.0, fall: 'Fell', year: 1902, country: 'Argentina' },
  { name: 'Adhi Kot', id: 379, name_type: 'Valid', class: 'EH4', mass: 4239.0, fall: 'Fell', year: 1919, country: 'Pakistan' },
  { name: 'Adzhi-Bogdo (stone)', id: 390, name_type: 'Valid', class: 'LL3-6', mass: 910.0, fall: 'Fell', year: 1949, country: 'Mongolia' },
  { name: 'Agen', id: 392, name_type: 'Valid', class: 'H5', mass: 30000.0, fall: 'Fell', year: 1814, country: 'France' },
  { name: 'Aguada', id: 398, name_type: 'Valid', class: 'L6', mass: 1620.0, fall: 'Fell', year: 1930, country: 'Argentina' },
  { name: 'Aguila Blanca', id: 417, name_type: 'Valid', class: 'L', mass: 1440.0, fall: 'Fell', year: 1920, country: 'Argentina' }
];

// 2. Función que calcula la media de masa para un país (por ejemplo, Argentina)
function calcularMediaMasaArgentina() {
    const paisBuscado = "Argentina";
    
    // Filtramos: que sea del país y que tenga una masa válida (no null)
    const meteoritosValidos = meteoritos.filter(m => m.country === paisBuscado && m.mass !== null);
    
    // Extraemos solo las masas
    const masas = meteoritosValidos.map(m => m.mass);
    
    // Sumamos todas las masas
    let suma = 0;
    masas.forEach(m => suma += m);
    
    // Calculamos la media
    const media = masas.length > 0 ? suma / masas.length : 0;
    
    return media;
}

// 3. Resultados por consola (Igual que en tu ejemplo de misiones)
console.log(`Buscando en los datos de meteoritos...`);
console.log(`País analizado: Argentina`);

const conteo = meteoritos.filter(m => m.country === "Argentina" && m.mass !== null).length;
console.log(`Meteoritos con masa válida encontrados en ese país: ${conteo}`);

console.log(`La masa media es de: ${calcularMediaMasaArgentina().toFixed(2)} gramos.`);

// 4. Exportamos la función para que otros archivos la usen
module.exports = calcularMediaMasaArgentina;