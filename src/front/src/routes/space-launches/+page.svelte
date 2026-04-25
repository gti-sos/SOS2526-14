<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API = '/api/v2/space-launches';
    const LIMIT = 10;

    let misiones = $state([]);
    let total = $state(0);
    let page = $state(0);
    let loading = $state(true);

    let newMissionId = $state('');
    let newCompany = $state('');
    let newLocation = $state('');
    let newYear = $state('');
    let newRocket = $state('');
    let newStatus = $state('');
    let newCountry = $state('');

    // Filtro por rango de años (estadísticas)
    let filterFrom = $state('');
    let filterTo = $state('');
    let filtered = $state([]);
    let filterLoading = $state(false);
    let filterUsed = $state(false);

    // Búsqueda por parámetros
    let searchId = $state('');
    let searchCompany = $state('');
    let searchLocation = $state('');
    let searchYear = $state('');
    let searchRocket = $state('');
    let searchStatus = $state('');
    let searchCountry = $state('');
    let searchResults = $state([]);
    let searchLoading = $state(false);
    let searchUsed = $state(false);

    // Mensaje de estado reactivo
    let statusMsg = $state('');
    let statusOk = $state(true);

    let totalPages = $derived(Math.ceil(total / LIMIT));

    function setStatus(msg, ok = true) {
        statusMsg = msg;
        statusOk = ok;
    }

    async function getMisiones() {
        loading = true;
        const offset = page * LIMIT;
        try {
            const res = await fetch(`${API}?limit=${LIMIT}&offset=${offset}`);
            if (res.ok) {
                misiones = await res.json();
            } else {
                setStatus(`❌ Error al cargar las misiones. Código: ${res.status}`, false);
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
        const res = await fetch(`${API}/loadInitialData`);
        if (res.ok) {
            setStatus('✅ Datos cargados correctamente.');
            page = 0;
            await getTotal();
            await getMisiones();
        } else {
            setStatus('❌ Error. Puede que ya haya datos cargados.', false);
        }
    }

    async function deleteAll() {
        const res = await fetch(API, { method: 'DELETE' });
        if (res.ok) {
            setStatus('✅ Todas las misiones han sido eliminadas.');
            page = 0;
            total = 0;
            await getMisiones();
        } else {
            setStatus(`❌ Error al borrar. Código: ${res.status}`, false);
        }
    }

    async function deleteOne(country, id) {
        const res = await fetch(`${API}/${encodeURIComponent(country)}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setStatus(`✅ Misión ${id} eliminada correctamente.`);
            total = total - 1;
            if (misiones.length === 1 && page > 0) page = page - 1;
            await getMisiones();
        } else if (res.status === 404) {
            setStatus(`❌ No existe una misión con ID ${id} en ${country}.`, false);
        } else {
            setStatus(`❌ No se pudo eliminar. Código: ${res.status}`, false);
        }
    }

    async function createMision() {
        if (!newMissionId || !newCompany || !newLocation || !newYear || !newRocket || !newStatus || !newCountry) {
            setStatus('❌ Todos los campos son obligatorios.', false);
            return;
        }

        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mission_id: Number(newMissionId),
                company_name: newCompany,
                location: newLocation,
                year: Number(newYear),
                rocket_name: newRocket,
                mission_status: newStatus,
                country: newCountry
            })
        });

        if (res.status === 201) {
            const createdId = newMissionId;
            newMissionId = ''; newCompany = ''; newLocation = ''; newYear = '';
            newRocket = ''; newStatus = ''; newCountry = '';
            total = total + 1;
            page = Math.ceil(total / LIMIT) - 1;
            await getMisiones();
            setStatus(`✅ Misión ${createdId} creada correctamente.`);
        } else if (res.status === 409) {
            setStatus('❌ Ya existe una misión con ese ID.', false);
        } else if (res.status === 400) {
            setStatus('❌ Datos incorrectos. Revisa que todos los campos sean válidos.', false);
        } else {
            setStatus(`❌ Error al crear la misión. Código: ${res.status}`, false);
        }
    }

    async function buscarFiltro() {
        if (!filterFrom && !filterTo) {
            setStatus('❌ Introduce al menos un año para filtrar.', false);
            return;
        }
        filterLoading = true;
        filterUsed = true;
        let url = `${API}/statistics?`;
        if (filterFrom) url += `from=${filterFrom}`;
        if (filterFrom && filterTo) url += '&';
        if (filterTo) url += `to=${filterTo}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                filtered = await res.json();
            } else {
                setStatus(`❌ Error al buscar. Código: ${res.status}`, false);
            }
        } catch (err) {
            console.error('Error de red:', err);
        } finally {
            filterLoading = false;
        }
    }

    function limpiarFiltro() {
        filterFrom = '';
        filterTo = '';
        filtered = [];
        filterUsed = false;
    }

    // ── NUEVA FUNCIÓN: búsqueda por parámetros ──────────────────────────────
    async function buscarPorParametros() {
        const hayAlgunCampo = searchId || searchCompany || searchLocation ||
                              searchYear || searchRocket || searchStatus || searchCountry;
        if (!hayAlgunCampo) {
            setStatus('❌ Rellena al menos un campo para buscar.', false);
            return;
        }

        searchLoading = true;
        searchUsed = true;

        // Construir query string solo con los campos que tienen valor
        const params = new URLSearchParams();
        if (searchId)       params.append('mission_id',     searchId);
        if (searchCompany)  params.append('company_name',   searchCompany);
        if (searchLocation) params.append('location',       searchLocation);
        if (searchYear)     params.append('year',           searchYear);
        if (searchRocket)   params.append('rocket_name',    searchRocket);
        if (searchStatus)   params.append('mission_status', searchStatus);
        if (searchCountry)  params.append('country',        searchCountry);

        try {
            const res = await fetch(`${API}?${params.toString()}`);
            if (res.ok) {
                searchResults = await res.json();
            } else {
                setStatus(`❌ Error al buscar. Código: ${res.status}`, false);
            }
        } catch (err) {
            console.error('Error de red:', err);
        } finally {
            searchLoading = false;
        }
    }

    function limpiarBusqueda() {
        searchId = ''; searchCompany = ''; searchLocation = '';
        searchYear = ''; searchRocket = ''; searchStatus = ''; searchCountry = '';
        searchResults = [];
        searchUsed = false;
    }
    // ────────────────────────────────────────────────────────────────────────

    async function goToPage(newPage) {
        page = newPage;
        await getMisiones();
    }

    onMount(async () => {
        await getTotal();
        await getMisiones();
    });
</script>

<h2>🚀 Lanzamientos Espaciales</h2>

<button onclick={loadInitialData}>Cargar datos iniciales</button>
<button onclick={deleteAll}>Borrar todos</button>

{#if statusMsg}
    <p style="color: {statusOk ? 'green' : 'red'}">{statusMsg}</p>
{/if}

<br>

<!-- ── BÚSQUEDA POR PARÁMETROS (NUEVO) ─────────────────────────────────── -->
<h3>Buscar por parámetros</h3>
<table border="1" cellpadding="8" cellspacing="0">
    <thead>
        <tr>
            <th>ID</th>
            <th>Empresa</th>
            <th>Ubicación</th>
            <th>Año</th>
            <th>Cohete</th>
            <th>Estado</th>
            <th>País</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><input type="number" bind:value={searchId}       placeholder="Ej: 1001" /></td>
            <td><input type="text"   bind:value={searchCompany}  placeholder="Ej: SpaceX" /></td>
            <td><input type="text"   bind:value={searchLocation} placeholder="Ej: Cape Canaveral" /></td>
            <td><input type="number" bind:value={searchYear}     placeholder="Ej: 2020" /></td>
            <td><input type="text"   bind:value={searchRocket}   placeholder="Ej: Falcon 9" /></td>
            <td>
                <select bind:value={searchStatus}>
                    <option value="">-- Todos --</option>
                    <option value="Success">Éxito</option>
                    <option value="Failure">Fallo</option>
                    <option value="Partial Failure">Fallo Parcial</option>
                    <option value="Prelaunch Failure">Fallo Prelanzamiento</option>
                </select>
            </td>
            <td><input type="text" bind:value={searchCountry} placeholder="Ej: USA" /></td>
            <td>
                <button onclick={buscarPorParametros}>Buscar</button>
                <button onclick={limpiarBusqueda}>Limpiar</button>
            </td>
        </tr>
    </tbody>
</table>

{#if searchLoading}
    <p>Buscando...</p>
{:else if searchUsed && searchResults.length === 0}
    <p>No se encontraron misiones con esos criterios.</p>
{:else if searchResults.length > 0}
    <p>{searchResults.length} misiones encontradas</p>
    <table border="1" cellpadding="8" cellspacing="0">
        <thead>
            <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Cohete</th>
                <th>Ubicación</th>
                <th>Año</th>
                <th>País</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            {#each searchResults as m}
                <tr>
                    <td>{m.mission_id}</td>
                    <td>{m.company_name}</td>
                    <td>{m.rocket_name}</td>
                    <td>{m.location}</td>
                    <td>{m.year}</td>
                    <td>{m.country}</td>
                    <td>{m.mission_status}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<br>

<!-- ── FILTRO POR RANGO DE AÑOS ─────────────────────────────────────────── -->
<h3>Filtrar por rango de años</h3>
<input type="number" bind:value={filterFrom} placeholder="Desde (ej: 2000)" />
<input type="number" bind:value={filterTo} placeholder="Hasta (ej: 2020)" />
<button onclick={buscarFiltro}>Buscar</button>
<button onclick={limpiarFiltro}>Limpiar</button>

{#if filterLoading}
    <p>Buscando...</p>
{:else if filterUsed && filtered.length === 0}
    <p>No se encontraron misiones en ese rango de años.</p>
{:else if filtered.length > 0}
    <p>{filtered.length} misiones encontradas</p>
    <table border="1" cellpadding="8" cellspacing="0">
        <thead>
            <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Cohete</th>
                <th>Ubicación</th>
                <th>Año</th>
                <th>País</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            {#each filtered as m}
                <tr>
                    <td>{m.mission_id}</td>
                    <td>{m.company_name}</td>
                    <td>{m.rocket_name}</td>
                    <td>{m.location}</td>
                    <td>{m.year}</td>
                    <td>{m.country}</td>
                    <td>{m.mission_status}</td>
                </tr>
            {/each}
        </tbody>
    </table>
{/if}

<br>

<!-- ── FORMULARIO DE CREACIÓN ────────────────────────────────────────────── -->
<h3>Crear nueva misión</h3>
<table border="1" cellpadding="8" cellspacing="0">
    <thead>
        <tr>
            <th>ID</th>
            <th>Empresa</th>
            <th>Ubicación</th>
            <th>Año</th>
            <th>Cohete</th>
            <th>Estado</th>
            <th>País</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><input type="number" bind:value={newMissionId} placeholder="1001" /></td>
            <td><input type="text" bind:value={newCompany} placeholder="SpaceX" /></td>
            <td><input type="text" bind:value={newLocation} placeholder="Cape Canaveral" /></td>
            <td><input type="number" bind:value={newYear} placeholder="2024" /></td>
            <td><input type="text" bind:value={newRocket} placeholder="Falcon 9" /></td>
            <td>
                <select bind:value={newStatus}>
                    <option value="">-- Estado --</option>
                    <option value="Success">Éxito</option>
                    <option value="Failure">Fallo</option>
                    <option value="Partial Failure">Fallo Parcial</option>
                    <option value="Prelaunch Failure">Fallo Prelanzamiento</option>
                </select>
            </td>
            <td><input type="text" bind:value={newCountry} placeholder="USA" /></td>
            <td><button onclick={createMision}>Crear</button></td>
        </tr>
    </tbody>
</table>

<br>

<!-- ── LISTADO ───────────────────────────────────────────────────────────── -->
<h3>Listado ({total} misiones)</h3>

{#if loading}
    <p>Cargando...</p>
{:else if total === 0}
    <p>No hay misiones. Crea una o carga los datos iniciales.</p>
{:else}
    <table border="1" cellpadding="8" cellspacing="0">
        <thead>
            <tr>
                <th>ID</th>
                <th>Empresa</th>
                <th>Cohete</th>
                <th>Ubicación</th>
                <th>Año</th>
                <th>País</th>
                <th>Estado</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each misiones as m}
                <tr>
                    <td>{m.mission_id}</td>
                    <td>{m.company_name}</td>
                    <td>{m.rocket_name}</td>
                    <td>{m.location}</td>
                    <td>{m.year}</td>
                    <td>{m.country}</td>
                    <td>{m.mission_status}</td>
                    <td>
                        <button onclick={() => goto(`/space-launches/edit/${encodeURIComponent(m.country)}/${m.mission_id}`)}>Editar</button>
                        <button onclick={() => deleteOne(m.country, m.mission_id)}>Eliminar</button>
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