<script>
	const API = '/api/v1/space-launches';

	let misiones = $state([]);
	let cargando = $state(true);
	let busqueda = $state('');

	let form = $state({
		mission_id: '',
		company_name: '',
		location: '',
		year: '',
		rocket_name: '',
		mission_status: '',
		country: ''
	});

	let toasts = $state([]);

	function toast(msg, tipo = 'ok') {
		const id = Date.now();
		toasts = [...toasts, { id, msg, tipo }];
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 4000);
	}

	async function cargarMisiones() {
		cargando = true;
		try {
			const res = await fetch(API);
			if (!res.ok) throw new Error();
			misiones = await res.json();
		} catch {
			toast('No se pudo conectar con el servidor. Comprueba que está activo.', 'err');
			misiones = [];
		} finally {
			cargando = false;
		}
	}

	async function crearMision() {
		const datos = {
			mission_id: Number(form.mission_id),
			company_name: form.company_name.trim(),
			location: form.location.trim(),
			year: Number(form.year),
			rocket_name: form.rocket_name.trim(),
			mission_status: form.mission_status,
			country: form.country.trim()
		};

		const vacios = Object.entries(datos).filter(([_, v]) => v === '' || v === 0);
		if (vacios.length > 0) {
			toast('Por favor, rellena todos los campos obligatorios.', 'err');
			return;
		}

		try {
			const res = await fetch(API, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(datos)
			});

			if (res.status === 201) {
				toast(`✅ Misión ${datos.mission_id} registrada correctamente.`, 'ok');
				limpiarFormulario();
				cargarMisiones();
			} else if (res.status === 409) {
				toast(`Ya existe una misión con el ID ${datos.mission_id}.`, 'err');
			} else if (res.status === 400) {
				const err = await res.json();
				toast(`Datos incorrectos: ${err.faltantes?.join(', ') || err.error}`, 'err');
			} else {
				toast('No se pudo registrar la misión. Inténtalo de nuevo.', 'err');
			}
		} catch {
			toast('Error de conexión con el servidor.', 'err');
		}
	}

	async function borrarMision(country, id, nombre) {
		if (!confirm(`¿Seguro que quieres eliminar la misión "${nombre}" (ID: ${id})?`)) return;
		try {
			const res = await fetch(`${API}/${encodeURIComponent(country)}/${id}`, { method: 'DELETE' });
			if (res.ok) {
				toast(`Misión ${id} eliminada correctamente.`, 'ok');
				cargarMisiones();
			} else if (res.status === 404) {
				toast(`No se encontró la misión con ID ${id}.`, 'err');
			} else {
				toast('No se pudo eliminar la misión.', 'err');
			}
		} catch {
			toast('Error de conexión con el servidor.', 'err');
		}
	}

	async function borrarTodo() {
		if (!confirm('⚠️ ¿Seguro que quieres eliminar TODAS las misiones? Esta acción no se puede deshacer.')) return;
		try {
			const res = await fetch(API, { method: 'DELETE' });
			if (res.ok) {
				const data = await res.json();
				toast(`Se han eliminado ${data.removed} misiones correctamente.`, 'ok');
				cargarMisiones();
			} else {
				toast('No se pudo eliminar la colección.', 'err');
			}
		} catch {
			toast('Error de conexión con el servidor.', 'err');
		}
	}

	function limpiarFormulario() {
		form = { mission_id: '', company_name: '', location: '', year: '', rocket_name: '', mission_status: '', country: '' };
	}

	let misionesFiltradas = $derived(
		misiones.filter((m) => {
			const q = busqueda.toLowerCase();
			return (
				m.company_name?.toLowerCase().includes(q) ||
				m.country?.toLowerCase().includes(q) ||
				m.rocket_name?.toLowerCase().includes(q) ||
				m.location?.toLowerCase().includes(q) ||
				String(m.year).includes(q)
			);
		})
	);

	function statusClass(s) {
		if (!s) return '';
		const sl = s.toLowerCase();
		if (sl === 'success') return 'badge-success';
		if (sl === 'failure') return 'badge-failure';
		if (sl.includes('partial')) return 'badge-partial';
		if (sl.includes('prelaunch')) return 'badge-prelaunch';
		return '';
	}

	function statusLabel(s) {
		const map = {
			success: 'Éxito',
			failure: 'Fallo',
			'partial failure': 'Fallo Parcial',
			'prelaunch failure': 'Fallo Prelanzamiento'
		};
		return map[s?.toLowerCase()] ?? s ?? '—';
	}

	cargarMisiones();
</script>

