<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';
    
    // Importamos los módulos necesarios para crear las "Piruletas"
    import HighchartsMore from 'highcharts/highcharts-more';
    import HighchartsDumbbell from 'highcharts/modules/dumbbell';
    import HighchartsLollipop from 'highcharts/modules/lollipop';

    let loading = $state(true);
    let errorMsg = $state('');
    
    // Variables para manejar los datos y el desplegable
    let todosLosDatos = [];
    let añosDisponibles = $state([]);
    let añoSeleccionado = $state(null);
    let chartInstance = null;

    const API_COMPA = 'https://sos2526-15.onrender.com/api/v2/happiness-indices';

    onMount(async () => {
        // Inicializamos los módulos de las piruletas antes de cargar datos
        if (typeof HighchartsMore === 'function') HighchartsMore(Highcharts);
        if (typeof HighchartsDumbbell === 'function') HighchartsDumbbell(Highcharts);
        if (typeof HighchartsLollipop === 'function') HighchartsLollipop(Highcharts);

        try {
            // 1. Cargamos todos los datos
            let res = await fetch(API_COMPA);
            let data = await res.json();
            
            if (Array.isArray(data) && data.length === 0) {
                await fetch(API_COMPA + '/loadinitialdata');
                res = await fetch(API_COMPA);
                data = await res.json();
            }

            todosLosDatos = data;

            // 2. Extraemos los años únicos y los ordenamos de más reciente a más antiguo
            const añosSet = new Set(data.map(d => d.year).filter(y => y !== undefined));
            añosDisponibles = Array.from(añosSet).sort((a, b) => b - a);
            
            // Seleccionamos por defecto el año más reciente
            if (añosDisponibles.length > 0) {
                añoSeleccionado = añosDisponibles[0];
            }

            // Quitamos el loading para que Svelte pinte el <div> de la gráfica
            loading = false;
            await tick(); 

            // Dibujamos la gráfica por primera vez
            if (añoSeleccionado) dibujarGrafica();

        } catch(err) {
            errorMsg = `❌ Error al cargar la API: ${err.message}`;
            loading = false;
        }
    });

    // Función que pinta la gráfica (la llamamos al iniciar y cada vez que cambia el desplegable)
    function dibujarGrafica() {
        // Filtramos los datos por el año que esté seleccionado en el desplegable
        const datosDelAño = todosLosDatos.filter(d => d.year === añoSeleccionado && d.happiness_score);
        
        // Ordenamos por los más felices y cogemos los 10 primeros para que se vea bien
        const top10 = datosDelAño.sort((a, b) => b.happiness_score - a.happiness_score).slice(0, 10);
        
        // Preparamos los datos
        const paises = top10.map(d => d.country.charAt(0).toUpperCase() + d.country.slice(1));
        const pibData = top10.map(d => d.gdp_per_capita);
        const apoyoSocialData = top10.map(d => d.social_support);

        // Si ya había una gráfica dibujada, la destruimos antes de pintar la nueva
        if (chartInstance) chartInstance.destroy();

        chartInstance = Highcharts.chart('grafica-felicidad', {
            chart: { 
                type: 'lollipop', 
                backgroundColor: '#ffffff'
            },
            title: { 
                text: `Desglose de la Felicidad por País (${añoSeleccionado})`,
                style: { fontWeight: 'bold' }
            },
            subtitle: { text: 'Muestra cuántos puntos aporta el PIB y el Apoyo Social a la nota final de felicidad' },
            xAxis: { 
                categories: paises,
                title: { text: null },
                labels: { style: { fontWeight: 'bold' } }
            },
            yAxis: { 
                min: 0,
                title: { text: 'Puntos aportados a la nota (sobre 10)', align: 'high' },
                labels: { overflow: 'justify' },
                gridLineColor: '#eeeeee'
            },
            tooltip: { 
                shared: true,
                valueSuffix: ' puntos',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
            },
            plotOptions: {
                lollipop: {
                    connectorWidth: 2, // Grosor del "palo" de la piruleta
                    marker: {
                        radius: 6 // Tamaño del "caramelo" (el círculo)
                    }
                }
            },
            series: [
                { name: 'Aporte del PIB per Cápita', data: pibData, color: '#27ae60' },
                { name: 'Aporte del Apoyo Social', data: apoyoSocialData, color: '#f39c12' }
            ],
            credits: { enabled: false }
        });
    }

    // Función que se dispara cuando el usuario elige un año distinto
    function cambiarAño(event) {
        añoSeleccionado = Number(event.target.value);
        dibujarGrafica();
    }
</script>

<main>
    <h2>Integración Uso API: Grupo 15</h2>

    <div class="botones">
        <button onclick={() => goto('/integrations')}>← Volver a Integraciones</button>
        <button onclick={() => goto('/')}>Inicio</button>
    </div>

    <p>
        Representación gráfica de los datos de la API de <strong>Índices de Felicidad</strong>.
        Utilizamos un <strong>Gráfico de Piruletas (Lollipop Chart)</strong> para ver el peso específico que tienen 
        factores como la economía y la sociedad sobre la nota total de cada país de forma limpia y minimalista.
    </p>

    {#if loading}
        <div class="status">Cargando datos de felicidad del Grupo 15...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {:else}
        <!-- Controles: Desplegable de Año -->
        <div class="controles">
            <label for="selector-año"><strong>Selecciona el año:</strong></label>
            <select id="selector-año" onchange={cambiarAño} value={añoSeleccionado}>
                {#each añosDisponibles as año}
                    <option value={año}>{año}</option>
                {/each}
            </select>
        </div>

        <!-- Aquí se dibuja Highcharts -->
        <div id="grafica-felicidad"></div>
    {/if}
</main>

<style>
    main { max-width: 900px; margin: 20px auto; font-family: sans-serif; color: #333; }
    
    .botones { margin-bottom: 20px; }
    button { padding: 8px 15px; margin-right: 10px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 4px; transition: 0.2s; }
    button:hover { background: #eee; border-color: #999; }
    
    .controles { margin-bottom: 20px; background: #f4f6f8; padding: 15px; border-radius: 8px; border: 1px solid #e1e4e8; }
    select { padding: 6px 12px; font-size: 15px; margin-left: 10px; border-radius: 4px; border: 1px solid #ccc; outline: none; }

    .status { text-align: center; padding: 30px; background: #f9f9f9; border-radius: 8px; font-weight: bold; color: #555; }
    .error { color: #d73a49; background: #ffeef0; border: 1px solid #d73a49; }
    
    #grafica-felicidad { width: 100%; height: 500px; border: 1px solid #e1e4e8; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 10px; }
</style>