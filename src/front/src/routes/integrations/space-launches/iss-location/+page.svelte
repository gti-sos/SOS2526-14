<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const LAUNCHES_API = '/api/v2/space-launches';
    const ISS_PROXY = '/api/v2/space-launches/proxy/iss-location';
    const COUNTRIES_API = 'https://restcountries.com/v3.1/all?fields=name,latlng';
    
    let loading = $state(true);
    let errorMsg = $state('');
    let tablaMezclada = $state([]);
    let intervalo;

    // Fórmula matemática para cruzar coordenadas (Haversine)
    function calcularDistancia(lat1, lon1, lat2, lon2) {
        if(!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
        return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))));
    }

    async function autoLoad(url) {
        let res = await fetch(`${url}?limit=0`);
        let data = await res.json();
        if (data.length === 0) { 
            await fetch(`${url}/loadInitialData`); 
            res = await fetch(`${url}?limit=0`); 
            data = await res.json(); 
        }
        return data;
    }

    async function cargarSuperMashup() {
        try {
            // Hacemos el fetch a las 3 APIs a la vez
            const [launches, issRes, countriesRes] = await Promise.all([
                autoLoad(LAUNCHES_API),
                fetch(ISS_PROXY),
                fetch(COUNTRIES_API)
            ]);

            if (!issRes.ok) throw new Error('Error en el Proxy de la ISS');
            const issData = await issRes.json();
            const countries = await countriesRes.json();

            const issLat = parseFloat(issData.iss_position.latitude);
            const issLon = parseFloat(issData.iss_position.longitude);

            // MEZCLA DE DATOS
            const cruce = [];
            
            // Cogemos los últimos 10 lanzamientos para no saturar la tabla
            const top10 = launches.slice(0, 10);

            top10.forEach(l => {
                let latPais = null;
                let lonPais = null;
                
                // 1. Buscamos dinámicamente las coordenadas del país de tu API en REST Countries
                const paisEncontrado = countries.find(c => {
                    const nameExt = c.name.common.toLowerCase();
                    const nameInt = (l.country || '').toLowerCase();
                    return nameExt.includes(nameInt) || nameInt.includes(nameExt);
                });

                if (paisEncontrado && paisEncontrado.latlng) {
                    latPais = paisEncontrado.latlng[0];
                    lonPais = paisEncontrado.latlng[1];
                }

                // 2. Cruzamos esas coordenadas con las de la ISS
                const distancia = (latPais && lonPais) 
                    ? calcularDistancia(latPais, lonPais, issLat, issLon) 
                    : null;

                // 3. Generamos la fila unificada
                cruce.push({
                    cohete: l.rocket_name,
                    pais: l.country,
                    distancia_km: distancia
                });
            });

            tablaMezclada = cruce;
            loading = false;

        } catch (err) {
            errorMsg = err.message;
            loading = false;
        }
    }

    onMount(() => {
        cargarSuperMashup();
        // Recalcular la distancia en tiempo real cada 5 segundos según se mueve la ISS
        intervalo = setInterval(cargarSuperMashup, 5000); 
        return () => clearInterval(intervalo);
    });
</script>

<style>
    .wrap { background:#0d1117; min-height:100vh; padding:24px; font-family:sans-serif; color:#e6edf3; }
    h2 { color:#e6edf3; margin-bottom:4px; }
    p.sub { color:#8b949e; font-size:13px; margin-bottom:16px; }
    .back-btn { background:#21262d; border:1px solid #30363d; color:#8b949e; padding:6px 14px; border-radius:8px; cursor:pointer; margin-bottom:16px; display:inline-block; margin-right:8px; }
    .back-btn:hover { border-color:#58a6ff; color:#58a6ff; }
    .tabla-box { background:#161b22; border:1px solid #30363d; border-radius:8px; padding:16px; }
    table { width:100%; border-collapse:collapse; font-size:13px; text-align: left; }
    th { color:#8b949e; padding:10px; border-bottom:1px solid #30363d; }
    td { padding:10px; border-bottom:1px solid #21262d; color:#e6edf3; }
    .proxy-note { background:#161b22; border:1px solid #30363d; border-radius:6px; padding:10px; font-size:12px; color:#8b949e; margin-bottom:16px; }
    .highlight { color: #39FF14; font-weight: bold; }
</style>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>← Volver</button>

    <h2>🛸 Integración Pura: Lanzamientos × ISS Proxy</h2>
    <p class="sub">Distancia en tiempo real entre la posición actual de la ISS y los países de origen de nuestros lanzamientos.</p>

    <div class="proxy-note">🔀 Usando Proxy Local para ISS y resolviendo coordenadas dinámicamente con REST Countries.</div>

    {#if loading}
        <div style="color: #8b949e; padding: 40px; text-align: center;">⟳ Mezclando datos en tiempo real...</div>
    {:else if errorMsg}
        <div style="color: #f85149; padding: 40px; text-align: center;">❌ {errorMsg}</div>
    {:else}
        <div class="tabla-box">
            <table>
                <thead>
                    <tr>
                        <th>Cohete (Nuestra API)</th>
                        <th>País de Lanzamiento (Nuestra API)</th>
                        <th>Distancia actual a la ISS (Dato Mezclado)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tablaMezclada as fila}
                        <tr>
                            <td>{fila.cohete}</td>
                            <td>{fila.pais}</td>
                            <td class="highlight">
                                {#if fila.distancia_km}
                                    {fila.distancia_km.toLocaleString()} km
                                {:else}
                                    <span style="color: #8b949e; font-weight:normal;">Calculando...</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>