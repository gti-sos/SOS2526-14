const express = require("express");
const router = express.Router();
const path = require("path");
const Datastore = require("nedb");
const csv = require("csvtojson");

const csvFile = path.join(__dirname, "../data/space-missions-with-country.csv");

const db = new Datastore({
    filename: "./data/space-launches.db",
    autoload: true
});

/* ================================
   LOAD INITIAL DATA
================================ */

router.get("/loadInitialData", async (req, res) => {

    db.count({}, async (err, count) => {

        if (count > 0) {
            return res.status(400).json({ error: "Los datos ya están cargados" });
        }

        try {

            const data = await csv().fromFile(csvFile);

            const launches = data.map(l => ({
                mission_id: Number(l.mission_id),
                company_name: l.company_name,
                location: l.location,
                launch_date: l.launch_date,
                year: Number(l.year),
                latitude: Number(l.latitude),
                longitude: Number(l.longitude),
                cost: l.cost ? Number(l.cost) : null,
                rocket_name: l.rocket_name,
                rocket_status: l.rocket_status,
                mission_status: l.mission_status,
                country: l.country
            }));

            db.insert(launches, (err, newDocs) => {

                const cleanDocs = newDocs.map(d => {
                    delete d._id;
                    return d;
                });

                res.status(201).json({
                    message: "Datos cargados",
                    count: cleanDocs.length
                });

            });

        } catch (error) {
            res.status(500).json({ error: "Error cargando CSV" });
        }

    });

});

/* ================================
   GET COLECCIÓN (con filtros + paginación)
================================ */

router.get("/", (req, res) => {

    const query = {};

    Object.keys(req.query).forEach(key => {

        if (key !== "limit" && key !== "offset") {
            query[key] = req.query[key];
        }

    });

    let limit = parseInt(req.query.limit) || 0;
    let offset = parseInt(req.query.offset) || 0;

    db.find(query)
        .skip(offset)
        .limit(limit)
        .exec((err, docs) => {

            const cleanDocs = docs.map(d => {
                delete d._id;
                return d;
            });

            res.status(200).json(cleanDocs);

        });

});

/* ================================
   GET RECURSO
================================ */

router.get("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);

    db.findOne({ mission_id: id }, (err, doc) => {

        if (!doc) {
            return res.status(404).json({ error: "No encontrado" });
        }

        delete doc._id;

        res.status(200).json(doc);

    });

});

/* ================================
   POST
================================ */

router.post("/", (req, res) => {

    const nuevo = req.body;

    if (!nuevo.mission_id || !nuevo.company_name) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    db.findOne({ mission_id: nuevo.mission_id }, (err, doc) => {

        if (doc) {
            return res.status(409).json({ error: "Ya existe ese recurso" });
        }

        db.insert(nuevo, (err, newDoc) => {

            delete newDoc._id;

            res.status(201).json(newDoc);

        });

    });

});

/* ================================
   PUT
================================ */

router.put("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);

    if (req.body.mission_id !== id) {
        return res.status(400).json({ error: "ID no coincide con la URL" });
    }

    db.update(
        { mission_id: id },
        req.body,
        {},
        (err, numUpdated) => {

            if (numUpdated === 0) {
                return res.status(404).json({ error: "No existe" });
            }

            res.sendStatus(200);

        }
    );

});

/* ================================
   DELETE UNO
================================ */

router.delete("/:mission_id", (req, res) => {

    const id = Number(req.params.mission_id);

    db.remove({ mission_id: id }, {}, (err, numRemoved) => {

        if (numRemoved === 0) {
            return res.status(404).json({ error: "No existe" });
        }

        res.sendStatus(200);

    });

});

/* ================================
   DELETE COLECCIÓN
================================ */

router.delete("/", (req, res) => {

    db.remove({}, { multi: true }, () => {

        res.sendStatus(200);

    });

});

/* ================================
   MÉTODOS NO PERMITIDOS
================================ */

router.post("/:mission_id", (req, res) => res.sendStatus(405));
router.put("/", (req, res) => res.sendStatus(405));

module.exports = router;