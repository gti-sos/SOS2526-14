<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const METEORITE_API = '/api/v2/meteorite-landings';
	const DEATHS_API    = 'https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors';

	// ── Mismo COUNTRY_MAP de src/back/utils/normalize-countries.js ──────────────
	const COUNTRY_MAP = {
		'USA':                           'United States of America',
		'US':                            'United States of America',
		'United States':                 'United States of America',
		'U.S.A.':                        'United States of America',
		'U.S.':                          'United States of America',
		'Brasil':                        'Brazil',
		'México':                        'Mexico',
		'Bolivia':                       'Bolivia',
		'Venezuela':                     'Venezuela',
		'Trinidad':                      'Trinidad and Tobago',
		'UK':                            'United Kingdom',
		'Great Britain':                 'United Kingdom',
		'England':                       'United Kingdom',
		'Russia':                        'Russia',
		'Czech Republic':                'Czechia',
		'Macedonia':                     'North Macedonia',
		'South Korea':                   'South Korea',
		'North Korea':                   'North Korea',
		'Iran':                          'Iran',
		'Syria':                         'Syrian Arab Republic',
		'Vietnam':                       'Vietnam',
		'Laos':                          'Lao PDR',
		'Burma':                         'Myanmar',
		'Taiwan':                        'Taiwan',
		"Ivory Coast":                   "Côte d'Ivoire",
		"Cote d'Ivoire":                 "Côte d'Ivoire",
		'DR Congo':                      'Democratic Republic of the Congo',
		'DRC':                           'Democratic Republic of the Congo',
		'Congo':                         'Republic of the Congo',
		'Tanzania':                      'United Republic of Tanzania',
		'Libya':                         'Libya',
		'Egypt':                         'Egypt',
		'New Zealand':                   'New Zealand',
	};

	const RISK_LABELS = {
		air_pollution:                            'Contaminación del aire',
		high_systolic_blood_pressure:             'Hipertensión sistólica',
		high_fasting_plasma_glucose:              'Glucosa en ayunas alta',
		household_air_pollution_from_solid_fuels: 'Polución doméstica',
		child_wasting:                            'Desnutrición infantil',
	};

	function normalizeCountry(raw) {
		if (!raw || !raw.trim()) return '';
		const trimmed = raw.trim();
		return COUNTRY_MAP[trimmed] ?? trimmed;
	}

	// Mediana: más robusta que la media ante outliers como el meteorito Hoba (Namibia)
	function median(arr) {
		if (!arr.length) return 0;
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 !== 0
			? sorted[mid]
			: (sorted[mid - 1] + sorted[mid]) / 2;
	}

	// ── Estado ───────────────────────────────────────────────────────────────────
	let loading        = $state(true);
	let error          = $state('');
	let selectedRisk   = $state('air_pollution');
	let selectedYear   = $state('all');
	let availableYears = $state([]);
	let seriesData     = $state([]);
	let useMassMode    = $state('median'); // 'median' | 'avg'

	let totalCountries  = $state(0);
	let totalMeteorites = $state(0);
	let maxMassDisplay  = $state(0);

	let meteoriteByCountry = {};
	let deathsByCountry    = {};

	// ── Agrupación ───────────────────────────────────────────────────────────────
	function groupMeteorites(meteorites) {
		const grouped = {};
		for (const m of meteorites) {
			const country = normalizeCountry(m.country);
			if (!country) continue;
			if (!grouped[country]) grouped[country] = { count: 0, masses: [], totalMass: 0 };
			grouped[country].count++;
			grouped[country].totalMass += (m.mass || 0);
			if (m.mass > 0) grouped[country].masses.push(m.mass);
		}
		for (const c of Object.keys(grouped)) {
			const d = grouped[c];
			d.avgMass    = d.count > 0 ? d.totalMass / d.count : 0;
			d.medianMass = median(d.masses);
		}
		return grouped;
	}

	function groupDeaths(deaths) {
		const grouped = {};
		const years   = new Set();
		for (const d of deaths) {
			const country = normalizeCountry(d.entity);
			if (!country) continue;
			if (!grouped[country]) grouped[country] = {};
			grouped[country][d.year] = d;
			years.add(d.year);
		}
		return { grouped, years: [...years].sort((a, b) => a - b) };
	}

	// ── Construir puntos ─────────────────────────────────────────────────────────
	function buildSeries(riskField, year, massMode) {
		const points = [];
		for (const country of Object.keys(meteoriteByCountry)) {
			const met = meteoriteByCountry[country];
			if (!deathsByCountry[country]) continue;

			let riskValue;
			if (year === 'all') {
				const vals = Object.values(deathsByCountry[country])
					.map(r => r[riskField])
					.filter(v => v != null && !isNaN(v));
				if (!vals.length) continue;
				riskValue = vals.reduce((a, b) => a + b, 0) / vals.length;
			} else {
				const row = deathsByCountry[country][Number(year)];
				if (!row || row[riskField] == null) continue;
				riskValue = row[riskField];
			}

			const massValue = massMode === 'median' ? met.medianMass : met.avgMass;

			// Logarítmico necesita valores > 0
			if (massValue <= 0 || riskValue <= 0) continue;

			const abbr = country
				.replace(/[^A-Za-z ]/g, '')
				.split(' ')
				.map(w => w[0] || '')
				.join('')
				.slice(0, 3)
				.toUpperCase();

			points.push({
				x:           Math.round(massValue),
				y:           Math.round(riskValue),
				z:           met.count,
				name:        abbr,
				country,
				count:       met.count,
				avgMass:     Math.round(met.avgMass),
				medianMass:  Math.round(met.medianMass),
				totalMass:   Math.round(met.totalMass),
			});
		}
		return points;
	}

	// ── Renderizar chart ─────────────────────────────────────────────────────────
	function renderChart(points, riskField, year, massMode) {
		const riskLabel = RISK_LABELS[riskField];
		const yearLabel = year === 'all' ? 'promedio todos los años' : year;
		const massLabel = massMode === 'median' ? 'mediana' : 'promedio';

		if (!window.Highcharts) return;

		window.Highcharts.chart('hc-container', {
			chart: {
				type: 'bubble',
				plotBorderWidth: 1,
				zooming: { type: 'xy' },
				animation: { duration: 400 },
			},
			title: {
				text: `Masa de meteoritos vs muertes por ${riskLabel}`,
			},
			subtitle: {
				text: `Año: ${yearLabel} · Eje X: ${massLabel} de masa · Tamaño burbuja = nº meteoritos`,
			},
			legend: { enabled: false },
			accessibility: {
				point: {
					valueDescriptionFormat:
						'{index}. {point.country}: masa {point.x} g, muertes {point.y}, meteoritos {point.z}.',
				},
			},
			xAxis: {
				type: 'logarithmic',           // ← escala log en X
				gridLineWidth: 1,
				title: { text: `Masa de meteoritos — ${massLabel} (g) · escala logarítmica` },
				labels: {
					formatter: function () {
						return Highcharts.numberFormat(this.value, 0, ',', '.');
					},
				},
			},
			yAxis: {
				type: 'logarithmic',           // ← escala log en Y
				startOnTick: false,
				endOnTick: false,
				title: { text: `Muertes por ${riskLabel} · escala logarítmica` },
				labels: {
					formatter: function () {
						return Highcharts.numberFormat(this.value, 0, ',', '.');
					},
				},
				maxPadding: 0.2,
			},
			tooltip: {
				useHTML: true,
				headerFormat: '<table>',
				pointFormat:
					`<tr><th colspan="2"><h3>{point.country}</h3></th></tr>` +
					`<tr><th>Mediana masa:</th><td>{point.medianMass} g</td></tr>` +
					`<tr><th>Media masa:</th><td>{point.avgMass} g</td></tr>` +
					`<tr><th>Masa total:</th><td>{point.totalMass} g</td></tr>` +
					`<tr><th>Nº meteoritos:</th><td>{point.count}</td></tr>` +
					`<tr><th>Muertes (${riskLabel}):</th><td>{point.y:,.0f}</td></tr>`,
				footerFormat: '</table>',
				followPointer: true,
			},
			plotOptions: {
				series: {
					dataLabels: {
						enabled: true,
						format: '{point.name}',
						style: { fontSize: '10px', textOutline: 'none' },
					},
				},
				bubble: { minSize: 6, maxSize: 50 },
			},
			series: [{ data: points, colorByPoint: true }],
			credits: {
				text: 'meteorite-landings API + deaths-by-risk-factors API',
			},
		});
	}

	// ── Actualizar al cambiar controles ──────────────────────────────────────────
	function updateChart() {
		const points = buildSeries(selectedRisk, selectedYear, useMassMode);
		seriesData      = points;
		totalCountries  = points.length;
		totalMeteorites = points.reduce((s, p) => s + p.count, 0);
		maxMassDisplay  = points.length ? Math.max(...points.map(p => p.x)) : 0;
		renderChart(points, selectedRisk, selectedYear, useMassMode);
	}

	// ── Carga inicial ────────────────────────────────────────────────────────────
	function loadScript(src) {
		return new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = src; s.onload = resolve; s.onerror = reject;
			document.head.appendChild(s);
		});
	}

	onMount(async () => {
		if (!window.Highcharts) {
			await loadScript('https://code.highcharts.com/highcharts.js');
			await loadScript('https://code.highcharts.com/highcharts-more.js');
			await loadScript('https://code.highcharts.com/modules/accessibility.js');
		}
		try {
			const [meteoriteRes, deathsRes] = await Promise.all([
				fetch(`${METEORITE_API}?limit=0`),
				fetch(DEATHS_API),
			]);
			if (!meteoriteRes.ok || !deathsRes.ok) {
				error = '❌ Error al cargar una de las APIs.';
				loading = false;
				return;
			}
			const meteorites = await meteoriteRes.json();
			const deaths     = await deathsRes.json();

			meteoriteByCountry = groupMeteorites(meteorites);
			const { grouped, years } = groupDeaths(deaths);
			deathsByCountry = grouped;
			availableYears  = years;

			loading = false;
			updateChart();
		} catch (err) {
			error   = `❌ Error de red: ${err.message}`;
			loading = false;
		}
	});