<div class="toast-container">
	{#each toasts as t (t.id)}
		<div class="toast {t.tipo}">{t.msg}</div>
	{/each}
</div>

<div class="page">
	<header>
		<div class="header-icon">🚀</div>
		<h1>LANZAMIENTOS ESPACIALES</h1>
		<p class="subtitle">Sistema de Gestión de Misiones · SOS2526-14</p>
		<a href="/" class="back-link">← Volver al inicio</a>
	</header>

	<section class="panel">
		<h2 class="panel-title">✦ Registrar nueva misión</h2>
		<div class="form-grid">
			<div class="form-group">
				<label for="f-id">ID de misión *</label>
				<input id="f-id" type="number" placeholder="Ej: 1001" bind:value={form.mission_id} />
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
			<button class="btn-primary" onclick={crearMision}>＋ Registrar misión</button>
			<button class="btn-secondary" onclick={limpiarFormulario}>↺ Limpiar</button>
		</div>
	</section>

	<section class="panel">
		<h2 class="panel-title">📡 Misiones registradas</h2>
		<div class="toolbar">
			<input class="search-box" type="text" placeholder="Filtrar por empresa, país, cohete..." bind:value={busqueda} />
			<button class="btn-secondary" onclick={cargarMisiones}>↻ Actualizar</button>
			<button class="btn-danger" onclick={borrarTodo}>🗑 Borrar todo</button>
			<span class="count-badge">Total: <strong>{misionesFiltradas.length}</strong></span>
		</div>

		{#if cargando}
			<div class="empty">Cargando misiones...</div>
		{:else if misionesFiltradas.length === 0}
			<div class="empty">
				<span>🛸</span>
				No se encontraron misiones
			</div>
		{:else}
			<div class="table-wrap">
				<table>
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
						{#each misionesFiltradas as m (m.mission_id + m.country)}
							<tr>
								<td>{m.mission_id}</td>
								<td>{m.company_name}</td>
								<td>{m.rocket_name}</td>
								<td>{m.location}</td>
								<td>{m.year}</td>
								<td>{m.country}</td>
								<td><span class="badge {statusClass(m.mission_status)}">{statusLabel(m.mission_status)}</span></td>
								<td>
									<div class="action-btns">
										<a class="btn-icon" href="/space-launches/edit/{encodeURIComponent(m.country)}/{m.mission_id}">✏️ Editar</a>
										<button class="btn-icon del" onclick={() => borrarMision(m.country, m.mission_id, m.company_name)}>🗑 Eliminar</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
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

	.page { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

	header { text-align: center; margin-bottom: 2.5rem; }
	.header-icon { font-size: 3rem; }

	h1 {
		font-size: clamp(1.4rem, 4vw, 2.4rem);
		font-weight: 900;
		background: linear-gradient(135deg, #00d4ff, #00ff9d);
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
		color: #00d4ff; margin: 0 0 1.2rem;
		display: flex; align-items: center; gap: 0.6rem;
	}
	.panel-title::after { content: ''; flex: 1; height: 1px; background: #1a2a50; }

	.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.8rem; }
	.form-group { display: flex; flex-direction: column; gap: 0.3rem; }

	label { font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; color: #5a7a9f; }

	input, select {
		background: #080d1e; border: 1px solid #1a2a50; border-radius: 5px;
		color: #e8f4ff; font-family: inherit; font-size: 0.85rem;
		padding: 0.55rem 0.75rem; transition: border-color 0.2s; outline: none;
	}
	input:focus, select:focus { border-color: #00d4ff; }
	input::placeholder { color: #5a7a9f; }
	select option { background: #080d1e; }

	.btn-row { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-top: 1rem; }

	button {
		font-size: 0.78rem; letter-spacing: 0.05em; padding: 0.55rem 1.1rem;
		border-radius: 5px; border: none; cursor: pointer; transition: all 0.2s;
	}

	.btn-primary  { background: #00d4ff; color: #04060f; font-weight: 700; }
	.btn-primary:hover { background: #00b8dd; }
	.btn-secondary { background: transparent; border: 1px solid #5a7a9f; color: #5a7a9f; }
	.btn-secondary:hover { border-color: #e8f4ff; color: #e8f4ff; }
	.btn-danger { background: transparent; border: 1px solid #ff4444; color: #ff4444; }
	.btn-danger:hover { background: #ff4444; color: #fff; }

	.toolbar { display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
	.search-box { flex: 1; min-width: 180px; }
	.count-badge { font-size: 0.78rem; color: #5a7a9f; margin-left: auto; }
	.count-badge strong { color: #00d4ff; }

	.table-wrap { overflow-x: auto; border-radius: 8px; border: 1px solid #1a2a50; }
	table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
	thead tr { background: #080d1e; }
	th {
		font-size: 0.63rem; letter-spacing: 0.15em; text-transform: uppercase;
		color: #5a7a9f; padding: 0.75rem 1rem; text-align: left;
		border-bottom: 1px solid #1a2a50; white-space: nowrap;
	}
	td { padding: 0.7rem 1rem; border-bottom: 1px solid #0f1d3a; vertical-align: middle; }
	tr:last-child td { border-bottom: none; }
	tbody tr:hover { background: #0f1a30; }

	.badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.7rem; }
	.badge-success   { background: #00ff9d22; color: #00ff9d; border: 1px solid #00ff9d44; }
	.badge-failure   { background: #ff444422; color: #ff4444; border: 1px solid #ff444444; }
	.badge-partial   { background: #ffaa0022; color: #ffaa00; border: 1px solid #ffaa0044; }
	.badge-prelaunch { background: #00d4ff22; color: #00d4ff; border: 1px solid #00d4ff44; }

	.action-btns { display: flex; gap: 0.4rem; }
	.btn-icon {
		background: transparent; border: 1px solid #1a2a50; color: #5a7a9f;
		padding: 0.3rem 0.6rem; font-size: 0.75rem; border-radius: 4px;
		cursor: pointer; transition: all 0.15s; text-decoration: none;
		display: inline-flex; align-items: center;
	}
	.btn-icon:hover     { border-color: #00d4ff; color: #00d4ff; }
	.btn-icon.del:hover { border-color: #ff4444; color: #ff4444; }

	.empty { text-align: center; padding: 3rem; color: #5a7a9f; font-size: 0.85rem; }
	.empty span { display: block; font-size: 2.5rem; margin-bottom: 0.8rem; }
</style>