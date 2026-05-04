<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let chartContainer;
	let loading = $state(true);
	let errorMsg = $state('');

	onMount(async () => {
		try {
			// 1. Importaciones seguras de Highcharts y el módulo BOOST
			const HC = await import('highcharts');
			const Highcharts = HC.default || HC;

			const BoostModule = await import('highcharts/modules/boost');
			const initBoost = BoostModule.default || BoostModule;

			if (typeof initBoost === 'function') {
				initBoost(Highcharts);
			}

			// 2. Fetch DIRECTO (Sin proxy). 
			// API del Gobierno de NY. Pedimos 20.000 registros del censo de árboles.
			const url = 'https://data.cityofnewyork.us/resource/uvpi-gqnh.json?$limit=20000&$select=longitude,latitude';
			
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const rawData = await res.json();

			// 3. Procesamos los datos
			const chartData = [];
			
			rawData.forEach(tree => {
				// Extraemos Coordenadas (X: Longitud, Y: Latitud)
				if (tree.longitude && tree.latitude) {
					chartData.push([ parseFloat(tree.longitude), parseFloat(tree.latitude) ]);
				}
			});

			loading = false;

			// 4. Dibujamos el gráfico masivo con Boost
			console.time('scatter-boost');
			Highcharts.chart(chartContainer, {
				chart: {
					type: 'scatter',
					zooming: { type: 'xy' }
				},
				boost: {
					useGPUTranslations: true,
					usePreAllocated: true
				},
				title: {
					text: `Censo Forestal de Nueva York (${chartData.length.toLocaleString()} árboles)`,
					align: 'left'
				},
				subtitle: {
					text: 'Dibujando la ciudad a través de sus árboles. Fuente: NYC Open Data API'
				},
				xAxis: {
					title: { text: 'Longitud' },
					gridLineWidth: 1
				},
				yAxis: {
					title: { text: 'Latitud' },
					lineWidth: 1
				},
				legend: {
					enabled: false
				},
				tooltip: {
					pointFormat: 'Longitud: {point.x:.4f} <br/> Latitud: {point.y:.4f}'
				},
				series: [{
					name: 'Árboles',
					color: 'rgba(34, 139, 34, 0.4)', // Verde bosque transparente para ver la densidad
					data: chartData,
					marker: {
						radius: 1 // Radio minúsculo para que los puntos parezcan píxeles
					}
				}]
			});
			console.timeEnd('scatter-boost');

		} catch (error) {
			console.error(error);
			errorMsg = `❌ Error al cargar la API de Nueva York: ${error.message}`;
			loading = false;
		}
	});
</script>

<h2>Análisis Masivo: Censo Botánico (NYC)</h2>

<button onclick={() => goto('/integrations')}>← Volver al Menú</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Esta visualización utiliza el módulo <strong>Boost de Highcharts</strong> para procesar de forma nativa en el navegador 
	20.000 puntos de datos de la API pública <em>Socrata (NYC Open Data)</em> sin necesidad de proxy.
</p>

{#if loading}
	<p>Descargando censo de 20.000 árboles... (Preparando renderizado espacial masivo)</p>
{:else if errorMsg}
	<p>{errorMsg}</p>
{/if}

<figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'}; margin: 0;">
	<div bind:this={chartContainer} id="container" style="border: 1px solid black; width: 100%; max-width: 800px; height: 500px; margin-top: 10px;"></div>
	<p class="highcharts-description" style="font-size: 0.9em; color: gray; margin-top: 10px;">
		Al mapear miles de árboles usando únicamente sus coordenadas, los propios puntos dibujan la silueta 
		de las calles y parques de Nueva York (destacando zonas vacías como los edificios). 
		Haz clic y arrastra para hacer zoom en cualquier distrito.
	</p>
</figure>

<br>
<button onclick={() => goto('/integrations')}>← Volver al Menú</button>