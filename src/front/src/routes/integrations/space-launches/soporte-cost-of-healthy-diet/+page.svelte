    <script>
        // @ts-nocheck
        import { onMount } from 'svelte';
        import { goto } from '$app/navigation';

        const LAUNCHES_API = '/api/v2/space-launches';
        const DIET_API     = 'https://sos2526-18.onrender.com/api/v1/cost-of-healthy-diet-by-countries';

        let loading   = $state(true);
        let errorMsg  = $state('');
        let filas     = $state([]);
        let filtradas = $state([]);

        let totalLaunches = $state(0);
        let totalDiet     = $state(0);

        let filterRegion   = $state('');
        let filterCategory = $state('');
        let filterYear     = $state('');
        let sortBy         = $state('launches');
        let sortDir        = $state('desc');

        let regiones   = $state([]);
        let categorias = $state([]);
        let anios      = $state([]);

        const COUNTRY_MAP = {
            'USA': 'United States', 'Russia': 'Russia', 'Kazakhstan': 'Kazakhstan',
            'China': 'China', 'France': 'France', 'Japan': 'Japan', 'India': 'India',
            'Australia': 'Australia', 'Brazil': 'Brazil', 'Israel': 'Israel',
            'Iran': 'Iran', 'South Korea': 'South Korea', 'North Korea': 'North Korea',
            'New Zealand': 'New Zealand', 'Canada': 'Canada', 'Argentina': 'Argentina',
            'UK': 'United Kingdom', 'Germany': 'Germany', 'Italy': 'Italy',
            'Spain': 'Spain', 'Ukraine': 'Ukraine', 'Kenya': 'Kenya',
        };

        async function autoLoad(url, loadUrl) {
            let res  = await fetch(`${url}?limit=0`);
            let data = await res.json();
            if (Array.isArray(data) && data.length === 0) {
                await fetch(loadUrl);
                res  = await fetch(`${url}?limit=0`);
                data = await res.json();
            }
            return data;
        }

        onMount(async () => {
            try {
                // Cargar ambas APIs con auto-cargado si están vacías
                const [launches, dietData] = await Promise.all([
                    autoLoad(LAUNCHES_API, `${LAUNCHES_API}/loadInitialData`),
                    autoLoad(DIET_API,     `${DIET_API}/loadinitialsat`)
                ]);

                totalLaunches = launches.length;
                totalDiet     = dietData.length;

                // Contar lanzamientos y éxitos por país
                const lanzamientosPorPais = {};
                const exitosPorPais       = {};
                launches.forEach(m => {
                    if (!m.country) return;
                    lanzamientosPorPais[m.country] = (lanzamientosPorPais[m.country] || 0) + 1;
                    if (m.mission_status === 'Success') {
                        exitosPorPais[m.country] = (exitosPorPais[m.country] || 0) + 1;
                    }
                });

                // Agrupar dieta por país (último año disponible)
                const dietaPorPais = {};
                dietData.forEach(d => {
                    if (!d.country) return;
                    if (!dietaPorPais[d.country] || d.year > dietaPorPais[d.country].year) {
                        dietaPorPais[d.country] = d;
                    }
                });

                // Cruzar datos
                const rows = [];
                Object.entries(lanzamientosPorPais).forEach(([pais, numLaunches]) => {
                    const dietKey   = COUNTRY_MAP[pais] ?? pais;
                    const dietEntry = dietaPorPais[dietKey]
                        ?? Object.values(dietaPorPais).find(d =>
                            d.country?.toLowerCase().includes(dietKey.toLowerCase())
                        );

                    const exitos    = exitosPorPais[pais] || 0;
                    const tasaExito = numLaunches > 0 ? ((exitos / numLaunches) * 100).toFixed(1) : 0;

                    rows.push({
                        country:      pais,
                        launches:     numLaunches,
                        exitos,
                        tasaExito:    Number(tasaExito),
                        region:       dietEntry?.region                      ?? '—',
                        year:         dietEntry?.year                        ?? '—',
                        costDay:      dietEntry?.cost_healthy_diet_ppp_usd   ?? null,
                        costYear:     dietEntry?.annual_cost_healthy_diet_usd ?? null,
                        costCategory: dietEntry?.cost_category               ?? '—',
                    });
                });

                filas = rows;

                regiones   = [...new Set(rows.map(r => r.region).filter(r => r !== '—'))].sort();
                categorias = [...new Set(rows.map(r => r.costCategory).filter(c => c !== '—'))].sort();
                anios      = [...new Set(rows.map(r => r.year).filter(y => y !== '—'))].sort((a, b) => b - a);

                aplicarFiltros();

            } catch (err) {
                errorMsg = `Error de conexión: ${err.message}`;
                console.error(err);
            } finally {
                loading = false;
            }
        });

        function aplicarFiltros() {
            let result = [...filas];
            if (filterRegion)   result = result.filter(r => r.region === filterRegion);
            if (filterCategory) result = result.filter(r => r.costCategory === filterCategory);
            if (filterYear)     result = result.filter(r => String(r.year) === filterYear);

            result.sort((a, b) => {
                const va = a[sortBy] ?? -1;
                const vb = b[sortBy] ?? -1;
                if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
                return sortDir === 'asc' ? va - vb : vb - va;
            });

            filtradas = result;
        }

        function toggleSort(campo) {
            if (sortBy === campo) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortBy  = campo;
                sortDir = 'desc';
            }
            aplicarFiltros();
        }

        function sortIcon(campo) {
            if (sortBy !== campo) return '↕';
            return sortDir === 'asc' ? '↑' : '↓';
        }

        function limpiar() {
            filterRegion = ''; filterCategory = ''; filterYear = '';
            sortBy = 'launches'; sortDir = 'desc';
            aplicarFiltros();
        }

        function categoryColor(cat) {
            if (cat === 'Low Cost')    return '#39FF14';
            if (cat === 'Medium Cost') return '#FFD700';
            if (cat === 'High Cost')   return '#FF4500';
            return '#8b949e';
        }

        function exitoColor(tasa) {
            if (tasa >= 90) return '#39FF14';
            if (tasa >= 70) return '#FFD700';
            return '#FF4500';
        }
    </script>

    <style>
        .wrap { background:#0d1117; min-height:100vh; padding:24px; font-family:sans-serif; color:#e6edf3; }
        h2 { color:#e6edf3; margin-bottom:8px; }
        p.sub { color:#8b949e; font-size:13px; margin-bottom:16px; }
        .back-btn { background:#21262d; border:1px solid #30363d; color:#8b949e; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:13px; margin-bottom:16px; display:inline-block; margin-right:8px; }
        .back-btn:hover { border-color:#58a6ff; color:#58a6ff; }
        .controls { display:flex; gap:12px; flex-wrap:wrap; align-items:center; margin-bottom:12px; background:#161b22; padding:12px 16px; border-radius:8px; border:1px solid #30363d; }
        label { color:#8b949e; font-size:13px; }
        select { background:#21262d; border:1px solid #30363d; color:#e6edf3; padding:5px 8px; border-radius:6px; font-size:13px; }
        .clear-btn { background:#21262d; border:1px solid #30363d; color:#f85149; padding:5px 12px; border-radius:6px; cursor:pointer; font-size:13px; margin-left:auto; }
        .clear-btn:hover { border-color:#f85149; }
        .badges { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
        .badge { font-size:12px; background:#161b22; border:1px solid #30363d; padding:4px 10px; border-radius:20px; color:#8b949e; }
        .count { color:#8b949e; font-size:13px; margin-bottom:10px; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { background:#161b22; color:#8b949e; padding:10px 12px; text-align:left; border-bottom:1px solid #30363d; cursor:pointer; user-select:none; white-space:nowrap; }
        th:hover { color:#58a6ff; }
        td { padding:9px 12px; border-bottom:1px solid #21262d; color:#e6edf3; }
        tr:hover td { background:#161b22; }
        .badge-small { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:bold; color:#0d1117; }
        .no-data { color:#30363d; font-style:italic; }
        .status { text-align:center; padding:60px 0; color:#8b949e; }
        .status.error { color:#f85149; }
    </style>

    <div class="wrap">
        <button class="back-btn" onclick={() => goto('/integrations')}>← Volver a integraciones</button>
        <button class="back-btn" onclick={() => goto('/')}>🏠 Portada</button>

        <h2>🚀 Space Launches × 🥗 Coste de Dieta Saludable</h2>
        <p class="sub">
            Cruce entre lanzamientos espaciales por país y el coste diario de una dieta saludable —
            ¿los países que más invierten en espacio tienen dietas más caras?
        </p>

        {#if loading}
            <div class="status">⟳ Cargando datos de ambas APIs...</div>
        {:else if errorMsg}
            <div class="status error">❌ {errorMsg}</div>
        {:else}
            <div class="badges">
                <span class="badge">🚀 {totalLaunches.toLocaleString()} lanzamientos</span>
                <span class="badge">🥗 {totalDiet.toLocaleString()} registros de dieta</span>
                <span class="badge">🌍 {filas.filter(f => f.costDay !== null).length} países cruzados</span>
            </div>

            <div class="controls">
                <label>Región:
                    <select bind:value={filterRegion} onchange={aplicarFiltros}>
                        <option value="">Todas</option>
                        {#each regiones as r}<option value={r}>{r}</option>{/each}
                    </select>
                </label>
                <label>Categoría coste:
                    <select bind:value={filterCategory} onchange={aplicarFiltros}>
                        <option value="">Todas</option>
                        {#each categorias as c}<option value={c}>{c}</option>{/each}
                    </select>
                </label>
                <label>Año dieta:
                    <select bind:value={filterYear} onchange={aplicarFiltros}>
                        <option value="">Todos</option>
                        {#each anios as a}<option value={String(a)}>{a}</option>{/each}
                    </select>
                </label>
                <button class="clear-btn" onclick={limpiar}>✕ Limpiar</button>
            </div>

            <p class="count">Mostrando <strong>{filtradas.length}</strong> países · clic en columna para ordenar</p>

            <table>
                <thead>
                    <tr>
                        <th onclick={() => toggleSort('country')}>País {sortIcon('country')}</th>
                        <th onclick={() => toggleSort('launches')}>🚀 Lanzamientos {sortIcon('launches')}</th>
                        <th onclick={() => toggleSort('tasaExito')}>✅ Tasa éxito {sortIcon('tasaExito')}</th>
                        <th onclick={() => toggleSort('region')}>Región {sortIcon('region')}</th>
                        <th onclick={() => toggleSort('costDay')}>💰 Coste/día (USD PPP) {sortIcon('costDay')}</th>
                        <th onclick={() => toggleSort('costYear')}>💰 Coste anual (USD) {sortIcon('costYear')}</th>
                        <th onclick={() => toggleSort('year')}>Año dato {sortIcon('year')}</th>
                        <th>Categoría</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filtradas as f}
                        <tr>
                            <td><strong>{f.country}</strong></td>
                            <td>{f.launches}</td>
                            <td>
                                <span class="badge-small" style="background:{exitoColor(f.tasaExito)}">{f.tasaExito}%</span>
                            </td>
                            <td>{f.region}</td>
                            <td>{#if f.costDay !== null}${f.costDay.toFixed(2)}{:else}<span class="no-data">sin datos</span>{/if}</td>
                            <td>{#if f.costYear !== null}${f.costYear.toFixed(2)}{:else}<span class="no-data">sin datos</span>{/if}</td>
                            <td>{f.year}</td>
                            <td>
                                {#if f.costCategory !== '—'}
                                    <span class="badge-small" style="background:{categoryColor(f.costCategory)}">{f.costCategory}</span>
                                {:else}
                                    <span class="no-data">—</span>
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>