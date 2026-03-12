const express = require("express");
const path = require("path");
const { loadBackend } = require("./src/back/index.js"); // Traemos el puente

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // Para leer JSON (sustituye a body-parser)
app.use("/", express.static("./public")); 

loadBackend(app); 

app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});