<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';
    import Sankey from 'highcharts/modules/sankey';
    import DependencyWheel from 'highcharts/modules/dependency-wheel';

    const APIS = {
        meteoritos: '/api/v2/meteorite-landings?limit=0',
        misiones:   '/api/v2/space-launches?limit=0',
        satelites:  '/api/v1/active-satellites?limit=0'
    };

    const NODOS = {
        meteoritos: '☄️ Meteoritos',
        misiones:   '🚀 Misiones',
        satelites:  '🛰️ Satélites'
    };

    const TOP_N = 15;
    const SCALE = 1000;

    let chartContainer;
    let loading  = $state(true);
    let errorMsg = $state('');
    let stats    = $state({ meteoritos: 0, misiones: 0, satelites: 0 });

    const COSMIC_COLORS = [
        '#7DF9FF','#FF6BFF','#FFD700','#39FF14','#FF4500',
        '#00BFFF','#FF8C00','#DA70D6','#7FFF00','#FF1493',
        '#FF4500','#00BFFF','#FFD700'
    ];

    // Valores reales para el tooltip
    let rawValues = {};

    onMount(async () => {
        if (typeof Sankey === 'function') Sankey(Highcharts);
        if (typeof DependencyWheel === 'function') DependencyWheel(Highcharts);
        await cargarYDibujar();
    });

    async function cargarYDibujar() {
        loading  = true;
        errorMsg = '';
        rawValues = {};

        try {
            const [rMet, rMis, rSat] = await Promise.all([
                fetch(APIS.meteoritos),
                fetch(APIS.misiones),
                fetch(APIS.satelites)
            ]);
            if (!rMet.ok) throw new Error(`Meteoritos: ${rMet.status}`);
            if (!rMis.ok) throw new Error(`Misiones: ${rMis.status}`);
            if (!rSat.ok) throw new Error(`Satélites: ${rSat.status}`);

            const [meteoritos, misiones, satelites] = await Promise.all([
                rMet.json(), rMis.json(), rSat.json()
            ]);

            stats = {
                meteoritos: meteoritos.length,
                misiones:   misiones.length,
                satelites:  satelites.length
            };

            // ── Meteoritos: CONTAR todos (con o sin masa) ──────────────
            const countMeteorPorPais = {};
            const masaMeteorPorPais  = {};

            meteoritos.forEach(m => {
                if (!m.country || m.country.trim() === '') return;
                countMeteorPorPais[m.country] = (countMeteorPorPais[m.country] || 0) + 1;
                const masa = Number(m.mass);
                if (masa > 0) {
                    masaMeteorPorPais[m.country] = (masaMeteorPorPais[m.country] || 0) + masa;
                }
            });

            // ── Misiones: contar ────────────────────────────────────────
            const countMisionesPorPais = {};
            misiones.forEach(m => {
                if (!m.country || m.country.trim() === '') return;
                countMisionesPorPais[m.country] = (countMisionesPorPais[m.country] || 0) + 1;
            });

            // ── Satélites: sumar launch_mass ────────────────────────────
            const masaSatPorPais   = {};
            const countSatPorPais  = {};
            satelites.forEach(s => {
                if (!s.country || s.country.trim() === '') return;
                countSatPorPais[s.country] = (countSatPorPais[s.country] || 0) + 1;
                const masa = Number(s.launch_mass);
                if (masa > 0) {
                    masaSatPorPais[s.country] = (masaSatPorPais[s.country] || 0) + masa;
                }
            });

            // ── Top 10: ranking por conteo en cada categoría ────────────
            const maxMeteor = Math.max(...Object.values(countMeteorPorPais), 1);
            const maxMision = Math.max(...Object.values(countMisionesPorPais), 1);
            const maxSat    = Math.max(...Object.values(countSatPorPais), 1);

            const todosPaises = new Set([
                ...Object.keys(countMeteorPorPais),
                ...Object.keys(countMisionesPorPais),
                ...Object.keys(countSatPorPais)
            ]);

            const scorePorPais = {};
            todosPaises.forEach(pais => {
                scorePorPais[pais] =
                    (countMeteorPorPais[pais]   || 0) / maxMeteor +
                    (countMisionesPorPais[pais]  || 0) / maxMision +
                    (countSatPorPais[pais]       || 0) / maxSat;
            });

            const topPaises = Object.entries(scorePorPais)
                .sort((a, b) => b[1] - a[1])
                .slice(0, TOP_N)
                .map(([pais]) => pais);

            // ── Construir chartData ─────────────────────────────────────
            const chartData = [];

            topPaises.forEach(pais => {
                // Meteoritos → grosor = conteo, tooltip muestra masa si existe
                const cMet = countMeteorPorPais[pais];
                if (cMet) {
                    const norm = Math.max(1, Math.round((cMet / maxMeteor) * SCALE));
                    chartData.push([pais, NODOS.meteoritos, norm]);
                    const masaKg = masaMeteorPorPais[pais]
                        ? ` · ${(masaMeteorPorPais[pais] / 1000).toFixed(1)} kg registrados`
                        : ' · masa no registrada';
                    rawValues[`${pais}|||${NODOS.meteoritos}`] = `${cMet.toLocaleString()} caídos${masaKg}`;
                }

                // Misiones → grosor = conteo
                const cMis = countMisionesPorPais[pais];
                if (cMis) {
                    const norm = Math.max(1, Math.round((cMis / maxMision) * SCALE));
                    chartData.push([pais, NODOS.misiones, norm]);
                    rawValues[`${pais}|||${NODOS.misiones}`] = `${cMis.toLocaleString()} misiones`;
                }

                // Satélites → grosor = suma de masa (o conteo si no hay masa)
                const mSat = masaSatPorPais[pais];
                const cSat = countSatPorPais[pais];
                if (cSat) {
                    const base = mSat
                        ? Math.max(...Object.values(masaSatPorPais), 1)
                        : maxSat;
                    const val  = mSat || cSat;
                    const norm = Math.max(1, Math.round((val / base) * SCALE));
                    chartData.push([pais, NODOS.satelites, norm]);
                    rawValues[`${pais}|||${NODOS.satelites}`] = mSat
                        ? `${cSat} satélites · ${mSat.toFixed(0)} kg masa total`
                        : `${cSat} satélites`;
                }
            });

            if (chartData.length === 0) {
                errorMsg = 'Sin datos. Verifica que las 3 APIs tienen datos cargados.';
                return;
            }

            // ── Highcharts ──────────────────────────────────────────────
            Highcharts.setOptions({
                chart: { backgroundColor: '#050816' },
                title: { style: { color: '#E0E8FF' } }
            });

            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'dependencywheel',
                    backgroundColor: '#050816',
                    animation: { duration: 1400 }
                },
                title: {
                    text: '✦ Rueda Cósmica — Integración de APIs',
                    style: { color: '#C8D8FF', fontSize: '20px', fontWeight: '500' }
                },
                subtitle: {
                    text: `Top ${TOP_N} países · ${stats.meteoritos.toLocaleString()} meteoritos · ${stats.misiones.toLocaleString()} misiones · ${stats.satelites.toLocaleString()} satélites`,
                    style: { color: '#6678AA', fontSize: '13px' }
                },
                tooltip: {
                    backgroundColor: '#0D1630',
                    borderColor: '#2A3A6A',
                    borderRadius: 10,
                    style: { color: '#C8D8FF', fontSize: '13px' },
                    formatter: function () {
                        const p    = this.point;
                        const from = p.fromNode?.name ?? p.from ?? '';
                        const to   = p.toNode?.name   ?? p.to   ?? '';
                        const val  = rawValues[`${from}|||${to}`]
                                  || rawValues[`${to}|||${from}`];
                        if (val) return `<b>${from}</b> → <b>${to}</b><br>${val}`;
                        return `<b>${p.name || from}</b>`;
                    }
                },
                accessibility: {
                    point: {
                        valueDescriptionFormat: '{index}. {point.from} → {point.to}: {point.weight}.'
                    }
                },
                series: [{
                    keys: ['from', 'to', 'weight'],
                    data: chartData,
                    type: 'dependencywheel',
                    name: 'Relaciones',
                    size: '90%',
                    colors: COSMIC_COLORS,
                    borderWidth: 0,
                    nodePadding: 6,
                    nodeWidth: 18,
                    dataLabels: {
                        enabled: true,
                        color: '#A0B4EE',
                        style: {
                            fontSize: '11px',
                            fontWeight: '400',
                            textOutline: '2px #050816'
                        },
                        textPath: { enabled: true, attributes: { dy: 4 } },
                        distance: 8
                    },
                    linkOpacity: 0.3,
                    states: {
                        hover:    { linkOpacity: 0.85 },
                        inactive: { linkOpacity: 0.06 }
                    }
                }],
                credits: { enabled: false }
            });

        } catch (err) {
            errorMsg = `Error: ${err.message}`;
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<style>
    .cosmic-wrap {
        background: #050816;
        border-radius: 16px;
        padding: 24px 16px 16px;
        position: relative;
        overflow: hidden;
    }
    .cosmic-wrap::before, .cosmic-wrap::after {
        content: '';
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        opacity: 0.06;
    }
    .cosmic-wrap::before {
        width: 500px; height: 500px;
        background: radial-gradient(circle, #5566FF 0%, transparent 70%);
        top: -120px; left: -100px;
    }
    .cosmic-wrap::after {
        width: 400px; height: 400px;
        background: radial-gradient(circle, #FF44BB 0%, transparent 70%);
        bottom: -80px; right: -60px;
    }
    .top-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }
    .back-btn {
        background: #0D1630;
        border: 1px solid #2A3A6A;
        color: #7888BB;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        transition: border-color .2s, color .2s;
    }
    .back-btn:hover { border-color: #7DF9FF; color: #7DF9FF; }
    .badges { margin-left: auto; display: flex; gap: 8px; flex-wrap: wrap; }
    .badge {
        font-size: 12px;
        color: #4A5A8A;
        background: #0D1630;
        border: 1px solid #1A2A4A;
        padding: 4px 10px;
        border-radius: 20px;
    }
    .badge.met { border-color: #FF4500; color: #FF6030; }
    .badge.mis { border-color: #00BFFF; color: #30CFFF; }
    .badge.sat { border-color: #FFD700; color: #FFE040; }
    .chart-box { width: 100%; height: 580px; position: relative; z-index: 1; }
    .status { text-align: center; padding: 60px 0; color: #4A5A8A; font-size: 14px; }
    .status.error { color: #FF4500; }
    .legend {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin-top: 12px;
        font-size: 12px;
        color: #4A5A8A;
        flex-wrap: wrap;
    }
    .legend span { display: flex; align-items: center; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .hint { text-align: center; font-size: 11px; color: #2A3A6A; margin-top: 8px; }
</style>

<div class="cosmic-wrap">
    <div class="top-bar">
        <button class="back-btn" onclick={() => goto('/meteorite-landings')}>← Volver</button>
        {#if !loading && !errorMsg}
            <div class="badges">
                <span class="badge met">☄️ {stats.meteoritos.toLocaleString()} meteoritos</span>
                <span class="badge mis">🚀 {stats.misiones.toLocaleString()} misiones</span>
                <span class="badge sat">🛰️ {stats.satelites.toLocaleString()} satélites</span>
            </div>
        {/if}
    </div>

    {#if loading}
        <div class="status">⟳ Consultando las 3 APIs…</div>
    {:else if errorMsg}
        <div class="status error">⚠ {errorMsg}</div>
    {/if}

    <div
        bind:this={chartContainer}
        class="chart-box"
        style={loading || errorMsg ? 'display:none' : ''}
    ></div>

    {#if !loading && !errorMsg}
        <div class="legend">
            <span><i class="dot" style="background:#FF4500"></i>Grosor ☄️ = nº caídos (masa en tooltip)</span>
            <span><i class="dot" style="background:#00BFFF"></i>Grosor 🚀 = nº misiones</span>
            <span><i class="dot" style="background:#FFD700"></i>Grosor 🛰️ = masa de lanzamiento</span>
        </div>
        <p class="hint">Pasa el cursor sobre un nodo para ver los datos reales · Top {TOP_N} países por actividad combinada</p>
    {/if}
</div>