const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

// Ruta a  CSV
const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

// Array en memoria para gestionar los datos (REQUISITO F04)
let satellites = [];

/* ================================
    1. CARGA INICIAL (/loadInitialData)
================================ */
router.get("/loadInitialData", (req, res) => {
    if (satellites.length === 0) {
        csv().fromFile(satellites_csv).then((datos) => {
            satellites = datos;
            res.status(201).json({ message: "Datos cargados correctamente", count: satellites.length });
        });
    } else {
        res.status(400).json({ error: "El array ya tiene datos." });
    }
});

/* ================================
    2. COLECCIÓN (Lista completa)
================================ */

// GET - Listar todos los satélites
router.get("/", (req, res) => {
    res.status(200).json(satellites);
});

// POST - Crear nuevo satélite
router.post("/", (req, res) => {
    const nuevo = req.body;

    // Validación: campos obligatorios según tu dataset
    if (!nuevo.name || !nuevo.country) {
        res.status(400).json({ error: "Los campos 'name' y 'country' son obligatorios." });
    } 
    // Comprobar si ya existe (Conflict - 409)
    else if (satellites.find(s => s.name.toLowerCase() === nuevo.name.toLowerCase())) {
        res.status(409).json({ error: "Ese satélite ya existe en la base de datos." });
    } 
    else {
        satellites.push(nuevo);
        res.status(201).json(nuevo);
    }
});

// DELETE - Borrar toda la colección
router.delete("/", (req, res) => {
    satellites = [];
    res.status(200).json({ message: "Colección de satélites borrada." });
});

/* ================================
    3. RECURSO ÚNICO (Por nombre)
================================ */

// GET - Un solo satélite por nombre
router.get("/:name", (req, res) => {
    const recurso = satellites.find(s => s.name.toLowerCase() === req.params.name.toLowerCase());
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "Satélite no encontrado." });
    }
});

// PUT - Actualizar un satélite
router.put("/:name", (req, res) => {
    const index = satellites.findIndex(s => s.name.toLowerCase() === req.params.name.toLowerCase());
    
    // El nombre del cuerpo JSON debe coincidir con el de la URL
    if (req.body.name && req.body.name.toLowerCase() !== req.params.name.toLowerCase()) {
        res.status(400).json({ error: "El nombre del satélite no coincide con la URL." });
    } else if (index !== -1) {
        satellites[index] = req.body;
        res.status(200).json(satellites[index]);
    } else {
        res.status(404).json({ error: "No existe el recurso para actualizar." });
    }
});

// DELETE - Borrar un satélite concreto
router.delete("/:name", (req, res) => {
    const longitudInicial = satellites.length;
    satellites = satellites.filter(s => s.name.toLowerCase() !== req.params.name.toLowerCase());
    
    if (satellites.length < longitudInicial) {
        res.status(200).json({ message: "Satélite eliminado correctamente." });
    } else {
        res.status(404).json({ error: "No existe el satélite para eliminar." });
    }
});

/* ================================
    4. MÉTODOS NO PERMITIDOS (405)
================================ */
router.post("/:name", (req, res) => res.status(405).json({ error: "Método no permitido sobre un recurso concreto." }));
router.put("/", (req, res) => res.status(405).json({ error: "No se puede actualizar toda la lista a la vez." }));

module.exports = router;