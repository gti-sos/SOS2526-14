// index-FRB.js

const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const filePath = path.join(__dirname, "data/space-missions-with-country.csv");

function calcularMediaUSA() {

    return new Promise((resolve, reject) => {

        let misiones = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {

                row.cost = row.cost ? Number(row.cost) : null;

                misiones.push(row);
            })
            .on("end", () => {

                const paisBuscado = "USA";

                const misionesValidas = misiones.filter(m =>
                    m.country === paisBuscado && m.cost !== null
                );

                const costes = misionesValidas.map(m => m.cost);

                const suma = costes.reduce((acc, c) => acc + c, 0);

                const media = costes.length > 0 ? suma / costes.length : 0;

                console.log("Buscando en el CSV...");
                console.log(`País analizado: ${paisBuscado}`);
                console.log(`Misiones válidas: ${costes.length}`);
                console.log(`Media calculada: ${media}`);

                resolve(media);
            })
            .on("error", reject);
    });
}

module.exports = calcularMediaUSA;