const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const filePath = path.join(__dirname, "../data/space-missions-with-country.csv");

let spaceLaunches = [];

/* ================================
   FUNCIÓN PARA CARGAR CSV
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
            .on("end", resolve)
            .on("error", reject);
    });
}

/* ================================
   FUNCIÓN PARA GUARDAR CSV
================================ */

function saveCSV() {
    const header = "mission_id,company_name,location,launch_date,year,latitude,longitude,cost,rocket_name,rocket_status,mission_status,country\n";

    const rows = spaceLaunches.map(l =>
`${l.mission_id},"${l.company_name}","${l.location}",${l.launch_date},${l.year},${l.latitude},${l.longitude},${l.cost ?? ""},"${l.rocket_name}",${l.rocket_status},${l.mission_status},${l.country}`
    ).join("\n");

    fs.writeFileSync(filePath, header + rows + "\n");
}

/* ================================
   1️⃣ LOAD INITIAL DATA
================================ */

router.get("/loadInitialData", async (req, res) => {

    if (spaceLaunches.length === 0) {
        try {
            await loadCSV();
            res.status(201).json({
                message: "Datos cargados correctamente",
                count: spaceLaunches.length
            });
        } catch (error) {
            res.status(500).json({ error: "Error cargando el CSV" });
        }
    } else {
        res.status(400).json({ error: "Los datos ya están cargados." });
    }
});

/* ================================
   2️⃣ COLECCIÓN
================================ */

// GET todos
router.get("/", (req, res) => {
    res.status(200).json(spaceLaunches);
});

// POST crear
router.post("/", (req, res) => {

    const nuevo = req.body;

    if (!nuevo.mission_id || !nuevo.company_name) {
        return res.status(400).json({ error: "mission_id y company_name son obligatorios" });
    }

    if (spaceLaunches.find(l => l.mission_id === Number(nuevo.mission_id))) {
        return res.status(409).json({ error: "Ya existe ese mission_id" });
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

// DELETE toda la colección
router.delete("/", (req, res) => {
    spaceLaunches = [];
    saveCSV();
    res.status(200).json({ message: "Colección borrada" });
});

/* ================================
   3️⃣ RECURSO ÚNICO (mission_id)
================================ */

// GET uno
router.get("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);
    const recurso = spaceLaunches.find(l => l.mission_id === id);

    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

// PUT actualizar
router.put("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);
    const index = spaceLaunches.findIndex(l => l.mission_id === id);

    if (req.body.mission_id && Number(req.body.mission_id) !== id) {
        return res.status(400).json({ error: "mission_id no coincide con la URL" });
    }

    if (index === -1) {
        return res.status(404).json({ error: "No existe para actualizar" });
    }

    spaceLaunches[index] = {
        ...spaceLaunches[index],
        ...req.body,
        mission_id: id
    };

    saveCSV();

    res.status(200).json(spaceLaunches[index]);
});

// DELETE uno
router.delete("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);
    const inicial = spaceLaunches.length;

    spaceLaunches = spaceLaunches.filter(l => l.mission_id !== id);

    if (spaceLaunches.length < inicial) {
        saveCSV();
        res.status(200).json({ message: "Eliminado correctamente" });
    } else {
        res.status(404).json({ error: "No existe para eliminar" });
    }
});

/* ================================
   4️⃣ MÉTODOS NO PERMITIDOS
================================ */

router.post("/:mission_id", (req, res) => 
    res.status(405).json({ error: "No se puede hacer POST a un recurso concreto" })
);

router.put("/", (req, res) => 
    res.status(405).json({ error: "No se puede hacer PUT a toda la colección" })
);

module.exports = router;