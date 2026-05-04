<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let chartContainer;
    let covidData = $state([]); 
    let loading = $state(true);
    let errorMsg = $state('');

    onMount(async () => {
        try {
            // 1. Importamos Highcharts
            const Highcharts = (await import('highcharts')).default;
            
            // 2. Petición a la API pública de COVID (disease.sh)
            // Ya la pedimos ordenada por número de casos (sort=cases)
            const response = await fetch('https://disease.sh/v3/covid-19/countries?sort=cases');

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // 3. Extraemos solo los 10 primeros países
            if (data && data.length > 0) {
                covidData = data.slice(0, 10);
            } else {
                throw new Error("No se encontraron datos en la API");
            }

            loading = false;

            // 4. Configuración del Gráfico: TARTA (Pie Chart)
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'pie', // ✅ TIPO NUEVO: Tarta clásica
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false
                },
                title: {
                    text: 'Top 10 Países con más Casos de COVID-19'
                },
                tooltip: {
                    pointFormat: '{series.name}: <b>{point.y:,.0f} casos</b> ({point.percentage:.1f}%)'
                },
                plotOptions: {
                    pie: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: true,
                            format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                        }
                    }
                },
                series: [{
                    name: 'Casos Totales',
                    colorByPoint: true,
                    // Mapeamos los datos: name (País) y y (Casos totales)
                    data: covidData.map(country => ({
                        name: country.country,
                        y: country.cases
                    }))
                }],
                credits: { enabled: false }
            });

        } catch (error) {
            errorMsg = `❌ Error al cargar datos: ${error.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración Externa: Datos COVID-19</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/')}>Volver al Inicio</button>
    </div>

    <p>Visualización de la proporción de casos históricos usando un <strong>Gráfico de Tarta</strong> y la API de disease.sh.</p>

    {#if loading}
        <div class="status">Cargando datos epidemiológicos...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'};">
        <div bind:this={chartContainer} id="container"></div>
    </figure>

    {#if !loading && !errorMsg}
        <hr>
        <section>
            <h3>Ficha Detallada (Uso Textual)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Bandera</th>
                        <th>País</th>
                        <th>Casos Totales</th>
                        <th>Recuperados</th>
                        <th>Fallecidos</th>
                    </tr>
                </thead>
                <tbody>
                    {#each covidData as country}
                        <tr>
                            <td class="center"><img src={country.countryInfo.flag} alt="Bandera de {country.country}" width="30"></td>
                            <td><strong>{country.country}</strong></td>
                            <td class="cases">{country.cases.toLocaleString()}</td>
                            <td class="recovered">{country.recovered.toLocaleString()}</td>
                            <td class="deaths">{country.deaths.toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    main { max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .nav-buttons { margin-bottom: 20px; }
    
    #container {
        width: 100%;
        height: 500px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        background: white;
    }

    .status { text-align: center; padding: 20px; background: #eee; border-radius: 8px; }
    .error { color: red; background: #ffdada; border: 1px solid red; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
    th, td { padding: 12px; border: 1px solid #ccc; text-align: left; }
    th { background: #2c3e50; color: white; }
    
    .center { text-align: center; }
    .cases { font-weight: bold; color: #e67e22; text-align: right; }
    .recovered { font-weight: bold; color: #27ae60; text-align: right; }
    .deaths { font-weight: bold; color: #c0392b; text-align: right; }
    
    img { border-radius: 4px; border: 1px solid #eee; }
</style>