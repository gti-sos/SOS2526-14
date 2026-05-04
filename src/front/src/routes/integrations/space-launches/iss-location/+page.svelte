<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const LAUNCHES_API = '/api/v2/space-launches';
    const ISS_PROXY = '/api/v2/space-launches/proxy/iss-location';
    
    let loading       = $state(true);
    let errorMsg      = $state('');
    let issData       = $state(null);
    let ultimosLanzamientos = $state([]);
    let totalLaunches = $state(0);
    let lastUpdate    = $state('');

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

    async function cargarISS() {
        const res  = await fetch(ISS_PROXY);
        if (!res.ok) throw new Error(`Proxy ISS: ${res.status}`);
        return await res.json();
    }

    onMount(async () => {
        await cargarDatos();
        // Actualizar la posición de la ISS cada 5 segundos
        const intervalo = setInterval(actualizarISS, 5000);
        return () => clearInterval(intervalo);
    });

    async function cargarDatos() {
        loading  = true;
        errorMsg = '';
        try {
            const [launches, iss] = await Promise.all([
                autoLoad(LAUNCHES_API, `${LAUNCHES_API}/loadInitialData`),
                cargarISS()
            ]);

            totalLaunches = launches.length;

            // Últimos 10 lanzamientos (los más recientes por año)
            ultimosLanzamientos = [...launches]
                .filter(m => m.year)
                .sort((a, b) => b.year - a.year)
                .slice(0, 10);

            issData    = iss;
            lastUpdate = new Date().toLocaleTimeString('es-ES');

        } catch (err) {
            errorMsg = `Error: ${err.message}`;
            console.error(err);
        } finally {
            loading = false;
        }
    }

    async function actualizarISS() {
        try {
            const iss  = await cargarISS();
            issData    = iss;
            lastUpdate = new Date().toLocaleTimeString('es-ES');
        } catch (err) {
            console.error('Error actualizando ISS:', err);
        }
    }

    function formatCoord(val) {
        return Number(val).toFixed(4);
    }
</script>

<style>
    .wrap { background:#0d1117; min-height:100vh; padding:24px; font-family:sans-serif; color:#e6edf3; }
    h2 { color:#e6edf3; margin-bottom:4px; }
    p.sub { color:#8b949e; font-size:13px; margin-bottom:16px; }
    .back-btn { background:#21262d; border:1px solid #30363d; color:#8b949e; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:13px; margin-bottom:16px; display:inline-block; margin-right:8px; }
    .back-btn:hover { border-color:#58a6ff; color:#58a6ff; }

    .grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; align-items:start; }

    .iss-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:20px; }
    .iss-box h3 { color:#e6edf3; font-size:15px; margin-bottom:12px; }
    .iss-coord { font-size:28px; font-weight:bold; color:#58a6ff; margin:8px 0; }
    .iss-detail { color:#8b949e; font-size:13px; margin-top:6px; }
    .pulse { display:inline-block; width:10px; height:10px; background:#39FF14; border-radius:50%; margin-right:6px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{ opacity:1; } 50%{ opacity:0.3; } }
    .update { font-size:12px; color:#30363d; margin-top:10px; }

    .tabla-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px; }
    .tabla-box h3 { color:#e6edf3; font-size:14px; margin-bottom:10px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    th { color:#8b949e; padding:8px 10px; text-align:left; border-bottom:1px solid #30363d; }
    td { padding:8px 10px; border-bottom:1px solid #21262d; color:#e6edf3; }
    tr:hover td { background:#21262d; }

    .badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
    .badge { font-size:12px; background:#161b22; border:1px solid #30363d; padding:4px 10px; border-radius:20px; color:#8b949e; }
    .status-ok { color:#39FF14; font-weight:bold; }
    .status { text-align:center; padding:60px 0; color:#8b949e; }
    .status.error { color:#f85149; }
    .hint { font-size:12px; color:#30363d; margin-top:16px; text-align:center; }
    .proxy-note { background:#161b22; border:1px solid #30363d; border-radius:6px; padding:10px 14px; font-size:12px; color:#8b949e; margin-bottom:16px; }
    .proxy-note strong { color:#e6edf3; }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>← Volver a integraciones</button>
    <button class="back-btn" onclick={() => goto('/')}>🏠 Portada</button>

    <h2>🚀 Space Launches × 🛸 Posición en Tiempo Real de la ISS</h2>
    <p class="sub">
        Posición actual de la Estación Espacial Internacional obtenida mediante un
        <strong>proxy propio</strong> en nuestro backend Express,
        junto con los lanzamientos más recientes de nuestra API.
    </p>

    <div class="proxy-note">
        🔀 <strong>Proxy:</strong> El frontend llama a <code>/api/proxy/iss-location</code> (nuestro Express),
        que a su vez consulta <code>api.open-notify.org/iss-now.json</code> — evitando problemas de CORS.
    </div>

    {#if !loading && !errorMsg}
        <div class="badges">
            <span class="badge">🚀 {totalLaunches.toLocaleString()} lanzamientos históricos</span>
            <span class="badge"><span class="pulse"></span>ISS actualizándose cada 5s</span>
        </div>
    {/if}

    {#if loading}
        <div class="status">⟳ Conectando con proxy ISS y cargando lanzamientos...</div>
    {:else if errorMsg}
        <div class="status error">❌ {errorMsg}</div>
    {:else}
        <div class="grid">
            <!-- Panel ISS -->
            <div class="iss-box">
                <h3>🛸 Posición actual de la ISS</h3>
                {#if issData}
                    <div class="iss-coord">
                        📍 {formatCoord(issData.iss_position?.latitude)}°,
                           {formatCoord(issData.iss_position?.longitude)}°
                    </div>
                    <div class="iss-detail">Latitud: <strong>{formatCoord(issData.iss_position?.latitude)}°</strong></div>
                    <div class="iss-detail">Longitud: <strong>{formatCoord(issData.iss_position?.longitude)}°</strong></div>
                    <div class="iss-detail">
                        Timestamp: <strong>{new Date(issData.timestamp * 1000).toLocaleString('es-ES')}</strong>
                    </div>
                    <div class="iss-detail">
                        Estado: <span class="status-ok">● En órbita</span>
                    </div>
                    <div class="update">Última actualización: {lastUpdate}</div>
                {/if}

                <br>
                <p style="color:#8b949e; font-size:13px;">
                    La ISS orbita la Tierra a ~400 km de altitud, completando una vuelta
                    cada 90 minutos a ~27.600 km/h. Su posición cambia constantemente —
                    refresca cada 5 segundos para ver el movimiento.
                </p>
            </div>

            <!-- Tabla últimos lanzamientos -->
            <div class="tabla-box">
                <h3>🚀 Últimos 10 lanzamientos registrados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Empresa</th>
                            <th>Cohete</th>
                            <th>País</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each ultimosLanzamientos as m}
                            <tr>
                                <td>{m.year}</td>
                                <td>{m.company_name}</td>
                                <td>{m.rocket_name}</td>
                                <td>{m.country}</td>
                                <td style="color: {m.mission_status === 'Success' ? '#39FF14' : '#f85149'}">
                                    {m.mission_status}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <p class="hint">
            ISS: Open Notify API (vía proxy /api/proxy/iss-location) ·
            Lanzamientos: /api/v2/space-launches
        </p>
    {/if}
</div>