<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';
    import TreemapModule from 'highcharts/modules/treemap';

    const LAUNCHES_API  = '/api/v2/space-launches';
    const PANDEMICS_API = 'https://sos2526-10.onrender.com/api/v2/pandemics';

    let chartContainer;
    let loading          = $state(true);
    let errorMsg         = $state('');
    let totalLaunches    = $state(0);
    let totalPandemics   = $state(0);
    let matchedCountries = $state(0);

    const DISEASES = [
        { key: 'malaria',      label: 'Malaria' },
        { key: 'hiv_aids',     label: 'VIH/SIDA' },
        { key: 'tuberculosis', label: 'Tuberculosis' },
        { key: 'cholera',      label: 'Cólera' },
        { key: 'rabies',       label: 'Rabia' },
        { key: 'polio',        label: 'Polio' },
    ];

    let selectedDisease = $state('malaria');

    const COUNTRY_MAP = {
        'USA': 'United States', 'Russia': 'Russia', 'Kazakhstan': 'Kazakhstan',
        'China': 'China', 'France': 'France', 'Japan': 'Japan', 'India': 'India',
        'Australia': 'Australia', 'Brazil': 'Brazil', 'Israel': 'Israel',
        'Iran': 'Iran', 'South Korea': 'South Korea', 'North Korea': 'North Korea',
        'New Zealand': 'New Zealand', 'Canada': 'Canada', 'Argentina': 'Argentina',
        'UK': 'United Kingdom', 'Germany': 'Germany', 'Italy': 'Italy',
        'Spain': 'Spain', 'Ukraine': 'Ukraine', 'Kenya': 'Kenya',
    };

    let launchesData  = [];
    let pandemicsData = [];

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
        if (typeof TreemapModule === 'function') TreemapModule(Highcharts);
        await cargarDatos();
    });

    async function cargarDatos() {
        loading  = true;
        errorMsg = '';
        try {
            // Cargar ambas APIs con auto-cargado si están vacías
            [launchesData, pandemicsData] = await Promise.all([
                autoLoad(LAUNCHES_API,  `${LAUNCHES_API}/loadInitialData`),
                autoLoad(PANDEMICS_API, `${PANDEMICS_API}/loadinitialdata`)
            ]);

            totalLaunches  = launchesData.length;
            totalPandemics = pandemicsData.length;

            dibujarGrafico();
        } catch (err) {
            errorMsg = `Error de conexión: ${err.message}`;
            console.error(err);
        } finally {
            loading = false;
        }
    }

    function dibujarGrafico() {
        const lanzamientosPorPais = {};
        launchesData.forEach(m => {
            if (!m.country) return;
            lanzamientosPorPais[m.country] = (lanzamientosPorPais[m.country] || 0) + 1;
        });

        const pandemiasPorEntidad = {};
        pandemicsData.forEach(d => {
            if (!d.entity || !d[selectedDisease]) return;
            const val = Number(d[selectedDisease]);
            if (val <= 0) return;
            pandemiasPorEntidad[d.entity] = (pandemiasPorEntidad[d.entity] || 0) + val;
        });

        const diseaseLabel = DISEASES.find(d => d.key === selectedDisease)?.label ?? selectedDisease;

        const treemapData = [];
        let matched = 0;

        Object.entries(lanzamientosPorPais)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 25)
            .forEach(([pais, launches]) => {
                const pandemicKey = COUNTRY_MAP[pais] ?? pais;
                const pandemicVal = pandemiasPorEntidad[pandemicKey] ?? 0;
                if (pandemicVal > 0) matched++;
                treemapData.push({
                    name:        pais,
                    value:       launches,
                    pandemicVal: Math.round(pandemicVal),
                    colorValue:  pandemicVal
                });
            });

        matchedCountries = matched;

        Highcharts.chart(chartContainer, {
            chart: { type: 'treemap', backgroundColor: '#0d1117' },
            title: {
                text: '🚀 Lanzamientos espaciales vs 🦠 ' + diseaseLabel + ' por país',
                style: { color: '#e6edf3' }
            },
            subtitle: {
                text: `Tamaño = nº lanzamientos · Color = casos de ${diseaseLabel} · ${matched} países cruzados`,
                style: { color: '#8b949e' }
            },
            colorAxis: {
                minColor: '#1a3a5c',
                maxColor: '#f85149',
                type: 'logarithmic'
            },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    const p = this.point;
                    const pandemicStr = p.pandemicVal > 0
                        ? `🦠 ${diseaseLabel}: <b>${p.pandemicVal.toLocaleString()}</b> casos acumulados`
                        : `🦠 ${diseaseLabel}: <b>sin datos</b>`;
                    return `<b>🌍 ${p.name}</b><br>🚀 Lanzamientos: <b>${p.value}</b><br>${pandemicStr}`;
                },
                backgroundColor: '#161b22',
                borderColor: '#30363d',
                style: { color: '#e6edf3' }
            },
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                data: treemapData,
                dataLabels: {
                    enabled: true,
                    style: { fontSize: '11px', fontWeight: 'bold', color: '#ffffff', textOutline: '2px #0d1117' }
                },
                levels: [{ level: 1, borderColor: '#0d1117', borderWidth: 2 }]
            }],
            credits: { enabled: false }
        });
    }
