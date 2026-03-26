<script>
    // @ts-nocheck
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API = '/api/v1/space-launches';

    const countryParam = page.params.country;
    const idParam = page.params.id;

    let resource = $state(null);
    let responseStatusCode = $state(0);

    let newCompany = $state('');
    let newLocation = $state('');
    let newYear = $state(0);
    let newRocket = $state('');
    let newStatus = $state('');

    async function getResource() {
        try {
            const response = await fetch(`${API}/${encodeURIComponent(countryParam)}/${idParam}`);
            responseStatusCode = response.status;
            if (response.ok) {
                resource = await response.json();
                newCompany = resource.company_name;
                newLocation = resource.location;
                newYear = resource.year;
                newRocket = resource.rocket_name;
                newStatus = resource.mission_status;
            } else {
                console.error('Error al obtener recurso:', response.status);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    }

    async function updateResource() {
        try {
            const response = await fetch(`${API}/${encodeURIComponent(countryParam)}/${idParam}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mission_id: Number(idParam),
                    company_name: newCompany,
                    location: newLocation,
                    year: Number(newYear),
                    rocket_name: newRocket,
                    mission_status: newStatus,
                    country: decodeURIComponent(countryParam)
                })
            });
            responseStatusCode = response.status;
            if (response.ok) {
                alert(`✅ La misión ${idParam} se ha actualizado correctamente.`);
                goto('/space-launches');
            } else {
                alert('❌ Faltan datos obligatorios o hay algún error.');
            }
        } catch (error) {
            console.error('Error al actualizar:', error);
        }
    }

    onMount(getResource);
</script>

<h3>Editar misión {idParam} ({decodeURIComponent(countryParam)})</h3>

{#if resource}
    <table border="1" cellpadding="8" cellspacing="0">
        <thead>
            <tr>
                <th>ID</th>
                <th>País</th>
                <th>Empresa</th>
                <th>Ubicación</th>
                <th>Año</th>
                <th>Cohete</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{resource.mission_id}</td>
                <td>{resource.country}</td>
                <td><input type="text" bind:value={newCompany} /></td>
                <td><input type="text" bind:value={newLocation} /></td>
                <td><input type="number" bind:value={newYear} /></td>
                <td><input type="text" bind:value={newRocket} /></td>
                <td>
                    <select bind:value={newStatus}>
                        <option value="Success">Éxito</option>
                        <option value="Failure">Fallo</option>
                        <option value="Partial Failure">Fallo Parcial</option>
                        <option value="Prelaunch Failure">Fallo Prelanzamiento</option>
                    </select>
                </td>
            </tr>
        </tbody>
    </table>

    <br>
    <button onclick={updateResource}>Guardar cambios</button>
    <button onclick={() => goto('/space-launches')}>Volver</button>

{:else if responseStatusCode === 404}
    <p>No se encontró la misión con ID {idParam} en {decodeURIComponent(countryParam)}.</p>
    <button onclick={() => goto('/space-launches')}>Volver a la lista</button>
{:else}
    <p>Cargando detalles de la misión {idParam}...</p>
{/if}