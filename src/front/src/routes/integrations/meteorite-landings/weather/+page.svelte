<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Sitios de caída de los meteoritos más famosos del mundo con sus coordenadas reales
	const SITES = [
		{ name: 'Hoba',          country: 'Namibia',    lat: -19.5833, lon:  17.9333 },
		{ name: 'Canyon Diablo', country: 'USA',        lat:  35.0278, lon: -111.0225 },
		{ name: 'Murchison',     country: 'Australia',  lat: -36.6167, lon:  145.2167 },
		{ name: 'Allende',       country: 'Mexico',     lat:  26.9667, lon: -105.3167 },
		{ name: 'Tagish Lake',   country: 'Canada',     lat:  59.7000, lon: -134.2000 },
		{ name: 'Sikhote-Alin',  country: 'Russia',     lat:  46.1167, lon:  134.6500 },
		{ name: 'Chelyabinsk',   country: 'Russia',     lat:  54.8200, lon:   61.1190 },
		{ name: 'Mbozi',         country: 'Tanzania',   lat:  -8.9333, lon:   32.9167 },
	];

	let rows    = $state([]);
	let loading = $state(true);
	let error   = $state('');

	const WMO_CODES = {
		0: 'Despejado', 1: 'Casi despejado', 2: 'Parcialmente nublado', 3: 'Nublado',
		45: 'Niebla', 48: 'Niebla con escarcha',
		51: 'Llovizna ligera', 53: 'Llovizna', 55: 'Llovizna densa',
		61: 'Lluvia ligera', 63: 'Lluvia', 65: 'Lluvia intensa',
		71: 'Nieve ligera', 73: 'Nieve', 75: 'Nieve intensa',
		80: 'Chubascos ligeros', 81: 'Chubascos', 82: 'Chubascos intensos',
		95: 'Tormenta', 99: 'Tormenta con granizo',
	};

	function describeWeather(code) {
		return WMO_CODES[code] ?? `Código ${code}`;
	}

	onMount(async () => {
		try {
			// Una sola petición con múltiples ubicaciones usando el parámetro de lista
			const lats = SITES.map(s => s.lat).join(',');
			const lons = SITES.map(s => s.lon).join(',');
			const url  =
				`https://api.open-meteo.com/v1/forecast` +
				`?latitude=${lats}&longitude=${lons}` +
				`&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
				`&wind_speed_unit=kmh&timezone=auto`;

			const res  = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();

			// La API devuelve array cuando se piden varias ubicaciones
			const results = Array.isArray(data) ? data : [data];

			rows = SITES.map((site, i) => {
				const current = results[i]?.current ?? {};
				return {
					name:        site.name,
					country:     site.country,
					lat:         site.lat,
					lon:         site.lon,
					temp:        current.temperature_2m   ?? '—',
					humidity:    current.relative_humidity_2m ?? '—',
					wind:        current.wind_speed_10m   ?? '—',
					weather:     describeWeather(current.weather_code),
				};
			});

			loading = false;
		} catch (err) {
			error   = `❌ Error al cargar Open-Meteo: ${err.message}`;
			loading = false;
		}
	});
</script>

<h2>Tiempo actual en sitios de meteoritos famosos</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Datos meteorológicos en tiempo real obtenidos de
	<a href="https://open-meteo.com/" target="_blank">Open-Meteo API</a>
	para las coordenadas exactas donde cayeron los meteoritos más conocidos del mundo.
</p>

{#if loading}
	<p>Cargando datos meteorológicos...</p>
{:else if error}
	<p>{error}</p>
{:else}
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>Meteorito</th>
				<th>País</th>
				<th>Coordenadas</th>
				<th>Temperatura (°C)</th>
				<th>Humedad (%)</th>
				<th>Viento (km/h)</th>
				<th>Condición</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r}
				<tr>
					<td>{r.name}</td>
					<td>{r.country}</td>
					<td>({r.lat}, {r.lon})</td>
					<td>{r.temp}</td>
					<td>{r.humidity}</td>
					<td>{r.wind}</td>
					<td>{r.weather}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>