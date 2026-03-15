const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const DataStore = require("@seald-io/nedb");

const dbFile = path.join(__dirname, "../data/satellites.db");
const db = new DataStore({ filename: dbFile, autoload: true });
const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

// Función auxiliar para validar la estructura exacta (Requisito 400)
function hasCorrectStructure(obj) {
    const fields = ["name", "country", "launch_date", "launch_mass", "expected_lifetime", "apogee_height", "perigee_height"];
    const keys = Object.keys(obj);
    return fields.length === keys.length && fields.every(f => keys.includes(f));
}

// DOCS: Redirección (Requisito L06)
router.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52241995/2sBXigMZ5R");
});

// CARGA INICIAL
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
        if (err) return res.sendStatus(500);
        if (count === 0) {
            csv().fromFile(satellites_csv).then((datos) => {
                db.insert(datos, (err) => {
                    if (err) return res.sendStatus(500);
                    res.sendStatus(201);
                });
            });
        } else {
            res.status(400).send("La base de datos ya tiene datos.");
        }
    });
});

/* ================================
    COLECCIÓN (ARRAY)
================================ */
router.get("/", (req, res) => {
    const { limit, offset, ...filters } = req.query;
    let search = {};
    if (filters.name) search.name = new RegExp('^' + filters.name + '$', "i");
    if (filters.country) search.country = new RegExp('^' + filters.country + '$', "i");
    // ... (añadir resto de filtros si se desea)

    db.find(search, { _id: 0 }).skip(parseInt(offset) || 0).limit(parseInt(limit) || 0).exec((err, docs) => {
        if (err) return res.sendStatus(500);
        res.status(200).json(docs); // Devuelve ARRAY
    });
});

router.post("/", (req, res) => {
    if (!hasCorrectStructure(req.body)) return res.sendStatus(400);
    
    db.findOne({ name: req.body.name, country: req.body.country }, (err, doc) => {
        if (err) return res.sendStatus(500);
        if (doc) return res.sendStatus(409);
        
        db.insert(req.body, (err) => {
            if (err) return res.sendStatus(500);
            res.sendStatus(201);
        });
    });
});

router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, num) => {
        if (err) return res.sendStatus(500);
        res.sendStatus(200);
    });
});

/* ================================
    RECURSO CONCRETO (OBJETO)
================================ */
router.get("/:country/:name", (req, res) => {
    db.findOne({ country: req.params.country, name: req.params.name }, { _id: 0 }, (err, doc) => {
        if (err) return res.sendStatus(500);
        if (!doc) return res.sendStatus(404);
        res.status(200).json(doc); // Devuelve OBJETO
    });
});

router.put("/:country/:name", (req, res) => {
    if (!hasCorrectStructure(req.body) || req.body.name !== req.params.name || req.body.country !== req.params.country) {
        return res.sendStatus(400);
    }
    db.update({ country: req.params.country, name: req.params.name }, req.body, {}, (err, num) => {
        if (err) return res.sendStatus(500);
        if (num === 0) return res.sendStatus(404);
        res.sendStatus(200);
    });
});

router.delete("/:country/:name", (req, res) => {
    db.remove({ country: req.params.country, name: req.params.name }, {}, (err, num) => {
        if (err) return res.sendStatus(500);
        if (num === 0) return res.sendStatus(404);
        res.sendStatus(200);
    });
});

module.exports = router;