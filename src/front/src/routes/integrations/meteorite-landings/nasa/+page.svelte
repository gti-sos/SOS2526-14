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
			// Pedimos TODOS los terremotos (sin importar magnitud) de los últimos 30 días.
			// Esto devuelve unos 10.000 registros de media.
			const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
			
			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const rawData = await res.json();

			// 3. Procesamos los datos
			const chartData = [];
			
			rawData.features.forEach(eq => {
				const mag = eq.properties.mag;
				const depth = eq.geometry.coordinates[2]; // Profundidad en km
				
				// Filtramos datos corruptos o terremotos con magnitud negativa (ruido sísmico)
				if (mag !== null && depth !== null && mag > 0) {
					chartData.push([ depth, mag ]);
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
					text: `Enjambre Sísmico Global (${chartData.length.toLocaleString()} registros)`,
					align: 'left'
				},
				subtitle: {
					text: 'Correlación Profundidad (km) vs Magnitud. Fuente: USGS Earthquake Hazards Program'
				},
				xAxis: {
					title: { text: 'Profundidad (km)' },
					gridLineWidth: 1,
					min: 0
				},
				yAxis: {
					title: { text: 'Magnitud (Richter)' },
					lineWidth: 1,
					min: 0
				},
				legend: {
					enabled: false
				},
				tooltip: {
					pointFormat: 'Profundidad: {point.x:.1f} km <br/> Magnitud: {point.y:.1f} Richter'
				},
				series: [{
					name: 'Terremotos',
					color: 'rgba(237, 86, 27, 0.2)', // Naranja transparente para ver la densidad
					data: chartData,
					marker: {
						radius: 1.5 // Radio pequeño para visualizar correctamente 10.000 puntos
					}
				}]
			});
			console.timeEnd('scatter-boost');

		} catch (error) {
			console.error(error);
			errorMsg = `❌ Error al cargar la API del USGS: ${error.message}`;
			loading = false;
		}
	});
</script>

<h2>Análisis Masivo: Actividad Sísmica Global</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Esta visualización utiliza el módulo <strong>Boost de Highcharts</strong> para procesar directamente en el navegador 
	una descarga masiva de datos (aproximadamente 10.000 registros). Usamos la API del USGS para analizar 
	todos los seísmos terrestres del último mes sin necesidad de proxy.
</p>

{#if loading}
	<p>Descargando registro sísmico global... (Preparando renderizado masivo)</p>
{:else if errorMsg}
	<p>{errorMsg}</p>
{/if}

<figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'}; margin: 0;">
	<div bind:this={chartContainer} id="container" style="border: 1px solid black; width: 100%; max-width: 800px; height: 500px; margin-top: 10px;"></div>
	<p class="highcharts-description" style="font-size: 0.9em; color: gray; margin-top: 10px;">
		El mapeo de miles de puntos revela la densidad de la actividad tectónica. 
		Podemos observar a qué profundidades (Eje X) se acumula la mayor cantidad de terremotos y si alcanzan magnitudes peligrosas (Eje Y).
		Haz clic y arrastra para hacer zoom en cualquier aglomeración.
	</p>
</figure>

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>