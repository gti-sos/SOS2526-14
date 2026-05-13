<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let chartCanvas;
    let tableData = [];

    onMount(async () => {
        console.log("1. Iniciando onMount...");

        // 1. Obtener tus datos de Satélites
        const resSat = await fetch('/api/v1/active-satellites');
        const satelliteData = await resSat.json();
        console.log("2. Satélites recibidos:", satelliteData.length);

        // 2. Obtener datos de Food Supply
        const resFood = await fetch('https://sos2526-18-mcs-stable.onrender.com/api/v2/food-supply-utilization-accounts');
        const foodData = await resFood.json();
        console.log("3. Alimentos recibidos:", foodData.length);

        // 3. Cruzar datos (MASHUP)
        const countriesInFood = [...new Set(foodData.map(item => item.country_name_en))];
        const merged = [];

        countriesInFood.forEach(country => {
            if (!country) return;

            const numSatellites = satelliteData.filter(sat => sat.country === country).length;
            
            if (numSatellites > 0) {
                const totalImports = foodData
                    .filter(f => f.country_name_en === country && f.import_quantity_tonnes)
                    .reduce((sum, f) => sum + Number(f.import_quantity_tonnes), 0);

                merged.push({
                    country: country,
                    satellites: numSatellites,
                    imports: totalImports.toFixed(2)
                });
            }
        });

        tableData = merged;
        console.log("4. Países cruzados resultantes:", tableData);

        // 4. Crear la gráfica de Barras (Con un pequeño timeout que ya tenías/usabas para evitar el fallo de canvas)
        if (tableData.length > 0) {
            setTimeout(() => {
                if (chartCanvas) {
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
                                    label: 'Importaciones de Alimentos (Toneladas)',
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
                                y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Toneladas Importadas' }}
                            }
                        }
                    });
                    console.log("5. Gráfica renderizada OK.");
                } else {
                    console.error("Error: El chartCanvas no existe.");
                }
            }, 100);
        } else {
            console.warn("ATENCIÓN: tableData está vacío, la gráfica no se va a crear.");
        }
    });
</script>

<main>
    <h1>Integración: Satélites vs Suministro de Alimentos</h1>
    <p>Comparativa entre la potencia espacial y las toneladas de alimentos importados por país (Mashup de 2 APIs).</p>

    <div class="chart-container">
        <canvas bind:this={chartCanvas}></canvas>
    </div>
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
</style>