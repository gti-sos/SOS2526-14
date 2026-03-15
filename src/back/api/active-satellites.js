const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const DataStore = require("@seald-io/nedb");

// 1. Configuración de NeDB (Sustituye al array en memoria)
const dbFile = path.join(__dirname, "../data/satellites.db");
const db = new DataStore({ filename: dbFile, autoload: true });

const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

/* ================================
    1. CARGA INICIAL (/loadInitialData)
================================ */
router.get("/loadInitialData", (req, res) => {
    // Comprobamos si la base de datos está vacía
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
/* ================================
    2. COLECCIÓN (Lista completa)
================================ */

// GET - Listar todos
router.get("/", (req, res) => {
    db.find({}, (err, satellites) => {
        if (err) return res.sendStatus(500);
        // Limpiamos el _id de NeDB para la respuesta
        const output = satellites.map(s => { delete s._id; return s; });
        res.status(200).json(output);
    });
});

// POST - Crear nuevo
router.post("/", (req, res) => {
    const nuevo = req.body;
    if (!nuevo.name || !nuevo.country) {
        return res.status(400).json({ error: "Campos obligatorios faltantes." });
    }

    // Comprobar duplicados (insensible a mayúsculas usando Regex)
    db.findOne({ name: new RegExp('^' + nuevo.name + '$', "i") }, (err, satellite) => {
        if (err) return res.sendStatus(500);
        if (satellite) {
            res.status(409).json({ error: "Ese satélite ya existe." });
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

// GET - Listar todos con filtros y paginación
router.get("/", (req, res) => {
    // 1. Extraemos parámetros de paginación (con valores por defecto)
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);

    // Eliminamos limit y offset del objeto query para que no interfieran en la búsqueda
    const query = { ...req.query };
    delete query.limit;
    delete query.offset;

    // 2. Construimos el objeto de búsqueda (Filtros del paso anterior)
    let search = {};
    if (query.name) search.name = new RegExp('^' + query.name + '$', "i");
    if (query.country) search.country = new RegExp('^' + query.country + '$', "i");
    if (query.launch_date) search.launch_date = query.launch_date;
    if (query.launch_mass) search.launch_mass = query.launch_mass;
    if (query.expected_lifetime) search.expected_lifetime = query.expected_lifetime;
    if (query.apogee_height) search.apogee_height = query.apogee_height;
    if (query.perigee_height) search.perigee_height = query.perigee_height;

    // 3. Ejecutamos la consulta con Paginación
    // .find(search) devuelve un cursor si no se pasa callback
    db.find(search)
      .skip(offset) // Salta N elementos
      .limit(limit) // Devuelve máximo N elementos
      .exec((err, satellites) => {
        if (err) {
            console.error("Error en DB:", err);
            return res.sendStatus(500);
        }

        // Limpieza de _id para la respuesta
        const output = satellites.map(s => {
            const newItem = { ...s };
            delete newItem._id;
            return newItem;
        });

        res.status(200).json(output);
    });
});



// PUT - Actualizar
router.put("/:name", (req, res) => {
    const nameParam = req.params.name;
    const body = req.body;

    if (body.name && body.name.toLowerCase() !== nameParam.toLowerCase()) {
        return res.status(400).json({ error: "El nombre no coincide con la URL." });
    }

    db.update({ name: new RegExp('^' + nameParam + '$', "i") }, body, {}, (err, numReplaced) => {
        if (err) return res.sendStatus(500);
        if (numReplaced === 0) {
            res.status(404).json({ error: "No existe el recurso." });
        } else {
            res.status(200).json(body);
        }
    });
});

// DELETE - Borrar uno concreto
router.delete("/:name", (req, res) => {
    db.remove({ name: new RegExp('^' + req.params.name + '$', "i") }, {}, (err, numRemoved) => {
        if (err) return res.sendStatus(500);
        if (numRemoved === 0) {
            res.status(404).json({ error: "No existe el satélite." });
        } else {
            res.status(200).json({ message: "Eliminado correctamente." });
        }
    });
});

/* ================================
    4. MÉTODOS NO PERMITIDOS
================================ */
router.post("/:name", (req, res) => res.sendStatus(405));
router.put("/", (req, res) => res.sendStatus(405));

module.exports = router;