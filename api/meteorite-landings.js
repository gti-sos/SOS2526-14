const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const meteorite_csv = path.join(__dirname, "../data/meteorite-landings-with-country.csv");

// Array en memoria para gestionar los datos
let meteorites = [];

/* ================================
    1. CARGA INICIAL (/loadInitialData)
================================ */
router.get("/loadInitialData", (req, res) => {
    if (meteorites.length === 0) {
        csv().fromFile(meteorite_csv).then((datos) => {
            meteorites = datos;
            res.status(201).json({ message: "Datos cargados correctamente", count: meteorites.length });
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
    res.status(200).json(meteorites);
});

// POST - Crear nuevo
router.post("/", (req, res) => {
    const nuevo = req.body;

    // Validación simple: que tenga nombre e ID
    if (!nuevo.name || !nuevo.id) {
        res.status(400).json({ error: "Campo 'name' e 'id' son obligatorios." });
    } 
    // Comprobar si ya existe (Conflict)
    else if (meteorites.find(m => m.name.toLowerCase() === nuevo.name.toLowerCase())) {
        res.status(409).json({ error: "Ese meteorito ya existe." });
    } 
    else {
        meteorites.push(nuevo);
        res.status(201).json(nuevo);
    }
});

// DELETE - Borrar todo
router.delete("/", (req, res) => {
    meteorites = [];
    res.status(200).json({ message: "Colección borrada." });
});

/* ================================
    3. RECURSO ÚNICO (Por nombre)
================================ */

// GET - Un solo meteorito
router.get("/:name", (req, res) => {
    const recurso = meteorites.find(m => m.name.toLowerCase() === req.params.name.toLowerCase());
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "Meteorito no encontrado." });
    }
});

// PUT - Actualizar
router.put("/:name", (req, res) => {
    const index = meteorites.findIndex(m => m.name.toLowerCase() === req.params.name.toLowerCase());
    
    // El nombre de la URL y del JSON deben coincidir
    if (req.body.name && req.body.name.toLowerCase() !== req.params.name.toLowerCase()) {
        res.status(400).json({ error: "El nombre no coincide con la URL." });
    } else if (index !== -1) {
        meteorites[index] = req.body;
        res.status(200).json(meteorites[index]);
    } else {
        res.status(404).json({ error: "No existe para actualizar." });
    }
});

// DELETE - Borrar uno
router.delete("/:name", (req, res) => {
    const inicial = meteorites.length;
    meteorites = meteorites.filter(m => m.name.toLowerCase() !== req.params.name.toLowerCase());
    
    if (meteorites.length < inicial) {
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