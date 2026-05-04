<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    let chartContainer;
    let playersData = $state([]); 
    let loading = $state(true);
    let errorMsg = $state('');

    onMount(async () => {
        try {
            // 1. Importamos Highcharts dinámicamente
            const Highcharts = (await import('highcharts')).default;
            
            // 2. Petición a la API de FIFA
            const response = await fetch('https://fifa23-players-data.p.rapidapi.com/list/2', {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': '5b5e04d545msh9464806fa4e3e24p1713dbjsnddab4f114579',
                    'X-RapidAPI-Host': 'fifa23-players-data.p.rapidapi.com'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();

            // 3. Extraemos los datos
            if (json && json.result) {
                playersData = json.result.slice(0, 10); 
            } else {
                throw new Error("No se encontraron jugadores en la respuesta");
            }

            loading = false;

            // 4. Configuración del Gráfico: COMBINADO DOBLE EJE (Columnas + Spline)
            Highcharts.chart(chartContainer, {
                chart: {
                    zoomType: 'xy' // Permite hacer zoom si hay muchos datos
                },
                title: {
                    text: 'Relación: Media (Overall) vs Salario (€)'
                },
                subtitle: {
                    text: 'Top 10 Jugadores FIFA 23'
                },
                xAxis: [{
                    categories: playersData.map(p => p.Name),
                    crosshair: true
                }],
                yAxis: [{ // Eje Y Primario (Izquierda) - Para la Media
                    min: 80,
                    max: 100,
                    title: {
                        text: 'Media (Overall)',
                        style: { color: '#e74c3c' }
                    },
                    labels: {
                        format: '{value} pts',
                        style: { color: '#e74c3c' }
                    }
                }, { // Eje Y Secundario (Derecha) - Para el Salario
                    title: {
                        text: 'Salario (€)',
                        style: { color: '#2980b9' }
                    },
                    labels: {
                        format: '{value} €',
                        style: { color: '#2980b9' }
                    },
                    opposite: true // ¡Esto lo pone a la derecha!
                }],
                tooltip: {
                    shared: true // Muestra ambos datos al pasar el ratón
                },
                series: [{
                    name: 'Salario',
                    type: 'column', // Tipo 1: Columnas
                    yAxis: 1, // Lo vinculamos al eje derecho
                    data: playersData.map(p => Number(p['Wage€'])),
                    color: 'rgba(41, 128, 185, 0.7)',
                    tooltip: { valueSuffix: ' €' }

                }, {
                    name: 'Media (Overall)',
                    type: 'spline', // Tipo 2: Línea curva
                    data: playersData.map(p => p.Overall),
                    color: '#e74c3c',
                    marker: {
                        lineWidth: 2,
                        lineColor: '#e74c3c',
                        fillColor: 'white'
                    },
                    tooltip: { valueSuffix: ' pts' }
                }],
                credits: { enabled: false }
            });

        } catch (error) {
            errorMsg = `❌ Error: ${error.message}`;
            loading = false;
        }
    });
</script>

<main>
    <h2>Integración Externa: FIFA 23 Stats</h2>

    <div class="nav-buttons">
        <button onclick={() => goto('/')}>Volver al Inicio</button>
    </div>

    <p>
        Análisis avanzado usando un <strong>Gráfico Combinado de Doble Eje</strong>. 
        Compara la valoración técnica (eje izquierdo) frente al salario percibido (eje derecho).
    </p>

    {#if loading}
        <div class="status">Cargando datos de la API...</div>
    {:else if errorMsg}
        <div class="status error">{errorMsg}</div>
    {:else}
        <figure class="highcharts-figure">
            <div bind:this={chartContainer} id="container"></div>
        </figure>

        <hr>

        <section>
            <h3>Ficha Detallada (Uso Textual)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Foto</th>
                        <th>Nombre</th>
                        <th>Club</th>
                        <th>Media (Overall)</th>
                        <th>Salario (€)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each playersData as player}
                        <tr>
                            <td><img src={player.Photo} alt={player.Name} width="40"></td>
                            <td><strong>{player.Name}</strong></td>
                            <td>{player.Club}</td>
                            <td class="overall">{player.Overall}</td>
                            <td class="wage">€ {Number(player['Wage€']).toLocaleString()}</td>
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

    .status { text-align: center; padding: 20px; background: #eee; border-radius: 8px; }
    .error { color: red; background: #ffdada; border: 1px solid red; }

    table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white;}
    th, td { padding: 12px; border: 1px solid #ccc; text-align: left; }
    th { background: #2c3e50; color: white; }
    .overall { font-weight: bold; color: #e74c3c; text-align: center; }
    .wage { font-weight: bold; color: #2980b9; text-align: right; }
    img { border-radius: 50%; }
</style>