<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let chartContainer;
    let mashupData = $state([]); 
    let loading = $state(true);
    let errorMsg = $state('');

    onMount(async () => {
        try {
            // 1. Importamos Highcharts
            const Highcharts = (await import('highcharts')).default;
            
            // 2. Petición a la API de F1 (Constructores actuales)
            const f1Response = await fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json');
            if (!f1Response.ok) throw new Error(`Error API F1: HTTP ${f1Response.status}`);
            const f1Json = await f1Response.json();
            const f1Teams = f1Json.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;

            // 3. Petición a TU API de Satélites
            // Usamos una ruta relativa para que funcione tanto en tu PC (localhost) como en Render
            const satResponse = await fetch('/api/v1/active-satellites');
            
            // Si la ruta relativa falla por algún motivo, descomenta la siguiente línea y usa la absoluta:
            // const satResponse = await fetch('https://sos2526-14-yjus.onrender.com/api/v1/active-satellites');
            
            if (!satResponse.ok) throw new Error(`Error en tus Satélites: HTTP ${satResponse.status}`);
            const satellites = await satResponse.json(); // Tu API devuelve el array directamente
            
            // 4. Cruzamos los datos (Cogemos hasta 5 elementos para que la gráfica no se sature)
            const limit = Math.min(5, f1Teams.length, satellites.length);
            
            for (let i = 0; i < limit; i++) {
                mashupData.push({
                    f1Team: f1Teams[i].Constructor.name,
                    f1Points: Number(f1Teams[i].points),
                    
                    // ✅ AQUÍ ESTÁ LA MAGIA: Usamos las propiedades exactas de tu base de datos
                    satName: satellites[i].name, 
                    satMass: Number(satellites[i].launch_mass) // Convertimos el "4200.0" a número real
                });
            }

            loading = false;

            // 5. Configuración del Gráfico: ÁREA SUAVIZADA (AreaSpline)
            Highcharts.chart(chartContainer, {
                chart: {
                    type: 'areaspline'
                },
                title: {
                    text: 'Mashup: F1 vs Satélites Activos'
                },
                subtitle: {
                    text: 'Comparativa de Puntos de Escuderías frente a Masa de Lanzamiento (kg)'
                },
                xAxis: {
                    categories: ['Muestra 1', 'Muestra 2', 'Muestra 3', 'Muestra 4', 'Muestra 5'],
                    title: { text: 'Ranking / Muestra' }
                },
                yAxis: [{ // Eje Y Izquierdo (F1)
                    title: { text: 'Puntos F1', style: { color: '#e67e22' } },
                    labels: { style: { color: '#e67e22' } }
                }, { // Eje Y Derecho (Satélites)
                    title: { text: 'Masa de Lanzamiento (kg)', style: { color: '#8e44ad' } },
                    labels: { style: { color: '#8e44ad' } },
                    opposite: true // ¡Eje a la derecha!
                }],
                tooltip: {
                    shared: true
                },
                plotOptions: {
                    areaspline: {
                        fillOpacity: 0.3 // Transparencia para que se vean ambas áreas al cruzarse
                    }
                },
                series: [{
                    name: 'Escuderías F1 (Puntos)',
                    yAxis: 0,
                    color: '#e67e22',
                    data: mashupData.map(d => d.f1Points)
                }, {
                    name: 'Satélites (Masa kg)',
                    yAxis: 1,
                    color: '#8e44ad',
                    data: mashupData.map(d => d.satMass) 
                }],
                credits: { enabled: false }
            });

        } catch (error) {
            errorMsg = `❌ Error en el Mashup: ${error.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración Mashup: F1 & Mis Satélites</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/')}>Volver al Inicio</button>
    </div>

    <p>
        Integración conjunta que cruza datos de la <strong>Jolpi API (Fórmula 1)</strong> con mi 
        API local de <strong>Satélites Activos</strong>, visualizados mediante un gráfico de áreas superpuestas.
    </p>

    {#if loading}
        <div class="status">Cargando y cruzando bases de datos...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {/if}

    <figure class="highcharts-figure" style="display: {loading || errorMsg ? 'none' : 'block'};">
        <div bind:this={chartContainer} id="container"></div>
    </figure>

    {#if !loading && !errorMsg}
        <hr>
        <section>
            <h3>Ficha de Datos Cruzados</h3>
            <table>
                <thead>
                    <tr>
                        <th colspan="2" class="header-f1">Fórmula 1</th>
                        <th colspan="2" class="header-sat">Satélites Activos</th>
                    </tr>
                    <tr>
                        <th>Escudería</th>
                        <th>Puntos Totales</th>
                        <th>Nombre del Satélite</th>
                        <th>Masa Lanzamiento</th>
                    </tr>
                </thead>
                <tbody>
                    {#each mashupData as row}
                        <tr>
                            <td><strong>{row.f1Team}</strong></td>
                            <td class="f1-data">{row.f1Points} pts</td>
                            <td><strong>{row.satName}</strong></td>
                            <td class="sat-data">{row.satMass} kg</td>
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
    
    #container {
        width: 100%;
        height: 500px;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        background: white;
    }

    .status { text-align: center; padding: 20px; background: #eee; border-radius: 8px; font-weight: bold; }
    .error { color: red; background: #ffdada; border: 1px solid red; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05);}
    th, td { padding: 12px; border: 1px solid #ccc; }
    
    .header-f1 { background: #e67e22; color: white; text-transform: uppercase; }
    .header-sat { background: #8e44ad; color: white; text-transform: uppercase; }
    th { background: #2c3e50; color: white; }
    
    .f1-data { font-weight: bold; color: #e67e22; }
    .sat-data { font-weight: bold; color: #8e44ad; }
</style>