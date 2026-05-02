<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let chartContainer;
	let loading = $state(true);
	let errorMsg = $state('');

	onMount(async () => {
		try {
			// Importamos Highcharts dinámicamente
			const Highcharts = (await import('highcharts')).default;

			// 1. Opciones y colores EXACTAMENTE como en tu código
			Highcharts.setOptions({
				colors: [
					'rgba(5,141,199,0.5)', 'rgba(80,180,50,0.5)', 'rgba(237,86,27,0.5)'
				]
			});

			// 2. Definimos las series (Cambiamos Deportes por Categorías de Terremotos)
			const series = [{
				name: 'Moderado (Mag 4.5 - 5.0)',
				id: 'moderate',
				marker: { symbol: 'circle' }
			}, {
				name: 'Fuerte (Mag 5.0 - 6.0)',
				id: 'strong',
				marker: { symbol: 'triangle' }
			}, {
				name: 'Mayor (Mag 6.0+)',
				id: 'major',
				marker: { symbol: 'square' }
			}];

			// 3. Petición a la API del USGS
			const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson');
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const data = await response.json();

			// 4. Lógica "getData" exacta de tu código adaptada a los terremotos
			const getEqData = categoryId => {
				const temp = [];
				data.features.forEach(elm => {
					const mag = elm.properties.mag;
					const depth = elm.geometry.coordinates[2]; // En GeoJSON, la 3ª coordenada es la profundidad

					// Clasificamos el terremoto
					let category = '';
					if (mag >= 4.5 && mag < 5.0) category = 'moderate';
					else if (mag >= 5.0 && mag < 6.0) category = 'strong';
					else if (mag >= 6.0) category = 'major';

					// Si coincide con la serie actual, metemos [Eje X, Eje Y] -> [Profundidad, Magnitud]
					if (category === categoryId) {
						temp.push([depth, mag]);
					}
				});
				return temp;
			};

			// Llenamos las series con los datos
			series.forEach(s => {
				s.data = getEqData(s.id);
			});

			loading = false;

			// 5. Configuración del Gráfico EXACTA de tu código
			Highcharts.chart(chartContainer, {
				chart: {
					type: 'scatter',
					zooming: { type: 'xy' }
				},
				title: {
					text: 'Terremotos por Profundidad y Magnitud'
				},
				subtitle: {
					text: 'Fuente: <a href="https://earthquake.usgs.gov/" target="_blank">USGS (Servicio Geológico)</a>'
				},
				xAxis: {
					title: { text: 'Profundidad' },
					labels: { format: '{value} km' },
					startOnTick: true,
					endOnTick: true,
					showLastLabel: true
				},
				yAxis: {
					title: { text: 'Magnitud' },
					labels: { format: '{value} Richter' }
				},
				legend: {
					enabled: true
				},
				plotOptions: {
					scatter: {
						marker: {
							radius: 3.5, // Un poco más grande para que se vean bien
							states: {
								hover: {
									enabled: true,
									lineColor: 'rgb(100,100,100)'
								}
							}
						},
						states: {
							hover: {
								marker: { enabled: false }
							}
						},
						jitter: {
							x: 0.005
						}
					}
				},
				tooltip: {
					pointFormat: 'Profundidad: {point.x} km <br/> Magnitud: {point.y} Richter'
				},
				series: series
			});

		} catch (error) {
			errorMsg = `❌ Error al cargar USGS: ${error.message}`;
			loading = false;
		}
	});
</script>

<h2>Actividad Sísmica Global (Terremotos)</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Gráfico de dispersión que visualiza la relación entre la magnitud y la profundidad 
	de los impactos sísmicos terrestres usando la API pública del USGS.
</p>

{#if loading}
	<p>Cargando datos sísmicos...</p>
{:else if errorMsg}
	<p>{errorMsg}</p>
{/if}

<!-- Contenedor del gráfico oculto mientras carga para evitar el error nodeName -->
<figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'};">
	<div bind:this={chartContainer} id="container" style="border: 1px solid black;"></div>
	<p class="highcharts-description" style="font-size: 0.9em; color: gray; margin-top: 10px;">
		Los gráficos de dispersión se utilizan a menudo para visualizar las relaciones entre datos en dos dimensiones. 
		Este gráfico muestra cómo los terremotos más fuertes (Magnitud alta) tienden a agruparse en ciertas 
		profundidades tectónicas.
	</p>
</figure>

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>

<style>
	/* Mantenemos tu estilo minimalista pero asegurando que el gráfico no colapse */
	#container {
		width: 100%;
		max-width: 800px;
		height: 500px;
		margin: 1em 0;
	}
	
	.highcharts-figure {
		margin: 0;
	}
</style>