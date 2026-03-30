<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const API = '/api/v2/meteorite-landings';
	const LIMIT = 10;

	let meteorites = $state([]);
	let total = $state(0);
	let page = $state(0);
	let loading = $state(true);

	// Campos del formulario de creación
	let newName = $state('');
	let newId = $state('');
	let newMass = $state('');
	let newYear = $state('');
	let newGeolocation = $state('');
	let newCountry = $state('');

	// Filtro
	let filterFrom = $state('');
	let filterTo = $state('');
	let filtered = $state([]);
	let filterLoading = $state(false);

	let totalPages = $derived(Math.ceil(total / LIMIT));

	async function getMeteorites() {
		loading = true;
		const offset = page * LIMIT;
		try {
			const res = await fetch(`${API}?limit=${LIMIT}&offset=${offset}`);
			if (res.ok) {
				meteorites = await res.json();
			}
		} catch (err) {
			console.error('Error de red:', err);
		} finally {
			loading = false;
		}
	}

	async function getTotal() {
		const res = await fetch(`${API}?limit=0`);
		if (res.ok) {
			const all = await res.json();
			total = all.length;
		}
	}

	async function loadInitialData() {
		if (!confirm('¿Cargar los datos iniciales del CSV?')) return;
		const res = await fetch(`${API}/loadInitialData`);
		alert(res.ok ? '✅ Datos cargados.' : '❌ Error. Puede que ya haya datos.');
		page = 0;
		await getTotal();
		await getMeteorites();
	}

	async function deleteAll() {
		if (!confirm('⚠️ ¿Borrar TODOS los meteoritos? Esta acción no se puede deshacer.')) return;
		const res = await fetch(API, { method: 'DELETE' });
		alert(res.ok ? '✅ Todos los meteoritos eliminados.' : `❌ Error: ${res.status}`);
		page = 0;
		total = 0;
		await getMeteorites();
	}

	async function deleteOne(country, name) {
		if (!confirm(`¿Eliminar "${name}" (${country})?`)) return;
		const res = await fetch(`${API}/${encodeURIComponent(country)}/${encodeURIComponent(name)}`, {
			method: 'DELETE'
		});
		if (res.ok) {
			alert(`✅ Meteorito "${name}" eliminado correctamente.`);  // ← esto faltaba
			total = total - 1;
			
			if (meteorites.length === 1 && page > 0) page = page - 1;
			await getMeteorites();
		} else {
			alert(`❌ No se pudo eliminar. Código: ${res.status}`);
		}
	}

	async function createMeteorite() {
		if (!newName || !newId || !newMass || !newYear || !newGeolocation || !newCountry) {
			alert('❌ Todos los campos son obligatorios.');
			return;
		}

		const res = await fetch(API, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: newName,
				id: Number(newId),
				mass: Number(newMass),
				year: Number(newYear),
				geolocation: newGeolocation,
				country: newCountry
			})
		});

		if (res.status === 201) {
			alert(`✅ Meteorito "${newName}" creado.`);
			// Limpiamos el formulario
			newName = ''; newId = ''; newMass = ''; newYear = ''; newGeolocation = ''; newCountry = '';
			total = total + 1;
			await getMeteorites();
		} else if (res.status === 409) {
			alert('❌ Ese meteorito ya existe.');
		} else {
			alert(`❌ Error al crear. Código: ${res.status}`);
		}
	}

	async function buscarFiltro() {
		if (!filterFrom && !filterTo) {
			alert('❌ Introduce al menos un año.');
			return;
		}
		filterLoading = true;
		let url = `${API}/statistics?`;
		if (filterFrom) url += `&from=${filterFrom}`;
		if (filterTo)   url += `&to=${filterTo}`;
		try {
			const res = await fetch(url);
			if (res.ok) filtered = await res.json();
		} catch (err) {
			console.error('Error de red:', err);
		} finally {
			filterLoading = false;
		}
	}

	async function goToPage(newPage) {
		page = newPage;
		await getMeteorites();
	}

	onMount(async () => {
		await getTotal();
		await getMeteorites();
	});
