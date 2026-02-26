const express = require("express");
const path = require("path");
const calcularFRB = require("./index-FRB.js"); // algoritmo Fernando
const calcularJPC = require("./index-JPC.js"); // algoritmo Jeremias
const csv = require('csvtojson');

const spaceLaunchesAPI = require("./api/spaceLaunches");
const { METHODS } = require("http");

const app = express();

const BASE_URL_API = "/api/v1"

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

// Ruta /cool
app.get("/cool", (req, res) => {
    res.send(`
        <pre>
        (•‿•)
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
//##############################################################JEREMIAS

// /samples/JPC
app.get("/samples/JPC", (req, res) => {
    const resultado = calcularJPC();
    res.send(`<h1>Resultado del cálculo para Argentina</h1>
              <p>La masa media de Meteorito caído es: ${resultado} gramos.</p>`);
});

let meteorite_csv = "./data/meteorite-landings-with-country.csv";
//const meteorite_csv = path.join(__dirname, "data", "meteorite-landings-with-country.csv");

app.get(BASE_URL_API + "/meteorite-landings", async (req, res) => {
    
    // 2. Añadimos "await" antes de la función que lee el archivo
    const enjson = await csv().fromFile(meteorite_csv);
    
    // 3. Ahora "enjson" ya contiene los datos reales, no una promesa
    //res.send("hola")
    res.json(enjson);
});


// Puerto obligatorio para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});