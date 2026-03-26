<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API = '/api/v1/space-launches';
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

    let totalPages = $derived(Math.ceil(total / LIMIT));

    async function getMisiones() {
        loading = true;
        const offset = page * LIMIT;
        try {
            const res = await fetch(`${API}?limit=${LIMIT}&offset=${offset}`);
            if (res.ok) {
                misiones = await res.json();
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
        await getMisiones();
    }

    async function deleteAll() {
        if (!confirm('⚠️ ¿Borrar TODAS las misiones? Esta acción no se puede deshacer.')) return;
        const res = await fetch(API, { method: 'DELETE' });
        alert(res.ok ? '✅ Todas las misiones eliminadas.' : `❌ Error: ${res.status}`);
        page = 0;
        total = 0;
        await getMisiones();
    }

    async function deleteOne(country, id) {
        if (!confirm(`¿Eliminar la misión ${id} (${country})?`)) return;
        const res = await fetch(`${API}/${encodeURIComponent(country)}/${id}`, { method: 'DELETE' });
        if (res.ok) {
            alert(`✅ Misión ${id} eliminada correctamente.`);
            total = total - 1;
            if (misiones.length === 1 && page > 0) page = page - 1;
            await getMisiones();
        } else {
            alert(`❌ No se pudo eliminar. Código: ${res.status}`);
        }
    }

    async function createMision() {
        if (!newMissionId || !newCompany || !newLocation || !newYear || !newRocket || !newStatus || !newCountry) {
            alert('❌ Todos los campos son obligatorios.');
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
            alert(`✅ Misión ${newMissionId} creada correctamente.`);
            newMissionId = ''; newCompany = ''; newLocation = ''; newYear = '';
            newRocket = ''; newStatus = ''; newCountry = '';
            total = total + 1;
            await getMisiones();
        } else if (res.status === 409) {
            alert('❌ Ya existe una misión con ese ID.');
        } else {
            alert(`❌ Error al crear. Código: ${res.status}`);
        }
    }

    async function goToPage(newPage) {
        page = newPage;
        await getMisiones();
    }

    onMount(async () => {
        await getTotal();
        await getMisiones();
    });
</script>

<h2>Lanzamientos Espaciales</h2>

<button onclick={loadInitialData}>Cargar datos iniciales</button>
<button onclick={deleteAll}>Borrar todos</button>

<br><br>

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