</script>

<h2>Meteoritos</h2>

<button onclick={loadInitialData}>Cargar datos iniciales</button>
<button onclick={deleteAll}>Borrar todos</button>

<br><br>

<!-- FILTRO POR AÑOS -->
<h3>Filtrar por rango de años</h3>
<input type="number" bind:value={filterFrom} placeholder="Desde (ej: 2000)" />
<input type="number" bind:value={filterTo} placeholder="Hasta (ej: 2017)" />
<button onclick={buscarFiltro}>Buscar</button>
<button onclick={() => { filterFrom = ''; filterTo = ''; filtered = []; }}>Limpiar</button>

{#if filterLoading}
    <p>Cargando...</p>
{:else if filtered.length > 0}
    <p>{filtered.length} meteoritos encontrados</p>
    <table border="1" cellpadding="8" cellspacing="0">
        <thead>
            <tr>
                <th>País</th><th>Nombre</th><th>ID</th>
                <th>Masa (g)</th><th>Año</th><th>Geolocalización</th>
            </tr>
        </thead>
        <tbody>
            {#each filtered as m}
                <tr>
                    <td>{m.country}</td><td>{m.name}</td><td>{m.id}</td>
                    <td>{m.mass}</td><td>{m.year}</td><td>{m.geolocation}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{:else if filtered.length === 0 && (filterFrom || filterTo)}
    <p>No se encontraron meteoritos en ese rango.</p>
{/if}

<!-- FORMULARIO DE CREACIÓN -->
<h3>Crear nuevo meteorito</h3>
<table border="1" cellpadding="8" cellspacing="0">
	<thead>
		<tr>
			<th>País</th>
			<th>Nombre</th>
			<th>ID</th>
			<th>Masa (g)</th>
			<th>Año</th>
			<th>Geolocalización</th>
			<th></th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><input type="text" bind:value={newCountry} placeholder="Spain" /></td>
			<td><input type="text" bind:value={newName} placeholder="Nombre" /></td>
			<td><input type="number" bind:value={newId} placeholder="12345" /></td>
			<td><input type="number" bind:value={newMass} placeholder="500" /></td>
			<td><input type="number" bind:value={newYear} placeholder="1990" /></td>
			<td><input type="text" bind:value={newGeolocation} placeholder="(40.4, -3.7)" /></td>
			<td><button onclick={createMeteorite}>Crear</button></td>
		</tr>
	</tbody>
</table>

<br>

<!-- LISTADO -->
<h3>Listado ({total} meteoritos)</h3>

{#if loading}
	<p>Cargando...</p>
{:else if total === 0}
	<p>No hay meteoritos. Crea uno o carga los datos iniciales.</p>
{:else}
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>País</th>
				<th>Nombre</th>
				<th>ID</th>
				<th>Masa (g)</th>
				<th>Año</th>
				<th>Geolocalización</th>
				<th>Acciones</th>
			</tr>
		</thead>
		<tbody>
			{#each meteorites as m}
				<tr>
					<td>{m.country}</td>
					<td>{m.name}</td>
					<td>{m.id}</td>
					<td>{m.mass}</td>
					<td>{m.year}</td>
					<td>{m.geolocation}</td>
					<td>
						<button onclick={() => goto(`/meteorite-landings/${m.country}/${m.name}`)}>Editar</button>
						<button onclick={() => deleteOne(m.country, m.name)}>Eliminar</button>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<br>
	<button onclick={() => goToPage(page - 1)} disabled={page === 0}>← Anterior</button>
	Página {page + 1} de {totalPages}
	<button onclick={() => goToPage(page + 1)} disabled={page + 1 >= totalPages}>Siguiente →</button>
{/if}

<br>
<button onclick={() => goto('/')}>Volver a la portada</button>