const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const DataStore = require("@seald-io/nedb");

const dbFile = path.join(__dirname, "../data/satellites.db");
const db = new DataStore({ filename: dbFile, autoload: true });
const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

// Validación estricta de estructura (L04)
function hasCorrectStructure(obj) {
    const fields = ["name", "country", "launch_date", "launch_mass", "expected_lifetime", "apogee_height", "perigee_height"];
    const keys = Object.keys(obj);
    return fields.length === keys.length && fields.every(f => keys.includes(f));
}


router.get("/docs", (req, res) => {
    // IMPORTANTE: Sustituye este enlace por tu URL pública de Postman
    res.redirect("https://documenter.getpostman.com/view/52241995/2sBXigMZ5R");
});
// 1. CARGA INICIAL
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
        if (err) return res.status(500).json({ message: "Error interno." });
        if (count === 0) {
            csv().fromFile(satellites_csv).then((datos) => {
                db.insert(datos, (err, newDocs) => {
                    if (err) return res.status(500).json({ message: "Error al insertar." });
                    res.status(201).json({ message: `Base de datos inicializada con ${newDocs.length} recursos.` });
                });
            });
        } else {
            res.status(400).json({ message: "La base de datos ya contiene datos." });
        }
    });
});

/* ============================================================
    COLECCIÓN (Acciones sobre / ) -> Siempre devuelve ARRAY en GET
============================================================ */

// GET Colección (Con filtros, offset y limit)
router.get("/", (req, res) => {
    const { limit, offset, ...filters } = req.query;
    let search = {};
    
    if (filters.name) search.name = new RegExp('^' + filters.name + '$', "i");
    if (filters.country) search.country = new RegExp('^' + filters.country + '$', "i");
    // Añade aquí más filtros si los necesitas (L05)

    db.find(search, { _id: 0 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 0)
      .exec((err, docs) => {
        if (err) return res.status(500).json({ message: "Error al obtener datos." });
        res.status(200).json(docs); // Devuelve [{}, {}]
    });
});

// POST Colección (Crear nuevo)
router.post("/", (req, res) => {
    if (!hasCorrectStructure(req.body)) {
        return res.status(400).json({ message: "Estructura de JSON incorrecta." });
    }
    
    db.findOne({ name: req.body.name, country: req.body.country }, (err, doc) => {
        if (err) return res.status(500).json({ message: "Error interno." });
        if (doc) return res.status(409).json({ message: "El recurso ya existe." });
        
        db.insert(req.body, (err) => {
            if (err) return res.status(500).json({ message: "Error al guardar." });
            res.status(201).json({ message: "Recurso creado con éxito." });
        });
    });
});

// DELETE Colección