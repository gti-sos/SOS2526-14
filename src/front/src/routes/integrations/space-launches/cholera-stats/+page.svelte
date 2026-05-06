<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import Highcharts from 'highcharts';
    
    // Importamos el módulo específico de Sunburst para evitar el tipo "pie"
    import Sunburst from 'highcharts/modules/sunburst';

    let loading = $state(true);
    let errorMsg = $state('');

    const API_COLERA = 'https://soporte-sos.onrender.com/api/v1/cholera-stats';

    onMount(async () => {
        try {
            // Inicializamos el módulo Sunburst de forma segura
            if (typeof Sunburst === 'function') Sunburst(Highcharts);
            else if (Sunburst && Sunburst.default) Sunburst.default(Highcharts);

            // 1. Cargamos la API de Cólera
            let res = await fetch(API_COLERA);
            let data = await res.json();

            if (Array.isArray(data) && data.length === 0) {
                await fetch(API_COLERA + '/loadInitialData');
                res = await fetch(API_COLERA);
                data = await res.json();
            }

            // 2. Preparamos la jerarquía (Mundo -> Región -> País)
            const regionMap = {};
            const countryMap = {};

            data.forEach(d => {
                // Solo usamos datos válidos
                if (!d.whoRegion || !d.country || !d.reportedCases) return;
                
                regionMap[d.whoRegion] = true;
                
                // Sumamos los casos por país
                if (!countryMap[d.country]) {
                    countryMap[d.country] = { region: d.whoRegion, cases: 0 };
                }
                countryMap[d.country].cases += d.reportedCases;
            });

            // 3. Construimos el array especial que necesita Sunburst
            const sunburstData = [];

            // Nivel 0: El centro invisible (para agrupar todo)
            sunburstData.push({
                id: 'Mundo',
                parent: '',
                name: 'Total Global'
            });

            // Nivel 1: El anillo interior (Regiones de la OMS)
            Object.keys(regionMap).forEach(region => {
                sunburstData.push({
                    id: region,
                    parent: 'Mundo',
                    name: region
                });
            });

            // Nivel 2: El anillo exterior (Países divididos en sus regiones)
            Object.keys(countryMap).forEach(country => {
                sunburstData.push({
                    id: country,
                    parent: countryMap[country].region,
                    name: country,
                    value: countryMap[country].cases // El valor define el tamaño del "trozo"
                });
            });

            loading = false;
            await tick(); 

            // 4. Dibujamos el Gráfico Sunburst (Multinivel)
            Highcharts.chart('grafica-sunburst', {
                chart: {
                    type: 'sunburst', // ESTA ES LA CLAVE: No es 'pie', es 'sunburst'
                    height: '600px',
                    backgroundColor: '#ffffff'
                },
                title: {
                    text: 'Jerarquía Global de Casos de Cólera'
                },
                subtitle: {
                    text: 'Anillo interior: Región OMS | Anillo exterior: Países (Haz clic para hacer zoom)'
                },
                series: [{
                    type: 'sunburst',
                    data: sunburstData,
                    allowDrillToNode: true, // Permite hacer clic para entrar en una región
                    cursor: 'pointer',
                    dataLabels: {
                        format: '{point.name}',
                        filter: {
                            property: 'innerArcLength',
                            operator: '>',
                            value: 16 // Oculta nombres si el trozo es muy pequeño para no manchar la gráfica
                        }
                    },
                    levels: [
                        { level: 1, levelIsConstant: false, color: 'transparent' }, // Nivel 0 (Centro invisible)
                        { level: 2, colorByPoint: true }, // Nivel 1 (Regiones con colores distintos)
                        { level: 3, colorVariation: { key: 'brightness', to: -0.3 } } // Nivel 2 (Países, tono más oscuro)
                    ]
                }],
                tooltip: {
                    headerFormat: "",
                    pointFormat: '<b>{point.name}</b>: {point.value} casos reportados'
                },
                credits: { enabled: false }
            });

        } catch (err) {
            errorMsg = `❌ Error al cargar la API de Cólera: ${err.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración Uso API: Cólera Stats</h2>

    <div class="botones">
        <button onclick={() => goto('/integrations')}>← Volver a Integraciones</button>
        <button onclick={() => goto('/')}>Inicio</button>
    </div>

    <p>
        Representación visual de los datos históricos extraídos de la API externa de <strong>Estadísticas de Cólera</strong>.
        Hemos implementado un <strong>Gráfico Multinivel (Sunburst)</strong>. El anillo interior agrupa el volumen de casos 
        por Región de la OMS, mientras que el anillo exterior desglosa los países que conforman dicha región. 
        <em>(Puedes hacer clic en una región para inspeccionarla en detalle).</em>
    </p>

    {#if loading}
        <div class="status">Agrupando regiones y países...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <div id="grafica-sunburst" style="display: {loading || errorMsg ? 'none' : 'block'}"></div>

</main>

<style>
    main { max-width: 900px; margin: 20px auto; font-family: sans-serif; color: #333; }
    
    .botones { margin-bottom: 20px; }
    button { padding: 8px 15px; margin-right: 10px; cursor: pointer; background: #fff; border: 1px solid #ccc; border-radius: 4px; }
    button:hover { background: #eee; }
    
    .status { text-align: center; padding: 20px; background: #f9f9f9; border-radius: 8px; font-weight: bold; }
    .error { color: #c0392b; background: #f9ebeb; border: 1px solid #c0392b; }
    
    #grafica-sunburst { 
        width: 100%; 
        background: white;
        border: 1px solid #ddd; 
        border-radius: 8px; 
        box-shadow: 0 4px 10px rgba(0,0,0,0.05); 
        margin-top: 20px;
    }
</style>