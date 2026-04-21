<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    let satelliteData = [];

    onMount(async () => {
        
        const res = await fetch('/api/v1/active-satellites');
        satelliteData = await res.json();

       
        const counts = {};
        satelliteData.forEach(s => {
            counts[s.country] = (counts[s.country] || 0) + 1;
        });

        const categories = Object.keys(counts);
        const dataValues = Object.values(counts);

       
        Highcharts.chart('container', {
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
    });
</script>

<main>
    <h1>Visualización Individual: Active Satellites</h1>
    <div id="container"></div>
    <a href="/analytics">Volver a Analytics Grupal</a>
</main>