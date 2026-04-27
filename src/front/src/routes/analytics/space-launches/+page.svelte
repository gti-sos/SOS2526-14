<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';

    const API = '/api/v2/space-launches';

    let chartContainer;
    let loading  = $state(true);
    let errorMsg = $state('');
    let totalCount = $state(0);

    // Cuántos países mostrar (los más activos)
    const TOP_N = 10;

    onMount(async () => {
        await cargarYDibujar();
    });

    async function cargarYDibujar() {
        loading  = true;
        errorMsg = '';

        try {
            const res = await fetch(`${API}?limit=0`);
            if (!res.ok) {
                errorMsg = `Error al cargar datos: ${res.status}`;
                return;
            }

            const datos = await res.json();

            // Filtramos registros con año y país válidos
            const datosValidos = datos.filter(m =>
                m.year &&
                !isNaN(Number(m.year)) &&
                Number(m.year) >= 1957 &&
                Number(m.year) <= new Date().getFullYear() &&
                m.country &&
                m.country.trim() !== ''
            );

            totalCount = datosValidos.length;

            if (totalCount === 0) {
                errorMsg = 'No hay datos válidos. Carga los datos iniciales primero.';
                return;
            }

            // ── Contar lanzamientos por país para elegir el Top N ──────
            const totalPorPais = {};
            datosValidos.forEach(m => {
                totalPorPais[m.country] = (totalPorPais[m.country] || 0) + 1;
            });

            const topPaises = Object.entries(totalPorPais)
                .sort((a, b) => b[1] - a[1])
                .slice(0, TOP_N)
                .map(([pais]) => pais);

            // ── Recopilar todos los años únicos ordenados ─────────────
            const todosAnios = [...new Set(
                datosValidos
                    .filter(m => topPaises.includes(m.country))
                    .map(m => Number(m.year))
            )].sort((a, b) => a - b);

            // ── Construir una serie por país ──────────────────────────
            const series = topPaises.map(pais => {
                // Para cada año, contar cuántos lanzamientos hubo en ese país
                const lanzamientosPorAnio = {};
                datosValidos
                    .filter(m => m.country === pais)
                    .forEach(m => {
                        const anio = Number(m.year);
                        lanzamientosPorAnio[anio] = (lanzamientosPorAnio[anio] || 0) + 1;
                    });

                // Rellenar todos los años (0 si no hubo lanzamientos ese año)
                const data = todosAnios.map(anio => lanzamientosPorAnio[anio] || 0);

                return { name: pais, data };
            });

            // ── Dibujar con Highcharts ────────────────────────────────
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'area',
                    backgroundColor: '#0d1117'
                },
                title: {
                    text: '🚀 Lanzamientos Espaciales por País y Año',
                    style: { color: '#e6edf3' }
                },
                subtitle: {
                    text: `Top ${TOP_N} países · ${totalCount.toLocaleString()} lanzamientos totales`,
                    style: { color: '#8b949e' }
                },
                xAxis: {
                    categories: todosAnios.map(String),
                    tickInterval: 5,
                    labels: {
                        style: { color: '#8b949e' },
                        rotation: -45
                    },
                    lineColor: '#30363d',
                    title: {
                        text: 'Año',
                        style: { color: '#8b949e' }
                    }
                },
                yAxis: {
                    title: {
                        text: 'Número de lanzamientos',
                        style: { color: '#8b949e' }
                    },
                    labels: {
                        format: '{value}%',
                        style: { color: '#8b949e' }
                    },
                    gridLineColor: '#21262d'
                },
                tooltip: {
                    pointFormat: '<span style="color:{series.color}">{series.name}</span>' +
                        ': <b>{point.percentage:.1f}%</b> ({point.y} lanzamientos)<br/>',
                    split: true,
                    backgroundColor: '#161b22',
                    borderColor: '#30363d',
                    style: { color: '#e6edf3' }
                },
                plotOptions: {
                    area: {
                        stacking: 'percent',
                        marker: { enabled: false },
                        lineWidth: 1
                    },
                    series: {
                        label: {
                            style: { opacity: 0.5 }
                        }
                    }
                },
                legend: {
                    itemStyle: { color: '#8b949e' },
                    itemHoverStyle: { color: '#e6edf3' }
                },
                series: series,
                credits: { enabled: false }
            });

        } catch (err) {
            errorMsg = 'Error de conexión con la API.';
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<style>
    .wrap {
        background: #0d1117;
        min-height: 100vh;
        padding: 24px;
        font-family: sans-serif;
        color: #e6edf3;
    }
    h2 {
        color: #e6edf3;
        margin-bottom: 16px;
    }
    .back-btn {
        background: #21262d;
        border: 1px solid #30363d;
        color: #8b949e;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        margin-bottom: 20px;
        display: inline-block;
    }
    .back-btn:hover {
        border-color: #58a6ff;
        color: #58a6ff;
    }
    .status {
        text-align: center;
        padding: 60px 0;
        color: #8b949e;
    }
    .status.error { color: #f85149; }
    .chart-box {
        width: 100%;
        height: 540px;
    }
    .hint {
        text-align: center;
        font-size: 12px;
        color: #30363d;
        margin-top: 8px;
    }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/space-launches')}>← Volver al listado</button>

    <h2>📊 Visualización — Space Launches</h2>

    {#if loading}
        <div class="status">⟳ Cargando datos...</div>
    {:else if errorMsg}
        <div class="status error">❌ {errorMsg}</div>
    {/if}

    <div
        bind:this={chartContainer}
        class="chart-box"
        style={loading || errorMsg ? 'display:none' : ''}
    ></div>

    {#if !loading && !errorMsg}
        <p class="hint">
            Cada franja representa el % de lanzamientos de ese país respecto al total mundial ese año.
            Pasa el cursor sobre el gráfico para ver el desglose exacto.
        </p>
    {/if}
</div>