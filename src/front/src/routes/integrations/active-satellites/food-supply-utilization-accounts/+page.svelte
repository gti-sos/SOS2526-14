<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let chartCanvas;
    let tableData = [];
    let loading = true; // Para saber si estamos cargando

    onMount(async () => {
        try {
            const resSat = await fetch('/api/v1/active-satellites');
            const satelliteData = await resSat.json();

            const resFood = await fetch('https://sos2526-18.onrender.com/api/v2/food-supply-utilization-accounts');
            const foodData = await resFood.json();

            console.log("Satélites cargados:", satelliteData.length);
            console.log("Datos Alimentos cargados:", foodData.length);

            // 1. Limpiamos y normalizamos nombres de países de la API de Alimentos
            const countriesInFood = [...new Set(foodData.map(item => item.country_name_en?.trim()))];
            const merged = [];

            countriesInFood.forEach(country => {
                if (!country) return;

                // 2. Buscamos coincidencias ignorando mayúsculas y espacios
                const satellitesOfCountry = satelliteData.filter(sat => 
                    sat.country?.trim().toLowerCase() === country.toLowerCase()
                );
                
                const numSatellites = satellitesOfCountry.length;
                
                if (numSatellites > 0) {
                    const totalImports = foodData
                        .filter(f => f.country_name_en?.trim().toLowerCase() === country.toLowerCase())
                        .reduce((sum, f) => sum + Number(f.import_quantity_tonnes || 0), 0);

                    merged.push({
                        country: country,
                        satellites: numSatellites,
                        imports: parseFloat(totalImports.toFixed(2))
                    });
                }
            });

            tableData = merged;
            console.log("Países cruzados encontrados:", tableData.length);
            loading = false;

            // 3. Crear la gráfica solo si hay datos
            if (tableData.length > 0) {
                // Pequeño timeout para asegurar que el canvas existe en el DOM
                setTimeout(() => {
                    new Chart(chartCanvas, {
                        type: 'bar',
                        data: {
                            labels: tableData.map(d => d.country),
                            datasets: [
                                {
                                    label: 'Nº de Satélites Activos',
                                    data: tableData.map(d => d.satellites),
                                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                                    yAxisID: 'y'
                                },
                                {
                                    label: 'Importaciones (Toneladas)',
                                    data: tableData.map(d => d.imports),
                                    backgroundColor: 'rgba(255, 159, 64, 0.8)',
                                    yAxisID: 'y1'
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: { type: 'linear', position: 'left', title: { display: true, text: 'Cantidad de Satélites' }},
                                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Toneladas' }}
                            }
                        }
                    });
                }, 100);
            }
        } catch (error) {
            console.error("Error cargando el Mashup:", error);
            loading = false;
        }
    });
</script>

<main>
    <h1>Integración: Satélites vs Suministro de Alimentos</h1>
    
    {#if loading}
        <p>Cargando y cruzando datos de APIs...</p>
    {:else if tableData.length === 0}
        <div style="background: #ffcccc; padding: 20px; border-radius: 8px; color: #a00;">
            <strong>¡Atención!</strong> No se han encontrado países que coincidan en ambas APIs. 
            <br>Comprueba que los nombres de los países (ej: "Spain") están escritos igual en tu base de datos y en la del compañero.
        </div>
    {:else}
        <div class="chart-container">
            <canvas bind:this={chartCanvas}></canvas>
        </div>
    {/if}
</main>