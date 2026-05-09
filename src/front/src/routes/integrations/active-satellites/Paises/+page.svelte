<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let chartContainer;
    let countriesData = $state([]); 
    let loading = $state(true);
    let errorMsg = $state('');

    onMount(async () => {
        try {
            // 1. PETICIÓN A TU PROPIO PROXY (En tu archivo de satélites)
            const response = await fetch('/api/v1/active-satellites/proxy/countries');

            if (!response.ok) throw new Error(`Error en mi proxy: HTTP ${response.status}`);
            countriesData = await response.json();

            loading = false;

            // 2. Importamos ApexCharts dinámicamente (evita errores de SSR en SvelteKit)
            const ApexCharts = (await import('apexcharts')).default;

            // 3. Configuración del Gráfico: POLAR AREA (Divertido y diferente)
            const options = {
                series: countriesData.map(c => c.population), // Los datos
                chart: {
                    type: 'polarArea',
                    height: 480,
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 1000, // Animación chula al cargar
                        dynamicAnimation: { speed: 350 }
                    }
                },
                labels: countriesData.map(c => c.name), // Los nombres de los países
                stroke: {
                    colors: ['#fff'],
                    width: 2
                },
                fill: {
                    opacity: 0.85
                },
                legend: {
                    position: 'bottom',
                    fontSize: '14px',
                    markers: { radius: 12 }
                },
                tooltip: {
                    y: {
                        formatter: function (val) {
                            return val.toLocaleString() + " habitantes";
                        }
                    }
                },
                theme: {
                    palette: 'palette6' // Usa colores vivos y modernos automáticamente
                },
                title: {
                    text: 'Población Europea (Área Polar)',
                    align: 'center',
                    style: { fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }
                }
            };

            // Renderizamos el gráfico
            const chart = new ApexCharts(chartContainer, options);
            chart.render();

        } catch (error) {
            errorMsg = `❌ Error: ${error.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración vía Proxy Propio</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/')}>Volver al Inicio</button>
    </div>

    <p>
        Demostración de uso de un <strong>Proxy Propio</strong>. El frontend solicita los datos a nuestro 
        backend (<code>/api/v1/active-satellites/proxy/countries</code>), y este se comunica con la API externa. 
        <br><em>*Representado con <strong>ApexCharts (Polar Area)</strong> para demostrar versatilidad tecnológica.</em>
    </p>

    {#if loading}
        <div class="status">Consultando al proxy local...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="chart-box" style="display: {loading || errorMsg ? 'none' : 'block'};">
        <div bind:this={chartContainer}></div>
    </figure>

    {#if !loading && !errorMsg}
        <hr>
        <section>
            <h3>Ranking Detallado</h3>
            <table>
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Bandera</th>
                        <th>País</th>
                        <th>Población (Habitantes)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each countriesData as country, index}
                        <tr>
                            <td class="pos">{index + 1}</td>
                            <td class="center"><img src={country.flag} alt="Bandera de {country.name}" width="40"></td>
                            <td><strong>{country.name}</strong></td>
                            <td class="points">{country.population.toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    main { max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    .nav-buttons { margin-bottom: 20px; }
    
    button {
        padding: 10px 15px;
        background-color: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
    }
    
    button:hover { background-color: #2980b9; }

    .chart-box {
        width: 100%;
        padding: 20px 0;
        margin: 20px 0;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        background: white;
        display: flex;
        justify-content: center;
    }

    .status { text-align: center; padding: 20px; background: #eee; border-radius: 8px; }
    .error { color: red; background: #ffdada; border: 1px solid red; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; text-align: left;}
    th, td { padding: 12px; border: 1px solid #ccc; }
    th { background: #2c3e50; color: white; }
    
    .pos { font-weight: bold; font-size: 1.2em; color: #7f8c8d; text-align: center; }
    .center { text-align: center; }
    .points { font-weight: bold; color: #2980b9; text-align: right; }
    img { border-radius: 4px; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
</style>