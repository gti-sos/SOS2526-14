<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Highcharts from 'highcharts';

	const API = '/api/v2/meteorite-landings';

	let chartContainer;           // Referencia al div donde Highcharts dibuja
	let loading    = $state(true);
	let errorMsg   = $state('');
	let totalCount = $state(0);   // Para mostrar cuántos registros válidos se usaron

	onMount(async () => {
		// onMount se ejecuta cuando el componente ya está en el DOM,
		// por eso chartContainer siempre existe aquí. Es la solución al problema anterior.
		await cargarYDibujar();
	});

	async function cargarYDibujar() {
		loading  = true;
		errorMsg = '';

		try {
			// Traemos todos los meteoritos sin paginación (limit=0 devuelve todo)
			const res = await fetch(`${API}?limit=0`);
			if (!res.ok) {
				errorMsg = `Error al cargar datos: ${res.status}`;
				return;
			}

			const datos = await res.json();

			// Filtramos registros con año válido:
			// - que tenga campo year
			// - que sea un número (no NaN, no null, no string vacío)
			// - que esté en un rango razonable (evita años como 0 o 999999)
			const datosValidos = datos.filter(m =>
				m.year &&
				!isNaN(Number(m.year)) &&
				Number(m.year) > 1960 &&
				Number(m.year) <= new Date().getFullYear()
			);

			totalCount = datosValidos.length;

			if (datosValidos.length === 0) {
				errorMsg = 'No hay datos con año válido para mostrar.';
				return;
			}

			// Agrupar por año y contar
			const yearCounts = {};
			datosValidos.forEach(m => {
				const y = Number(m.year);
				yearCounts[y] = (yearCounts[y] || 0) + 1;
			});

			const years  = Object.keys(yearCounts).sort((a, b) => Number(a) - Number(b));
			const counts = years.map(y => yearCounts[y]);

			// Dibujar el gráfico
			Highcharts.chart(chartContainer, {
				chart: {
					type: 'column'
				},
				title: {
					text: 'Meteoritos registrados por año'
				},
				subtitle: {
					text: `${totalCount} registros con año válido de un total de ${datos.length}`
				},
				xAxis: {
					categories: years,
					title:      { text: 'Año' },
					labels:     { rotation: -45, step: Math.ceil(years.length / 20) }
					// step evita solapar etiquetas si hay muchos años
				},
				yAxis: {
					min:   0,
					title: { text: 'Número de impactos' }
				},
				tooltip: {
					headerFormat: '<b>Año {point.key}</b><br>',
					pointFormat:  '{point.y} meteoritos registrados'
				},
				plotOptions: {
					column: {
						pointPadding: 0.1,
						borderWidth:  0
					}
				},
				series: [{
					name:  'Meteoritos',
					data:  counts,
					color: '#378ADD'
				}],
				credits: { enabled: false }
			});

		} catch (err) {
			errorMsg = 'Error de conexión con la API.';
			console.error(err);
		} finally {
			loading = false;
		}
	}
</script>

<h2>Gráfica de meteoritos por año</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver al listado</button>

<br><br>

{#if loading}
	<p>Cargando datos...</p>
{:else if errorMsg}
	<p style="color: red;">❌ {errorMsg}</p>
{/if}

<!-- El div siempre está en el DOM desde el primer render.
     Highcharts lo encontrará en onMount sin problemas. -->
<div
	bind:this={chartContainer}
	style="width: 100%; height: 500px; {loading ? 'display:none' : ''}"
></div>