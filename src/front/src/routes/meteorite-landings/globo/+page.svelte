<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';
    import MapModule from 'highcharts/modules/map';

    const API = '/api/v2/meteorite-landings';

    let chartContainer;
    let loading = $state(true);
    let errorMsg = $state('');

    onMount(async () => {
        // Inicializar el módulo de mapas
        if (typeof MapModule === 'function') {
            MapModule(Highcharts);
        }
        await cargarYMapa();
    });

    // Función auxiliar para las líneas del globo (Graticule)
    const getGraticule = () => {
        const data = [];
        for (let x = -180; x <= 180; x += 15) {
            data.push({
                geometry: {
                    type: 'LineString',
                    coordinates: x % 90 === 0 ? [[x, -90], [x, 0], [x, 90]] : [[x, -80], [x, 80]]
                }
            });
        }
        for (let y = -90; y <= 90; y += 10) {
            const coordinates = [];
            for (let x = -180; x <= 180; x += 5) coordinates.push([x, y]);
            data.push({
                geometry: { type: 'LineString', coordinates },
                lineWidth: y === 0 ? 2 : undefined
            });
        }
        return data;
    };

    async function cargarYMapa() {
        loading = true;
        try {
            const res = await fetch(`${API}?limit=0`);
            const datos = await res.json();

            // 1. Agrupar por país y contar
            const countryCounts = {};
            datos.forEach(m => {
                if (m.country) {
                    countryCounts[m.country] = (countryCounts[m.country] || 0) + 1;
                }
            });

            // 2. Formatear para Highcharts: [{ name: "Spain", value: 10 }, ...]
            const mapData = Object.keys(countryCounts).map(name => ({
                name: name,
                value: countryCounts[name]
            }));

            // 3. Cargar la topología del mundo
            const topology = await fetch('https://code.highcharts.com/mapdata/custom/world.topo.json')
                .then(r => r.json());

            // 4. Dibujar el mapa (Globo)
            const chart = Highcharts.mapChart(chartContainer, {
                chart: { map: topology },
                title: { text: 'Distribución Global de Caída de Meteoritos' },
                subtitle: { text: 'Haz clic y arrastra para rotar el globo' },
                
                mapNavigation: {
                    enabled: true,
                    buttonOptions: { verticalAlign: 'bottom' }
                },

                mapView: {
                    projection: {
                        name: 'Orthographic',
                        rotation: [10, -20] // Posición inicial
                    }
                },

                colorAxis: {
                    min: 1,
                    type: 'logarithmic', // Usamos escala logarítmica por la gran diferencia de datos
                    minColor: '#f7fbff',
                    maxColor: '#08306b',
                    stops: [
                        [0, '#f7fbff'],
                        [0.2, '#deebf7'],
                        [0.4, '#9ecae1'],
                        [0.6, '#4292c6'],
                        [0.8, '#08519c'],
                        [1, '#08306b']
                    ]
                },

                tooltip: {
                    pointFormat: '{point.name}: <b>{point.value}</b> meteoritos'
                },

                series: [{
                    name: 'Graticule',
                    type: 'mapline',
                    data: getGraticule(),
                    nullColor: 'rgba(0, 0, 0, 0.05)',
                    enableMouseTracking: false
                }, {
                    data: mapData,
                    joinBy: 'name', // Une los datos con el mapa por el nombre del país
                    name: 'Meteoritos registrados',
                    states: {
                        hover: { color: '#a4edba' }
                    },
                    dataLabels: {
                        enabled: false,
                        format: '{point.name}'
                    }
                }]
            });

            // Efecto de mar (fondo circular)
            const renderSea = () => {
                if (!chart.sea) {
                    chart.sea = chart.renderer.circle().attr({
                        fill: {
                            radialGradient: { cx: 0.4, cy: 0.4, r: 1 },
                            stops: [[0, 'white'], [1, 'lightblue']]
                        },
                        zIndex: -1
                    }).add(chart.get('graticule').group);
                }
                const bounds = chart.get('graticule').bounds;
                const p1 = chart.mapView.projectedUnitsToPixels({ x: bounds.x1, y: bounds.y1 });
                const p2 = chart.mapView.projectedUnitsToPixels({ x: bounds.x2, y: bounds.y2 });
                chart.sea.attr({
                    cx: (p1.x + p2.x) / 2,
                    cy: (p1.y + p2.y) / 2,
                    r: Math.min(p2.x - p1.x, p1.y - p2.y) / 2
                });
            };
            renderSea();
            Highcharts.addEvent(chart, 'redraw', renderSea);

        } catch (err) {
            errorMsg = 'Error al cargar el mapa.';
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<h2>Mapa Mundial de Impactos</h2>
<button onclick={() => goto('/meteorite-landings')}>← Volver</button>

<div bind:this={chartContainer} style="width: 100%; height: 600px; margin-top: 20px;">
    {#if loading} <p>Cargando globo interactivo...</p> {/if}
</div>

<style>
    /* Estilos opcionales para mejorar la apariencia */
    h2 { text-align: center; color: #333; }
</style>