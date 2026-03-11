const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const meteorite_csv = path.join(__dirname, "../data/meteorite-landings-with-country.csv");

// Array en memoria para gestionar los datos
let meteorites = [];

// Lista maestra de campos para validar POST y PUT
const camposObligatorios = ["name", "id", "name_type", "class", "mass", "fall", "year", "latitude", "longitude", "geolocation", "country"];

/* ============================================================
    1. CARGA INICIAL (/loadInitialData) -> Código 201
============================================================ */
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

/* ============================================================
    2. COLECCIÓN (Lista completa)
============================================================ */

// GET - Listar todos -> Código 200
router.get("/", (req, res) => {
    res.status(200).json(meteorites);
});

// POST - Crear nuevo -> Códigos 201, 400, 409
router.post("/", (req, res) => {
    const nuevo = req.body;

    // Comprobar si falta algún campo o está vacío
    const camposFaltantes = camposObligatorios.filter(campo => !nuevo.hasOwnProperty(campo) || nuevo[campo] === "");

    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Faltan campos obligatorios", faltantes: camposFaltantes }); //
    }

    // Comprobar si ya existe (Conflict)
    if (meteorites.find(m => m.name.toLowerCase() === nuevo.name.toLowerCase())) {
        return res.status(409).json({ error: "Ese meteorito ya existe." }); //
    } 

    meteorites.push(nuevo);
    res.status(201).json(nuevo); //
});

// DELETE - Borrar todo -> Código 200
router.delete("/", (req, res) => {
    meteorites = [];
    res.status(200).json({ message: "Colección borrada correctamente." });
});

/* ============================================================
    3. RECURSO ÚNICO (Por nombre)
============================================================ */

// GET - Un solo meteorito -> Código 200, 404
router.get("/:name", (req, res) => {
    const recurso = meteorites.find(m => m.name.toLowerCase() === req.params.name.toLowerCase());
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "Meteorito no encontrado." }); //
    }
});

// PUT - Actualizar -> Código 200, 400, 404
router.put("/:name", (req, res) => {
    const nameParam = req.params.name.toLowerCase();
    const index = meteorites.findIndex(m => m.name.toLowerCase() === nameParam);
    const nuevoDato = req.body;

    // 1. El nombre de la URL y del JSON deben coincidir
    if (nuevoDato.name && nuevoDato.name.toLowerCase() !== nameParam) {
        return res.status(400).json({ error: "El nombre no coincide con la URL." });
    }

    // 2. Comprobar que se envían TODOS los campos necesarios para actualizar
    const camposFaltantes = camposObligatorios.filter(campo => !nuevoDato.hasOwnProperty(campo));
    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Debe enviar todos los campos para actualizar el recurso.", faltantes: camposFaltantes });
    }

    if (index !== -1) {
        meteorites[index] = nuevoDato;
        res.status(200).json(meteorites[index]);
    } else {
        res.status(404).json({ error: "No existe para actualizar." });
    }
});

// DELETE - Borrar uno -> Código 200, 404
router.delete("/:name", (req, res) => {
    const inicial = meteorites.length;
    meteorites = meteorites.filter(m => m.name.toLowerCase() !== req.params.name.toLowerCase());
    
    if (meteorites.length < inicial) {
        res.status(200).json({ message: "Eliminado correctamente." });
    } else {
        res.status(404).json({ error: "No existe para eliminar." });
    }
});

/* ============================================================
    4. MÉTODOS NO PERMITIDOS (405) -
============================================================ */
router.post("/:name", (req, res) => res.status(405).json({ error: "POST no permitido en recurso concreto." }));
router.put("/", (req, res) => res.status(405).json({ error: "PUT no permitido en la colección." }));

module.exports = router;