const express = require("express");
const path = require("path");
const calcularFRB = require("./index-FRB.js"); // tu algoritmo
const spaceLaunchesAPI = require("./api/spaceLaunches");

const app = express();

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
app.get("/samples/FRB", (req, res) => {
    const resultado = calcularFRB();
    res.send(`<h1>Resultado del cálculo para USA</h1>
              <p>Coste medio: ${resultado} millones</p>`);
});

// Puerto obligatorio para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});