<script>
    // @ts-nocheck
    import { onMount, tick } from 'svelte';
    import { goto } from '$app/navigation';
    
    import Highcharts from 'highcharts';
    import HighchartsNetworkgraph from 'highcharts/modules/networkgraph';

    const PROXY_USERS = '/api/v2/space-launches/proxy/random-users';
    
    let loading = $state(true);
    let errorMsg = $state('');
    let chartInstance = null;

    async function cargarDatos() {
        try {
            const res = await fetch(PROXY_USERS);
            if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
            
            const data = await res.json();
            const usuarios = data.results; 

            const enlaces = [];
            const nodosExtra = [];
            const registroEnlaces = new Set(); // Para no repetir ramas

            usuarios.forEach(user => {
                const pais = user.location.country;
                const genero = user.gender === 'male' ? 'Hombres' : 'Mujeres';
                const nombre = `${user.name.first} ${user.name.last}`;

                // 1. Conectar el Centro con el País
                const linkPais = `Base-${pais}`;
                if (!registroEnlaces.has(linkPais)) {
                    enlaces.push(['Base Demográfica', pais]);
                    registroEnlaces.add(linkPais);
                }

                // 2. Conectar el País con el Género
                const nodoGenero = `${genero} (${pais})`;
                const linkGenero = `${pais}-${nodoGenero}`;
                if (!registroEnlaces.has(linkGenero)) {
                    enlaces.push([pais, nodoGenero]);
                    registroEnlaces.add(linkGenero);
                }

                // 3. Conectar el Género con el Usuario Final
                enlaces.push([nodoGenero, nombre]);

                // 4. Guardar los datos del usuario para mostrarlos en el Tooltip
                nodosExtra.push({
                    id: nombre,
                    edad: user.dob.age,
                    ciudad: user.location.city,
                    antiguedad: user.registered.age,
                    color: user.gender === 'male' ? '#3498db' : '#e74c3c' // Azul para hombres, rojo para mujeres
                });
            });

            dibujarGrafica(enlaces, nodosExtra);
            loading = false;
        } catch (err) {
            errorMsg = err.message;
            loading = false;
        }
    }

    async function dibujarGrafica(datosEnlaces, datosNodos) {
        await tick(); 

        chartInstance = Highcharts.chart('grafica-red', {
            chart: {
                type: 'networkgraph', // <--- ¡LA NUEVA GRÁFICA RARA!
                height: '700px',
                backgroundColor: '#ffffff'
            },
            title: {
                text: 'Red Neuronal Demográfica',
                style: { color: '#333333', fontSize: '22px', fontWeight: 'bold' }
            },
            subtitle: {
                text: 'Nodos interactivos: Base -> País -> Género -> Usuario',
                style: { color: '#666666' }
            },
            plotOptions: {
                networkgraph: {
                    keys: ['from', 'to'],
                    layoutAlgorithm: {
                        enableSimulation: true, // Físicas activadas
                        friction: -0.9 // Efecto de rebote
                    },
                    dataLabels: {
                        enabled: true,
                        linkFormat: '', // No poner texto en las líneas
                        style: {
                            fontSize: '11px',
                            fontWeight: 'normal',
                            textOutline: 'none'
                        }
                    }
                }
            },
            tooltip: {
                useHTML: true,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#cccccc',
                formatter: function () {
                    // Si el nodo tiene edad, es un Usuario final
                    if (this.point.edad) {
                        return `
                            <div style="font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 5px;">
                                👤 <b>${this.key}</b>
                            </div>
                            Edad: <b>${this.point.edad} años</b><br>
                            Ciudad: <b>${this.point.ciudad}</b><br>
                            Años en el sistema: <b>${this.point.antiguedad}</b>
                        `;
                    } else {
                        // Si no, es un nodo agrupador (País, Género o Base)
                        return `<b>Rama:</b> ${this.key}`;
                    }
                }
            },
            series: [{
                name: 'Red Demográfica',
                data: datosEnlaces,
                nodes: datosNodos, // Inyectamos los colores y datos extra a los nodos finales
                marker: {
                    radius: 12 // Tamaño de las bolitas
                }
            }],
            credits: { enabled: false }
        });
    }

    onMount(() => {
        // Inicializamos el módulo de Network Graph
        if (typeof HighchartsNetworkgraph === 'function') HighchartsNetworkgraph(Highcharts);
        else if (HighchartsNetworkgraph && HighchartsNetworkgraph.default) HighchartsNetworkgraph.default(Highcharts);

        cargarDatos();
    });
</script>

<div class="wrap">
    <button class="back-btn" onclick={() => goto('/integrations')}>Volver a Integraciones</button>

    <h2>Integración Random: Network Graph</h2>
    <p class="sub">Cruzando nuestra plataforma con datos mediante un grafo de red con físicas simuladas.</p>

    <div class="proxy-note">
        <strong>Endpoint Local (Proxy):</strong> <code>/api/v2/space-launches/proxy/random-users</code>
    </div>

    {#if loading}
        <div class="status-msg">Tejiendo red neuronal de usuarios...</div>
    {:else if errorMsg}
        <div class="status-msg error">❌ {errorMsg}</div>
    {/if}

    <div id="grafica-red" class="tabla-box" style="display: {loading || errorMsg ? 'none' : 'block'}"></div>
</div>

<style>
    .wrap { background: #ffffff; min-height: 100vh; padding: 24px; font-family: sans-serif; color: #333333; max-width: 1000px; margin: 0 auto; }
    h2 { margin-bottom: 4px; color: #222222; }
    p.sub { color: #666666; font-size: 13px; margin-bottom: 16px; }
    .back-btn { background: #f9f9f9; border: 1px solid #dddddd; color: #333333; padding: 8px 14px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
    .back-btn:hover { background: #eeeeee; }
    .proxy-note { background: #f4f6f8; border: 1px solid #e1e4e8; border-radius: 4px; padding: 12px; font-size: 13px; color: #586069; margin-bottom: 20px; }
    code { background: #e1e4e8; padding: 3px 6px; border-radius: 3px; font-weight: bold; color: #24292e; }
    .tabla-box { background: #ffffff; border: 1px solid #e1e4e8; border-radius: 8px; padding: 16px; height: 750px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .status-msg { color: #555555; padding: 40px; text-align: center; background: #f9f9f9; border: 1px solid #e1e4e8; border-radius: 8px; }
    .error { color: #d73a49; border-color: #d73a49; background: #ffeef0; font-weight: bold; }
</style>