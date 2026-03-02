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
   FUNCIÓN PARA REESCRIBIR CSV
================================ */

function saveCSV() {
    const header = "mission_id,company_name,location,launch_date,year,latitude,longitude,cost,rocket_name,rocket_status,mission_status,country\n";

    const rows = spaceLaunches.map(nuevo =>
`${nuevo.mission_id},"${nuevo.company_name}","${nuevo.location}",${nuevo.launch_date},${nuevo.year},${nuevo.latitude},${nuevo.longitude},${nuevo.cost ?? ""},"${nuevo.rocket_name}",${nuevo.rocket_status},${nuevo.mission_status},${nuevo.country}`
    ).join("\n");

    fs.writeFileSync(filePath, header + rows + "\n");
}

/* ================================
   GET TODOS
================================ */

router.get("/", (req, res) => {
    res.status(200).json(spaceLaunches);
});

/* ================================
   POST
================================ */

router.post("/", (req, res) => {

    const nuevo = req.body;

    if (!nuevo.mission_id || !nuevo.company_name) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    nuevo.mission_id = Number(nuevo.mission_id);
    nuevo.year = Number(nuevo.year);
    nuevo.latitude = Number(nuevo.latitude);
    nuevo.longitude = Number(nuevo.longitude);
    nuevo.cost = nuevo.cost ? Number(nuevo.cost) : null;

    spaceLaunches.push(nuevo);
    saveCSV();

    res.status(201).json(nuevo);
});

/* ================================
   PUT (actualizar por mission_id)
================================ */

router.put("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);
    const index = spaceLaunches.findIndex(l => l.mission_id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Mission no encontrada" });
    }

    const actualizado = {
        ...spaceLaunches[index],
        ...req.body
    };

    actualizado.mission_id = Number(actualizado.mission_id);
    actualizado.year = Number(actualizado.year);
    actualizado.latitude = Number(actualizado.latitude);
    actualizado.longitude = Number(actualizado.longitude);
    actualizado.cost = actualizado.cost ? Number(actualizado.cost) : null;

    spaceLaunches[index] = actualizado;

    saveCSV();

    res.status(200).json(actualizado);
});

/* ================================
   DELETE (por mission_id)
================================ */

router.delete("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);
    const index = spaceLaunches.findIndex(l => l.mission_id === id);

    if (index === -1) {
        return res.status(404).json({ error: "Mission no encontrada" });
    }

    spaceLaunches.splice(index, 1);

    saveCSV();

    res.status(204).send();
});

module.exports = router;