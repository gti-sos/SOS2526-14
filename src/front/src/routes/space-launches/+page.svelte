<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API = '/api/v1/space-launches';

    let misiones = $state([]);
    let nuevaMision = $state({ mission_id: '', company_name: '', location: '', year: '', rocket_name: '', mission_status: '', country: '' });

    let mensajeExito = $state('');
    let mensajeError = $state('');

    let limit = 10;
    let offset = $state(0);
    let busquedaPais = $state('');
    let busquedaEmpresa = $state('');

    onMount(getMisiones);

    async function getMisiones() {
        limpiarMensajes();
        try {
            let url = `${API}?limit=${limit}&offset=${offset}`;
            if (busquedaPais) url += `&country=${busquedaPais}`;
            if (busquedaEmpresa) url += `&company_name=${busquedaEmpresa}`;

            const res = await fetch(url);
            if (res.ok) {
                misiones = await res.json();
                if (misiones.length === 0 && (busquedaPais || busquedaEmpresa)) {
                    mostrarError("No se encontraron misiones con esos filtros.");
                }
            } else {
                mostrarError("No se han podido cargar los datos.");
            }
        } catch (error) {
            mostrarError("Error de conexión con el servidor.");
        }
    }

    function buscar() {
        offset = 0;
        getMisiones();
    }

    function recargarLista() {
        busquedaPais = '';
        busquedaEmpresa = '';
        offset = 0;
        getMisiones();
    }

    function paginaSiguiente() {
        offset += limit;
        getMisiones();
    }

    function paginaAnterior() {
        if (offset >= limit) {
            offset -= limit;
            getMisiones();
        }
    }

    async function cargarDatosIniciales() {
        limpiarMensajes();
        const res = await fetch(`${API}/loadInitialData`);
        if (res.ok) {
            const data = await res.json();
            mostrarExito(`Se han cargado ${data.count} misiones correctamente.`);
            recargarLista();
        } else if (res.status === 400) {
            mostrarError("La base de datos ya tiene datos cargados.");
        } else {
            mostrarError("No se pudieron cargar los datos iniciales.");
        }
    }

    async function crearMision() {
        limpiarMensajes();
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...nuevaMision,
                mission_id: Number(nuevaMision.mission_id),
                year: Number(nuevaMision.year)
            })
        });

        if (res.status === 201) {
            mostrarExito(`¡La misión ${nuevaMision.mission_id} se ha añadido correctamente!`);
            nuevaMision = { mission_id: '', company_name: '', location: '', year: '', rocket_name: '', mission_status: '', country: '' };
            recargarLista();
        } else if (res.status === 409) {
            mostrarError(`Ya existe una misión con el ID '${nuevaMision.mission_id}'.`);
        } else if (res.status === 400) {
            mostrarError("Revisa los datos. Faltan campos obligatorios.");
        } else {
            mostrarError("Ha ocurrido un error inesperado al intentar guardar.");
        }
    }

    async function borrarMision(country, id) {
        limpiarMensajes();
        if (!confirm(`¿Estás seguro de que quieres eliminar la misión ${id}?`)) return;

        const res = await fetch(`${API}/${encodeURIComponent(country)}/${id}`, { method: 'DELETE' });

        if (res.status === 200) {
            mostrarExito(`La misión ${id} ha sido eliminada.`);
            getMisiones();
        } else if (res.status === 404) {
            mostrarError(`No existe la misión con ID '${id}' en '${country}'.`);
        } else {
            mostrarError("No se ha podido eliminar.");
        }
    }

    async function borrarTodos() {
        limpiarMensajes();
        if (!confirm("¡ATENCIÓN! ¿Seguro que quieres borrar TODAS las misiones?")) return;

        const res = await fetch(API, { method: 'DELETE' });

        if (res.status === 200) {
            mostrarExito("Se han eliminado todas las misiones.");
            recargarLista();
        } else {
            mostrarError("Error al vaciar la base de datos.");
        }
    }

    function mostrarExito(msg) { mensajeExito = msg; }
    function mostrarError(msg) { mensajeError = msg; }
    function limpiarMensajes() { mensajeExito = ''; mensajeError = ''; }
</script>

