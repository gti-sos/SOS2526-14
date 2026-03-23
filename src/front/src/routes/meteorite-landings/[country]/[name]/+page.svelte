<script>
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';

    const API_URL = '/api/v2/meteorite-landings';

    let countryParam = page.params.country;
    let nameParam = page.params.name;

    // MAGIA DE SVELTE 5
    let meteorite = $state({ name: '', id: '', mass: '', year: '', geolocation: '', country: '' });
    let mensajeExito = $state('');
    let mensajeError = $state('');

    onMount(getMeteorite);

    async function getMeteorite() {
        const res = await fetch(`${API_URL}/${countryParam}/${nameParam}`);
        if (res.status === 200) {
            meteorite = await res.json();
        } else if (res.status === 404) {
            mensajeError = `No hemos encontrado ningún meteorito llamado '${nameParam}' en '${countryParam}'.`;
        } else {
            mensajeError = "Error al conectar con la base de datos.";
        }
    }

    async function guardarCambios() {
        mensajeExito = ''; mensajeError = '';

        const res = await fetch(`${API_URL}/${countryParam}/${nameParam}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...meteorite,
                id: Number(meteorite.id),
                mass: Number(meteorite.mass),
                year: Number(meteorite.year)
            })
        });

        if (res.status === 200) {
            mensajeExito = "¡Los cambios se han guardado correctamente!";
            // Volvemos a la tabla después de un segundo y medio para que el usuario lea el mensaje verde
            setTimeout(() => goto('/meteorite-landings'), 1500);
        } else if (res.status === 400) {
            mensajeError = "No se ha podido guardar. Comprueba que no falten datos obligatorios.";
        } else if (res.status === 404) {
            mensajeError = "El meteorito que intentas editar ya no existe.";
        } else {
            mensajeError = "Ha ocurrido un error inesperado.";
        }
    }

    // --- NUEVA FUNCIÓN PARA ELIMINAR ---
    async function eliminarMeteorito() {
        mensajeExito = ''; mensajeError = '';
        
        // Pedimos confirmación por seguridad antes de borrar
        if (!confirm(`¿Estás seguro de que quieres eliminar el meteorito ${meteorite.name}? Esta acción no se puede deshacer.`)) return;

        const res = await fetch(`${API_URL}/${countryParam}/${nameParam}`, {
            method: 'DELETE'
        });

        if (res.status === 200) {
            mensajeExito = "¡El meteorito ha sido eliminado con éxito!";
            // Esperamos 1.5 segundos para que vea el mensaje de éxito y lo mandamos al listado
            setTimeout(() => goto('/meteorite-landings'), 1500);
        } else if (res.status === 404) {
            mensajeError = "El meteorito que intentas borrar ya no existe.";
        } else {
            mensajeError = "Ha ocurrido un error al intentar eliminar el meteorito.";
        }
    }
</script>

<main>
    <h2>✏️ Editar Meteorito</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="formulario">
        <div class="campo-grupo">
            <label>Nombre (No editable):</label>
            <input type="text" bind:value={meteorite.name} disabled>
        </div>
        
        <div class="campo-grupo">
            <label>País (No editable):</label>
            <input type="text" bind:value={meteorite.country} disabled>
        </div>

        <div class="campo-grupo">
            <label>ID:</label>
            <input type="number" bind:value={meteorite.id}>
        </div>
        
        <div class="campo-grupo">
            <label>Masa (g):</label>
            <input type="number" bind:value={meteorite.mass}>
        </div>
        
        <div class="campo-grupo">
            <label>Año:</label>
            <input type="number" bind:value={meteorite.year}>
        </div>
        
        <div class="campo-grupo">
            <label>Geolocalización:</label>
            <input type="text" bind:value={meteorite.geolocation}>
        </div>
        
        <div class="botones">
            <button onclick={guardarCambios} class="btn-guardar">Guardar cambios</button>
            <button onclick={eliminarMeteorito} class="btn-eliminar">Eliminar meteorito</button>
            <button onclick={() => goto('/meteorite-landings')} class="btn-volver">Cancelar y volver</button>
        </div>
    </section>
</main>

<style>
    /* Estilos compartidos con la página principal para mantener la coherencia */
    :global(body) {
        background-color: #f8fafc; 
        color: #334155; 
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 0;
    }

    main {
        max-width: 700px; /* Un poco más estrecho para el formulario */
        margin: 40px auto;
        padding: 0 20px;
    }

    h2 {
        color: #1e293b;
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 30px;
        border-bottom: 3px solid #ffc107; /* Acento amarillo para "Editar" */
        display: inline-block;
        padding-bottom: 5px;
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

    .formulario {
        background: #ffffff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .campo-grupo {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }

    label {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
    }

    input {
        padding: 12px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        font-size: 15px;
        transition: border-color 0.2s;
        width: 100%;
        box-sizing: border-box; /* Para que el padding no rompa el ancho */
    }
    input:focus:not(:disabled) {
        outline: none;
        border-color: #28a745;
        box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.1);
    }
    input:disabled {
        background-color: #f1f5f9;
        color: #94a3b8;
        cursor: not-allowed;
    }

    .botones {
        margin-top: 15px;
        display: flex;
        gap: 12px;
        padding-top: 15px;
        border-top: 1px solid #e2e8f0;
    }

    button {
        padding: 10px 18px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s;
    }
    button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    .btn-guardar { background-color: #28a745; color: white; }
    .btn-volver { background-color: #64748b; color: white; }
    
    /* ESTILO PARA EL NUEVO BOTÓN */
    .btn-eliminar { background-color: #dc3545; color: white; }
</style>