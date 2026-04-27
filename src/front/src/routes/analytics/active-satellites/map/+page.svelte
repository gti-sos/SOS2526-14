<script>
    import { onMount } from 'svelte';
    import L from 'leaflet';

    let satelliteData = [];

    // Diccionario con las coordenadas de TUS datos
    const countryCoords = {
        "United States of America": [37.0902, -95.7129],
        "United Kingdom": [55.3781, -3.4360],
        "Finland": [61.9241, 25.7482],
        "Denmark": [56.2639, 9.5018],
        "Multinational": [20.0, 0.0], // Lo situamos en el centro del mapa
        "Israel": [31.0461, 34.8516],
        "Austria": [47.5162, 14.5501],
        "ESA": [48.8566, 2.3522], // París (Sede central)
        "Lithuania": [55.1694, 23.8813],
        "Norway": [60.4720, 8.4689]
    };

    onMount(async () => {
        // 1. Obtener los datos de tu API
        const res = await fetch('/api/v1/active-satellites');
        satelliteData = await res.json();

        // 2. Inicializar el mapa
        const map = L.map('map').setView([30, 0], 2);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // 3. Agrupar satélites por país para no amontonar marcadores
        const countryGroups = {};
        satelliteData.forEach(s => {
            if (!countryGroups[s.country]) countryGroups[s.country] = [];
            countryGroups[s.country].push(s);
        });

        // 4. Poner un marcador por cada país que tenga satélites
        Object.keys(countryGroups).forEach(country => {
            const coords = countryCoords[country];
            const count = countryGroups[country].length;
            
            if (coords) {
                L.marker(coords).addTo(map)
                    .bindPopup(`
                        <b>${country}</b><br>
                        Satélites activos: ${count}<br>
                        <small>Ejemplos: ${countryGroups[country].slice(0,2).map(s => s.name).join(', ')}...</small>
                    `);
            }
        });
    });
</script>

<svelte:head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<main>
    <h1>🛰️ Mapa Global de Satélites Activos</h1>
    <div id="map"></div>
    <div class="info">
        <p><a href="/analytics/active-satellites">← Volver a la Gráfica</a></p>
    </div>
</main>

<style>
    #map {
        height: 600px;
        width: 100%;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    main {
        padding: 20px;
        font-family: sans-serif;
    }
    .info {
        margin-top: 15px;
    }
</style>