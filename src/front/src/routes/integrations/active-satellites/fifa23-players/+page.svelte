<script>
    import { onMount } from 'svelte';
    import Chart from 'svelte-apexcharts';

    let options = {};
    let series = [];
    let playersData = [];
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            // Llamada directa a RapidAPI desde el frontend (SIN PROXY)
            const res = await fetch('https://fifa23-players-data.p.rapidapi.com/list/2', {
                method: 'GET',
                headers: {
                    
                    'X-RapidAPI-Key': ' 5b5e04d545msh9464806fa4e3e24p1713dbjsnddab4f114579',
                    'X-RapidAPI-Host': 'fifa23-players-data.p.rapidapi.com'
                }
            });

            if (!res.ok) throw new Error('Error al conectar con la API de FIFA');

            const data = await res.json();

            // Cogemos los primeros 8 jugadores para que la gráfica no quede saturada
            playersData = data.slice(0, 8);

            // Preparamos los datos para la gráfica de ApexCharts (Área Polar)
            series = playersData.map(player => player.Overall);
            
            options = {
                chart: { type: 'polarArea', height: 500 },
                labels: playersData.map(player => player.Name),
                stroke: { colors: ['#fff'] },
                fill: { opacity: 0.8 },
                title: { 
                    text: 'Media (Overall) de los Top Jugadores - FIFA 23',
                    align: 'center'
                },
                yaxis: { show: false }, // Ocultamos los números del eje para que quede más limpio
                legend: { position: 'bottom' },
                theme: { palette: 'palette1' }
            };

            loading = false;
        } catch (e) {
            console.error(e);
            error = "Hubo un problema cargando los datos. Revisa tu API Key.";
            loading = false;
        }
    });
</script>

<main>
    <h1>Integración Externa: API FIFA 23</h1>
    <p>Esta integración obtiene datos reales de jugadores directamente desde RapidAPI.</p>

    {#if loading}
        <div class="status">Cargando datos de jugadores...</div>
    {:else if error}
        <div class="status error">{error}</div>
    {:else}
        <div class="chart-container">
            <Chart {options} {series} />
        </div>

        <hr>

        <section>
            <h3>Ficha de Jugadores (Uso Textual)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Jugador</th>
                        <th>Nacionalidad</th>
                        <th>Club</th>
                        <th>Media (Overall)</th>
                        <th>Salario (£)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each playersData as player}
                        <tr>
                            <td>
                                <img src={player.Photo} alt={player.Name} width="30" style="vertical-align: middle; border-radius: 50%; margin-right: 10px;">
                                <strong>{player.Name}</strong>
                            </td>
                            <td>{player.Nationality}</td>
                            <td>{player.Club}</td>
                            <td>{player.Overall}</td>
                            <td>£ {Number(player['Wage£']).toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </section>
    {/if}
</main>

<style>
    main { max-width: 900px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
    h1 { color: #2c3e50; text-align: center; }
    .chart-container { background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .status { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .error { color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
    th { background-color: #2c3e50; color: white; }
    tr:nth-child(even) { background-color: #f8f9fa; }
    hr { margin: 40px 0; border: 0; border-top: 1px solid #eee; }
</style>