<main>
    <h2>Gestión de Lanzamientos Espaciales</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="busqueda-box">
        <h3>🔍 Buscar Misiones</h3>
        <input type="text" placeholder="Buscar por País (ej. USA)" bind:value={busquedaPais}>
        <input type="text" placeholder="Buscar por Empresa" bind:value={busquedaEmpresa}>
        <button onclick={buscar} class="btn-buscar">Buscar</button>
        <button onclick={recargarLista} class="btn-recargar">Limpiar y Recargar Lista</button>
    </section>

    <section class="formulario">
        <h3>➕ Añadir Nueva Misión</h3>
        <input type="number" placeholder="ID de misión" bind:value={nuevaMision.mission_id}>
        <input type="text" placeholder="Empresa" bind:value={nuevaMision.company_name}>
        <input type="text" placeholder="Ubicación" bind:value={nuevaMision.location}>
        <input type="number" placeholder="Año" bind:value={nuevaMision.year}>
        <input type="text" placeholder="Cohete" bind:value={nuevaMision.rocket_name}>
        <select bind:value={nuevaMision.mission_status}>
            <option value="">-- Estado de la misión --</option>
            <option value="Success">Éxito</option>
            <option value="Failure">Fallo</option>
            <option value="Partial Failure">Fallo Parcial</option>
            <option value="Prelaunch Failure">Fallo Prelanzamiento</option>
        </select>
        <input type="text" placeholder="País" bind:value={nuevaMision.country}>
        <button onclick={crearMision} class="btn-guardar">Añadir a la base de datos</button>
    </section>

    <div class="acciones-globales">
        <button onclick={cargarDatosIniciales} class="btn-cargar">Cargar datos iniciales</button>
        <button onclick={borrarTodos} class="btn-peligro">Borrar TODO</button>
    </div>

    <div class="paginacion">
        <button onclick={paginaAnterior} disabled={offset === 0} class="btn-paginacion">⬅ Página Anterior</button>
        <span>Mostrando desde el {offset + 1} al {offset + limit}</span>
        <button onclick={paginaSiguiente} disabled={misiones.length < limit} class="btn-paginacion">Página Siguiente ➡</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>ID</th><th>Empresa</th><th>Cohete</th><th>Ubicación</th><th>Año</th><th>País</th><th>Estado</th><th>Acciones</th>
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
                        <button onclick={() => goto(`/space-launches/edit/${encodeURIComponent(m.country)}/${m.mission_id}`)} class="btn-editar">Editar</button>
                        <button onclick={() => borrarMision(m.country, m.mission_id)} class="btn-borrar">Eliminar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    :global(body) {
        background-color: #f8fafc;
        color: #334155;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 0;
    }

    main {
        max-width: 1200px;
        margin: 40px auto;
        padding: 0 20px;
    }

    h2 {
        color: #1e293b;
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 30px;
        border-bottom: 3px solid #007bff;
        display: inline-block;
        padding-bottom: 5px;
    }

    h3 {
        font-size: 1.25rem;
        color: #475569;
        margin-top: 0;
        margin-bottom: 15px;
        font-weight: 600;
    }

    .alerta {
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 25px;
        font-weight: 600;
        border: 1px solid;
        display: flex;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .exito { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .error { background-color: #fee2e2; color: #991b1b; border-color: #fecaca; }

    section {
        background: #ffffff;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 25px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e2e8f0;
    }

    .busqueda-box {
        background: #e0f2fe;
        border-color: #bae6fd;
    }

    input, select {
        padding: 10px 14px;
        margin: 6px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    input:focus, select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .acciones-globales {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        justify-content: flex-end;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        font-size: 14px;
    }
    th, td {
        padding: 16px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    th {
        background-color: #f1f5f9;
        color: #64748b;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:nth-child(even) { background-color: #f8fafc; }
    tbody tr:hover { background-color: #f1f5f9; }

    button {
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
    }
    button:hover { opacity: 0.85; transform: translateY(-1px); }

    .btn-guardar { background-color: #28a745; color: white; }
    .btn-recargar { background-color: #17a2b8; color: white; }
    .btn-buscar { background-color: #6f42c1; color: white; }
    .btn-peligro { background-color: #dc3545; color: white; }
    .btn-cargar { background-color: #007bff; color: white; }
    .btn-editar { background-color: #ffc107; color: #1e293b; }
    .btn-borrar { background-color: #dc3545; color: white; }

    .paginacion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #ffffff;
        padding: 12px 20px;
        border-radius: 12px;
        margin-bottom: 15px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        font-size: 14px;
        font-weight: 500;
        color: #64748b;
    }
    .btn-paginacion {
        background-color: #f1f5f9;
        color: #007bff;
        border: 1px solid #cbd5e1;
    }
    .btn-paginacion:hover:not(:disabled) {
        background-color: #e0f2fe;
        border-color: #bae6fd;
    }
    .btn-paginacion:disabled {
        background-color: #f1f5f9;
        color: #cbd5e1;
        cursor: not-allowed;
        border-color: #e2e8f0;
    }
</style>