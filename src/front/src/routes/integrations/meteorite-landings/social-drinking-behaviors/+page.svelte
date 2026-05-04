<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let chartContainer;
	let chartInstance; // Guardamos el gráfico para poder actualizarlo desde fuera
	let loading = $state(true);
	let errorMsg = $state('');
	
	// Nuevas variables para el desplegable
	let countriesData = $state([]); 
	let selectedIndex = $state(0); 

	onMount(async () => {
		try {
			// 1. Importaciones dinámicas
			const HC = await import('highcharts');
			const Highcharts = HC.default || HC;

			const HCMore = await import('highcharts/highcharts-more');
			const initHCMore = HCMore.default || HCMore;

			if (typeof initHCMore === 'function') {
				initHCMore(Highcharts);
			}

			// 2. Petición a la API del compañero de SOS (Grupo 25)
			const url = 'https://sos2526-25.onrender.com/api/v2/social-drinking-behaviors';
			const res = await fetch(url);
			
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			countriesData = await res.json();

			if (countriesData.length === 0) throw new Error("La API no devolvió datos.");

			loading = false;

			const maxLiters = 20; // Límite del velocímetro (20 litros)

			// 3. Dibujamos el gráfico inicial y lo guardamos en la variable chartInstance
			chartInstance = Highcharts.chart(chartContainer, {
				chart: {
					type: 'gauge',
					plotBackgroundColor: null,
					plotBackgroundImage: null,
					plotBorderWidth: 0,
					plotShadow: false,
					height: '80%'
				},
				title: {
					text: 'Consumo de Alcohol per Cápita'
				},
				subtitle: {
					text: `País: ${countriesData[0].country} (${countriesData[0].year})`,
					style: { fontSize: '18px', fontWeight: 'bold', color: '#df5353' }
				},
				pane: {
					startAngle: -90,
					endAngle: 89.9,
					background: null,
					center: ['50%', '75%'],
					size: '110%'
				},
				yAxis: {
					min: 0,
					max: maxLiters,
					tickPixelInterval: 72,
					tickPosition: 'inside',
					tickColor: '#FFFFFF',
					tickLength: 20,
					tickWidth: 2,
					minorTickInterval: null,
					labels: {
						distance: 20,
						style: { fontSize: '14px' }
					},
					lineWidth: 0,
					plotBands: [{
						from: 0, to: 5, color: '#55BF3B', thickness: 20, borderRadius: '50%'
					}, {
						from: 5, to: 12, color: '#DDDF0D', thickness: 20, borderRadius: '50%'
					}, {
						from: 12, to: maxLiters, color: '#DF5353', thickness: 20, borderRadius: '50%'
					}]
				},
				series: [{
					name: 'Consumo Total',
					data: [countriesData[0].total_liter],
					tooltip: { valueSuffix: ' litros/año' },
					dataLabels: {
						format: '{y} L',
						borderWidth: 0,
						style: { fontSize: '16px' }
					},
					dial: {
						radius: '80%', backgroundColor: 'gray', baseWidth: 12, baseLength: '0%', rearLength: '0%'
					},
					pivot: {
						backgroundColor: 'gray', radius: 6
					}
				}]
			});

		} catch (error) {
			console.error(error);
			errorMsg = `❌ Error al conectar con la API: ${error.message}`;
			loading = false;
		}
	});

	// 4. Función que se ejecuta cuando el usuario cambia el desplegable
	function updateChart() {
		if (chartInstance && countriesData.length > 0) {
			const currentCountry = countriesData[selectedIndex];
			
			// Actualizamos la posición de la aguja
			const point = chartInstance.series[0].points[0];
			point.update(currentCountry.total_liter);

			// Actualizamos el subtítulo
			chartInstance.setTitle(null, {
				text: `País: ${currentCountry.country} (${currentCountry.year})`
			});
		}
	}
</script>

<h2>Integración API Externa: SOS2526-25</h2>

<button onclick={() => goto('/integrations')}>← Volver al Menú</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<p>
	Visualización utilizando un gráfico de tipo <strong>Gauge (Velocímetro)</strong>. Consume la API 
	sobre <em>Comportamientos de consumo de alcohol</em> desarrollada por el grupo 25. 
	Usa el menú desplegable a continuación para consultar el registro de cada país.
</p>

{#if loading}
	<p>Conectando con la base de datos del Grupo 25...</p>
{:else if errorMsg}
	<p>{errorMsg}</p>
{:else}
	<!-- EL NUEVO DESPLEGABLE INTERACTIVO -->
	<div class="selector-container">
		<label for="countrySelect"><strong>Selecciona un país: </strong></label>
		<select id="countrySelect" bind:value={selectedIndex} onchange={updateChart}>
			{#each countriesData as data, index}
				<option value={index}>{data.country} ({data.year})</option>
			{/each}
		</select>
	</div>
{/if}

<!-- Contenedor del gráfico oculto mientras carga -->
<figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'}; margin: 0;">
	<div bind:this={chartContainer} id="container" style="border: 1px solid black; width: 100%; max-width: 600px; height: 400px; margin-top: 10px;"></div>
	<p class="highcharts-description" style="font-size: 0.9em; color: gray; margin-top: 10px;">
		El velocímetro indica el consumo total de alcohol (litros). 
		Zonas: Verde (0-5L), Amarillo (5-12L), Rojo (12L+).
	</p>
</figure>

<br>
<button onclick={() => goto('/integrations')}>← Volver al Menú</button>

<style>
	.highcharts-figure {
		margin: 1em auto;
	}
	#container {
		margin: auto;
	}
	/* Estilos para el desplegable */
	.selector-container {
		text-align: center;
		margin-bottom: 20px;
		padding: 15px;
		background-color: #f1f5f9;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
	}
	select {
		padding: 5px 10px;
		font-size: 16px;
		margin-left: 10px;
		border-radius: 4px;
		border: 1px solid #94a3b8;
		cursor: pointer;
	}
</style>