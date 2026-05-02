<script>
	// @ts-nochecknpm
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let rows    = $state([]);
	let loading = $state(true);
	let error   = $state('');

	onMount(async () => {
		try {
			// Petición a la API pública de SpaceX
			const url = 'https://api.spacexdata.com/v4/launches/past';
			const res = await fetch(url);
			
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();

			// Cogemos los últimos 10 lanzamientos, les damos la vuelta y los mapeamos
			const ultimosLanzamientos = data.slice(-10).reverse();

			rows = ultimosLanzamientos.map(launch => {
				return {
					name:    launch.name,
					date:    new Date(launch.date_utc).toLocaleDateString('es-ES'),
					flight:  launch.flight_number,
					success: launch.success === true ? 'Sí' : (launch.success === false ? '❌ No' : '❓ N/A'),
					details: launch.details ?? 'Sin detalles.'
				};
			});

			loading = false;
		} catch (err) {
			error   = `❌ Error al cargar SpaceX: ${err.message}`;
			loading = false;
		}
	});
</script>

<h2>Últimos lanzamientos de SpaceX</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Datos históricos de vuelos espaciales obtenidos de la
	<a href="https://github.com/r-spacex/SpaceX-API" target="_blank">SpaceX API</a>
	para registrar la actividad tecnológica humana hacia el espacio.
</p>

{#if loading}
	<p>Cargando datos espaciales...</p>
{:else if error}
	<p>{error}</p>
{:else}
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>Misión</th>
				<th>Fecha</th>
				<th>Vuelo Nº</th>
				<th>¿Éxito?</th>
				<th>Detalles</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r}
				<tr>
					<td>{r.name}</td>
					<td>{r.date}</td>
					<td>{r.flight}</td>
					<td>{r.success}</td>
					<td>{r.details}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>