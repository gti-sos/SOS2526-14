const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

// Variable con el nombre de tu recurso (satellites)
let satellites = [];

/* ================================
    1. CARGA INICIAL (/loadInitialData)
================================ */
router.get("/loadInitialData", (req, res) => {
    if (satellites.length === 0) {
        csv().fromFile(satellites_csv).then((datos) => {
            // Adaptamos los datos al formato necesario (conversión a números)
            satellites = datos.map(s => {
                return {
                    name: s.name,
                    country: s.country,
                    launch_date: s.launch_date,
                    launch_mass: s.launch_mass ? Number(s.launch_mass) : null,
                    expected_lifetime: s.expected_lifetime ? Number(s.expected_lifetime) : null,
                    apogee_height: s.apogee_height ? Number(s.apogee_height) : null,
                    perigee_height: s.perigee_height ? Number(s.perigee_height) : null
                };
            });
            res.status(201).json({ message: "Datos cargados correctamente", count: satellites.length });
        }).catch(err => {
            res.status(500).json({ error: "Error al leer el archivo CSV" });
        });
    } else {
        res.status(400).json({ error: "El array ya tiene datos." });
    }
});

/* ================================
    2. COLECCIÓN (Lista completa)
================================ */

// GET - Listar todos
router.get("/", (req, res) => {
    res.status(200).json(satellites);
});

// POST - Crear nuevo
router.post("/", (req, res) => {
    const nuevo = req.body;

    // Validación: nombre y país obligatorios
    if (!nuevo.name || !nuevo.country) {
        res.status(400).json({ error: "Campo 'name' y 'country' son obligatorios." });
    } 
    // Comprobar si ya existe (Conflict)
    else if (satellites.find(s => s.name.toLowerCase() === nuevo.name.toLowerCase())) {
        res.status(409).json({ error: "Ese satélite ya existe." });
    } 
    else {
        satellites.push(nuevo);
        res.status(201).json(nuevo);
    }
});

// DELETE - Borrar todo
router.delete("/", (req, res) => {
    satellites = [];
    res.status(200).json({ message: "Colección borrada." });
});

/* ================================
    3. RECURSO ÚNICO (Por nombre)
================================ */

// GET - Un solo satélite
router.get("/:name", (req, res) => {
    const recurso = satellites.find(s => s.name.toLowerCase() === req.params.name.toLowerCase());
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "Satélite no encontrado." });
    }
});

// PUT - Actualizar
router.put("/:name", (req, res) => {
    const index = satellites.findIndex(s => s.name.toLowerCase() === req.params.name.toLowerCase());
    
    // El nombre de la URL y del JSON deben coincidir
    if (req.body.name && req.body.name.toLowerCase() !== req.params.name.toLowerCase()) {
        res.status(400).json({ error: "El nombre no coincide con la URL." });
    } else if (index !== -1) {
        satellites[index] = req.body;
        res.status(200).json(satellites[index]);
    } else {
        res.status(404).json({ error: "No existe para actualizar." });
    }
});

// DELETE - Borrar uno
router.delete("/:name", (req, res) => {
    const inicial = satellites.length;
    satellites = satellites.filter(s => s.name.toLowerCase() !== req.params.name.toLowerCase());
    
    if (satellites.length < inicial) {
        res.status(200).json({ message: "Eliminado." });
    } else {
        res.status(404).json({ error: "No existe para eliminar." });
    }
});

/* ================================
    4. MÉTODOS NO PERMITIDOS (405)
================================ */
router.post("/:name", (req, res) => res.status(405).json({ error: "No se puede hacer POST a un recurso concreto." }));
router.put("/", (req, res) => res.status(405).json({ error: "No se puede hacer PUT a toda la lista." }));

module.exports = router;