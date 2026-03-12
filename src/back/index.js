// src/back/index.js
const cool = require("cool-ascii-faces");

// Importamos vuestras 3 APIs (las que usan express.Router)
const spaceLaunchesAPI = require("./api/spaceLaunches.js");
const meteoriteLandingsAPI = require("./api/meteorite-landings.js");
const satellitesAPI = require("./api/active-satellites.js");

// Importamos vuestros algoritmos
const calcularFRB = require("./index-FRB.js");
const calcularJPC = require("./index-JPC.js");
const calcularJGA = require("./index-JGA.js");

function loadBackend(app) {
    const BASE_URL_API = "/api/v1";

    // --- Enchufamos las APIs ---
    app.use(BASE_URL_API + "/space-launches", spaceLaunchesAPI);
    app.use(BASE_URL_API + "/meteorite-landings", meteoriteLandingsAPI);
    app.use(BASE_URL_API + "/active-satellites", satellitesAPI);

    // --- Otras rutas sueltas ---
    app.get("/cool", (req, res) => res.send(`<pre>${cool()}</pre>`));

    // --- 6. RUTAS DE PRUEBA (SAMPLES) ---
    app.get("/samples/FRB", async (req, res) => {
        try {
            const resultado = await calcularFRB();
            res.send(`<h1>Resultado para USA</h1><p>Coste medio: ${resultado} millones</p>`);
        } catch (error) {
            res.status(500).send("Error calculando la media");
        }
    });

    app.get("/samples/JPC", (req, res) => {
        const resultado = calcularJPC();
        res.send(`<h1>Resultado para Argentina</h1><p>Masa media: ${resultado} gramos.</p>`);
    });

    app.get("/samples/JGA", async (req, res) => {
        try {
            const resultado = await calcularJGA();
            res.send(`<h1>Resultado para USA</h1> <p>Masa media de lanzamiento: ${resultado} kg</p>`);
        } catch (error) {
            res.status(500).send("Error calculando la media");
        }
    });

}

module.exports = { loadBackend };