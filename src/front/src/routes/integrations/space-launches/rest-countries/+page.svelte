<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';

    const LAUNCHES_API  = '/api/v2/space-launches';
    const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,region,population,flags,cca2';

    let chartCanvas;
    let loading       = $state(true);
    let errorMsg      = $state('');
    let totalLaunches = $state(0);
    let chartInstance = null;
    let tablaData     = $state([]);

    const COUNTRY_MAP = {
        'USA': 'United States', 'Russia': 'Russia', 'Kazakhstan': 'Kazakhstan',
        'China': 'China', 'France': 'France', 'Japan': 'Japan', 'India': 'India',
        'Australia': 'Australia', 'Brazil': 'Brazil', 'Israel': 'Israel',
        'Iran': 'Iran', 'South Korea': 'South Korea', 'North Korea': 'North Korea',
        'New Zealand': 'New Zealand', 'Canada': 'Canada', 'Argentina': 'Argentina',
        'UK': 'United Kingdom', 'Germany': 'Germany', 'Italy': 'Italy',
        'Spain': 'Spain', 'Ukraine': 'Ukraine', 'Kenya': 'Kenya',
    };

    const REGION_COLORS = {
        'Americas': 'rgba(88,166,255,0.8)',
        'Europe':   'rgba(63,185,80,0.8)',
        'Asia':     'rgba(248,81,73,0.8)',
        'Africa':   'rgba(255,215,0,0.8)',
        'Oceania':  'rgba(188,140,255,0.8)',
        'Antarctic':'rgba(150,150,150,0.8)',
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

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src; s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    onMount(async () => {
        await loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        await cargarDatos();
    });

    async function cargarDatos() {
        loading  = true;
        errorMsg = '';

        // Variables locales para el gráfico
        let labels = [], values = [], colors = [];

        try {
            const [launches, countries] = await Promise.all([
                autoLoad(LAUNCHES_API, `${LAUNCHES_API}/loadInitialData`),
                fetch(COUNTRIES_API).then(r => r.json())
            ]);

            totalLaunches = launches.length;

            // Contar lanzamientos por país
            const porPais = {};
            launches.forEach(m => {
                if (!m.country) return;
                porPais[m.country] = (porPais[m.country] || 0) + 1;
            });

            // Índice de países por nombre
            const countryIndex = {};
            countries.forEach(c => {
                countryIndex[c.name.common] = c;
            });

            // Cruzar y agrupar por región
            const porRegion = {};
            const tabla = [];

            Object.entries(porPais)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)
                .forEach(([pais, count]) => {
                    const mapped  = COUNTRY_MAP[pais] ?? pais;
                    const country = countryIndex[mapped];
                    const region  = country?.region ?? 'Unknown';
                    const pop     = country?.population ?? null;
                    const flag    = country?.flags?.png ?? '';

                    porRegion[region] = (porRegion[region] || 0) + count;
                    tabla.push({ pais, count, region, pop, flag });
                });

            tablaData = tabla;

            labels = Object.keys(porRegion);
            values = Object.values(porRegion);
            colors = labels.map(l => REGION_COLORS[l] ?? 'rgba(150,150,150,0.8)');

        } catch (err) {
            errorMsg = `Error: ${err.message}`;
            console.error(err);
            loading = false;
            return;
        }

        // Primero ponemos loading=false para que Svelte renderice el canvas
        loading = false;

        // Esperamos a que Svelte actualice el DOM
        await tick();

        // Ahora sí creamos el gráfico
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

        chartInstance = new window.Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: '#0d1117',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#e6edf3', font: { size: 13 } } },
                    title: {
                        display: true,
                        text: '🌍 Distribución de lanzamientos por región (Top 15 países)',
                        color: '#e6edf3',
                        font: { size: 14 }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ${ctx.raw} lanzamientos`
                        }
                    }
                }
            }
        });
    }
</script>

<style>
    .wrap { background:#0d1117; min-height:100vh; padding:24px; font-family:sans-serif; color:#e6edf3; }
    h2 { color:#e6edf3; margin-bottom:4px; }
    p.sub { color:#8b949e; font-size:13px; margin-bottom:16px; }
    .back-btn { background:#21262d; border:1px solid #30363d; color:#8b949e; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:13px; margin-bottom:16px; display:inline-block; margin-right:8px; }
    .back-btn:hover { border-color:#58a6ff; color:#58a6ff; }
    .badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
    .badge { font-size:12px; background:#161b22; border:1px solid #30363d; padding:4px 10px; border-radius:20px; color:#8b949e; }
    .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }
    .chart-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px; }
    .tabla-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px; overflow-y:auto; max-height:500px; }
    .tabla-box h3 { color:#e6edf3; font-size:14px; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { color:#8b949e; padding:6px 8px; text-align:left; border-bottom:1px solid #30363d; }
    td { padding:6px 8px; border-bottom:1px solid #21262d; color:#e6edf3; }
    tr:hover td { background:#21262d; }
    .flag { width:24px; height:16px; object-fit:cover; border-radius:2px; }
    .status { text-align:center; padding:60px 0; color:#8b949e; }
    .status.error { color:#f85149; }
    .hint { font-size:12px; color:#30363d; margin-top:10px; text-align:center; }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>← Volver a integraciones</button>
    <button class="back-btn" onclick={() => goto('/')}>🏠 Portada</button>

    <h2>🚀 Space Launches × 🌍 REST Countries</h2>
    <p class="sub">
        Cruce entre los lanzamientos espaciales y los datos de cada país
        (región, población, bandera) obtenidos de <strong>REST Countries API</strong>.
    </p>

    {#if !loading && !errorMsg}
        <div class="badges">
            <span class="badge">🚀 {totalLaunches.toLocaleString()} lanzamientos totales</span>
            <span class="badge">🌍 Top 15 países mostrados</span>
        </div>
    {/if}

    {#if loading}
        <div class="status">⟳ Cargando lanzamientos y datos de países...</div>
    {:else if errorMsg}
        <div class="status error">❌ {errorMsg}</div>
    {:else}
        <div class="grid">
            <div class="chart-box">
                <canvas bind:this={chartCanvas}></canvas>
            </div>
            <div class="tabla-box">
                <h3>📋 Top 15 países — detalle</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Bandera</th>
                            <th>País</th>
                            <th>Región</th>
                            <th>Lanzamientos</th>
                            <th>Población</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each tablaData as r}
                            <tr>
                                <td>
                                    {#if r.flag}
                                        <img class="flag" src={r.flag} alt={r.pais} />
                                    {:else}
                                        —
                                    {/if}
                                </td>
                                <td><strong>{r.pais}</strong></td>
                                <td>{r.region}</td>
                                <td>{r.count}</td>
                                <td>{r.pop ? r.pop.toLocaleString() : '—'}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        <p class="hint">
            Fuente: restcountries.com · Lanzamientos: /api/v2/space-launches
        </p>
    {/if}
</div>