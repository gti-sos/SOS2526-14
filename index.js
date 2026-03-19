const express = require("express");
const path = require("path");
const { loadBackend } = require("./src/back/index.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// APIs primero
loadBackend(app);

// Sirve el build estático de SvelteKit
app.use(express.static(path.join(__dirname, "src/front/build")));

// Cualquier otra ruta la maneja SvelteKit
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "src/front/build/index.html"));
});

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});