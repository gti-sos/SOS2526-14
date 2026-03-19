<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API_URL = '/api/v2/meteorite-landings';

    let meteorites = $state([]);
    let nuevoMeteorito = $state({ name: '', id: '', mass: '', year: '', geolocation: '', country: '' });
    
    let mensajeExito = $state('');
    let mensajeError = $state('');

    // --- PAGINACIÓN Y BÚSQUEDA ---
    let limit = 10; 
    let offset = $state(0); 
    let busquedaPais = $state('');
    let busquedaNombre = $state('');

    onMount(getMeteorites);

    async function getMeteorites() {
        limpiarMensajes();
        try {
            // Construimos la URL con paginación y las búsquedas si las hay
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (busquedaPais) url += `&country=${busquedaPais}`;
            if (busquedaNombre) url += `&name=${busquedaNombre}`;

            const res = await fetch(url);
            if (res.ok) {
                meteorites = await res.json();
                // Si la búsqueda no devuelve nada, avisamos
                if (meteorites.length === 0 && (busquedaPais || busquedaNombre)) {
                    mostrarError("No se encontraron meteoritos con esos filtros.");
                }
            } else {
                mostrarError("No se han podido cargar los datos.");
            }
        } catch (error) {
            mostrarError("Error de conexión con el servidor principal.");
        }
    }

    // --- FUNCIONES MEJORADAS ---
    function buscar() {
        offset = 0; // Al buscar, volvemos a la página 1
        getMeteorites();
    }

    function recargarLista() {
        // Limpiamos todo y volvemos a empezar
        busquedaPais = '';
        busquedaNombre = '';
        offset = 0; 
        getMeteorites();
    }

    function paginaSiguiente() {
        offset += limit;
        getMeteorites();
    }

    function paginaAnterior() {
        if (offset >= limit) {
            offset -= limit;
            getMeteorites();
        }
    }

    async function crearMeteorito() {
        limpiarMensajes();
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...nuevoMeteorito,
                id: Number(nuevoMeteorito.id),
                mass: Number(nuevoMeteorito.mass),
                year: Number(nuevoMeteorito.year)
            })
        });

        if (res.status === 201) {
            mostrarExito(`¡El meteorito ${nuevoMeteorito.name} se ha añadido correctamente!`);
            nuevoMeteorito = { name: '', id: '', mass: '', year: '', geolocation: '', country: '' }; 
            recargarLista(); 
        } else if (res.status === 409) {
            mostrarError(`Ya existe un meteorito registrado con el nombre '${nuevoMeteorito.name}'.`);
        } else if (res.status === 400) {
            mostrarError("Revisa los datos. Faltan campos obligatorios.");
        } else {
            mostrarError("Ha ocurrido un error inesperado al intentar guardar.");
        }
    }

    async function borrarMeteorito(country, name) {
        limpiarMensajes();
        if (!confirm(`¿Estás seguro de que quieres eliminar el meteorito ${name}?`)) return;

        const res = await fetch(`${API_URL}/${country}/${name}`, { method: 'DELETE' });

        if (res.status === 200) {
            mostrarExito(`El meteorito ${name} ha sido eliminado.`);
            getMeteorites(); // Recargamos la vista actual
        } else if (res.status === 404) {
            mostrarError(`No existe el meteorito '${name}' en '${country}'.`);
        } else {
            mostrarError("No se ha podido eliminar.");
        }
    }

    async function borrarTodos() {
        limpiarMensajes();
        if (!confirm("¡ATENCIÓN! ¿Seguro que quieres borrar TODOS los meteoritos?")) return;

        const res = await fetch(API_URL, { method: 'DELETE' });

        if (res.status === 200) {
            mostrarExito("Se han eliminado todos los meteoritos.");
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
    <h2>Gestión de Meteoritos</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="busqueda-box">
        <h3>🔍 Buscar Meteoritos</h3>
        <input type="text" placeholder="Buscar por País (ej. Spain)" bind:value={busquedaPais}>
        <input type="text" placeholder="Buscar por Nombre" bind:value={busquedaNombre}>
        <button onclick={buscar} class="btn-buscar">Buscar</button>
        <button onclick={recargarLista} class="btn-recargar">Limpiar y Recargar Lista</button>
    </section>

    <section class="formulario">
        <h3>➕ Añadir Nuevo Meteorito</h3>
        <input type="text" placeholder="Nombre" bind:value={nuevoMeteorito.name}>
        <input type="number" placeholder="ID" bind:value={nuevoMeteorito.id}>
        <input type="number" placeholder="Masa (g)" bind:value={nuevoMeteorito.mass}>
        <input type="number" placeholder="Año" bind:value={nuevoMeteorito.year}>
        <input type="text" placeholder="Geolocalización" bind:value={nuevoMeteorito.geolocation}>
        <input type="text" placeholder="País" bind:value={nuevoMeteorito.country}>
        
        <button onclick={crearMeteorito} class="btn-guardar">Añadir a la base de datos</button>
    </section>

    <div class="acciones-globales">
        <button onclick={borrarTodos} class="btn-peligro">Borrar TODO</button>
    </div>

    <div class="paginacion">
        <button onclick={paginaAnterior} disabled={offset === 0} class="btn-paginacion">⬅ Página Anterior</button>
        <span>Mostrando desde el {offset + 1} al {offset + limit}</span>
        <button onclick={paginaSiguiente} disabled={meteorites.length < limit} class="btn-paginacion">Página Siguiente ➡</button>
    </div>

    <table>
        <thead>
            <tr>
                <th>Nombre</th><th>ID</th><th>Masa (g)</th><th>Año</th><th>Geolocalización</th><th>País</th><th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each meteorites as m}
                <tr>
                    <td>{m.name}</td><td>{m.id}</td><td>{m.mass}</td><td>{m.year}</td>
                    <td>{m.geolocation || 'No disponible'}</td> <td>{m.country}</td>
                    <td>
                        <button onclick={() => goto(`/meteorite-landings/${m.country}/${m.name}`)} class="btn-editar">Editar</button>
                        <button onclick={() => borrarMeteorito(m.country, m.name)} class="btn-borrar">Eliminar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>

<style>
    /* PALETA DE COLORES SOS2526-14 DEFINITIVA:
       Minimalista, limpia y profesional.
    */
    :global(body) {
        background-color: #f8fafc; /* Gris azulado muy claro */
        color: #334155; /* Gris pizarra oscuro para texto principal */
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
        color: #1e293b; /* Azul grisáceo oscuro */
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 30px;
        border-bottom: 3px solid #007bff; /* Acento de marca */
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

    /* ZONA DE MENSAJES (Confirmación exitosa/error) */
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
    .exito {
        background-color: #d1fae5; /* Verde menta muy suave */
        color: #065f46; /* Verde bosque oscuro */
        border-color: #a7f3d0;
    }
    .error {
        background-color: #fee2e2; /* Rojo rosa muy suave */
        color: #991b1b; /* Rojo sangre oscuro */
        border-color: #fecaca;
    }

    /* TARJETAS DE FORMULARIOS (Búsqueda y Creación) */
    section {
        background: #ffffff;
        padding: 25px;
        border-radius: 12px;
        margin-bottom: 25px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e2e8f0;
    }

    .busqueda-box {
        background: #e0f2fe; /* Azul cielo muy suave */
        border-color: #bae6fd;
    }

    /* INPUTS MINIMALISTAS */
    input {
        padding: 10px 14px;
        margin: 6px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        font-size: 14px;
        transition: border-color 0.2s;
    }
    input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    /* BOTONES DE ACCIÓN GLOBALES */
    .acciones-globales {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        justify-content: flex-end;
    }

    /* LA TABLA MODERNA */
    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden; /* Para bordes redondeados */
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
        background-color: #f1f5f9; /* Gris suave */
        color: #64748b; /* Gris texto suave */
        font-weight: 700;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
    }
    tbody tr:last-child td {
        border-bottom: none;
    }
    tbody tr:nth-child(even) {
        background-color: #f8fafc; /* Filas alternas */
    }
    tbody tr:hover {
        background-color: #f1f5f9; /* Efecto hover */
    }

    /* BOTONES MINIMALISTAS CON ICONOS (Simulados) */
    button {
        padding: 8px 14px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    button:hover {
        opacity: 0.85;
        transform: translateY(-1px);
    }
    button:active {
        transform: translateY(0);
    }

    /* Colores de botones específicos */
    .btn-guardar { background-color: #28a745; color: white; } /* Verde éxito */
    .btn-recargar { background-color: #17a2b8; color: white; } /* Teal info */
    .btn-buscar { background-color: #6f42c1; color: white; } /* Púrpura búsqueda */
    .btn-peligro { background-color: #dc3545; color: white; } /* Rojo peligro */
    .btn-editar { background-color: #ffc107; color: #1e293b; } /* Amarillo alerta (texto oscuro) */
    .btn-borrar { background-color: #dc3545; color: white; } /* Rojo borrar */

    /* CONTROLES DE PAGINACIÓN MINIMALISTAS */
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