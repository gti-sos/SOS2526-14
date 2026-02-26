const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const meteorite_csv = path.join(__dirname, "../data/meteorite-landings-with-country.csv");

/* ================================
    GET TODOS LOS METEORITOS
================================ */
router.get("/", (req, res) => {
    // 1. Empieza a leer
    // 2. .then significa: "Cuando termines, haz esto con los datos"
    csv().fromFile(meteorite_csv).then((datos) => {
        res.json(datos);
    });
});

module.exports = router;