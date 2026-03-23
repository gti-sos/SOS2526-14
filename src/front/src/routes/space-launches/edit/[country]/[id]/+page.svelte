<script>
    import { page } from '$app/state';
    import { goto } from '$app/navigation';

    const API = '/api/v1/space-launches';

    let countryParam = page.params.country;
    let idParam = page.params.id;

    let mision = $state({ mission_id: '', company_name: '', location: '', year: '', rocket_name: '', mission_status: '', country: '' });
    let mensajeExito = $state('');
    let mensajeError = $state('');

    getMision();

    async function getMision() {
        const res = await fetch(`${API}/${countryParam}/${idParam}`);
        if (res.status === 200) {
            mision = await res.json();
        } else if (res.status === 404) {
            mensajeError = `No se ha encontrado ninguna misión con ID '${idParam}' en '${countryParam}'.`;
        } else {
            mensajeError = "Error al conectar con la base de datos.";
        }
    }

    async function guardarCambios() {
        mensajeExito = ''; mensajeError = '';

        const res = await fetch(`${API}/${countryParam}/${idParam}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...mision,
                mission_id: Number(mision.mission_id),
                year: Number(mision.year)
            })
        });

        if (res.status === 200) {
            mensajeExito = "¡Los cambios se han guardado correctamente!";
            setTimeout(() => goto('/space-launches'), 1500);
        } else if (res.status === 400) {
            mensajeError = "No se ha podido guardar. Comprueba que no falten datos obligatorios.";
        } else if (res.status === 404) {
            mensajeError = "La misión que intentas editar ya no existe.";
        } else {
            mensajeError = "Ha ocurrido un error inesperado.";
        }
    }
</script>

<main>
    <h2>✏️ Editar Misión</h2>

    {#if mensajeExito} <div class="alerta exito">{mensajeExito}</div> {/if}
    {#if mensajeError} <div class="alerta error">{mensajeError}</div> {/if}

    <section class="formulario">
        <div class="campo-grupo">
            <label for="mission_id">ID de misión (No editable):</label>
            <input id="mission_id" type="number" bind:value={mision.mission_id} disabled>
        </div>
        <div class="campo-grupo">
            <label for="company_name">Empresa:</label>
            <input id="company_name" type="text" bind:value={mision.company_name}>
        </div>
        <div class="campo-grupo">
            <label for="location">Ubicación:</label>
            <input id="location" type="text" bind:value={mision.location}>
        </div>
        <div class="campo-grupo">
            <label for="year">Año:</label>
            <input id="year" type="number" bind:value={mision.year}>
        </div>
        <div class="campo-grupo">
            <label for="rocket_name">Cohete:</label>
            <input id="rocket_name" type="text" bind:value={mision.rocket_name}>
        </div>
        <div class="campo-grupo">
            <label for="mission_status">Estado de la misión:</label>
            <select id="mission_status" bind:value={mision.mission_status}>
                <option value="">-- Seleccionar --</option>
                <option value="Success">Éxito</option>
                <option value="Failure">Fallo</option>
                <option value="Partial Failure">Fallo Parcial</option>
                <option value="Prelaunch Failure">Fallo Prelanzamiento</option>
            </select>
        </div>
        <div class="campo-grupo">
            <label for="country">País (No editable):</label>
            <input id="country" type="text" bind:value={mision.country} disabled>
        </div>
        <div class="botones">
            <button onclick={guardarCambios} class="btn-guardar">Guardar cambios</button>
            <button onclick={() => goto('/space-launches')} class="btn-volver">Cancelar y volver</button>
        </div>
    </section>
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
        max-width: 700px;
        margin: 40px auto;
        padding: 0 20px;
    }

    h2 {
        color: #1e293b;
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 30px;
        border-bottom: 3px solid #ffc107;
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
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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

    input, select {
        padding: 12px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background-color: #ffffff;
        font-size: 15px;
        transition: border-color 0.2s;
        width: 100%;
        box-sizing: border-box;
    }
    input:focus:not(:disabled), select:focus {
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
    button:hover { opacity: 0.9; transform: translateY(-1px); }

    .btn-guardar { background-color: #28a745; color: white; }
    .btn-volver { background-color: #64748b; color: white; }
</style>