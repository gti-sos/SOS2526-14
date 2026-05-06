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
        { key: 'hiv_aids',     label: 'VIH/SIDA' },
        { key: 'malaria',      label: 'Malaria' },
        { key: 'tuberculosis', label: 'Tuberculosis' },
        { key: 'cholera',      label: 'Cólera' },
        { key: 'rabies',       label: 'Rabia' },
        { key: 'polio',        label: 'Polio' },
    ];

    let selectedDisease = $state('malaria');

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
            // Sumamos todos los años de esa entidad/país
            pandemiasPorEntidad[d.entity] = (pandemiasPorEntidad[d.entity] || 0) + val;
        });

        const diseaseLabel = DISEASES.find(d => d.key === selectedDisease)?.label ?? selectedDisease;

        const treemapData = [];
        let matched = 0;
        const entidadesPandemia = Object.keys(pandemiasPorEntidad);

        Object.entries(lanzamientosPorPais)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 25)
            .forEach(([pais, launches]) => {
                
                // CRUCE PURO: Buscamos si el string coincide
                const entidadEncontrada = entidadesPandemia.find(e => 
                    e.toLowerCase().includes(pais.toLowerCase()) || 
                    pais.toLowerCase().includes(e.toLowerCase())
                );

                const pandemicVal = entidadEncontrada ? pandemiasPorEntidad[entidadEncontrada] : 0;
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
            chart: { type: 'treemap' },
            title: {
                text: 'Lanzamientos espaciales vs ' + diseaseLabel + ' por país'
            },
            subtitle: {
                text: `Tamaño = nº lanzamientos · Color = casos de ${diseaseLabel} · ${matched} países cruzados dinámicamente`
            },
            colorAxis: {
                minColor: '#ecf0f1',
                maxColor: '#c0392b',
                type: 'logarithmic'
            },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    const p = this.point;
                    const pandemicStr = p.pandemicVal > 0
                        ? `${diseaseLabel}: <b>${p.pandemicVal.toLocaleString()}</b> casos acumulados`
                        : `${diseaseLabel}: <b>sin datos exactos (0)</b>`;
                    return `<b>${p.name}</b><br>Lanzamientos: <b>${p.value}</b><br>${pandemicStr}`;
                }
            },
            series: [{
                type: 'treemap',
                layoutAlgorithm: 'squarified',
                data: treemapData,
                dataLabels: {
                    enabled: true,
                    style: { fontSize: '11px', fontWeight: 'bold', color: '#000000', textOutline: 'none' }
                },
                levels: [{ level: 1, borderColor: '#ffffff', borderWidth: 2 }]
            }],
            credits: { enabled: false }
        });
    }
</script>

<main>
    <h2>Integración Grupo SOS: Pandemias</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/integrations')}>Volver al Inicio</button>
    </div>

    <div class="controls">
        <label>Enfermedad a cruzar: 
            <select bind:value={selectedDisease} onchange={dibujarGrafico}>
                {#each DISEASES as d}
                    <option value={d.key}>{d.label}</option>
                {/each}
            </select>
        </label>
        {#if !loading && !errorMsg}
            <span class="stats-info">
                (Datos procesados: {totalLaunches} lanzamientos, {totalPandemics} registros epidémicos)
            </span>
        {/if}
    </div>

    <p>Visualización <strong>Treemap</strong>. El tamaño representa el volumen de lanzamientos, la intensidad del color representa los casos acumulados.</p>

    {#if loading}
        <div class="status">Cargando datos de ambas APIs...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'};">
        <div bind:this={chartContainer} id="container"></div>
    </figure>
</main>

<style>
    main { max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #333; }
    
    .nav-buttons { margin-bottom: 20px; }
    .nav-buttons button { padding: 8px 12px; cursor: pointer; }
    
    .controls { margin-bottom: 15px; padding: 12px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 6px; display: flex; align-items: center; flex-wrap: wrap; gap: 15px; }
    select { padding: 4px; }
    .stats-info { font-size: 12px; color: #666; }

    #container {
        width: 100%;
        height: 500px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        background: white;
    }

    .status { text-align: center; padding: 20px; background: #eee; border-radius: 8px; font-weight: bold; }
    .error { color: red; background: #ffdada; border: 1px solid red; }
</style>