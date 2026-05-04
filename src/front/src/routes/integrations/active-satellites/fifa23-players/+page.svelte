<script>
    import { onMount } from 'svelte';

    // Variable para guardar el componente dinámico y evitar errores de SSR
    let ChartComponent;

    let options = {};
    let series = [];
    let playersData = [];
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            // 1. Importación dinámica: Se carga SOLO en el navegador
            const module = await import('svelte-apexcharts');
            ChartComponent = module.default;

            // 2. Llamada a la API de FIFA en RapidAPI
            const res = await fetch('https://fifa23-players-data.p.rapidapi.com/list/2', {
                method: 'GET',
                headers: {
                    // ⚠️ IMPORTANTE: SUSTITUYE ESTO POR TU CLAVE REAL DE RAPIDAPI
                    'X-RapidAPI-Key': 'TU_API_KEY_AQUI',
                    'X-RapidAPI-Host': 'fifa23-players-data.p.rapidapi.com'
                }
            });

            if (!res.ok) throw new Error('Error al conectar con la API de FIFA');

            const data = await res.json();

            // 3. Entramos en la propiedad "result" de la respuesta y cogemos los 8 primeros
            if (data && data.result) {
                playersData = data.result.slice(0, 8);
            } else {
                throw new Error("No se encontró la lista de jugadores en la respuesta.");
            }

            // 4. Preparamos los datos para la gráfica de ApexCharts (Área Polar)
            series = playersData.map(player => player.Overall);
            
            options = {
                chart: { type: 'polarArea', height: 500 },
                labels: playersData.map(player => player.Name),
                stroke: { colors: ['#fff'] },
                fill: { opacity: 0.8 },
                title: { 
                    text: 'Media (Overall) de los Top Jugadores - FIFA 23',
                    align: 'center',
                    style: { fontSize: '18px', color: '#2c3e50' }
                },
                yaxis: { show: false }, // Ocultamos los números del eje para que quede más limpio
                legend: { position: 'bottom' },
                theme: { palette: 'palette1' }
            };

            loading = false;
        } catch (e) {
            console.error(e);
            error = "Hubo un problema cargando los datos: " + e.message;
            loading = false;
        }
    });
</script>

<main>
    <h1>Integración Externa: API FIFA 23</h1>
    <p>Esta integración obtiene datos reales de jugadores directamente desde RapidAPI (Uso Simple con Widget).</p>

    {#if loading}
        <div class="status">Cargando datos de jugadores...</div>
    {:else if error}
        <div class="status error">{error}</div>
    {:else}
        <div class="chart-container">
            {#if ChartComponent}
                <svelte:component this={ChartComponent} {options} {series} />
            {/if}
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
    main { 
        max-width: 900px; 
        margin: 0 auto; 
        padding: 20px; 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        color: #333;
    }
    
    h1 { color: #2c3e50; text-align: center; }
    p { text-align: center; color: #666; margin-bottom: 30px; }
    
    .chart-container { 
        background: #fff; 
        padding: 20px; 
        border-radius: 12px; 
        margin-bottom: 30px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
    }
    
    .status { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; font-weight: bold; }
    .error { color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; }
    
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 15px; }
    th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
    th { background-color: #2c3e50; color: white; text-transform: uppercase; font-size: 0.9em; }
    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #eef2f5; }
    
    hr { margin: 40px 0; border: 0; border-top: 2px dashed #eee; }
</style>