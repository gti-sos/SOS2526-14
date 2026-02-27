const express = require("express");
const path = require("path");

// --- 1. ALGORITMOS Y LIBRERÍAS EXTERNAS ---
const calcularFRB = require("./index-FRB.js");
const calcularJPC = require("./index-JPC.js");
const calcularJGA = require("./index-JGA.js");
const cool = require("cool-ascii-faces"); 

// --- 2. IMPORTACIÓN DE APIS MODULARES ---
const spaceLaunchesAPI = require("./api/spaceLaunches.js");
const meteoriteLandingsAPI = require("./api/meteorite-landings.js");
const spaceLaunchesAPI = require("./api/spaceLaunches.js");


const app = express();
const BASE_URL_API = "/api/v1";

// --- 3. MIDDLEWARES ---
app.use(express.json());
app.use(express.static("public"));

// --- 4. REGISTRO DE RUTAS DE API ---
// Usamos la variable BASE_URL_API para que todo sea consistente
app.use(BASE_URL_API + "/space-launches", spaceLaunchesAPI);
app.use(BASE_URL_API + "/meteorite-landings", meteoriteLandingsAPI);
app.use(BASE_URL_API + "/active-satellites", spaceLaunchesAPI);

// --- 5. RUTAS ESTÁTICAS Y DE CONTENIDO ---
app.get("/", (req, res) => {
    res.send("SOS2526-14 runnnnnnning correctly 🚀");
});

app.get("/cool", (req, res) => {
    res.send(`<pre>${cool()}</pre>`);
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public/about.html"));
});

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

// --- 7. INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
