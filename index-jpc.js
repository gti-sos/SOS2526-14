const fs = require('fs');
const csv = require('csv-parser');

const rutaCSV = 'meteoritos.csv';
const paisObjetivo = 'Argentina';
const meteoritos = [];

// Leemos el archivo usando el paquete csv-parser
fs.createReadStream(rutaCSV)
  .pipe(csv())
  .on('data', (fila) => {
    // Cada 'fila' que lee el paquete se guarda en nuestro array
    meteoritos.push(fila);
  })
  .on('end', () => {
    // ¡El archivo se ha terminado de leer por completo!
    // Ahora aplicamos nuestro algoritmo con iteradores
    
    const meteoritosFiltrados = meteoritos.filter(m => m.country === paisObjetivo);

    if (meteoritosFiltrados.length > 0) {
      // Usamos map para extraer la masa. Nota: csv-parser lee todo como texto, 
      // así que usamos parseFloat() para convertir la masa a número.
      const masas = meteoritosFiltrados
        .map(m => parseFloat(m.mass))
        .filter(masa => !isNaN(masa)); // Filtramos por si alguna masa estaba en blanco

      if (masas.length > 0) {
        const sumaMasas = masas.reduce((acc, masaActual) => acc + masaActual, 0);
        const mediaMasas = sumaMasas / masas.length;

        console.log(`\n=== RESULTADO DEL CÁLCULO ===`);
        console.log(`País analizado: ${paisObjetivo}`);
        console.log(`Meteoritos encontrados con masa registrada: ${masas.length}`);
        console.log(`Media de masa: ${mediaMasas.toFixed(2)} g\n`);
      } else {
        console.log(`Se encontraron meteoritos en ${paisObjetivo}, pero ninguno tiene datos de masa.`);
      }
    } else {
      console.log(`No se encontraron meteoritos en ${paisObjetivo}.`);
    }
  });