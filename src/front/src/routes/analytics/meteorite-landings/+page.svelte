<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Highcharts from 'highcharts';
    import Variwide from 'highcharts/modules/variwide';

	const API = '/api/v2/meteorite-landings';

	let chartContainer;           // Referencia al div donde Highcharts dibuja
	let loading    = $state(true);
	let errorMsg   = $state('');
	let totalCount = $state(0);   // Para mostrar cuántos registros válidos se usaron

	onMount(async () => {
        // Inicializar el módulo variwide pasándole Highcharts
        if (typeof Variwide === 'function') {
            Variwide(Highcharts);
        }
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

			if (totalCount.length === 0) {
				errorMsg = 'No hay datos válidos.';
				return;
			}

			// --- NUEVA LÓGICA DE AGRUPACIÓN ---
        const statsPerYear = {}; // Guardaremos { count: X, totalMass: Y }
            
            datosValidos.forEach(m => {
                const y = Number(m.year);
                const mass = Number(m.mass) || 0; // Si no hay masa, tratamos como 0

                if (!statsPerYear[y]) {
                    statsPerYear[y] = { count: 0, totalMass: 0 };
                }
                statsPerYear[y].count += 1;
                statsPerYear[y].totalMass += mass;
            });

            // Ordenamos los años
            const sortedYears = Object.keys(statsPerYear).sort((a, b) => Number(a) - Number(b));

            // Formateamos para Variwide: [nombre, valor_y (impactos), valor_z (masa)]
            const chartData = sortedYears.map(y => [
                String(y), 
                statsPerYear[y].count, 
                Math.round(statsPerYear[y].totalMass)
            ]);

            Highcharts.chart(chartContainer, {
                chart: { type: 'variwide' },
                title: { text: 'Meteoritos: Frecuencia vs Masa Total' },
                subtitle: { text: 'El ancho de la barra representa la masa total acumulada ese año' },
                xAxis: { type: 'category', title: { text: 'Año' } },
                yAxis: { title: { text: 'Número de Impactos' } },
                tooltip: {
                    shared: true,
                    pointFormat: 'Impactos: <b>{point.y}</b><br>' +
                                'Masa total: <b>{point.z} g</b><br>'
                },
                series: [{
                    name: 'Impactos por año',
                    data: chartData,
                    colorByPoint: true,
                    dataLabels: {
                        enabled: true,
                        format: '{point.y}'
                    }
                }],
                credits: { enabled: false }
            });

        } catch (err) {
            errorMsg = 'Error de conexión.';
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