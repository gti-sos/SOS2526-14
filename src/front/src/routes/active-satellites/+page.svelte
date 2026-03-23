<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API_URL = '/api/v1/active-satellites';

    let satellites = $state([]);
    let nuevoSatelite = $state({ 
        name: '', 
        country: '', 
        launch_date: '', 
        launch_mass: '', 
        expected_lifetime: '', 
        apogee_height: '', 
        perigee_height: '' 
    });
    
    let mensajeExito = $state('');
    let mensajeError = $state('');

    let limit = 10; 
    let offset = $state(0); 
    let busquedaPais = $state('');
    let busquedaNombre = $state('');

    onMount(getSatellites);

    async function getSatellites() {
        limpiarMensajes();
        try {
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (busquedaPais) url += `&country=${busquedaPais}`;
            if (busquedaNombre) url += `&name=${busquedaNombre}`;

            const res = await fetch(url);
            if (res.ok) {
                satellites = await res.json();
                if (satellites.length === 0 && (busquedaPais || busquedaNombre)) {
                    mostrarError("No se encontraron satélites con esos filtros.");
                }
            } else {
                mostrarError("No se han podido cargar los datos.");
            }
        } catch (error) {
            mostrarError("Error de conexión con el servidor.");
        }
    }

    // --- NUEVA FUNCIÓN: CARGAR DATOS INICIALES ---
    async function cargarDatosIniciales() {
        limpiarMensajes();
        const res = await fetch(`${API_URL}/loadInitialData`);
        if (res.ok) {
            const data = await res.json();
            mostrarExito(`Se han cargado ${data.length} satélites de prueba correctamente.`);
            recargarLista();
        } else {
            mostrarError("Error al cargar los datos iniciales. Es posible que la base de datos ya contenga datos.");
        }
    }

    function buscar() {
        offset = 0; 
        getSatellites();
    }

    function recargarLista() {
        busquedaPais = '';
        busquedaNombre = '';
        offset = 0; 
        getSatellites();
    }

    function paginaSiguiente() {
        offset += limit;
        getSatellites();
    }

    function paginaAnterior() {
        if (offset >= limit) {
            offset -= limit;
            getSatellites();
        }
    }

    async function crearSatelite() {
        limpiarMensajes();
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...nuevoSatelite,
                launch_mass: Number(nuevoSatelite.launch_mass),
                expected_lifetime: Number(nuevoSatelite.expected_lifetime),
                apogee_height: Number(nuevoSatelite.apogee_height),
                perigee_height: Number(nuevoSatelite.perigee_height)
            })
        });

        if (res.status === 201) {
            mostrarExito(`¡Satélite ${nuevoSatelite.name} añadido!`);
            nuevoSatelite = { name: '', country: '', launch_date: '', launch_mass: '', expected_lifetime: '', apogee_height: '', perigee_height: '' }; 
            recargarLista(); 
        } else if (res.status === 409) {
            mostrarError(`El satélite '${nuevoSatelite.name}' ya existe.`);
        } else {
            mostrarError("Error al guardar. Revisa los campos.");
        }
    }

    async function borrarSatelite(country, name) {
        limpiarMensajes();
        if (!confirm(`¿Eliminar ${name}?`)) return;
        const res = await fetch(`${API_URL}/${country}/${name}`, { method: 'DELETE' });
        if (res.status === 200) {
            mostrarExito("Eliminado correctamente.");
            getSatellites(); 
        } else {
            mostrarError("No se ha podido eliminar.");
        }
    }

    async function borrarTodos() {
        limpiarMensajes();
        if (!confirm("¿Seguro que quieres borrar TODO?")) return;
        const res = await fetch(API_URL, { method: 'DELETE' });
        if (res.status === 200) {
            mostrarExito("Base de datos vaciada.");
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
    <h2>Gestión de Satélites</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="busqueda-box">
        <h3>🔍 Buscar</h3>
        <input type="text" placeholder="País" bind:value={busquedaPais}>
        <input type="text" placeholder="Nombre" bind:value={busquedaNombre}>
        <button onclick={buscar} class="btn-buscar">Buscar</button>
        <button onclick={recargarLista} class="btn-recargar">Limpiar</button>
    </section>

    <section class="formulario">
        <h3>➕ Nuevo Satélite</h3>
        <input type="text" placeholder="Nombre" bind:value={nuevoSatelite.name}>
        <input type="text" placeholder="País" bind:value={nuevoSatelite.country}>
        <input type="text" placeholder="Lanzamiento" bind:value={nuevoSatelite.launch_date}>
        <input type="number" placeholder="Masa (kg)" bind:value={nuevoSatelite.launch_mass}>
        <input type="number" placeholder="Vida (años)" bind:value={nuevoSatelite.expected_lifetime}>
        <input type="number" placeholder="Apogeo" bind:value={nuevoSatelite.apogee_height}>
        <input type="number" placeholder="Perigeo" bind:value={nuevoSatelite.perigee_height}>
        <button onclick={crearSatelite} class="btn-guardar">Añadir Satélite</button>
    </section>

    <div class="acciones-globales">
        <button onclick={cargarDatosIniciales} class="btn-inicial">📥 Cargar Datos Iniciales</button>
        <button onclick={borrarTodos} class="btn-peligro">🗑️ Borrar Todo</button>
    </div>

    <div class="paginacion">
        <button onclick={paginaAnterior} disabled={offset === 0} class="btn-paginacion">⬅ Anterior</button>
        <span>Página {Math.floor(offset/limit) + 1}</span>
        <button onclick={paginaSiguiente} disabled={satellites.length < limit} class="btn-paginacion">Siguiente ➡</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Nombre</th><th>País</th><th>Lanzamiento</th><th>Masa</th><th>Vida</th><th>H(a/p)</th><th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each satellites as s}
                <tr>
                    <td>{s.name}</td><td>{s.country}</td><td>{s.launch_date}</td><td>{s.launch_mass}</td><td>{s.expected_lifetime}</td><td>{s.apogee_height}/{s.perigee_height}</td>
                    <td>
                        <button onclick={() => goto(`/active-satellites/${s.country}/${s.name}`)} class="btn-editar">Editar</button>
                        <button onclick={() => borrarSatelite(s.country, s.name)} class="btn-borrar">Borrar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    /* ... (Estilos anteriores) ... */
    :global(body) { background-color: #f8fafc; color: #334155; font-family: sans-serif; }
    main { max-width: 1100px; margin: 20px auto; padding: 20px; }
    h2 { border-bottom: 3px solid #007bff; display: inline-block; padding-bottom: 5px; }
    .alerta { padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid; }
    .exito { background-color: #d1fae5; color: #065f46; border-color: #a7f3d0; }
    .error { background-color: #fee2e2; color: #991b1b; border-color: #fecaca; }
    section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .busqueda-box { background: #e0f2fe; }
    input { padding: 8px; margin: 5px; border: 1px solid #ccc; border-radius: 4px; }
    .acciones-globales { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
    th { background: #f1f5f9; }
    button { padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; }
    button:hover { opacity: 0.8; }
    
    .btn-inicial { background-color: #007bff; color: white; } /* Color Azul para Carga */
    .btn-guardar { background-color: #28a745; color: white; }
    .btn-buscar { background-color: #6f42c1; color: white; }
    .btn-recargar { background-color: #17a2b8; color: white; }
    .btn-peligro, .btn-borrar { background-color: #dc3545; color: white; }
    .btn-editar { background-color: #ffc107; color: #333; }
    .btn-paginacion { background: #eee; }
</style>