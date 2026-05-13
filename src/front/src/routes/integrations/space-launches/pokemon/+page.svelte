<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    
    import Highcharts from 'highcharts';
    import HighchartsMore from 'highcharts/highcharts-more'; //Usado para formar el hexsagonno
    let loading = $state(true);
    let errorMsg = $state('');
    let chartInstance = null;

    async function cargarDatos() {
        try {
            const pokemons = ['charizard', 'blastoise', 'venusaur'];
            const promesasFetch = pokemons.map(nombre => 
                fetch(`https://pokeapi.co/api/v2/pokemon/${nombre}`).then(res => res.json())
            );
            
            const resultados = await Promise.all(promesasFetch);

            // 2. Extraemos las categorías (HP, Attack, Defense...) del primer Pokémon
            const categorias = resultados[0].stats.map(s => s.stat.name.toUpperCase());

            // 3. Preparamos las "capas" de la telaraña para cada Pokémon
            const datosSeries = resultados.map(poke => {
                return {
                    name: poke.name.charAt(0).toUpperCase() + poke.name.slice(1), // Primera letra en mayúscula
                    data: poke.stats.map(s => s.base_stat),
                    pointPlacement: 'on' // Clave para que los puntos encajen en las esquinas de la red
                };
            });

            datosSeries[0].color = '#e74c3c'; // Charizard (Rojo)
            datosSeries[1].color = '#3498db'; // Blastoise (Azul)
            datosSeries[2].color = '#2ecc71'; // Venusaur (Verde)

            dibujarGrafica(categorias, datosSeries);
            loading = false;
        } catch (err) {
            errorMsg = "Error al conectar con la API externa: " + err.message;
            loading = false;
        }
    }

    async function dibujarGrafica(categorias, seriesData) {
        await tick(); 

        chartInstance = Highcharts.chart('grafica-spiderweb', {
            chart: {
                polar: true, //  convierte gráfico plano en uno circular
                type: 'area', // Área rellena translúcida
                backgroundColor: '#ffffff'
            },
            title: {
                text: 'Comparativa de Estadísticas Base',
                style: { color: '#333333', fontSize: '22px', fontWeight: 'bold' }
            },
            subtitle: {
                text: 'Gráfico en forma de hexagono (Spiderweb Chart) - Directo desde PokeAPI',
                style: { color: '#666666' }
            },
            pane: {
                size: '80%'
            },
            xAxis: {
                categories: categorias,
                tickmarkPlacement: 'on',
                lineWidth: 0,
                labels: {
                    style: { color: '#333333', fontWeight: 'bold', fontSize: '12px' }
                }
            },
            yAxis: {
                gridLineInterpolation: 'polygon', // Esto hace que las líneas de fondo formen hexágono en vez de círculos
                lineWidth: 0,
                min: 0,
                max: 120, // Límite lógico para stats base
                labels: { style: { color: '#999999' } }
            },
            tooltip: {
                shared: true, // Muestra los datos de los 3 a la vez al pasar el ratón
                useHTML: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#cccccc',
                pointFormat: '<span style="color:{series.color}"><b>{series.name}</b></span>: {point.y}<br/>'
            },
            plotOptions: {
                area: {
                    fillOpacity: 0.2, // semitransparente para que se vean todos
                    lineWidth: 2,
                    marker: {
                        radius: 4,
                        symbol: 'circle'
                    }
                }
            },
            series: seriesData,
            credits: { enabled: false }
        });
    }

    onMount(() => {
        if (typeof HighchartsMore === 'function') HighchartsMore(Highcharts);
        else if (HighchartsMore && HighchartsMore.default) HighchartsMore.default(Highcharts);

        cargarDatos();
    });
</script>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>Volver a Integraciones</button>

    <h2>Integración Externa: Spiderweb Chart</h2>
    <p class="sub">Api Externa de Pokemon(podemos añadir otros pokemos si queremos).</p>

    {#if loading}
        <div class="status-msg">Descargando estadísticas de combate...</div>
    {:else if errorMsg}
        <div class="status-msg error">❌ {errorMsg}</div>
    {/if}

    <div id="grafica-spiderweb" class="tabla-box" style="display: {loading || errorMsg ? 'none' : 'block'}"></div>
</div>

<style>
    .wrap { background: #ffffff; min-height: 100vh; padding: 24px; font-family: sans-serif; color: #333333; max-width: 1000px; margin: 0 auto; }
    h2 { margin-bottom: 4px; color: #222222; }
    p.sub { color: #666666; font-size: 13px; margin-bottom: 16px; }
    .back-btn { background: #f9f9f9; border: 1px solid #dddddd; color: #333333; padding: 8px 14px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
    .back-btn:hover { background: #eeeeee; }
    code { background: #ccecf6; padding: 3px 6px; border-radius: 3px; font-weight: bold; color: #004a63; }
    .tabla-box { background: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; height: 650px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .status-msg { color: #555555; padding: 40px; text-align: center; background: #f9f9f9; border: 1px solid #e1e4e8; border-radius: 8px; }
    .error { color: #d73a49; border-color: #d73a49; background: #ffeef0; font-weight: bold; }
</style>