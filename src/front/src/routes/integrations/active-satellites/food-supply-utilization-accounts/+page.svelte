<script>
    import { onMount, tick } from 'svelte'; // Añadimos tick para sincronizar el DOM
    import Chart from 'chart.js/auto';

    let chartCanvas;
    let tableData = [];
    let loading = true;
    let errorMsg = '';

    onMount(async () => {
        try {
            // 1. Obtener datos de Satélites
            const resSat = await fetch('/api/v1/active-satellites');
            const satelliteData = await resSat.json();

            // 2. Obtener datos de Food Supply
            const resFood = await fetch('https://sos2526-18-mcs-stable.onrender.com/api/v2/food-supply-utilization-accounts');
            const foodData = await resFood.json();

            // 3. Cruzar datos (MASHUP)
            const countriesInFood = [...new Set(foodData.map(item => item.country_name_en?.trim()))];
            const merged = [];

            countriesInFood.forEach(country => {
                if (!country) return;

                // Normalizamos para encontrar coincidencias (revertimos el problema de tipos)
                const numSatellites = satelliteData.filter(sat => 
                    sat.country?.trim().toLowerCase() === country.toLowerCase()
                ).length;
                
                if (numSatellites > 0) {
                    const totalImports = foodData
                        .filter(f => f.country_name_en?.trim().toLowerCase() === country.toLowerCase())
                        // Usamos Number() porque los datos del revert vienen como strings
                        .reduce((sum, f) => sum + Number(f.import_quantity_tonnes || 0), 0);

                    merged.push({
                        country: country,
                        satellites: numSatellites,
                        imports: parseFloat(totalImports.toFixed(2))
                    });
                }
            });

            tableData = merged;
            loading = false;

            // 4. SOLUCIÓN AL ERROR DE CONTEXTO
            // Esperamos a que el DOM se actualice antes de crear la gráfica
            await tick(); 

            if (tableData.length > 0 && chartCanvas) {
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
                            y: { type: 'linear', position: 'left', title: { display: true, text: 'Satélites' }},
                            y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Toneladas' }}
                        }
                    }
                });
            }
        } catch (error) {
            console.error("Error:", error);
            errorMsg = "Error al cargar la integración";
            loading = false;
        }
    });
</script>

<main>
    <h1>Integración: Satélites vs Alimentos</h1>
    
    {#if loading}
        <p>Cargando y cruzando datos de APIs...</p>
    {:else if errorMsg}
        <p style="color: red;">{errorMsg}</p>
    {:else if tableData.length === 0}
        <p>No se encontraron países coincidentes.</p>
    {:else}
        <div class="chart-container">
            <canvas bind:this={chartCanvas}></canvas>
        </div>
    {/if}
</main>

<style>
    main { max-width: 900px; margin: 0 auto; padding: 20px; }
    .chart-container { position: relative; height: 50vh; width: 80vw; }
</style>