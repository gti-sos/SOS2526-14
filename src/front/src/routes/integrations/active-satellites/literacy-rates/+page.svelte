<script>
    import { onMount } from 'svelte';
    import Chart from 'chart.js/auto';

    let chartCanvas;
    let satelliteData = [];
    let literacyData = [];

    onMount(async () => {
        // 1. Obtener datos
        const resSat = await fetch('/api/v1/active-satellites');
        satelliteData = await resSat.json();

        // 2. Obtener datos del compañero 
        const resLit = await fetch('https://sos2526-11.onrender.com/api/v2/literacy-rates');
        literacyData = await resLit.json();

        // Buscamos cuántos satélites tiene cada país que aparece en la lista de alfabetización
        const points = literacyData.map(lit => {
            const numSatellites = satelliteData.filter(sat => sat.country === lit.country).length;
            return {
                x: lit.total,      // Eje X: % Alfabetización
                y: numSatellites,  // Eje Y: Número de satélites
                label: lit.country
            };
        }).filter(p => p.y > 0); // Solo mostramos países que tengan al menos 1 satélite

        // 4. Crear la gráfica con Chart.js
        new Chart(chartCanvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Países (Alfabetización vs Satélites)',
                    data: points,
                    backgroundColor: 'rgba(54, 162, 235, 1)',
                    pointRadius: 8
                }]
            },
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const p = points[ctx.dataIndex];
                                return `${p.label}: ${p.x}% alfabetización, ${p.y} satélites`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Tasa de Alfabetización (%)' } },
                    y: { title: { display: true, text: 'Nº de Satélites' } }
                }
            }
        });
    });
</script>

<main>
    <h1>Análisis de Correlación: Educación y Tecnología</h1>
    <p>¿Tienen los países más alfabetizados más presencia en el espacio?</p>
    
    <div class="canvas-container">
        <canvas bind:this={chartCanvas}></canvas>
    </div>
</main>

<style>
    .canvas-container { 
        width: 80%; 
        margin: 0 auto; 
        background: #fff; 
        padding: 20px; 
        border-radius: 10px; 
    }
    main { 
        font-family: sans-serif; 
        padding: 20px; 
    }
</style>