<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const API = '/api/v1/space-launches';

	let country = $derived(decodeURIComponent($page.params.country));
	let id = $derived(Number($page.params.id));

	let cargando = $state(true);
	let guardando = $state(false);
	let noEncontrado = $state(false);

	let form = $state({
		mission_id: 0,
		company_name: '',
		location: '',
		year: 0,
		rocket_name: '',
		mission_status: '',
		country: ''
	});

	let toasts = $state([]);

	function toast(msg, tipo = 'ok') {
		const tid = Date.now();
		toasts = [...toasts, { id: tid, msg, tipo }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== tid);
		}, 4000);
	}

	async function cargarMision() {
		cargando = true;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(country)}/${id}`);
			if (res.status === 404) {
				noEncontrado = true;
				return;
			}
			if (!res.ok) throw new Error();
			const data = await res.json();
			form = { ...data };
		} catch {
			toast('No se pudo cargar la misión. Comprueba tu conexión.', 'err');
		} finally {
			cargando = false;
		}
	}

	async function guardarCambios() {
		const datos = {
			mission_id: Number(form.mission_id),
			company_name: form.company_name.trim(),
			location: form.location.trim(),
			year: Number(form.year),
			rocket_name: form.rocket_name.trim(),
			mission_status: form.mission_status,
			country: form.country.trim()
		};

		const vacios = Object.entries(datos).filter(([_, v]) => v === '' || (typeof v === 'number' && v === 0));
		if (vacios.length > 0) {
			toast('Por favor, rellena todos los campos obligatorios.', 'err');
			return;
		}

		guardando = true;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(country)}/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(datos)
			});

			if (res.ok) {
				toast('✅ Misión actualizada correctamente.', 'ok');
				setTimeout(() => goto('/space-launches'), 1500);
			} else if (res.status === 404) {
				toast(`No se encontró la misión con ID ${id} en "${country}".`, 'err');
			} else if (res.status === 400) {
				const err = await res.json();
				toast(`Datos incorrectos: ${err.error}`, 'err');
			} else {
				toast('No se pudo guardar los cambios. Inténtalo de nuevo.', 'err');
			}
		} catch {
			toast('Error de conexión con el servidor.', 'err');
		} finally {
			guardando = false;
		}
	}

	cargarMision();
</script>

<div class="toast-container">
	{#each toasts as t (t.id)}
		<div class="toast {t.tipo}">{t.msg}</div>
	{/each}
</div>

<div class="page">
	<header>
		<div class="header-icon">✏️</div>
		<h1>EDITAR MISIÓN</h1>
		<p class="subtitle">Modificar datos · SOS2526-14</p>
		<a href="/space-launches" class="back-link">← Volver al listado</a>
	</header>

	{#if cargando}
		<div class="panel">
			<div class="empty">Cargando datos de la misión...</div>
		</div>
	{:else if noEncontrado}
		<div class="panel">
			<div class="empty">
				<span>🔍</span>
				No existe ninguna misión con ID <strong>{id}</strong> en el país <strong>{country}</strong>.
				<br /><br />
				<a href="/space-launches" class="back-link">← Volver al listado</a>
			</div>
		</div>
	{:else}
		<section class="panel">
			<h2 class="panel-title">📋 Datos de la misión #{id} · {country}</h2>
			<div class="form-grid">
				<div class="form-group">
					<label for="f-id">ID de misión</label>
					<input id="f-id" type="number" bind:value={form.mission_id} disabled />
					<span class="hint">El ID no se puede modificar</span>
				</div>
				<div class="form-group">
					<label for="f-company">Empresa *</label>
					<input id="f-company" type="text" placeholder="Ej: SpaceX" bind:value={form.company_name} />
				</div>
				<div class="form-group">
					<label for="f-location">Ubicación *</label>
					<input id="f-location" type="text" placeholder="Ej: Cape Canaveral" bind:value={form.location} />
				</div>
				<div class="form-group">
					<label for="f-year">Año *</label>
					<input id="f-year" type="number" placeholder="Ej: 2024" bind:value={form.year} />
				</div>
				<div class="form-group">
					<label for="f-rocket">Cohete *</label>
					<input id="f-rocket" type="text" placeholder="Ej: Falcon 9" bind:value={form.rocket_name} />
				</div>
				<div class="form-group">
					<label for="f-status">Estado de la misión *</label>
					<select id="f-status" bind:value={form.mission_status}>
						<option value="">— Seleccionar —</option>
						<option value="Success">Éxito</option>
						<option value="Failure">Fallo</option>
						<option value="Partial Failure">Fallo Parcial</option>
						<option value="Prelaunch Failure">Fallo Prelanzamiento</option>
					</select>
				</div>
				<div class="form-group">
					<label for="f-country">País *</label>
					<input id="f-country" type="text" placeholder="Ej: USA" bind:value={form.country} />
				</div>
			</div>
			<div class="btn-row">
				<button class="btn-primary" onclick={guardarCambios} disabled={guardando}>
					{guardando ? '⏳ Guardando...' : '💾 Guardar cambios'}
				</button>
				<a href="/space-launches" class="btn-secondary">✕ Cancelar</a>
			</div>
		</section>
	{/if}
</div>

<style>
	:global(body) {
		margin: 0;
		background: #04060f;
		color: #e8f4ff;
		font-family: 'DM Mono', 'Courier New', monospace;
	}

	.toast-container {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.toast {
		padding: 0.8rem 1.2rem;
		border-radius: 6px;
		font-size: 0.82rem;
		max-width: 340px;
		border-left: 3px solid;
		animation: slideIn 0.3s ease;
	}
	.toast.ok  { background: #001a10; border-color: #00ff9d; color: #00ff9d; }
	.toast.err { background: #1a0000; border-color: #ff4444; color: #ff4444; }

	@keyframes slideIn {
		from { opacity: 0; transform: translateX(30px); }
		to   { opacity: 1; transform: translateX(0); }
	}

	.page { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; }

	header { text-align: center; margin-bottom: 2.5rem; }
	.header-icon { font-size: 2.5rem; }

	h1 {
		font-size: clamp(1.4rem, 4vw, 2rem);
		font-weight: 900;
		background: linear-gradient(135deg, #ff6b35, #ffaa00);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin: 0.3rem 0;
	}

	.subtitle { color: #5a7a9f; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.15em; }

	.back-link { display: inline-block; margin-top: 0.6rem; color: #5a7a9f; font-size: 0.78rem; text-decoration: none; }
	.back-link:hover { color: #00d4ff; }

	.panel { background: #0c1428; border: 1px solid #1a2a50; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; }

	.panel-title {
		font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
		color: #ff6b35; margin: 0 0 1.2rem;
		display: flex; align-items: center; gap: 0.6rem;
	}
	.panel-title::after { content: ''; flex: 1; height: 1px; background: #1a2a50; }

	.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.8rem; }
	.form-group { display: flex; flex-direction: column; gap: 0.3rem; }

	label { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: #5a7a9f; }
	.hint { font-size: 0.65rem; color: #3a5a7f; font-style: italic; }

	input, select {
		background: #080d1e; border: 1px solid #1a2a50; border-radius: 5px;
		color: #e8f4ff; font-family: inherit; font-size: 0.85rem;
		padding: 0.55rem 0.75rem; transition: border-color 0.2s; outline: none;
	}
	input:focus, select:focus { border-color: #ff6b35; }
	input:disabled { opacity: 0.5; cursor: not-allowed; }
	input::placeholder { color: #5a7a9f; }
	select option { background: #080d1e; }

	.btn-row { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-top: 1.5rem; }

	button, a.btn-secondary {
		font-size: 0.78rem; letter-spacing: 0.05em; padding: 0.6rem 1.2rem;
		border-radius: 5px; border: none; cursor: pointer; transition: all 0.2s;
		text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;
	}

	.btn-primary { background: #ff6b35; color: #fff; font-weight: 700; }
	.btn-primary:hover:not(:disabled) { background: #e55a28; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

	a.btn-secondary { background: transparent; border: 1px solid #5a7a9f; color: #5a7a9f; }
	a.btn-secondary:hover { border-color: #e8f4ff; color: #e8f4ff; }

	.empty { text-align: center; padding: 3rem; color: #5a7a9f; font-size: 0.85rem; }
	.empty span { display: block; font-size: 2.5rem; margin-bottom: 0.8rem; }
</style>