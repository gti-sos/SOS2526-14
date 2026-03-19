const express = require("express");
const path = require("path");
const fs = require("fs");
const { loadBackend } = require("./src/back/index.js"); // Traemos el puente

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); // Para leer JSON

loadBackend(app);

const buildPath = path.join(__dirname, "src", "front", "build");

if (fs.existsSync(buildPath)) {
    // Si la carpeta build existe, servimos los archivos estáticos
    app.use(express.static(buildPath));
    
    // Y cualquier ruta que no sea de la API, se la mandamos a Svelte (index.html)
    app.get("*", (req, res) => {
        res.sendFile(path.join(buildPath, "index.html"));
    });
} else {
    // Si aún no hemos compilado el frontend, mostramos un mensaje de bienvenida EN FORMATO JSON
    // (Fusionamos tu mensaje con la idea de tu compañero, pero respetando la rúbrica)
    app.get("/", (req, res) => {
        res.status(200).json({ message: "SOS2526-14 API is running correctly 🚀 (Frontend no compilado aúnnnn)" });
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Servidor funcionando en http://localhost:${PORT}`);
});