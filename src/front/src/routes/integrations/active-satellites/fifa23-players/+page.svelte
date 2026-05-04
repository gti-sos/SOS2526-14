<script>
    import { onMount } from 'svelte';
    
    // ❌ 1. ELIMINA esta línea que tenías arriba:
    // import Chart from 'svelte-apexcharts';

    // ✅ 2. En su lugar, creamos una variable vacía para guardar el componente
    let ChartComponent; 

    let options = {};
    let series = [];
    let playersData = [];
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            // ✅ 3. Importación dinámica: Se carga SOLO en el navegador
            const module = await import('svelte-apexcharts');
            ChartComponent = module.default;

            // --- A PARTIR DE AQUÍ VA TU CÓDIGO NORMAL DEL FETCH ---
            const res = await fetch('https://fifa23-players-data.p.rapidapi.com/list/2', {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': '5b5e04d545msh9464806fa4e3e24p1713dbjsnddab4f114579',
                    'X-RapidAPI-Host': 'fifa23-players-data.p.rapidapi.com'
                }
            });

            if (!res.ok) throw new Error('Error al conectar con la API');

            const data = await res.json();
            playersData = data.slice(0, 8);

            series = playersData.map(player => player.Overall);
            options = {
                chart: { type: 'polarArea', height: 500 },
                labels: playersData.map(player => player.Name),
                stroke: { colors: ['#fff'] },
                fill: { opacity: 0.8 },
                title: { text: 'Media (Overall) de los Top Jugadores - FIFA 23', align: 'center' },
                yaxis: { show: false },
                legend: { position: 'bottom' },
                theme: { palette: 'palette1' }
            };

            loading = false;
        } catch (e) {
            console.error(e);
            error = "Hubo un problema cargando los datos.";
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
            {#if ChartComponent}
                <svelte:component this={ChartComponent} {options} {series} />
            {/if}
        </div>

        <hr>
        
        <section>
             ...
        </section>
    {/if}
</main>