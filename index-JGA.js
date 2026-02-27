// 1. Inicializamos el array con datos de ejemplo (Satélites JGA)
const satellites = [
    { name: "1HOPSAT-TD", country: "USA", launch_date: "2019-12-11", launch_mass: 22.0, expected_lifetime: 0.5, apogee_height: 576.0, perigee_height: 566.0 },
    { name: "AAC AIS-Sat1", country: "United Kingdom", launch_date: "2023-01-03", launch_mass: 4.0, expected_lifetime: null, apogee_height: 654.0, perigee_height: 637.0 },
    { name: "ABS-2", country: "Multinational", launch_date: "2014-02-06", launch_mass: 6330.0, expected_lifetime: 15.0, apogee_height: 35793.0, perigee_height: 35778.0 },
    { name: "Adelis-Samposon", country: "Israel", launch_date: "2021-03-22", launch_mass: 9.0, expected_lifetime: null, apogee_height: 599.0, perigee_height: 539.0 },
    { name: "ADLER-2", country: "Austria", launch_date: "2023-04-15", launch_mass: 11.5, expected_lifetime: null, apogee_height: 506.0, perigee_height: 497.0 },
    { name: "USA 171", country: "USA", launch_date: "2003-09-09", launch_mass: 5200.0, expected_lifetime: null, apogee_height: 35984.0, perigee_height: 35589.0 },
    { name: "USA 246", country: "USA", launch_date: "2013-09-18", launch_mass: 6169.0, expected_lifetime: 14.0, apogee_height: 35803.0, perigee_height: 35700.0 },
    { name: "Aeneas", country: "USA", launch_date: "2012-09-13", launch_mass: 3.0, expected_lifetime: null, apogee_height: 790.0, perigee_height: 480.0 },
    { name: "Aerocube 12B", country: "USA", launch_date: "2018-07-16", launch_mass: 4.0, expected_lifetime: null, apogee_height: 487.0, perigee_height: 481.0 },
    { name: "Aerocube 6A", country: "USA", launch_date: "2014-06-19", launch_mass: 5.0, expected_lifetime: 3.0, apogee_height: 700.0, perigee_height: 614.0 }
];

//Función que calcula la media de masa para un país
async function calcularJGA() {
    const targetCountry = "USA";
    
    // Filtramos por país y masa válida
    const filteredSatellites = satellites.filter(s => s.country === targetCountry && s.launch_mass !== null);
    
    // Obtenemos solo las masas
    const masses = filteredSatellites.map(s => s.launch_mass);
    
    // Calculamos la suma
    let totalMass = 0;
    masses.forEach(m => totalMass += m);
    
    // Calculamos la media
    const averageMass = masses.length > 0 ? totalMass / masses.length : 0;

    //Resultados por consola 
    console.log(`Análisis para el país: ${targetCountry}`);
    console.log(`Número de satélites encontrados: ${filteredSatellites.length}`);
    console.log(`La masa media de lanzamiento es: ${averageMass.toFixed(2)} kg.`);

    return averageMass.toFixed(2);
}

// 4. Exportamos la función para que el servidor la use
module.exports = calcularJGA;
