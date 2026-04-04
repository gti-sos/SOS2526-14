<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    const API_URL = '/api/v1/active-satellites';

    let satellites = $state([]);
    let nuevoSatelite = $state({ 
        name: '', country: '', launch_date: '', launch_mass: '', 
        expected_lifetime: '', apogee_height: '', perigee_height: '' 
    });
    
    let mensajeExito = $state('');
    let mensajeError = $state('');

    let limit = 10; 
    let offset = $state(0); 
    let busquedaPais = $state('');
    let busquedaNombre = $state('');

    onMount(getSatellites);

    // --- GESTIÓN DE MENSAJES ---
    function mostrarExito(msg) {
        mensajeError = '';
        mensajeExito = msg;
        // El mensaje permanece 4 segundos
        setTimeout(() => mensajeExito = '', 4000);
    }

    function mostrarError(msg) {
        mensajeExito = '';
        mensajeError = msg;
    }

    // --- OPERACIONES ---

    async function getSatellites() {
        // Importante: No limpiamos mensajes aquí para que el éxito de otras funciones persista
        try {
            let url = `${API_URL}?limit=${limit}&offset=${offset}`;
            if (busquedaPais) url += `&country=${busquedaPais}`;
            if (busquedaNombre) url += `&name=${busquedaNombre}`;

            const res = await fetch(url);
            if (res.ok) {
                satellites = await res.json();
            }
        } catch (error) {
            mostrarError("Error de conexión al cargar los datos.");
        }
    }

    async function cargarDatosIniciales() {
        mensajeExito = ''; mensajeError = ''; // Limpiamos antes de empezar
        try {
            const res = await fetch(`${API_URL}/loadInitialData`);
            if (res.ok) {
                mostrarExito("¡Operación exitosa! Se han cargado los datos iniciales correctamente.");
                getSatellites();
            } else {
                mostrarError("No se han podido cargar los datos (posiblemente ya existan).");
            }
        } catch (e) {
            mostrarError("Error al conectar con el servidor.");
        }
    }

    async function crearSatelite() {
        mensajeExito = ''; mensajeError = ''; 
        try {
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
                mostrarExito(`¡Operación exitosa! El satélite "${nuevoSatelite.name}" ha sido añadido.`);
                // Resetear formulario
                nuevoSatelite = { name: '', country: '', launch_date: '', launch_mass: '', expected_lifetime: '', apogee_height: '', perigee_height: '' }; 
                getSatellites(); 
            } else {
                mostrarError("Error: El satélite ya existe o los datos son inválidos.");
            }
        } catch (e) {
            mostrarError("Error de red al intentar crear el satélite.");
        }
    }

    async function borrarSatelite(country, name) {
        mensajeExito = ''; mensajeError = '';
        if (!confirm(`¿Estás seguro de eliminar el satélite "${name}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/${country}/${name}`, { method: 'DELETE' });
            if (res.ok) {
                mostrarExito(`¡Operación exitosa! Satélite "${name}" eliminado.`);
                getSatellites();
            } else {
                mostrarError("No se ha podido eliminar el satélite.");
            }
        } catch (e) {
            mostrarError("Error al conectar con el servidor.");
        }
    }

    async function borrarTodos() {
        mensajeExito = ''; mensajeError = '';
        if (!confirm("¿Seguro que quieres vaciar TODA la base de datos?")) return;

        try {
            const res = await fetch(API_URL, { method: 'DELETE' });
            if (res.ok) {
                mostrarExito("¡Operación exitosa! Todos los datos han sido eliminados.");
                offset = 0;
                getSatellites();
            } else {
                mostrarError("Error al intentar vaciar la base de datos.");
            }
        } catch (e) {
            mostrarError("Error de conexión.");
        }
    }

    // Funciones auxiliares de búsqueda (estas sí limpian mensajes al ser manuales)
    function buscar() { mensajeExito = ''; mensajeError = ''; offset = 0; getSatellites(); }
    function recargarLista() { mensajeExito = ''; mensajeError = ''; busquedaPais = ''; busquedaNombre = ''; offset = 0; getSatellites(); }
</script>

<main>
    <h2>Gestión de Satélites</h2>

    {#if mensajeExito} 
        <div class="alerta exito">
            <strong>✅ {mensajeExito}</strong>
        </div> 
    {/if}

    {#if mensajeError} 
        <div class="alerta error">
            <strong>❌ {mensajeError}</strong>
        </div> 
    {/if}

    <section class="busqueda-box">
        <h3>🔍 Filtros</h3>
        <input type="text" placeholder="País" bind:value={busquedaPais}>
        <input type="text" placeholder="Nombre" bind:value={busquedaNombre}>
        <button onclick={buscar} class="btn-buscar">Buscar</button>
        <button onclick={recargarLista} class="btn-recargar">Limpiar</button>
    </section>

    <section class="formulario">
        <h3>➕ Nuevo Satélite</h3>
        <div class="grid-inputs">
            <input type="text" placeholder="Nombre" bind:value={nuevoSatelite.name}>
            <input type="text" placeholder="País" bind:value={nuevoSatelite.country}>
            <input type="number" placeholder="Masa (kg)" bind:value={nuevoSatelite.launch_mass}>
            </div>
        <button onclick={crearSatelite} class="btn-guardar">Guardar Satélite</button>
    </section>

    <div class="acciones-globales">
        <button onclick={cargarDatosIniciales} class="btn-inicial">📥 Cargar Datos Iniciales</button>
        <button onclick={borrarTodos} class="btn-peligro">🗑️ Borrar Todo</button>
    </div>

    <table>
        <thead>
            <tr><th>Nombre</th><th>País</th><th>Acciones</th></tr>
        </thead>
        <tbody>
            {#each satellites as s}
                <tr>
                    <td>{s.name}</td>
                    <td>{s.country}</td>
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
    /* Estilos para que los mensajes resalten */
    .alerta {
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 2px solid;
        font-size: 1.1rem;
        animation: slideDown 0.4s ease-out;
    }
    .exito { background-color: #d1fae5; color: #065f46; border-color: #34d399; }
    .error { background-color: #fee2e2; color: #991b1b; border-color: #f87171; }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Resto de estilos básicos */
    main { max-width: 1000px; margin: 40px auto; font-family: sans-serif; padding: 0 20px; }
    section { background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; }
    .acciones-globales { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 12px; border: 1px solid #eee; text-align: left; }
    button { padding: 8px 12px; border-radius: 5px; border: none; cursor: pointer; font-weight: bold