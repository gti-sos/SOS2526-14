<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API = '/api/v2/space-launches';

    let mapContainer;
    let loading  = $state(true);
    let errorMsg = $state('');
    let totalCount = $state(0);

    const COUNTRY_COORDS = {
        'USA': [37.09, -95.71],
        'Russia': [61.52, 105.31],
        'Kazakhstan': [48.02, 66.92],
        'China': [35.86, 104.19],
        'France': [46.23, 2.21],
        'Japan': [36.20, 138.25],
        'India': [20.59, 78.96],
        'Australia': [-25.27, 133.77],
        'Kenya': [-0.02, 37.90],
        'Brazil': [-14.24, -51.93],
        'Italy': [41.87, 12.56],
        'UK': [55.37, -3.43],
        'Germany': [51.16, 10.45],
        'Israel': [31.04, 34.85],
        'Iran': [32.42, 53.68],
        'South Korea': [35.90, 127.76],
        'North Korea': [40.33, 127.51],
        'New Zealand': [-40.90, 174.88],
        'Canada': [56.13, -106.34],
        'Argentina': [-38.41, -63.61],
        'Algeria': [28.03, 1.65],
        'Spain': [40.46, -3.74],
        'Ukraine': [48.38, 31.16],
        'Pakistan': [30.37, 69.34],
        'Mexico': [23.63, -102.55],
        'Sweden': [60.12, 18.64],
    };

    onMount(async () => {
        const L = await import('https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js');

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        try {
            const res = await fetch(`${API}?limit=0`);
            if (!res.ok) {
                errorMsg = `Error al cargar datos: ${res.status}`;
                loading = false;
                return;
            }

            const datos = await res.json();

            const countPorPais = {};
            const exitosPorPais = {};

            datos.forEach(m => {
                if (!m.country || m.country.trim() === '') return;
                countPorPais[m.country] = (countPorPais[m.country] || 0) + 1;
                if (m.mission_status === 'Success') {
                    exitosPorPais[m.country] = (exitosPorPais[m.country] || 0) + 1;
                }
            });

            totalCount = datos.length;
            const maxCount = Math.max(...Object.values(countPorPais));
            loading = false;

            await new Promise(r => setTimeout(r, 50));

            const map = L.map(mapContainer, {
                center: [30, 10],
                zoom: 2,
                minZoom: 1,
                maxZoom: 6,
                worldCopyJump: true
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap · © CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            Object.entries(countPorPais).forEach(([pais, count]) => {
                const coords = COUNTRY_COORDS[pais];
                if (!coords) return;

                const exitos = exitosPorPais[pais] || 0;
                const tasaExito = count > 0 ? ((exitos / count) * 100).toFixed(1) : 0;
                const radio = 8 + (count / maxCount) * 47;

                const color = tasaExito >= 90 ? '#2ecc71'
                            : tasaExito >= 70 ? '#f1c40f'
                            : '#e74c3c';

                const circle = L.circleMarker(coords, {
                    radius: radio,
                    fillColor: color,
                    color: '#333',
                    weight: 1,
                    opacity: 0.8,
                    fillOpacity: 0.6
                }).addTo(map);

                circle.bindPopup(`
                    <div style="font-family:sans-serif; min-width:160px;">
                        <b style="font-size:15px;">🌍 ${pais}</b><br>
                        <hr style="margin:6px 0;">
                        🚀 <b>${count.toLocaleString()}</b> lanzamientos<br>
                        ✅ <b>${exitos.toLocaleString()}</b> exitosos<br>
                        📊 Tasa de éxito: <b>${tasaExito}%</b>
                    </div>
                `);

                circle.bindTooltip(`${pais}: ${count} lanzamientos`, {
                    direction: 'top'
                });
            });

        } catch (err) {
            errorMsg = 'Error de conexión con la API.';
            console.error(err);
            loading = false;
        }
    });
</script>

<style>
    .wrap {
        background: #ffffff;
        min-height: 100vh;
        padding: 20px;
        font-family: sans-serif;
        color: #111827;
    }

    h2 {
        color: #111827;
        margin-bottom: 4px;
    }

    .subtitle {
        color: #4b5563;
        font-size: 13px;
        margin-bottom: 16px;
    }

    .back-btn {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        color: #374151;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        margin-bottom: 16px;
        display: inline-block;
    }

    .back-btn:hover {
        border-color: #3b82f6;
        color: #3b82f6;
    }

    .map-box {
        width: 100%;
        height: 560px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
    }

    .status {
        text-align: center;
        padding: 60px 0;
        color: #6b7280;
    }

    .status.error {
        color: #ef4444;
    }

    .legend {
        display: flex;
        gap: 20px;
        margin-top: 12px;
        font-size: 13px;
        color: #4b5563;
        flex-wrap: wrap;
        align-items: center;
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
    }

    .hint {
        font-size: 12px;
        color: #9ca3af;
        margin-top: 10px;
        text-align: center;
    }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/analytics/space-launches')}>
        ← Volver a la gráfica
    </button>

    <h2>🗺️ Mapa de Lanzamientos Espaciales</h2>

    <p class="subtitle">
        {#if !loading && !errorMsg}
            {totalCount.toLocaleString()} lanzamientos distribuidos por país · haz clic en una burbuja para ver el detalle
        {:else}
            Distribución geoespacial de lanzamientos por país
        {/if}
    </p>

    {#if loading}
        <div class="status">⟳ Cargando datos y mapa...</div>
    {:else if errorMsg}
        <div class="status error">❌ {errorMsg}</div>
    {/if}

    <div
        bind:this={mapContainer}
        class="map-box"
        style={loading || errorMsg ? 'display:none' : ''}
    ></div>

    {#if !loading && !errorMsg}
        <div class="legend">
            <span>Tamaño de burbuja = nº de lanzamientos</span>
            <span class="legend-item"><span class="dot" style="background:#2ecc71"></span> ≥ 90%</span>
            <span class="legend-item"><span class="dot" style="background:#f1c40f"></span> 70–89%</span>
            <span class="legend-item"><span class="dot" style="background:#e74c3c"></span> &lt; 70%</span>
        </div>

        <p class="hint">
            Fuente: /api/v2/space-launches · Mapa base: Carto Light · Leaflet
        </p>
    {/if}
</div>