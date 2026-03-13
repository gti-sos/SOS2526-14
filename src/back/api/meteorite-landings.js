const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');
const Datastore = require('@seald-io/nedb');

// 1. Configuración de rutas y DB
// IMPORTANTE: Al estar en src/back/api, usamos ../../../ para llegar a la raíz
const meteorite_csv = path.join(__dirname, "/../data/meteorite-landings-with-country.csv");
const db = new Datastore({ 
    filename: path.join(process.cwd(), "data", "meteoritos.db"), 
    autoload: true 
});

// Nos quedamos solo con los datos que aportan valor real a la API
const camposObligatorios = ["name", "id", "mass", "year", "geolocation", "country"];

// Nuestro Middleware de validación
function validarMeteorito(req, res, next) {
    const dato = req.body;

    // 1. Comprobar campos faltantes o vacíos
    const camposFaltantes = camposObligatorios.filter(campo => !dato.hasOwnProperty(campo) || dato[campo] === "");
    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Faltan campos obligatorios o están vacíos", faltantes: camposFaltantes });
    }

    // 2. Comprobar campos extra (basura)
    const camposExtra = Object.keys(dato).filter(campo => !camposObligatorios.includes(campo));
    if (camposExtra.length > 0) {
        return res.status(400).json({ error: "Se han enviado campos no permitidos", extra: camposExtra });
    }

    // Si todo está perfecto, pasamos a la ruta real
    next();
}

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
            // Mapeamos y limpiamos los datos antes de guardarlos
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
    // 1. Extraer parámetros de paginación (si no vienen, por defecto son 0)
    let limit = parseInt(req.query.limit) || 0;  // 0 en NeDB significa "sin límite"
    let offset = parseInt(req.query.offset) || 0; // Cuántos resultados me salto

    // 2. Construir el objeto de búsqueda dinámico
    let searchQuery = {};

    Object.keys(req.query).forEach(key => {
        // Ignoramos limit y offset porque no son campos de la base de datos
        if (key !== "limit" && key !== "offset") {
            
            // Si el campo es numérico (como year o mass), lo convertimos a número
            if (key === "year" || key === "mass" || key === "id") {
                searchQuery[key] = Number(req.query[key]);
            } else {
                // Si es texto (name, country, class), búsqueda exacta sin importar mayúsculas
                searchQuery[key] = new RegExp(`^${req.query[key]}$`, 'i');
            }
        }
    });

    // 3. Ejecutar la búsqueda en NeDB con paginación
    db.find(searchQuery, { _id: 0 })
      .skip(offset)
      .limit(limit)
      .exec((err, docs) => {
          if (err) return res.status(500).json({ error: "Error en la base de datos" });
          
          res.status(200).json(docs);
      });
});

// POST - Crear nuevo
router.post("/", validarMeteorito, (req, res) => {
    const nuevo = req.body;

    // Comprobar si ya existe en la DB
    db.findOne({ name: nuevo.name }, (err, doc) => {
        if (doc) return res.status(409).json({ error: "Ese meteorito ya existe." });

        db.insert(nuevo, (err, docInsertado) => {
            if (err) return res.status(500).json({ error: "Error al guardar" });
            const { _id, ...docSinId } = docInsertado; // Quitamos el _id de NeDB para la respuesta
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
    3. RECURSO ÚNICO (Por nombre)
============================================================ */

// GET - Un solo meteorito
router.get("/:name", (req, res) => {
    const nameParam = req.params.name;
    // Usamos expresión regular para que no importe mayúsculas/minúsculas
    db.findOne({ name: new RegExp(`^${nameParam}$`, 'i') }, { _id: 0 }, (err, doc) => {
        if (doc) {
            res.status(200).json(doc);
        } else {
            res.status(404).json({ error: "Meteorito no encontrado." });
        }
    });
});

// PUT - Actualizar
router.put("/:name", validarMeteorito, (req, res) => {
    const nameParam = req.params.name;
    const nuevoDato = req.body;

    if (nuevoDato.name && nuevoDato.name.toLowerCase() !== nameParam.toLowerCase()) {
        return res.status(400).json({ error: "El nombre no coincide con la URL." });
    }

    const camposFaltantes = camposObligatorios.filter(campo => !nuevoDato.hasOwnProperty(campo));
    if (camposFaltantes.length > 0) {
        return res.status(400).json({ error: "Debe enviar todos los campos.", faltantes: camposFaltantes });
    }

    db.update({ name: new RegExp(`^${nameParam}$`, 'i') }, nuevoDato, {}, (err, numReplaced) => {
        if (numReplaced === 0) {
            res.status(404).json({ error: "No existe para actualizar." });
        } else {
            res.status(200).json(nuevoDato);
        }
    });
});

// DELETE - Borrar uno
router.delete("/:name", (req, res) => {
    const nameParam = req.params.name;
    db.remove({ name: new RegExp(`^${nameParam}$`, 'i') }, {}, (err, numRemoved) => {
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
router.post("/:name", (req, res) => res.status(405).json({ error: "Método no permitido." }));
router.put("/", (req, res) => res.status(405).json({ error: "Método no permitido." }));

module.exports = router;