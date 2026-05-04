<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';

    const LAUNCHES_API = '/api/v2/space-launches';
    const NASA_API     = 'https://api.nasa.gov/neo/rest/v1/feed';
    const NASA_KEY     = 'DEMO_KEY';

    let chartCanvas;
    let loading        = $state(true);
    let errorMsg       = $state('');
    let totalLaunches  = $state(0);
    let totalAsteroids = $state(0);
    let chartInstance  = null;
    let topPaises      = $state([]);

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

        // Variables locales para construir el gráfico
        let dias = [], totalPorDia = [], peligrososPorDia = [], start = '', end = '';

        try {
            const hoy = new Date();
            start = hoy.toISOString().split('T')[0];
            end   = new Date(hoy.getTime() + 6 * 86400000).toISOString().split('T')[0];

            const [launches, nasaRes] = await Promise.all([
                autoLoad(LAUNCHES_API, `${LAUNCHES_API}/loadInitialData`),
                fetch(`${NASA_API}?start_date=${start}&end_date=${end}&api_key=${NASA_KEY}`)
            ]);

            if (!nasaRes.ok) throw new Error(`NASA API: ${nasaRes.status}`);
            const nasaData = await nasaRes.json();

            totalLaunches = launches.length;

            // Top 8 países
            const porPais = {};
            launches.forEach(m => {
                if (!m.country) return;
                porPais[m.country] = (porPais[m.country] || 0) + 1;
            });
            topPaises = Object.entries(porPais)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([p, c]) => ({ pais: p, count: c }));

            // Procesar asteroides
            const asteroidsByDay = nasaData.near_earth_objects;
            dias             = Object.keys(asteroidsByDay).sort();
            totalPorDia      = dias.map(d => asteroidsByDay[d].length);
            peligrososPorDia = dias.map(d =>
                asteroidsByDay[d].filter(a => a.is_potentially_hazardous_asteroid).length
            );
            totalAsteroids = totalPorDia.reduce((a, b) => a + b, 0);

        } catch (err) {
            errorMsg = `Error: ${err.message}`;
            console.error(err);
            loading = false;
            return;
        }

        // Ponemos loading=false ANTES de crear el gráfico
        // para que Svelte renderice el canvas en el DOM
        loading = false;

        // Esperamos a que Svelte actualice el DOM
        await tick();

        // Ahora sí creamos el gráfico
        if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

        chartInstance = new window.Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: dias,
                datasets: [
                    {
                        label: 'Asteroides cercanos',
                        data: totalPorDia,
                        backgroundColor: 'rgba(88, 166, 255, 0.7)',
                        borderColor: '#58a6ff',
                        borderWidth: 1
                    },
                    {
                        label: 'Potencialmente peligrosos',
                        data: peligrososPorDia,
                        backgroundColor: 'rgba(248, 81, 73, 0.7)',
                        borderColor: '#f85149',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { labels: { color: '#e6edf3' } },
                    title: {
                        display: true,
                        text: `☄️ Asteroides cercanos a la Tierra esta semana`,
                        color: '#e6edf3',
                        font: { size: 14 }
                    },
                    tooltip: {
                        callbacks: {
                            afterBody: () => [
                                '',
                                `🚀 Contexto: ${totalLaunches.toLocaleString()} lanzamientos históricos en nuestra API`
                            ]
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#8b949e' }, grid: { color: '#21262d' } },
                    y: {
                        ticks: { color: '#8b949e', stepSize: 1 },
                        grid: { color: '#21262d' },
                        title: { display: true, text: 'Nº de asteroides', color: '#8b949e' }
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
    .grid { display:grid; grid-template-columns:2fr 1fr; gap:20px; align-items:start; }
    .chart-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px; }
    .tabla-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px; }
    .tabla-box h3 { color:#e6edf3; font-size:14px; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { color:#8b949e; padding:6px 8px; text-align:left; border-bottom:1px solid #30363d; }
    td { padding:6px 8px; border-bottom:1px solid #21262d; color:#e6edf3; }
    tr:hover td { background:#21262d; }
    .status { text-align:center; padding:60px 0; color:#8b949e; }
    .status.error { color:#f85149; }
    .hint { font-size:12px; color:#30363d; margin-top:10px; text-align:center; }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>← Volver a integraciones</button>
    <button class="back-btn" onclick={() => goto('/')}>🏠 Portada</button>

    <h2>🚀 Space Launches × ☄️ Asteroides NASA</h2>
    <p class="sub">
        Asteroides cercanos a la Tierra esta semana según la <strong>NASA NeoWs API</strong>,
        en contexto con los lanzamientos históricos de nuestra API.
    </p>

    {#if !loading && !errorMsg}
        <div class="badges">
            <span class="badge">🚀 {totalLaunches.toLocaleString()} lanzamientos históricos</span>
            <span class="badge">☄️ {totalAsteroids} asteroides esta semana</span>
            <span class="badge">🔑 NASA DEMO_KEY · sin registro necesario</span>
        </div>
    {/if}

    {#if loading}
        <div class="status">⟳ Consultando NASA y cargando lanzamientos...</div>
    {:else if errorMsg}
        <div class="status error">❌ {errorMsg}</div>
    {:else}
        <div class="grid">
            <div class="chart-box">
                <canvas bind:this={chartCanvas}></canvas>
            </div>
            <div class="tabla-box">
                <h3>🏆 Top 8 países con más lanzamientos</h3>
                <table>
                    <thead>
                        <tr><th>País</th><th>Lanzamientos</th></tr>
                    </thead>
                    <tbody>
                        {#each topPaises as p}
                            <tr>
                                <td><strong>{p.pais}</strong></td>
                                <td>{p.count}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        <p class="hint">
            Fuente: NASA NeoWs API (api.nasa.gov) · Lanzamientos: /api/v2/space-launches
        </p>
    {/if}
</div>