<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    /** @type {any[]} */
    let satelliteData = []; 
    let chartContainer; // Esta variable guardará la referencia al DIV

    onMount(async () => {
        const res = await fetch('/api/v1/active-satellites');
        if (res.ok) {
            satelliteData = await res.json();

            /** @type {Record<string, number>} */
            let counts = {};
            satelliteData.forEach((s) => {
                if (s.country) {
                    counts[s.country] = (counts[s.country] || 0) + 1;
                }
            });

            const categories = Object.keys(counts);
            const dataValues = Object.values(counts);

            // USAMOS chartContainer EN LUGAR DEL ID 'container'
            Highcharts.chart(chartContainer, {
                chart: { type: 'bar' },
                title: { text: 'Satélites Activos por País' },
                xAxis: { categories: categories, title: { text: 'País' } },
                yAxis: { title: { text: 'Número de Satélites' } },
                series: [{
                    name: 'Satélites',
                    data: dataValues,
                    color: '#2b908f'
                }]
            });
        }
    });
</script>

<main>
    <h1>Visualización Individual: Active Satellites</h1>
    <div bind:this={chartContainer}></div>
    <p><a href="/analytics">Volver a Analytics Grupal</a></p>
</main>