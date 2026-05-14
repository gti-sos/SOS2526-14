<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import Chart from 'chart.js/auto'; // <-- Importamos Chart.js en lugar de Highcharts

    const API = '/api/v2/space-launches';

    let chartContainer; // Ahora esto apuntará a una etiqueta <canvas>
    let chartInstance = null;
    let loading = $state(true);
    let errorMsg = $state('');
    let totalCount = $state(0);

    const TOP_N = 10;

    // Chart.js necesita que le demos los colores manualmente
    const colores = [
        '#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', 
        '#34495e', '#16a085', '#e67e22', '#c0392b', '#7f8c8d'
    ];

    onMount(async () => {
        await cargarYDibujar();
    });

    async function cargarYDibujar() {
        loading = true;
        errorMsg = '';

        try {
            const res = await fetch(`${API}?limit=0`);

            if (!res.ok) {
                errorMsg = `Error al cargar datos: ${res.status}`;
                return;
            }

            const datos = await res.json();

            // 1. Filtramos registros válidos
            const datosValidos = datos.filter(m =>
                m.year &&
                !isNaN(Number(m.year)) &&
                Number(m.year) >= 1957 &&
                Number(m.year) <= new Date().getFullYear() &&
                m.country &&
                m.country.trim() !== ''
            );

            totalCount = datosValidos.length;

            if (totalCount === 0) {
                errorMsg = 'No hay datos válidos. Carga los datos iniciales primero.';
                return;
            }

            // 2. Contar lanzamientos por país
            const totalPorPais = {};
            datosValidos.forEach(m => {
                totalPorPais[m.country] = (totalPorPais[m.country] || 0) + 1;
            });

            const topPaises = Object.entries(totalPorPais)
                .sort((a, b) => b[1] - a[1])
                .slice(0, TOP_N)
                .map(([pais]) => pais);

            // 3. Obtener años únicos
            const todosAnios = [
                ...new Set(
                    datosValidos
                        .filter(m => topPaises.includes(m.country))
                        .map(m => Number(m.year))
                )
            ].sort((a, b) => a - b);

            // 4. Calcular el total de lanzamientos en cada año (Necesario para Chart.js)
            const totalesPorAnio = {};
            todosAnios.forEach(anio => {
                totalesPorAnio[anio] = datosValidos.filter(
                    m => topPaises.includes(m.country) && Number(m.year) === anio
                ).length;
            });

            // 5. Construir los datasets (las franjas de área)
            const datasets = topPaises.map((pais, index) => {
                const data = todosAnios.map(anio => {
                    // Cuántos lanzó este país este año
                    const count = datosValidos.filter(m => m.country === pais && Number(m.year) === anio).length;
                    // Qué porcentaje representa sobre el total de ese año
                    const porcentaje = totalesPorAnio[anio] ? (count / totalesPorAnio[anio]) * 100 : 0;
                    
                    return {
                        x: String(anio),
                        y: porcentaje, 
                        rawCount: count // Guardamos el número real para mostrarlo en el recuadro flotante
                    };
                });

                return {
                    label: pais,
                    data: data,
                    fill: true, // Magia: convierte la línea en un área coloreada
                    backgroundColor: colores[index % colores.length] + '80', // Color con un poco de transparencia
                    borderColor: colores[index % colores.length],
                    borderWidth: 1,
                    tension: 0.4, // Hace que las líneas sean curvadas y suaves
                    pointRadius: 0 // Ocultamos los circulitos de los puntos para que quede limpio
                };
            });

            // 6. Dibujar el gráfico
            // Si ya existía un gráfico, lo destruimos para que no se superpongan
            if (chartInstance) {
                chartInstance.destroy();
            }

            chartInstance = new Chart(chartContainer, {
                type: 'line', // En Chart.js, las áreas son gráficos de línea con relleno
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false, // Muestra todos los datos de un año al pasar el ratón
                    },
                    scales: {
                        x: {
                            title: { display: true, text: 'Año', color: '#555' },
                            grid: { display: false }
                        },
                        y: {
                            stacked: true, // Esto apila las franjas una encima de otra
                            max: 100, // Fijamos el techo en el 100%
                            title: { display: true, text: '% de lanzamientos', color: '#555' },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#333' }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#000',
                            bodyColor: '#333',
                            borderColor: '#ccc',
                            borderWidth: 1,
                            callbacks: {
                                // Personalizamos el texto al pasar el ratón
                                label: function(context) {
                                    const porcentaje = context.raw.y.toFixed(1);
                                    const lanzamientos = context.raw.rawCount;
                                    return `${context.dataset.label}: ${porcentaje}% (${lanzamientos} lanzamientos)`;
                                }
                            }
                        }
                    }
                }
            });

        } catch (err) {
            errorMsg = 'Error de conexión con la API.';
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<style>
    .wrap {
        background: #ffffff;
        min-height: 100vh;
        padding: 24px;
        font-family: sans-serif;
        color: #000000;
    }

    h2 {
        color: #000000;
        margin-bottom: 4px;
    }
    
    .subtitulo {
        color: #555;
        font-size: 14px;
        margin-top: 0;
        margin-bottom: 24px;
    }

    .back-btn {
        background: #f5f5f5;
        border: 1px solid #cccccc;
        color: #333333;
        padding: 6px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        margin-bottom: 20px;
        display: inline-block;
        transition: 0.2s;
    }

    .back-btn:hover {
        border-color: #0077ff;
        color: #0077ff;
        background: #eef5ff;
    }

    .status {
        text-align: center;
        padding: 60px 0;
        color: #555;
    }

    .status.error {
        color: #d93025;
    }

    .chart-box {
        width: 100%;
        height: 540px;
        position: relative; /* Importante para que Chart.js sea responsivo */
    }

    .hint {
        text-align: center;
        font-size: 12px;
        color: #666;
        margin-top: 16px;
    }
</style>

<div class="wrap">

    <button
        class="back-btn"
        onclick={() => goto('/space-launches')}
    >
        ← Volver al listado
    </button>

    <h2>Visualización — Space Launches (Chart.js)</h2>
    <p class="subtitulo">Top {TOP_N} países · {totalCount.toLocaleString()} lanzamientos totales</p>

    {#if loading}
        <div class="status">
             Cargando datos y generando áreas apiladas...
        </div>
    {:else if errorMsg}
        <div class="status error">
            ❌ {errorMsg}
        </div>
    {/if}

    <!-- Chart.js OBLIGA a que su contenedor sea una etiqueta <canvas>, no un <div> -->
    <div class="chart-box" style={loading || errorMsg ? 'display:none' : ''}>
        <canvas bind:this={chartContainer}></canvas>
    </div>

    {#if !loading && !errorMsg}
        <p class="hint">
            Cada franja representa el % de lanzamientos de ese país respecto al total mundial ese año.
            Pasa el cursor sobre el gráfico para ver el desglose exacto.
        </p>
    {/if}

</div>