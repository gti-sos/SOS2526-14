<script>
    import { onMount } from 'svelte';

    let ChartComponent;
    let options = {};
    let series = [];
    let regionsData = [];
    let loading = true;
    let error = null;

    onMount(async () => {
        try {
            // Importación dinámica para evitar errores de compilación
            const module = await import('svelte-apexcharts');
            ChartComponent = module.default;

            // Llamada a la API de COVID-19
            const res = await fetch('https://covid-19-statistics.p.rapidapi.com/regions', {
                method: 'GET',
                headers: {
                    // ⚠️ PON AQUÍ TU API KEY REAL DE RAPIDAPI
                    'X-RapidAPI-Key': '5b5e04d545msh9464806fa4e3e24p1713dbjsnddab4f114579',
                    'X-RapidAPI-Host': 'covid-19-statistics.p.rapidapi.com'
                }
            });

            if (!res.ok) throw new Error('Error al conectar con la API de COVID-19');

            const responseData = await res.json();

            // Según tu captura, el array viene dentro de la propiedad "data"
            if (responseData && responseData.data) {
                const allRegions = responseData.data;
                
                // Guardamos los primeros 15 países para la tabla HTML (Uso Textual)
                regionsData = allRegions.slice(0, 15);

                // MÁGIA PARA EL WIDGET: Contamos cuántos países empiezan por cada letra
                const letterCounts = {};
                allRegions.forEach(region => {
                    if (region.name) {
                        const firstLetter = region.name.charAt(0).toUpperCase();
                        letterCounts[firstLetter] = (letterCounts[firstLetter] || 0) + 1;
                    }
                });

                // Ordenamos para coger las 10 letras más repetidas
                const topLetters = Object.keys(letterCounts)
                    .map(letter => ({ letter, count: letterCounts[letter] }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10);

                // Preparamos los datos para la gráfica de Anillo (Donut)
                series = topLetters.map(item => item.count);
                
                options = {
                    chart: { type: 'donut', height: 400 },
                    labels: topLetters.map(item => `Letra ${item.letter}`),
                    title: { 
                        text: 'Top 10 Letras Iniciales de Países/Regiones',
                        align: 'center',
                        style: { fontSize: '18px', color: '#2c3e50' }
                    },
                    plotOptions: {
                        pie: { donut: { size: '60%' } }
                    },
                    legend: { position: 'right' },
                    theme: { palette: 'palette2' } // Usamos otra paleta para que no sea igual a la del FIFA
                };
            } else {
                throw new Error("No se encontró el array de regiones en la respuesta.");
            }

            loading = false;
        } catch (e) {
            console.error(e);
            error = "Hubo un problema cargando los datos: " + e.message;
            loading = false;
        }
    });
</script>

<main>
    <h1>Integración Externa: API COVID-19 Regions</h1>
    <p>Esta integración obtiene datos de regiones directamente desde RapidAPI y los agrupa alfabéticamente.</p>

    {#if loading}
        <div class="status">Cargando regiones...</div>
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
            <h3>Listado de Regiones (Uso Textual)</h3>
            <table>
                <thead>
                    <tr>
                        <th>Código ISO</th>
                        <th>Nombre de la Región / País</th>
                    </tr>
                </thead>
                <tbody>
                    {#each regionsData as region}
                        <tr>
                            <td><strong>{region.iso}</strong></td>
                            <td>{region.name}</td>
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
        display: flex;
        justify-content: center;
    }
    
    .status { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; font-weight: bold; }
    .error { color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; }
    
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-top: 15px; }
    th, td { border: 1px solid #e0e0e0; padding: 12px; text-align: left; }
    th { background-color: #2c3e50; color: white; text-transform: uppercase; font-size: 0.9em; width: 30%; }
    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #eef2f5; }
    
    hr { margin: 40px 0; border: 0; border-top: 2px dashed #eee; }
</style>