const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const DataStore = require("@seald-io/nedb");

// Ruta a la base de datos y CSV respetando tu estructura de carpetas
const dbFile = path.join(__dirname, "../data/satellites.db");
const db = new DataStore({ filename: dbFile, autoload: true });
const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

// Validación estricta de estructura (Requisito: 400 si no es exacta)
function hasCorrectStructure(obj) {
    const fields = ["name", "country", "launch_date", "launch_mass", "expected_lifetime", "apogee_height", "perigee_height"];
    const keys = Object.keys(obj);
    return fields.length === keys.length && fields.every(f => keys.includes(f));
}

// DOCS: Redirección a Postman (Requisito L06)
router.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52241995/2sBXigMZ5R");
});

// CARGA INICIAL (Solo envía código de estado)
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
            res.sendStatus(400); // Ya inicializada
        }
    });
});

/* ============================================================
    COLECCIÓN (GET /) -> Devuelve siempre un ARRAY [ ]
============================================================ */
router.get("/", (req, res) => {
    const { limit, offset, ...filters } = req.query;
    let search = {};
    
    // Búsquedas por todos los campos (L05)
    if (filters.name) search.name = new RegExp('^' + filters.name + '$', "i");
    if (filters.country) search.country = new RegExp('^' + filters.country + '$', "i");
    if (filters.launch_date) search.launch_date = filters.launch_date;
    if (filters.launch_mass) search.launch_mass = filters.launch_mass;
    if (filters.expected_lifetime) search.expected_lifetime = filters.expected_lifetime;
    if (filters.apogee_height) search.apogee_height = filters.apogee_height;
    if (filters.perigee_height) search.perigee_height = filters.perigee_height;

    db.find(search, { _id: 0 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 0)
      .exec((err, docs) => {
        if (err) return res.sendStatus(500);
        res.status(200).json(docs); // Siempre Array
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
    db.remove({}, { multi: true }, (err) => {
        if (err) return res.sendStatus(500);
        res.sendStatus(200);
    });
});

/* ============================================================
    RECURSO CONCRETO (GET /country/name) -> Devuelve siempre OBJETO { }
============================================================ */
router.get("/:country/:name", (req, res) => {
    db.findOne({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, { _id: 0 }, (err, doc) => {
        if (err) return res.sendStatus(500);
        if (!doc) return res.sendStatus(404);
        res.status(200).json(doc); // Siempre Objeto
    });
});

router.put("/:country/:name", (req, res) => {
    if (!hasCorrectStructure(req.body) || 
        req.body.name.toLowerCase() !== req.params.name.toLowerCase() || 
        req.body.country.toLowerCase() !== req.params.country.toLowerCase()) {
        return res.sendStatus(400);
    }
    
    db.update({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, req.body, {}, (err, num) => {
        if (err) return res.sendStatus(500);
        if (num === 0) return res.sendStatus(404);
        res.sendStatus(200);
    });
});

router.delete("/:country/:name", (req, res) => {
    db.remove({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, {}, (err, num) => {
        if (err) return res.sendStatus(500);
        if (num === 0) return res.sendStatus(404);
        res.sendStatus(200);
    });
});

// Métodos no permitidos
router.post("/:country/:name", (req, res) => res.sendStatus(405));
router.put("/", (req, res) => res.sendStatus(405));

module.exports = router;