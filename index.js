const express = require("express");
const path = require("path");
const calcularFRB = require("./index-FRB.js"); // algoritmo Fernando
const calcularJPC = require("./index-JPC.js"); // algoritmo Jeremias
const csv = require("csvtojson");
const cool = require("cool-ascii-faces"); // caras aleatorias

const spaceLaunchesAPI = require("./api/spaceLaunches");

const app = express();
const BASE_URL_API = "/api/v1";

// Middleware para JSON
app.use(express.json());

// Servir archivos estáticos
app.use(express.static("public"));

// Registrar la API **antes** de app.listen
app.use("/api/v1/space-launches", spaceLaunchesAPI);

// Ruta principal
app.get("/", (req, res) => {
    res.send("SOS2526-14 running correctly 🚀");
});

// Ruta /cool con cara aleatoria
app.get("/cool", (req, res) => {
    res.send(`
        <pre>
        ${cool()}
        </pre>
    `);
});

// Ruta /about
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "public/about.html"));
});

// /samples/FRB
app.get("/samples/FRB", async (req, res) => {
    try {
        const resultado = await calcularFRB();
        res.send(`<h1>Resultado del cálculo para USA</h1>
                  <p>Coste medio: ${resultado} millones</p>`);
    } catch (error) {
        res.status(500).send("Error calculando la media");
    }
});

// /samples/JPC
app.get("/samples/JPC", (req, res) => {
    const resultado = calcularJPC();
    res.send(`<h1>Resultado del cálculo para Argentina</h1>
              <p>La masa media de Meteorito caído es: ${resultado} gramos.</p>`);
});

// CSV meteorites
const meteorite_csv = path.join(__dirname, "data", "meteorite-landings-with-country.csv");

app.get(BASE_URL_API + "/meteorite-landings", async (req, res) => {
    try {
        const enjson = await csv().fromFile(meteorite_csv);
        res.json(enjson);
    } catch (error) {
        console.error("Error en la ruta de meteoritos:", error);
        res.status(500).send("Error al procesar el archivo CSV");
    }
});

// Puerto obligatorio para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});