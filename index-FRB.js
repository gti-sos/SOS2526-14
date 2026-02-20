// 1. Inicializamos el array con tus 10 datos de ejemplo exactos
const misiones = [
    { mission_id: 1, company_name: "SpaceX", location: "LC-39A, Kennedy Space Center, Florida, USA", launch_date: "2020-08-06 5:12:00", year: 2020, latitude: 28.5728, longitude: -80.649, cost: 50, rocket_name: "Falcon 9 Block 5 | Starlink V1 L9 & BlackSky", rocket_status: "StatusActive", mission_status: "Success", country: "usa" },
    { mission_id: 2, company_name: "RVSN USSR", location: "Site 43/4, Plesetsk Cosmodrome, Russia", launch_date: "1976-12-28 6:38:00", year: 1976, latitude: 62.9256, longitude: 40.5777, cost: null, rocket_name: "Molniya-M /Block ML | Molniya-3 n†­65", rocket_status: "StatusRetired", mission_status: "Success", country: "russia" },
    { mission_id: 3, company_name: "ULA", location: "SLC-41, Cape Canaveral AFS, Florida, USA", launch_date: "2019-12-20 11:36:00", year: 2019, latitude: 28.474, longitude: -80.5772, cost: null, rocket_name: "Atlas V N22 | Starliner OFT", rocket_status: "StatusActive", mission_status: "Success", country: "usa" },
    { mission_id: 4, company_name: "SpaceX", location: "LC-39A, Kennedy Space Center, Florida, USA", launch_date: "19/01/2020 15:30", year: 2020, latitude: 285.728, longitude: -80.649, cost: 50, rocket_name: "Falcon 9 Block 5 | Crew Dragon Inflight Abort Test", rocket_status: "StatusActive", mission_status: "Success", country: "usa" },
    { mission_id: 5, company_name: "Arianespace", location: "ELA-3, Guiana Space Centre, French Guiana, France", launch_date: "26/06/2010 21:41", year: 2010, latitude: 5.236, longitude: -52.775, cost: 200, rocket_name: "Ariane 5 ECA | Arabsat-5A, COMS-1", rocket_status: "StatusActive", mission_status: "Success", country: "france" },
    { mission_id: 6, company_name: "RVSN USSR", location: "Site 43/4, Plesetsk Cosmodrome, Russia", launch_date: "03/12/1971 13:00", year: 1971, latitude: 629.256, longitude: 405.777, cost: null, rocket_name: "Voskhod | Zenit-2M nâ€ Â­25", rocket_status: "StatusRetired", mission_status: "Failure", country: "russia" },
    { mission_id: 7, company_name: "NASA", location: "LC-39A, Kennedy Space Center, Florida, USA", launch_date: "08/06/2007 23:38", year: 2007, latitude: 285.728, longitude: -80.649, cost: 450, rocket_name: "Space Shuttle Atlantis | STS-117", rocket_status: "StatusRetired", mission_status: "Success", country: "usa" },
    { mission_id: 8, company_name: "Boeing", location: "SLC-17B, Cape Canaveral AFS, Florida, USA", launch_date: "19/03/1994 23:45", year: 1994, latitude: 28.474, longitude: -805.772, cost: null, rocket_name: "Delta II 7925-8 | Galaxy 1R", rocket_status: "StatusRetired", mission_status: "Success", country: "usa" },
    { mission_id: 9, company_name: "CASC", location: "Site 138 (LA-2B), Jiuquan Satellite Launch Center, China", launch_date: "10/11/1976 9:05", year: 1976, latitude: 409.605, longitude: 100.2983, cost: null, rocket_name: "Feng Bao 1 | JSSW-6", rocket_status: "StatusRetired", mission_status: "Failure", country: "china" },
    { mission_id: 10, company_name: "NASA", location: "LC-19, Cape Canaveral AFS, Florida, USA", launch_date: "12/09/1966 14:42", year: 1966, latitude: 28.474, longitude: -805.772, cost: null, rocket_name: "Titan II GLV | Gemini XI", rocket_status: "StatusRetired", mission_status: "Success", country: "usa" }
];

// Queremos calcular la media del campo "cost" para el país "usa"
const paisBuscado = "usa";

// 2. Usamos .filter() para quedarnos con las misiones de "usa" QUE TENGAN coste (cost !== null)
const misionesValidas = misiones.filter(mision => {
    return mision.country === paisBuscado && mision.cost !== null;
});

// 3. Usamos .map() para extraer un nuevo array solo con los números del coste
const costesExtraidos = misionesValidas.map(mision => mision.cost);

// 4. Calculamos la suma total usando .forEach()
let sumaCostes = 0;
costesExtraidos.forEach(coste => {
    sumaCostes += coste;
});

// 5. Calculamos la media
let mediaCoste = 0;
if (costesExtraidos.length > 0) {
    mediaCoste = sumaCostes / costesExtraidos.length;
}

// 6. Mostramos el resultado
console.log(`Buscando en los datos provistos...`);
console.log(`País analizado: ${paisBuscado.toUpperCase()}`);
console.log(`Misiones con datos de coste válidos en ese país: ${costesExtraidos.length}`);
console.log(`El coste medio es de: ${mediaCoste} millones.`);