</script>

<style>
    .wrap { background:#0d1117; min-height:100vh; padding:24px; font-family:sans-serif; color:#e6edf3; }
    h2 { color:#e6edf3; margin-bottom:8px; }
    .back-btn { background:#21262d; border:1px solid #30363d; color:#8b949e; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:13px; margin-bottom:16px; display:inline-block; margin-right:8px; }
    .back-btn:hover { border-color:#58a6ff; color:#58a6ff; }
    .controls { display:flex; align-items:center; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
    label { color:#8b949e; font-size:14px; }
    select { background:#21262d; border:1px solid #30363d; color:#e6edf3; padding:6px 10px; border-radius:6px; font-size:14px; }
    .badges { display:flex; gap:8px; flex-wrap:wrap; margin-left:auto; }
    .badge { font-size:12px; background:#161b22; border:1px solid #30363d; padding:4px 10px; border-radius:20px; color:#8b949e; }
    .status { text-align:center; padding:60px 0; color:#8b949e; }
    .status.error { color:#f85149; }
    .chart-box { width:100%; height:540px; }
    .hint { font-size:12px; color:#30363d; margin-top:10px; text-align:center; }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>← Volver a integraciones</button>
    <button class="back-btn" onclick={() => goto('/')}>🏠 Portada</button>

    <h2>🚀 Space Launches × 🦠 Pandemias</h2>

    <div class="controls">
        <label for="disease">Enfermedad en tooltip:
            <select id="disease" bind:value={selectedDisease} onchange={dibujarGrafico}>
                {#each DISEASES as d}
                    <option value={d.key}>{d.label}</option>
                {/each}
            </select>
        </label>
        {#if !loading && !errorMsg}
            <div class="badges">
                <span class="badge">🚀 {totalLaunches.toLocaleString()} lanzamientos</span>
                <span class="badge">🦠 {totalPandemics.toLocaleString()} registros pandemia</span>
                <span class="badge">🌍 {matchedCountries} países cruzados</span>
            </div>
        {/if}
    </div>

    {#if loading}
        <div class="status">⟳ Cargando datos de ambas APIs...</div>
    {:else if errorMsg}
        <div class="status error">❌ {errorMsg}</div>
    {/if}

    <div bind:this={chartContainer} class="chart-box" style={loading || errorMsg ? 'display:none' : ''}></div>

    {#if !loading && !errorMsg}
        <p class="hint">Tamaño = nº lanzamientos · Color = casos acumulados de la enfermedad · Top 25 países</p>
    {/if}
</div>