<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';
    import HighchartsMore from 'highcharts/highcharts-more';

    const LAUNCHES_API = '/api/v2/space-launches';
    const DIET_API     = 'https://sos2526-18.onrender.com/api/v1/cost-of-healthy-diet-by-countries';

    let chartContainer;
    let loading       = $state(true);
    let errorMsg      = $state('');
    let totalLaunches = $state(0);
    let totalDiet     = $state(0);
    let cruzados      = $state(0);

    const COUNTRY_MAP = {
        'USA': 'United States', 'Russia': 'Russia', 'Kazakhstan': 'Kazakhstan',
        'China': 'China', 'France': 'France', 'Japan': 'Japan', 'India': 'India',
        'Australia': 'Australia', 'Brazil': 'Brazil', 'Israel': 'Israel',
        'Iran': 'Iran', 'South Korea': 'South Korea', 'North Korea': 'North Korea',
        'New Zealand': 'New Zealand', 'Canada': 'Canada', 'Argentina': 'Argentina',
        'UK': 'United Kingdom', 'Germany': 'Germany', 'Italy': 'Italy',
        'Spain': 'Spain', 'Ukraine': 'Ukraine', 'Kenya': 'Kenya',
    };

    async function autoLoad(url, loadUrl) {
        let res  = await fetch(`${url}?limit=0`);
        let data = await res.json();
        if (Array.isArray(data) && data.length === 0) {
            await fetch(loadUrl);
            res  = await fetch(`${url}?limit=0`);
            data = await res.json();
        }
        return data;
    }

    onMount(async () => {
        if (typeof HighchartsMore === 'function') HighchartsMore(Highcharts);
        await cargarDatos();
    });

    async function cargarDatos() {
        loading  = true;
        errorMsg = '';
        try {
            const [launches, dietData] = await Promise.all([
                autoLoad(LAUNCHES_API, `${LAUNCHES_API}/loadInitialData`),
                autoLoad(DIET_API,     `${DIET_API}/loadinitialdata`)
            ]);

            totalLaunches = launches.length;
            totalDiet     = dietData.length;

            // Contar lanzamientos y éxitos por país
            const lanzamientosPorPais = {};
            const exitosPorPais       = {};
            launches.forEach(m => {
                if (!m.country) return;
                lanzamientosPorPais[m.country] = (lanzamientosPorPais[m.country] || 0) + 1;
                if (m.mission_status === 'Success') {
                    exitosPorPais[m.country] = (exitosPorPais[m.country] || 0) + 1;
                }
            });

            // Agrupar dieta por país (último año disponible)
            const dietaPorPais = {};
            dietData.forEach(d => {
                if (!d.country) return;
                if (!dietaPorPais[d.country] || d.year > dietaPorPais[d.country].year) {
                    dietaPorPais[d.country] = d;
                }
            });

            // Cruzar datos para el bubble chart
            const bubbleData = [];
            Object.entries(lanzamientosPorPais).forEach(([pais, numLaunches]) => {
                const dietKey   = COUNTRY_MAP[pais] ?? pais;
                const dietEntry = dietaPorPais[dietKey]
                    ?? Object.values(dietaPorPais).find(d =>
                        d.country?.toLowerCase().includes(dietKey.toLowerCase())
                    );

                if (!dietEntry || !dietEntry.cost_healthy_diet_ppp_usd) return;

                const exitos    = exitosPorPais[pais] || 0;
                const tasaExito = numLaunches > 0 ? (exitos / numLaunches) * 100 : 0;

                bubbleData.push({
                    x:       numLaunches,
                    y:       parseFloat(dietEntry.cost_healthy_diet_ppp_usd.toFixed(2)),
                    z:       parseFloat(tasaExito.toFixed(1)),
                    name:    pais,
                    region:  dietEntry.region ?? '—',
                    costYear: dietEntry.annual_cost_healthy_diet_usd?.toFixed(2) ?? '—',
                    category: dietEntry.cost_category ?? '—'
                });
            });

            cruzados = bubbleData.length;

            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'bubble',
                    plotBorderWidth: 1,
                    zoomType: 'xy',
                    backgroundColor: '#ffffff'
                },
                title: {
                    text: 'Lanzamientos espaciales vs Coste de dieta saludable por país',
                    style: { color: '#333', fontSize: '16px' }
                },
                subtitle: {
                    text: 'Eje X = nº lanzamientos · Eje Y = coste diario dieta (USD PPP) · Tamaño burbuja = tasa de éxito · Arrastra para hacer zoom',
                    style: { color: '#666' }
                },
                xAxis: {
                    title: { text: 'Número de lanzamientos espaciales', style: { color: '#555' } },
                    labels: { style: { color: '#555' } },
                    gridLineColor: '#eee'
                },
                yAxis: {
                    title: { text: 'Coste diario dieta saludable (USD PPP)', style: { color: '#555' } },
                    labels: {
                        format: '${value}',
                        style: { color: '#555' }
                    },
                    gridLineColor: '#eee'
                },
                tooltip: {
                    useHTML: true,
                    formatter: function () {
                        const p = this.point;
                        return `
                            <b>${p.name}</b><br>
                            Región: ${p.region}<br>
                             Lanzamientos: <b>${p.x}</b><br>
                             Coste/día: <b>$${p.y}</b> USD PPP<br>
                             Coste anual: <b>$${p.costYear}</b> USD<br>
                             Tasa de éxito: <b>${p.z}%</b><br>
                            Categoría: <b>${p.category}</b>
                        `;
                    }
                },
                plotOptions: {
                    bubble: {
                        minSize: 10,
                        maxSize: 60,
                        dataLabels: {
                            enabled: true,
                            format: '{point.name}',
                            style: {
                                fontSize: '10px',
                                fontWeight: 'normal',
                                color: '#333',
                                textOutline: 'none'
                            }
                        }
                    }
                },
                series: [{
                    name: 'Países',
                    colorByPoint: true,
                    data: bubbleData
                }],
                credits: {
                    text: 'space-launches API + cost-of-healthy-diet API (sos2526-18)'
                }
            });

        } catch (err) {
            errorMsg = `Error de conexión: ${err.message}`;
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<main>
    <h2>Integración Grupo SOS: Dieta Saludable × Lanzamientos Espaciales</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/integrations')}>Volver al Inicio</button>
    </div>

    <p>
        Visualización <strong>Bubble Chart</strong> que cruza los datos de lanzamientos espaciales
        con el coste de una dieta saludable por país.
        El <strong>tamaño</strong> de cada burbuja representa la tasa de éxito de los lanzamientos.
    </p>

    {#if !loading && !errorMsg}
        <div class="stats-box">
            <span> <strong>{totalLaunches.toLocaleString()}</strong> lanzamientos</span>
            <span> <strong>{totalDiet.toLocaleString()}</strong> registros de dieta</span>
            <span> <strong>{cruzados}</strong> países cruzados</span>
        </div>
    {/if}

    {#if loading}
        <div class="status">Cargando datos de ambas APIs...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'}">
        <div bind:this={chartContainer} id="container"></div>
    </figure>

    {#if !loading && !errorMsg}
        <p class="hint">
            Fuente lanzamientos: /api/v2/space-launches ·
            Fuente dieta: sos2526-18 /api/v1/cost-of-healthy-diet-by-countries
        </p>
    {/if}
</main>

<style>
    main { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #333; }
    h2 { margin-bottom: 10px; }

    .nav-buttons { margin-bottom: 20px; }
    .nav-buttons button { padding: 8px 12px; cursor: pointer; }

    .stats-box {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 12px 16px;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
        color: #555;
    }

    #container {
        width: 100%;
        height: 560px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        background: white;
    }

    .status {
        text-align: center;
        padding: 20px;
        background: #eee;
        border-radius: 8px;
        font-weight: bold;
        margin: 20px 0;
    }
    .error { color: red; background: #ffdada; border: 1px solid red; }
    .hint { font-size: 12px; color: #999; margin-top: 12px; text-align: center; }
</style>