const express = require("express");
const path = require("path");
const fs = require("fs");
const { loadBackend } = require("./src/back/index.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());

// APIs primero
loadBackend(app);

// Sirve el frontend solo si existe el build
const buildPath = path.join(__dirname, "src/front/build");
if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
}

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});