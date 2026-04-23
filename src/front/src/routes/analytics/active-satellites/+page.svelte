<script>
    import { onMount } from 'svelte';
    import Highcharts from 'highcharts';

    /** @type {any[]} */
    let satelliteData = []; 

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
        }
    });
</script>