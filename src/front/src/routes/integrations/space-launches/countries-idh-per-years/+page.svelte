<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    
    // Importamos Highcharts y los módulos
    import Highcharts from 'highcharts';
    import Highcharts3D from 'highcharts/highcharts-3d';
    import Cylinder from 'highcharts/modules/cylinder';

    let loading = $state(true);
    let errorMsg = $state('');

    const API_COMPA = 'https://sos2526-26.onrender.com/api/v2/countries-idh-per-years';

    onMount(async () => {
        try {
            // SOLUCIÓN AL ERROR "Bi is not a function":
            // Comprobamos si Vite lo ha envuelto en un ".default" antes de ejecutarlo
            if (typeof Highcharts3D === 'function') Highcharts3D(Highcharts);
            else if (Highcharts3D && Highcharts3D.default) Highcharts3D.default(Highcharts);

            if (typeof Cylinder === 'function') Cylinder(Highcharts);
            else if (Cylinder && Cylinder.default) Cylinder.default(Highcharts);

            // 1. Traemos los datos de la API del compañero
            let res = await fetch(API_COMPA);
            let data = await res.json();

            if (Array.isArray(data) && data.length === 0) {
                await fetch(API_COMPA + '/loadinitialdata');
                res = await fetch(API_COMPA);
                data = await res.json();
            }

            // 2. Buscamos cuál es el año más reciente de todos los datos
            const añosSet = new Set(data.map(d => d.year).filter(y => y !== undefined));
            const añoMasReciente = Math.max(...Array.from(añosSet));

            // 3. Filtramos los datos para quedarnos SOLO con los de ese año
            const datosDelAño = data.filter(d => d.year === añoMasReciente && d.hdi_value !== undefined);
            
            // Ordenamos los países de mayor a menor IDH
            datosDelAño.sort((a, b) => b.hdi_value - a.hdi_value);

            // Preparamos las listas
            const paises = datosDelAño.map(d => d.country.charAt(0).toUpperCase() + d.country.slice(1));
            const valoresIDH = datosDelAño.map(d => d.hdi_value);

            loading = false;
            await tick(); // Esperamos a que Svelte pinte el div

            // 4. Dibujamos el Gráfico de Cilindros 3D
            Highcharts.chart('grafica-cilindro', {
                chart: {
                    type: 'cylinder',
                    backgroundColor: '#ffffff',
                    options3d: {
                        enabled: true,
                        alpha: 15,  
                        beta: 15,   
                        depth: 50,  
                        viewDistance: 25
                    }
                },
                title: { 
                    text: `Índice de Desarrollo Humano (${añoMasReciente})` 
                },
                subtitle: { 
                    text: 'Comparativa por país (Cilindros 3D)' 
                },
                xAxis: {
                    categories: paises,
                    title: { text: null }
                },
                yAxis: {
                    title: { text: 'Valor IDH (0 - 1)' },
                    min: 0,
                    max: 1 
                },
                tooltip: {
                    valueSuffix: ' puntos IDH'
                },
                plotOptions: {
                    series: {
                        depth: 25,
                        colorByPoint: true 
                    }
                },
                series: [{
                    name: 'IDH',
                    data: valoresIDH,
                    showInLegend: false
                }],
                credits: { enabled: false }
            });

        } catch(err) {
            errorMsg = `❌ Error al cargar la API del compañero: ${err.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración Uso API: Grupo 26</h2>

    <div class="botones">
        <button onclick={() => goto('/integrations')}>← Volver a Integraciones</button>
        <button onclick={() => goto('/')}>Inicio</button>
    </div>

    <p>
        Representación de los datos obtenidos de la API externa de <strong>Índice de Desarrollo Humano (IDH)</strong>.
        Para esta visualización, hemos filtrado el año más reciente de la base de datos y aplicado un gráfico de 
        <strong>Cilindros 3D interactivos</strong> de Highcharts para comparar las puntuaciones entre países.
    </p>

    {#if loading}
        <div class="status">Cargando módulos 3D y sincronizando datos...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <div id="grafica-cilindro" style="display: {loading || errorMsg ? 'none' : 'block'}"></div>

</main>

<style>
    main { max-width: 900px; margin: 20px auto; font-family: sans-serif; color: #333; }
    
    .botones { margin-bottom: 20px; }
    button { padding: 8px 15px; margin-right: 10px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 4px; }
    button:hover { background: #eee; }
    
    .status { text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; font-weight: bold; }
    .error { color: #c0392b; background: #f9ebeb; border: 1px solid #c0392b; }
    
    #grafica-cilindro { 
        width: 100%; 
        height: 500px;
        background: white;
        border: 1px solid #ddd; 
        border-radius: 8px; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
        margin-top: 20px;
    }
</style>