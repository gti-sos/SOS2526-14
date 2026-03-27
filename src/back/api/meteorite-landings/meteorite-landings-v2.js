const express = require("express");
const router = express.Router();
const csv = require('csvtojson');


// En meteorite-landings-v2.js (v2)
const db = require('../../data/meteorite-landings/meteorite-data.js');

// Nos quedamos solo con los datos que aportan valor real a la API
const camposObligatorios = ["name", "id", "mass", "year", "geolocation", "country"];

function validarMeteorito(req, res, next) {
    const dato = req.body;

    // 1. Comprobar campos faltantes o vacíos
    const camposFaltantes = camposObligatorios.filter(campo => !dato.hasOwnProperty(campo) || dato[campo] === "");
    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Faltan campos obligatorios o están vacíos", faltantes: camposFaltantes });
    }

    // 2. Comprobar campos extra (basura o intentos de inyectar _id)
    const camposExtra = Object.keys(dato).filter(campo => !camposObligatorios.includes(campo));
    if (camposExtra.length > 0) {
        return res.status(400).json({ error: "Se han enviado campos no permitidos", extra: camposExtra });
    }

    // Si todo está perfecto, pasamos a la ruta real
    next();
}

/* ============================================================
    DOCUMENTACIÓN (/docs) -> Requisito L06
============================================================ */
router.get("/docs", (req, res) => {
    // IMPORTANTE: Sustituye este enlace por tu URL pública de Postman
    res.redirect("https://documenter.getpostman.com/view/52378516/2sBXiertzB");
});

/* ============================================================
    1. CARGA INICIAL (/loadInitialData)
============================================================ */
router.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => { 
        if (err) return res.status(500).json({ error: "Error al consultar la DB" });
        
        if (count > 0) {
            return res.status(400).json({ error: "La base de datos ya tiene datos." });
        }

        csv().fromFile(meteorite_csv).then((datos) => {
            // Mapeamos y limpiamos los datos para quedarnos solo con las 6 columnas elegidas
            const datosLimpios = datos.map(m => ({
                name: m.name,
                id: Number(m.id),
                mass: Number(m.mass), 
                year: Number(m.year),
                geolocation: m.geolocation,
                country: m.country
            }));

            db.insert(datosLimpios, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar en DB" });
                res.status(201).json({ message: "Datos cargados correctamente", count: newDocs.length });
            });
        });
    });
});

/* ============================================================
    2. COLECCIÓN (Lista completa con Búsqueda y Paginación)
============================================================ */
router.get("/", (req, res) => {
    // Extraer parámetros de paginación
    let limit = parseInt(req.query.limit) || 0; 
    let offset = parseInt(req.query.offset) || 0; 

    // Construir el objeto de búsqueda dinámico
    let searchQuery = {};

    Object.keys(req.query).forEach(key => {
        if (key !== "limit" && key !== "offset") {
            if (key === "year" || key === "mass" || key === "id") {
                searchQuery[key] = Number(req.query[key]);
            } else {
                searchQuery[key] = new RegExp(`^${req.query[key]}$`, 'i');
            }
        }
    });

    // Buscar filtrando el _id autogenerado de NeDB
    db.find(searchQuery, { _id: 0 })
      .skip(offset)
      .limit(limit)
      .exec((err, docs) => {
          if (err) return res.status(500).json({ error: "Error en la base de datos" });
          //if(docs.length===1)
            //docs = docs[0]
          res.status(200).json(docs);
      });
});

// POST - Crear nuevo
router.post("/", validarMeteorito, (req, res) => {
    const nuevo = req.body;

    // Comprobar si ya existe en la DB (por nombre)
    db.findOne({ name: new RegExp(`^${nuevo.name}$`, 'i') }, (err, doc) => {
        if (doc) return res.status(409).json({ error: "Ese meteorito ya existe." });

        db.insert(nuevo, (err, docInsertado) => {
            if (err) return res.status(500).json({ error: "Error al guardar" });
            const { _id, ...docSinId } = docInsertado; // Quitamos el _id de la respuesta
            res.status(201).json(docSinId);
        });
    });
});

// DELETE - Borrar todo
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al borrar" });
        res.status(200).json({ message: `Colección borrada. ${numRemoved} recursos eliminados.` });
    });
});

/* ============================================================
    3. RECURSO ÚNICO (Identificador Compuesto: /:country/:name)
============================================================ */

// GET - Un solo meteorito
router.get("/:country/:name", (req, res) => {
    const countryParam = req.params.country;
    const nameParam = req.params.name;
    
    db.findOne({ 
        country: new RegExp(`^${countryParam}$`, 'i'),
        name: new RegExp(`^${nameParam}$`, 'i') 
    }, { _id: 0 }, (err, doc) => {
        if (doc) {
            res.status(200).json(doc);
        } else {
            res.status(404).json({ error: "Meteorito no encontrado." });
        }
    });
});

// PUT - Actualizar
router.put("/:country/:name", validarMeteorito, (req, res) => {
    const countryParam = req.params.country;
    const nameParam = req.params.name;
    const nuevoDato = req.body;

    // El nombre y país del JSON deben coincidir con los de la URL
    if (nuevoDato.name.toLowerCase() !== nameParam.toLowerCase() || 
        nuevoDato.country.toLowerCase() !== countryParam.toLowerCase()) {
        return res.status(400).json({ error: "El nombre o país del cuerpo no coincide con la URL." });
    }

    db.update(
        { 
            country: new RegExp(`^${countryParam}$`, 'i'),
            name: new RegExp(`^${nameParam}$`, 'i') 
        }, 
        nuevoDato, 
        {}, 
        (err, numReplaced) => {
            if (numReplaced === 0) {
                res.status(404).json({ error: "No existe para actualizar." });
            } else {
                res.status(200).json(nuevoDato);
            }
        }
    );
});

// DELETE - Borrar uno
router.delete("/:country/:name", (req, res) => {
    const countryParam = req.params.country;
    const nameParam = req.params.name;

    db.remove({ 
        country: new RegExp(`^${countryParam}$`, 'i'),
        name: new RegExp(`^${nameParam}$`, 'i') 
    }, {}, (err, numRemoved) => {
        if (numRemoved === 0) {
            res.status(404).json({ error: "No existe para eliminar." });
        } else {
            res.status(200).json({ message: "Eliminado correctamente." });
        }
    });
});

/* ============================================================
    4. MÉTODOS NO PERMITIDOS
============================================================ */
router.post("/:country/:name", (req, res) => res.status(405).json({ error: "Método no permitido." }));
router.put("/", (req, res) => res.status(405).json({ error: "Método no permitido." }));


/* ============================================================
    5. FILTROS
============================================================ */
router.get("/statistics", (req, res) => {
    const from = parseInt(req.query.from);
    const to   = parseInt(req.query.to);

    const filtro = {};
    if (!isNaN(from)) filtro.year = { ...filtro.year, $gte: from };
    if (!isNaN(to))   filtro.year = { ...filtro.year, $lte: to };

    db.find(filtro, { _id: 0 }, (err, meteoritos) => {
        if (err) return res.status(500).json({ error: "Error al consultar la DB" });
        res.status(200).json(meteoritos);
    });
});

module.exports = router;