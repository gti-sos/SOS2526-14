const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const filePath = path.join(__dirname, "../data/space-missions-with-country.csv");

let spaceLaunches = [];

/* ================================
   CARGAR CSV AL INICIAR SERVIDOR
================================ */

function loadCSV() {
    spaceLaunches = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {

                // Convertimos tipos correctamente
                row.mission_id = Number(row.mission_id);
                row.year = Number(row.year);
                row.latitude = Number(row.latitude);
                row.longitude = Number(row.longitude);
                row.cost = row.cost ? Number(row.cost) : null;

                spaceLaunches.push(row);
            })
            .on("end", () => {
                console.log("✅ CSV cargado correctamente");
                resolve();
            })
            .on("error", reject);
    });
}

loadCSV();

/* ================================
   GET TODOS LOS DATOS
================================ */

router.get("/", (req, res) => {
    res.status(200).json(spaceLaunches);
});

/* ================================
   POST - AÑADIR NUEVO LANZAMIENTO
================================ */

router.post("/", (req, res) => {

    const nuevo = req.body;

    // Validación básica
    if (!nuevo.mission_id || !nuevo.company_name) {
        return res.status(400).json({
            error: "Faltan campos obligatorios"
        });
    }

    // Convertimos tipos
    nuevo.mission_id = Number(nuevo.mission_id);
    nuevo.year = Number(nuevo.year);
    nuevo.latitude = Number(nuevo.latitude);
    nuevo.longitude = Number(nuevo.longitude);
    nuevo.cost = nuevo.cost ? Number(nuevo.cost) : null;

    spaceLaunches.push(nuevo);

    // Creamos línea CSV EXACTAMENTE en el orden correcto
    const linea =
`${nuevo.mission_id},"${nuevo.company_name}","${nuevo.location}",${nuevo.launch_date},${nuevo.year},${nuevo.latitude},${nuevo.longitude},${nuevo.cost ?? ""},"${nuevo.rocket_name}",${nuevo.rocket_status},${nuevo.mission_status},${nuevo.country}\n`;

    fs.appendFile(filePath, linea, (err) => {
        if (err) {
            return res.status(500).json({
                error: "Error escribiendo en CSV"
            });
        }

        res.status(201).json(nuevo);
    });
});

module.exports = router;