<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let rows    = $state([]);
	let loading = $state(true);
	let error   = $state('');

	onMount(async () => {
		try {
			// Llamamos a nuestro propio proxy (que ahora apunta a Rick & Morty)
			const url = '/api/v2/meteorite-landings/proxy/personajes';
			const res = await fetch(url);
			
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();

			// Mapeamos los datos para nuestra tabla
			rows = data.map(personaje => {
				return {
					name:    personaje.name,
					status:  personaje.status === 'Alive' ? 'Vivo' : (personaje.status === 'Dead' ? 'Muerto' : 'Desconocido'),
					species: personaje.species,
					gender:  personaje.gender,
					origin:  personaje.origin.name
				};
			});

			loading = false;
		} catch (err) {
			error   = `❌ Error al conectar con nuestro proxy: ${err.message}`;
			loading = false;
		}
	});
</script>

<h2>Viajeros Interdimensionales (Rick & Morty)</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Datos obtenidos mediante un <strong>Proxy propio</strong> en nuestro backend de Express, 
    consumiendo la <em>Rick and Morty API</em>.
</p>

{#if loading}
	<p>Abriendo portal interdimensional a través del proxy...</p>
{:else if error}
	<p>{error}</p>
{:else}
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>Nombre</th>
				<th>Estado</th>
				<th>Especie</th>
				<th>Género</th>
				<th>Lugar de Origen</th>
			</tr>
		</thead>
		<tbody>
			{#each rows as r}
				<tr>
					<td><strong>{r.name}</strong></td>
					<td>{r.status}</td>
					<td>{r.species}</td>
					<td>{r.gender}</td>
					<td>{r.origin}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>