</script>

<h2>Integración: Meteoritos × Factores de riesgo de salud</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<!-- Controles -->
<label for="riskSelect">Factor de riesgo (eje Y):</label>
<select id="riskSelect" bind:value={selectedRisk} onchange={updateChart}>
	<option value="air_pollution">Contaminación del aire</option>
	<option value="high_systolic_blood_pressure">Hipertensión sistólica</option>
	<option value="high_fasting_plasma_glucose">Glucosa en ayunas alta</option>
	<option value="household_air_pollution_from_solid_fuels">Polución doméstica</option>
	<option value="child_wasting">Desnutrición infantil</option>
</select>

&nbsp;

<label for="yearSelect">Año:</label>
<select id="yearSelect" bind:value={selectedYear} onchange={updateChart}>
	<option value="all">Todos (promedio)</option>
	{#each availableYears as y}
		<option value={y}>{y}</option>
	{/each}
</select>

&nbsp;

<label for="massMode">Masa (eje X):</label>
<select id="massMode" bind:value={useMassMode} onchange={updateChart}>
	<option value="median">Mediana (recomendado)</option>
	<option value="avg">Media</option>
</select>

<br><br>

<!-- Stats -->
{#if !loading && !error}
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>Países con datos cruzados</th>
				<th>Meteoritos totales</th>
				<th>Masa máxima en eje X (g)</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>{totalCountries}</td>
				<td>{totalMeteorites.toLocaleString('es-ES')}</td>
				<td>{maxMassDisplay.toLocaleString('es-ES')} g</td>
			</tr>
		</tbody>
	</table>
	<br>
{/if}

{#if loading}
	<p>Cargando datos de ambas APIs...</p>
{:else if error}
	<p>{error}</p>
{/if}

<!-- Chart -->
<div id="hc-container" style="width:100%; height:500px; min-width:310px;"></div>

<br>

<!-- Tabla de resultados -->
{#if seriesData.length > 0}
	<h3>Datos cruzados ({seriesData.length} países)</h3>
	<table border="1" cellpadding="8" cellspacing="0">
		<thead>
			<tr>
				<th>País</th>
				<th>Nº Meteoritos</th>
				<th>Mediana masa (g)</th>
				<th>Media masa (g)</th>
				<th>Muertes ({RISK_LABELS[selectedRisk]})</th>
			</tr>
		</thead>
		<tbody>
			{#each [...seriesData].sort((a, b) => b.y - a.y) as p}
				<tr>
					<td>{p.country}</td>
					<td>{p.count}</td>
					<td>{p.medianMass.toLocaleString('es-ES')}</td>
					<td>{p.avgMass.toLocaleString('es-ES')}</td>
					<td>{p.y.toLocaleString('es-ES')}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}