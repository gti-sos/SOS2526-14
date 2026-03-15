const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const DataStore = require("@seald-io/nedb");

// 1. Configuración de NeDB
const dbFile = path.join(__dirname, "../data/satellites.db");
const db = new DataStore({ filename: dbFile, autoload: true });

const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

/* ============================================================
    1. CARGA INICIAL (/loadInitialData)
============================================================ */
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
        if (err) return res.sendStatus(500);
        
        if (count === 0) {
            csv().fromFile(satellites_csv).then((datos) => {
                db.insert(datos, (err, newDocs) => {
                    if (err) return res.sendStatus(500);
                    res.status(201).json({ message: "Datos cargados", count: newDocs.length });
                });
            });
        } else {
            res.status(400).json({ error: "La base de datos ya tiene datos." });
        }
    });
});

/* ============================================================
    DOCUMENTACIÓN (/docs) -> Requisito L06
============================================================ */
router.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52241995/2sBXigMZ5R");
});

/* ============================================================
    2. COLECCIÓN (Lista completa con filtros y paginación)
============================================================ */
router.get("/", (req, res) => {
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);

    // Clonamos la query para construir los filtros de búsqueda
    const query = { ...req.query };
    delete query.limit;
    delete query.offset;

    let search = {};
    
    // Búsqueda por todos los campos (L05)
    if (query.name) search.name = new RegExp('^' + query.name + '$', "i");
    if (query.country) search.country = new RegExp('^' + query.country + '$', "i");
    if (query.launch_date) search.launch_date = query.launch_date;
    if (query.launch_mass) search.launch_mass = query.launch_mass;
    if (query.expected_lifetime) search.expected_lifetime = query.expected_lifetime;
    if (query.apogee_height) search.apogee_height = query.apogee_height;
    if (query.perigee_height) search.perigee_height = query.perigee_height;

    db.find(search, { _id: 0 }) // Ocultamos el _id interno de NeDB
      .skip(offset) 
      .limit(limit) 
      .exec((err, satellites) => {
        if (err) return res.sendStatus(500);
        res.status(200).json(satellites);
    });
});

// POST - Crear nuevo (Valida que no exista la clave compuesta)
router.post("/", (req, res) => {
    const nuevo = req.body;
    if (!nuevo.name || !nuevo.country) {
        return res.status(400).json({ error: "Campos obligatorios faltantes (name y country)." });
    }

    // Comprobar duplicados por clave compuesta (nombre y país)
    db.findOne({ 
        name: new RegExp('^' + nuevo.name + '$', "i"),
        country: new RegExp('^' + nuevo.country + '$', "i")
    }, (err, satellite) => {
        if (err) return res.sendStatus(500);
        if (satellite) {
            res.status(409).json({ error: "Este recurso (mismo nombre y país) ya existe." });
        } else {
            db.insert(nuevo, (err) => {
                if (err) return res.sendStatus(500);
                res.status(201).json(nuevo);
            });
        }
    });
});

// DELETE - Borrar toda la colección
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.sendStatus(500);
        res.status(200).json({ message: `Colección borrada (${numRemoved} registros).` });
    });
});

/* ============================================================
    3. RECURSO ÚNICO (Identificador Compuesto: /country/name)
============================================================ */

// GET - Un solo recurso por país y nombre
router.get("/:country/:name", (req, res) => {
    const { country, name } = req.params;
    db.findOne({ 
        country: new RegExp('^' + country + '$', "i"), 
        name: new RegExp('^' + name + '$', "i") 
    }, { _id: 0 }, (err, satellite) => {
        if (err) return res.sendStatus(500);
        if (satellite) {
            res.status(200).json(satellite);
        } else {
            res.status(404).json({ error: "Satélite no encontrado." });
        }
    });
});

// PUT - Actualizar un recurso (Valida URL vs Body)
router.put("/:country/:name", (req, res) => {
    const { country, name } = req.params;
    const body = req.body;

    // Validación L06: El cuerpo debe coincidir con los identificadores de la URL
    if (body.country !== country || body.name !== name) {
        return res.status(400).json({ error: "Los datos del cuerpo no coinciden con la URL (country/name)." });
    }

    db.update(
        { country: new RegExp('^' + country + '$', "i"), name: new RegExp('^' + name + '$', "i") },
        body,
        {},
        (err, numReplaced) => {
            if (err) return res.sendStatus(500);
            if (numReplaced === 0) {
                res.status(404).json({ error: "No existe el recurso para actualizar." });
            } else {
                res.status(200).json(body);
            }
        }
    );
});

// DELETE - Borrar un recurso concreto
router.delete("/:country/:name", (req, res) => {
    const { country, name } = req.params;
    db.remove({ 
        country: new RegExp('^' + country + '$', "i"), 
        name: new RegExp('^' + name + '$', "i") 
    }, {}, (err, numRemoved) => {
        if (err) return res.sendStatus(500);
        if (numRemoved === 0) {
            res.status(404).json({ error: "No existe el satélite para eliminar." });
        } else {
            res.status(200).json({ message: "Eliminado correctamente." });
        }
    });
});

/* ============================================================
    4. MÉTODOS NO PERMITIDOS
============================================================ */
router.post("/:country/:name", (req, res) => res.sendStatus(405));
router.put("/", (req, res) => res.sendStatus(405));

module.exports = router;