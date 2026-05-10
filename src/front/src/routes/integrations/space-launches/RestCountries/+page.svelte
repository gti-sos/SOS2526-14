<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto';

    const API_RESTCOUNTRIES = 'https://restcountries.com/v3.1/alpha?codes=USA,DEU,FRA,GBR,JPN,ITA,POL,RUS,CHN,CAN,AUS,NLD,BEL,NOR,GRC';

    let chartCanvas;
    let chartInstance = null;
    
    let loading    = $state(true);
    let errorMsg   = $state('');
    let totalPaises = $state(0);

    onMount(async () => {
        try {
            const res = await fetch(API_RESTCOUNTRIES);
            if (!res.ok) throw new Error(`Error en la API RestCountries: ${res.status}`);
            
            const datos = await res.json();
            
            if (!datos || datos.length === 0) throw new Error('No se recibieron datos');

            datos.sort((a, b) => b.population - a.population);
            totalPaises = datos.length;

            const categorias = [];
            const poblaciones = [];
            const valoresVisuales = []; // Aquí guardaremos los números "comprimidos" para el gráfico
            const areas = [];
            const capitales = [];
            const continentes = [];

            datos.forEach(pais => {
                categorias.push(pais.name.common);                  
                poblaciones.push(pais.population); // Dato real para el tooltip                 
                
                // Aplicamos Logaritmo en base 10 para comprimir las diferencias gigantes
                valoresVisuales.push(Math.log10(pais.population));  
                
                areas.push(pais.area);                              
                capitales.push(pais.capital ? pais.capital[0] : '');
                continentes.push(pais.region);                      
            });

            const backgroundColors = poblaciones.map(p =>
                p >= 100000000 ? 'rgba(231, 76, 60, 0.7)'  : 
                p >= 50000000  ? 'rgba(230, 126, 34, 0.7)' : 
                p >= 20000000  ? 'rgba(241, 196, 15, 0.7)' : 
                                 'rgba(46, 204, 113, 0.7)'   
            );
            
            const borderColors = poblaciones.map(p =>
                p >= 100000000 ? '#c0392b' :
                p >= 50000000  ? '#d35400' :
                p >= 20000000  ? '#f39c12' :
                                 '#27ae60'
            );

            loading = false;
            await tick(); 

            chartInstance = new Chart(chartCanvas, {
                type: 'polarArea',
                data: {
                    labels: categorias,
                    datasets: [{
                        label: 'Población Total',
                        data: valoresVisuales, // Le damos los datos comprimidos para que se dibuje bien
                        backgroundColor: backgroundColors,
                        borderColor: borderColors,
                        borderWidth: 1.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            // Hemos quitado el type: 'logarithmic' para que no dé error
                            ticks: { 
                                backdropColor: 'transparent', 
                                z: 10, 
                                display: false 
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { font: { size: 12 } }
                        },
                        tooltip: {
                            callbacks: {
                                // Aquí hacemos la magia inversa: sacamos la población REAL
                                label: function(context) {
                                    const idx = context.dataIndex; // Miramos qué país está tocando el ratón
                                    const poblacionReal = poblaciones[idx]; // Buscamos su población real
                                    const millones = (poblacionReal / 1000000).toFixed(1);
                                    return ` 👥 Población: ${millones} millones`;
                                },
                                afterLabel: function(context) {
                                    const idx = context.dataIndex;
                                    return [
                                        ` 🏛️ Capital: ${capitales[idx]}`,
                                        ` 🌍 Continente: ${continentes[idx]}`,
                                        ` 📏 Superficie: ${areas[idx].toLocaleString()} km²`
                                    ];
                                }
                            }
                        }
                    }
                }
            });

        } catch (err) {
            errorMsg = `Error: ${err.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración Externa: Demografía Mundial (RestCountries API)</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/integrations')}>Volver al Inicio</button>
    </div>

    <p>
        Representación visual obtenida mediante <strong>una única consulta</strong> a la API de 
        <strong>RestCountries</strong>. Utilizamos un gráfico de <strong>Área Polar</strong> donde aplicamos un 
        <em>transformado logarítmico de base 10 (Math.log10)</em> para normalizar la representación visual entre países 
        con diferencias demográficas extremas. El <em>Tooltip</em> interactivo muestra los valores reales de población, Capital, Continente y Superficie.
    </p>

    {#if !loading && !errorMsg}
        <div class="stats-box">
            <span>🌍 <strong>{totalPaises}</strong> países analizados</span>
            <span>📡 Peticiones a la API: <strong>1 (Óptimo)</strong></span>
            <span>📊 Datos mostrados: Población, Área, Capital y Continente</span>
        </div>
    {/if}

    {#if loading}
        <div class="status">Extrayendo datos de RestCountries...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="chart-container" style="display: {loading || errorMsg ? 'none' : 'block'}">
        <canvas bind:this={chartCanvas}></canvas>
    </figure>

</main>

<style>
    main { max-width: 1000px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #333; }
    h2 { margin-bottom: 10px; }

    .nav-buttons { margin-bottom: 20px; }
    .nav-buttons button { padding: 8px 12px; cursor: pointer; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px;}

    .stats-box {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
        margin-bottom: 16px;
        padding: 12px 16px;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
        color: #555;
    }

    .chart-container {
        width: 100%;
        height: 550px;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        background: white;
        margin: 0;
    }

    .status {
        text-align: center;
        padding: 20px;
        background: #eee;
        border-radius: 8px;
        font-weight: bold;
        margin: 20px 0;
    }
    .error { color: red; background: #ffdada; border: 1px solid red; }
</style>