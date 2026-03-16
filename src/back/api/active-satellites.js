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


router.get("/docs", (req, res) => {
    // IMPORTANTE: Sustituye este enlace por tu URL pública de Postman
    res.redirect("https://documenter.getpostman.com/view/52241995/2sBXigMZ5R");
});
/* ============================================================
    COLECCIÓN (Acciones sobre / ) -> Siempre devuelve ARRAY en GET
============================================================ */
/* ============================================================
    COLECCIÓN (Acciones sobre / ) -> Siempre devuelve ARRAY en GET
============================================================ */

// GET Colección (Con filtros por todos los campos, offset y limit)
router.get("/", (req, res) => {
    const { limit, offset, ...filters } = req.query;
    let search = {};
    
    // --- FILTROS DE TEXTO (Case Insensitive) ---
    if (filters.name) search.name = new RegExp('^' + filters.name + '$', "i");
    if (filters.country) search.country = new RegExp('^' + filters.country + '$', "i");
    if (filters.launch_date) search.launch_date = new RegExp('^' + filters.launch_date + '$', "i");

    // --- FILTROS NUMÉRICOS ---
    // En NeDB, si los datos se guardaron como strings (por el CSV), 
    // filtramos como string. Si los convertiste a número, quita las comillas.
    if (filters.launch_mass) search.launch_mass = filters.launch_mass;
    if (filters.expected_lifetime) search.expected_lifetime = filters.expected_lifetime;
    if (filters.apogee_height) search.apogee_height = filters.apogee_height;
    if (filters.perigee_height) search.perigee_height = filters.perigee_height;

    db.find(search, { _id: 0 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 0)
      .exec((err, docs) => {
        if (err) {
            return res.status(500).json({ message: "Error al obtener datos." });
        }
        res.status(200).json(docs); 
    });
});
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

// DELETE Colección (Borrar todo)
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ message: "Error al borrar." });
        res.status(200).json({ message: `Colección borrada. ${numRemoved} recursos eliminados.` });
    });
});

/* ============================================================
    RECURSO CONCRETO (Acciones sobre /:country/:name ) -> Siempre OBJETO en GET
============================================================ */

// GET Recurso concreto
router.get("/:country/:name", (req, res) => {
    db.findOne({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, { _id: 0 }, (err, doc) => {
        if (err) return res.status(500).json({ message: "Error al buscar." });
        if (!doc) return res.status(404).json({ message: "Recurso no encontrado." });
        res.status(200).json(doc); // Devuelve { }
    });
});

// PUT Recurso concreto (Actualizar)
router.put("/:country/:name", (req, res) => {
    // Validar que el cuerpo es correcto y coincide con los IDs de la URL
    if (!hasCorrectStructure(req.body) || 
        req.body.name.toLowerCase() !== req.params.name.toLowerCase() || 
        req.body.country.toLowerCase() !== req.params.country.toLowerCase()) {
        return res.status(400).json({ message: "Cuerpo inválido o no coincide con la URL." });
    }
    
    db.update({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, req.body, {}, (err, num) => {
        if (err) return res.status(500).json({ message: "Error al actualizar." });
        if (num === 0) return res.status(404).json({ message: "Recurso no encontrado para actualizar." });
        res.status(200).json({ message: "Recurso actualizado correctamente." });
    });
});

// DELETE Recurso concreto (Borrar uno)
router.delete("/:country/:name", (req, res) => {
    db.remove({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, {}, (err, numRemoved) => {
        if (err) return res.status(500).json({ message: "Error al borrar." });
        if (numRemoved === 0) return res.status(404).json({ message: "No encontrado." });
        res.status(200).json({ message: "Recurso eliminado correctamente." });
    });
});

/* ============================================================
    CONTROL DE ERRORES Y MÉTODOS NO PERMITIDOS
============================================================ */

// POST a un recurso concreto (405)
router.post("/:country/:name", (req, res) => {
    res.status(405).json({ message: "POST no permitido en recurso concreto." });
});

// PUT a la colección (405)
router.put("/", (req, res) => {
    res.status(405).json({ message: "PUT no permitido en la colección." });
});

// Catch-all para cualquier otra ruta (Evita el HTML 404 de Express)
router.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada." });
});

module.exports = router;