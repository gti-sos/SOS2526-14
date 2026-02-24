const express = require("express");
const path = require("path");

const app = express();

// Servir archivos estáticos
app.use(express.static("public"));

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

// Puerto obligatorio para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});