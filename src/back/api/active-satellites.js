const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const DataStore = require("@seald-io/nedb");

const dbFile = path.join(__dirname, "../data/satellites.db");
const db = new DataStore({ filename: dbFile, autoload: true });
const satellites_csv = path.join(__dirname, "../data/active-satellites.csv");

// Helper para validar estructura
function hasCorrectStructure(obj) {
    const fields = ["name", "country", "launch_date", "launch_mass", "expected_lifetime", "apogee_height", "perigee_height"];
    const keys = Object.keys(obj);
    return fields.length === keys.length && fields.every(f => keys.includes(f));
}

// 1. CARGA INICIAL
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
        if (err) return res.status(500).json({ message: "Error interno al contar registros." });
        if (count === 0) {
            csv().fromFile(satellites_csv).then((datos) => {
                db.insert(datos, (err, newDocs) => {
                    if (err) return res.status(500).json({ message: "Error al insertar datos." });
                    res.status(201).json({ message: `Base de datos inicializada con ${newDocs.length} recursos.` });
                });
            });
        } else {
            res.status(400).json({ message: "La base de datos ya contiene datos." });
        }
    });
});

// 2. COLECCIÓN (GET /)
router.get("/", (req, res) => {
    const { limit, offset, ...filters } = req.query;
    let search = {};
    
    if (filters.name) search.name = new RegExp('^' + filters.name + '$', "i");
    if (filters.country) search.country = new RegExp('^' + filters.country + '$', "i");
    // ... otros filtros ...

    db.find(search, { _id: 0 })
      .skip(parseInt(offset) || 0)
      .limit(parseInt(limit) || 0)
      .exec((err, docs) => {
        if (err) return res.status(500).json({ message: "Error al obtener la colección." });
        res.status(200).json(docs); // Devuelve Array JSON
    });
});

// 3. BORRAR COLECCIÓN (DELETE /)
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ message: "Error al borrar la colección." });
        res.status(200).json({ message: `Colección borrada. ${numRemoved} recursos eliminados.` });
    });
});

// 4. RECURSO CONCRETO (DELETE /country/name)
router.delete("/:country/:name", (req, res) => {
    db.remove({ 
        country: new RegExp('^' + req.params.country + '$', "i"), 
        name: new RegExp('^' + req.params.name + '$', "i") 
    }, {}, (err, numRemoved) => {
        if (err) return res.status(500).json({ message: "Error al borrar el recurso." });
        if (numRemoved === 0) return res.status(404).json({ message: "Recurso no encontrado." });
        res.status(200).json({ message: "Recurso eliminado correctamente." });
    });
});

// 5. MANEJO DE ERRORES Y RUTAS INEXISTENTES (Para evitar HTML)
router.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada." });
});

router.use((err, req, res, next) => {
    res.status(500).json({ message: "Error interno del servidor." });
});

module.exports = router;