<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let chartContainer;
    let countriesData = $state([]); 
    let loading = $state(true);
    let errorMsg = $state('');

    onMount(async () => {
        try {
            // 1. PETICIÓN A TU PROPIO PROXY
            const response = await fetch('/api/v1/active-satellites/proxy/countries');

            if (!response.ok) throw new Error(`Error en mi proxy: HTTP ${response.status}`);
            countriesData = await response.json();

            loading = false;

            // 2. Importamos ApexCharts dinámicamente
            const ApexCharts = (await import('apexcharts')).default;

            // 3. Configuración del Gráfico: RADAR (Diferente y sofisticado)
            const options = {
                series: [{
                    name: 'Población',
                    data: countriesData.map(c => c.population),
                }],
                chart: {
                    height: 450,
                    type: 'radar',
                    dropShadow: {
                        enabled: true,
                        blur: 1,
                        left: 1,
                        top: 1
                    }
                },
                title: {
                    text: 'Comparativa de Población Europea',
                    align: 'center',
                    style: { fontSize: '20px', color: '#2c3e50' }
                },
                stroke: {
                    width: 3,
                    colors: ['#FF4560'] // Color de la línea del radar
                },
                fill: {
                    opacity: 0.4,
                    colors: ['#FF4560'] // Color del área interna
                },
                markers: {
                    size: 5,
                    colors: ['#fff'],
                    strokeColors: '#FF4560',
                    strokeWidth: 2,
                },
                labels: countriesData.map(c => c.name),
                yaxis: {
                    stepSize: 20000000, // Ajusta según la escala de población
                    labels: {
                        formatter: (val) => (val / 1000000).toFixed(0) + "M"
                    }
                },
                xaxis: {
                    labels: {
                        style: {
                            colors: Array(countriesData.length).fill('#333'),
                            fontSize: '13px',
                            fontWeight: 'bold'
                        }
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val) {
                            return val.toLocaleString() + " habitantes";
                        }
                    }
                },
                plotOptions: {
                    radar: {
                        polygons: {
                            strokeColors: '#e8e8e8',
                            fill: {
                                colors: ['#f8f8f8', '#fff']
                            }
                        }
                    }
                }
            };

            const chart = new ApexCharts(chartContainer, options);
            chart.render();

        } catch (error) {
            errorMsg = `❌ Error: ${error.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración vía Proxy Propio</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/')}>Volver al Inicio</button>
    </div>

    <p>
        Demostración de uso de un <strong>Proxy Propio</strong>. 
        <br><em>*Visualizado con <strong>ApexCharts (Radar Chart)</strong> para un análisis comparativo de red.</em>
    </p>

    {#if loading}
        <div class="status">Consultando al proxy local...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="chart-box" style="display: {loading || errorMsg ? 'none' : 'block'};">
        <div bind:this={chartContainer}></div>
    </figure>

    {#if !loading && !errorMsg}
        <hr>
        <section>
            <h3>Ranking Detallado</h3>
            <table>
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Bandera</th>
                        <th>País</th>
                        <th>Población (Habitantes)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each countriesData as country, index}
                        <tr>
                            <td class="pos">{index + 1}</td>
                            <td class="center"><img src={country.flag} alt="Bandera" width="40"></td>
                            <td><strong>{country.name}</strong></td>
                            <td class="points">{country.population.toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    /* El CSS se mantiene igual al anterior, es muy sólido */
    main { max-width: 900px; margin: 0 auto; padding: 20px; font-family: 'Segoe UI', sans-serif; }
    .nav-buttons { margin-bottom: 20px; }
    
    button {
        padding: 10px 15px;
        background-color: #e74c3c; /* Cambiado a rojo para que pegue con el radar */
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }
    
    button:hover { background-color: #c0392b; }

    .chart-box {
        width: 100%;
        padding: 20px;
        margin: 20px 0;
        border: 1px solid #ddd;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    .status { text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; }
    .error { color: #c0392b; background: #f9ebeb; border: 1px solid #e74c3c; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
    th, td { padding: 12px; border: 1px solid #eee; }
    th { background: #2c3e50; color: white; text-align: left; }
    
    .pos { font-weight: bold; color: #95a5a6; text-align: center; }
    .center { text-align: center; }
    .points { font-weight: bold; color: #e74c3c; text-align: right; }
    img { border: 1px solid #eee; }
</style>