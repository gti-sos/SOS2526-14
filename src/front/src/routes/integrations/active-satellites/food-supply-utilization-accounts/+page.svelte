<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let chartCanvas;
    let tableData = [];

    onMount(async () => {
        // 1. Obtener tus datos de Satélites
        const resSat = await fetch('/api/v1/active-satellites');
        const satelliteData = await resSat.json();

        // 2. Obtener datos de Food Supply del compañero
        const resFood = await fetch('https://sos2526-18-mcs-stable.onrender.com/api/v2/food-supply-utilization-accounts');
        const foodData = await resFood.json();

        // 3. Cruzar datos (MASHUP)
        // Buscamos los países únicos en la API de alimentos
        const countriesInFood = [...new Set(foodData.map(item => item.country_name_en))];
        const merged = [];

        countriesInFood.forEach(country => {
            // Contamos cuántos satélites tiene ese país en tu API
            const numSatellites = satelliteData.filter(sat => sat.country === country).length;
            
            // Solo nos interesan los países que coincidan en ambas APIs
            if (numSatellites > 0) {
                // Sumamos todas las toneladas importadas de ese país
                const totalImports = foodData
                    .filter(f => f.country_name_en === country && f.import_quantity_tonnes)
                    .reduce((sum, f) => sum + Number(f.import_quantity_tonnes), 0);

                merged.push({
                    country: country,
                    satellites: numSatellites,
                    imports: totalImports.toFixed(2) // Redondeamos a 2 decimales
                });
            }
        });

        tableData = merged;

        // 4. Crear la gráfica de Barras (Combinación: Chart.js + Bar)
        if (tableData.length > 0) {
            new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: tableData.map(d => d.country),
                    datasets: [
                        {
                            label: 'Nº de Satélites Activos',
                            data: tableData.map(d => d.satellites),
                            backgroundColor: 'rgba(54, 162, 235, 0.8)',
                            yAxisID: 'y' // Eje izquierdo
                        },
                        {
                            label: 'Importaciones de Alimentos (Toneladas)',
                            data: tableData.map(d => d.imports),
                            backgroundColor: 'rgba(255, 159, 64, 0.8)',
                            yAxisID: 'y1' // Eje derecho
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Cantidad de Satélites' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: 'Toneladas Importadas' },
                            grid: { drawOnChartArea: false } // Evita que la cuadrícula se solape
                        }
                    }
                }
            });
        }
    });
</script>

<main>
    <h1>Integración: Satélites vs Suministro de Alimentos</h1>
    <p>Comparativa entre la potencia espacial y las toneladas de alimentos importados por país (Mashup de 2 APIs).</p>

    <div class="chart-container">
        <canvas bind:this={chartCanvas}></canvas>
    </div>

    <hr>

    <section>
        <h3>📊 Datos Detallados (Uso Textual HTML)</h3>
        <p><i>Esta tabla cumple el requisito obligatorio de mostrar el cruce de datos en formato lista/tabla.</i></p>
        
        {#if tableData.length > 0}
            <table>
                <thead>
                    <tr>
                        <th>País</th>
                        <th>Nº de Satélites</th>
                        <th>Importaciones (Toneladas)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as row}
                        <tr>
                            <td><strong>{row.country}</strong></td>
                            <td>{row.satellites} unidades</td>
                            <td>{row.imports} t</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else}
            <div class="empty-state">
                Buscando coincidencias exactas de países entre ambas bases de datos...
            </div>
        {/if}
    </section>
</main>

<style>
    main {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
        color: #333;
    }

    h1 { text-align: center; color: #2c3e50; }

    .chart-container {
        width: 100%;
        margin: 30px 0;
        background: #fff;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    th, td {
        border: 1px solid #e0e0e0;
        padding: 12px 15px;
        text-align: left;
    }

    th {
        background-color: #2c3e50;
        color: white;
        text-transform: uppercase;
        font-size: 0.9em;
    }

    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #eef2f5; }

    hr { margin: 40px 0; border: 0; border-top: 2px dashed #eee; }

    .empty-state {
        padding: 20px;
        background: #fff3cd;
        color: #856404;
        border-radius: 8px;
        text-align: center;
    }
</style>