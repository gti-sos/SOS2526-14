const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require("csvtojson");
const Datastore = require("@seald-io/nedb");

const csvFile = path.join(__dirname, "../../data/space-missions/space-missions-with-country.csv");

const db = require('../../data/space-missions/space-data.js');

/* ============================================================
   CAMPOS IMPORTANTES
============================================================ */
const camposObligatorios = [
    "mission_id",
    "company_name",
    "location",
    "year",
    "rocket_name",
    "mission_status",
    "country"
];

/* ============================================================
   VALIDADOR
============================================================ */
function validarLaunch(req, res, next) {
    const dato = req.body;

    const faltantes = camposObligatorios.filter(c => !dato.hasOwnProperty(c) || dato[c] === "");
    if (faltantes.length > 0) {
        return res.status(400).json({ error: "Faltan campos obligatorios", faltantes });
    }

    const extra = Object.keys(dato).filter(c => !camposObligatorios.includes(c));
    if (extra.length > 0) {
        return res.status(400).json({ error: "Campos no permitidos", extra });
    }

    next();
}

/* ============================================================
   DOCUMENTACIÓN
============================================================ */
router.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52380677/2sBXiomVQn");
});

/* ============================================================
   LOAD INITIAL DATA
============================================================ */
router.get("/loadInitialData", (req, res) => {

    db.count({}, (err, count) => {

        if (count > 0) {
            return res.status(400).json({ error: "La base de datos ya tiene datos" });
        }

        csv().fromFile(csvFile).then(data => {

            const launches = data.map(l => ({
                mission_id: Number(l.mission_id),
                company_name: l.company_name,
                location: l.location,
                year: Number(l.year),
                rocket_name: l.rocket_name,
                mission_status: l.mission_status,
                country: l.country
            }));

            db.insert(launches, (err, newDocs) => {
                res.status(201).json({
                    message: "Datos cargados",
                    count: newDocs.length
                });
            });

        });

    });

});

/* ============================================================
   STATISTICS - Filtro por rango de años
============================================================ */
router.get("/statistics", (req, res) => {
    const from = parseInt(req.query.from);
    const to   = parseInt(req.query.to);

    const filtro = {};
    if (!isNaN(from)) filtro.year = { ...filtro.year, $gte: from };
    if (!isNaN(to))   filtro.year = { ...filtro.year, $lte: to };

    db.find(filtro, { _id: 0 }, (err, launches) => {
        if (err) return res.status(500).json({ error: "Error al consultar la DB" });
        res.status(200).json(launches);
    });
});

/* ============================================================
   PROXY ISS (Open Notify API)
   IMPORTANTE: debe ir ANTES de /:country/:mission_id
   para que Express no lo confunda con un país.
   Accesible en: /api/v2/space-launches/proxy/iss-location
============================================================ */
router.get("/proxy/iss-location", async (req, res) => {
    try {
        const response = await fetch("http://api.open-notify.org/iss-now.json");
        if (!response.ok) {
            return res.status(response.status).json({ error: "Error al contactar con la API de la ISS" });
        }
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error("Error en el proxy ISS:", err);
        res.status(500).json({ error: "Error interno del proxy ISS: " + err.message });
    }
});

/* ============================================================
   GET COLECCIÓN (búsqueda + paginación)
============================================================ */
router.get("/", (req, res) => {

    let limit = parseInt(req.query.limit) || 0;
    let offset = parseInt(req.query.offset) || 0;

    let searchQuery = {};

    Object.keys(req.query).forEach(key => {

        if (key !== "limit" && key !== "offset") {

            if (key === "mission_id" || key === "year") {
                searchQuery[key] = Number(req.query[key]);
            } else {
                searchQuery[key] = new RegExp(`^${req.query[key]}$`, "i");
            }

        }

    });

    db.find(searchQuery, { _id: 0 })
        .skip(offset)
        .limit(limit)
        .exec((err, docs) => {
            res.status(200).json(docs);
        });

});

/* ============================================================
   POST
============================================================ */
router.post("/", validarLaunch, (req, res) => {

    const nuevo = req.body;

    db.findOne({ mission_id: nuevo.mission_id }, (err, doc) => {

        if (doc) {
            return res.status(409).json({ error: "La misión ya existe" });
        }

        db.insert(nuevo, (err, newDoc) => {

            const { _id, ...clean } = newDoc;
            res.status(201).json(clean);

        });

    });

});

/* ============================================================
   DELETE COLECCIÓN
============================================================ */
router.delete("/", (req, res) => {

    db.remove({}, { multi: true }, (err, numRemoved) => {

        res.status(200).json({
            message: `Colección borrada`,
            removed: numRemoved
        });

    });

});

/* ============================================================
   GET RECURSO — va DESPUÉS del proxy
============================================================ */
router.get("/:country/:mission_id", (req, res) => {

    const country = req.params.country;
    const id = Number(req.params.mission_id);

    db.findOne({
        country: new RegExp(`^${country}$`, "i"),
        mission_id: id
    }, { _id: 0 }, (err, doc) => {

        if (!doc) {
            return res.status(404).json({ error: "No encontrado" });
        }

        res.status(200).json(doc);

    });

});

/* ============================================================
   PUT
============================================================ */
router.put("/:country/:mission_id", validarLaunch, (req, res) => {

    const country = req.params.country;
    const id = Number(req.params.mission_id);

    if (Number(req.body.mission_id) !== id) {
        return res.status(400).json({ error: "El ID no coincide con la URL" });
    }

    db.update({
        country: new RegExp(`^${country}$`, "i"),
        mission_id: id
    }, req.body, {}, (err, num) => {

        if (num === 0) {
            return res.status(404).json({ error: "No existe" });
        }

        res.status(200).json(req.body);

    });

});

/* ============================================================
   DELETE UNO
============================================================ */
router.delete("/:country/:mission_id", (req, res) => {

    const country = req.params.country;
    const id = Number(req.params.mission_id);

    db.remove({
        country: new RegExp(`^${country}$`, "i"),
        mission_id: id
    }, {}, (err, num) => {

        if (num === 0) {
            return res.status(404).json({ error: "No existe" });
        }

        res.status(200).json({ message: "Eliminado correctamente" });

    });

});

/* ============================================================
   MÉTODOS NO PERMITIDOS
============================================================ */
router.post("/:country/:mission_id", (req, res) => res.status(405).json({ error: "Método no permitido" }));
router.put("/", (req, res) => res.status(405).json({ error: "Método no permitido" }));

module.exports = router;