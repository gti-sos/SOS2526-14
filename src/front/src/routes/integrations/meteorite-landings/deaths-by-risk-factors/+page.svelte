<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const METEORITE_API = '/api/v2/meteorite-landings';
	const DEATHS_API    = 'https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors';

	async function fetchWithAutoLoad(baseUrl, query = '') {
		let res  = await fetch(baseUrl + query);
		let data = await res.json();
		if (Array.isArray(data) && data.length === 0) {
			await fetch(`${baseUrl}/loadInitialData`);
			res  = await fetch(baseUrl + query);
			data = await res.json();
		}
		return data;
	}

	const COUNTRY_MAP = {
		'USA':'United States of America','US':'United States of America',
		'United States':'United States of America','U.S.A.':'United States of America',
		'U.S.':'United States of America','Brasil':'Brazil','México':'Mexico',
		'Bolivia':'Bolivia','Venezuela':'Venezuela','Trinidad':'Trinidad and Tobago',
		'UK':'United Kingdom','Great Britain':'United Kingdom','England':'United Kingdom',
		'Russia':'Russia','Czech Republic':'Czechia','Macedonia':'North Macedonia',
		'South Korea':'South Korea','North Korea':'North Korea','Iran':'Iran',
		'Syria':'Syrian Arab Republic','Vietnam':'Vietnam','Laos':'Lao PDR',
		'Burma':'Myanmar','Taiwan':'Taiwan',"Ivory Coast":"Côte d'Ivoire",
		"Cote d'Ivoire":"Côte d'Ivoire",'DR Congo':'Democratic Republic of the Congo',
		'DRC':'Democratic Republic of the Congo','Congo':'Republic of the Congo',
		'Tanzania':'United Republic of Tanzania','Libya':'Libya','Egypt':'Egypt',
		'New Zealand':'New Zealand',
	};

	const CONTINENT_MAP = {
		'Africa': [
			'Algeria','Angola','Benin','Botswana','Burkina Faso','Burundi','Cameroon',
			'Cape Verde','Central African Republic','Chad','Comoros',"Côte d'Ivoire",
			'Democratic Republic of the Congo','Djibouti','Egypt','Equatorial Guinea',
			'Eritrea','Eswatini','Ethiopia','Gabon','Gambia','Ghana','Guinea',
			'Guinea-Bissau','Kenya','Lesotho','Liberia','Libya','Madagascar','Malawi',
			'Mali','Mauritania','Mauritius','Morocco','Mozambique','Namibia','Niger',
			'Nigeria','Republic of the Congo','Rwanda','Sao Tome and Principe','Senegal',
			'Sierra Leone','Somalia','South Africa','South Sudan','Sudan','Tanzania',
			'Togo','Tunisia','Uganda','United Republic of Tanzania','Zambia','Zimbabwe',
		],
		'Asia': [
			'Afghanistan','Armenia','Azerbaijan','Bahrain','Bangladesh','Bhutan','Brunei',
			'Cambodia','China','Cyprus','Georgia','India','Indonesia','Iran','Iraq',
			'Israel','Japan','Jordan','Kazakhstan','Kuwait','Kyrgyzstan','Lao PDR',
			'Lebanon','Malaysia','Maldives','Mongolia','Myanmar','Nepal','North Korea',
			'Oman','Pakistan','Palestine','Philippines','Qatar','Saudi Arabia','Singapore',
			'South Korea','Sri Lanka','Syrian Arab Republic','Taiwan','Tajikistan',
			'Thailand','Timor-Leste','Turkey','Turkmenistan','United Arab Emirates',
			'Uzbekistan','Vietnam','Yemen',
		],
		'Europe': [
			'Albania','Andorra','Austria','Belarus','Belgium','Bosnia and Herzegovina',
			'Bulgaria','Croatia','Czechia','Denmark','Estonia','Finland','France',
			'Germany','Greece','Hungary','Iceland','Ireland','Italy','Kosovo','Latvia',
			'Liechtenstein','Lithuania','Luxembourg','Malta','Moldova','Monaco',
			'Montenegro','Netherlands','North Macedonia','Norway','Poland','Portugal',
			'Romania','Russia','San Marino','Serbia','Slovakia','Slovenia','Spain',
			'Sweden','Switzerland','Ukraine','United Kingdom',
		],
		'North America': [
			'Antigua and Barbuda','Bahamas','Barbados','Belize','Canada','Costa Rica',
			'Cuba','Dominica','Dominican Republic','El Salvador','Grenada','Guatemala',
			'Haiti','Honduras','Jamaica','Mexico','Nicaragua','Panama',
			'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
			'Trinidad and Tobago','United States of America',
		],
		'South America': [
			'Argentina','Bolivia','Brazil','Chile','Colombia','Ecuador','Guyana',
			'Paraguay','Peru','Suriname','Uruguay','Venezuela',
		],
		'Oceania': [
			'Australia','Fiji','Kiribati','Marshall Islands','Micronesia','Nauru',
			'New Zealand','Palau','Papua New Guinea','Samoa','Solomon Islands','Tonga',
			'Tuvalu','Vanuatu',
		],
	};

	function getContinent(country) {
		for (const [continent, countries] of Object.entries(CONTINENT_MAP)) {
			if (countries.includes(country)) return continent;
		}
		return null;
	}

	const RISK_LABELS = {
		air_pollution:                            'Contaminación del aire',
		high_systolic_blood_pressure:             'Hipertensión sistólica',
		high_fasting_plasma_glucose:              'Glucosa en ayunas alta',
		household_air_pollution_from_solid_fuels: 'Polución doméstica',
		child_wasting:                            'Desnutrición infantil',
	};

	function normalizeCountry(raw) {
		if (!raw || !raw.trim()) return '';
		const t = raw.trim();
		return COUNTRY_MAP[t] ?? t;
	}

	let loading        = $state(true);
	let error          = $state('');
	let selectedRisk   = $state('air_pollution');
	let selectedYear   = $state('all');
	let availableYears = $state([]);
	let totalCrossed   = $state(0);

	let meteoriteByCountry = {};
	let deathsByCountry    = {};

	function groupMeteorites(list) {
		const g = {};
		for (const m of list) {
			const c = normalizeCountry(m.country);
			if (!c) continue;
			g[c] = (g[c] || 0) + 1;
		}
		return g;
	}

	function groupDeaths(list) {
		const g = {};
		const years = new Set();
		for (const d of list) {
			const c = normalizeCountry(d.entity);
			if (!c) continue;
			if (!g[c]) g[c] = {};
			g[c][d.year] = d;
			years.add(d.year);
		}
		return { grouped: g, years: [...years].sort((a, b) => a - b) };
	}

	function buildSeries(riskField, year) {
		const continentData = {};
		for (const k of Object.keys(CONTINENT_MAP)) continentData[k] = [];
		let crossed = 0;

		for (const country of Object.keys(meteoriteByCountry)) {
			if (!deathsByCountry[country]) continue;
			const continent = getContinent(country);
			if (!continent) continue;

			let deaths;
			if (year === 'all') {
				const vals = Object.values(deathsByCountry[country])
					.map(r => r[riskField])
					.filter(v => v != null && !isNaN(v));
				if (!vals.length) continue;
				deaths = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
			} else {
				const row = deathsByCountry[country][Number(year)];
				if (!row || row[riskField] == null) continue;
				deaths = Math.round(row[riskField]);
			}

			continentData[continent].push({ name: country, value: meteoriteByCountry[country], deaths });
			crossed++;
		}

		totalCrossed = crossed;
		return Object.entries(continentData)
			.filter(([, data]) => data.length > 0)
			.map(([name, data]) => ({ name, data }));
	}

	function renderChart(series, riskField, year) {
		if (!window.Highcharts) return;
		const riskLabel = RISK_LABELS[riskField];
		const yearLabel = year === 'all' ? 'promedio todos los años' : year;

		window.Highcharts.chart('hc-container', {
			chart: { type: 'packedbubble', height: '75%' },
			title: { text: 'Meteoritos caídos por país y continente', align: 'left' },
			subtitle: { text: `Tamaño = nº meteoritos · Tooltip = muertes por ${riskLabel} (${yearLabel})`, align: 'left' },
			tooltip: {
				useHTML: true,
				pointFormat:
					'<b>{point.name}</b><br>' +
					'Meteoritos caídos: <b>{point.value}</b><br>' +
					`Muertes (${riskLabel}): <b>{point.deaths:,.0f}</b>`,
			},
			plotOptions: {
				packedbubble: {
					minSize: '20%', maxSize: '100%', zMin: 0,
					layoutAlgorithm: { splitSeries: true, gravitationalConstant: 0.05 },
					dataLabels: {
						enabled: true, format: '{point.name}',
						filter: { property: 'value', operator: '>', value: 5 },
						style: { color: 'black', textOutline: 'none', fontWeight: 'normal', fontSize: '10px' },
					},
				},
			},
			series,
			credits: { text: 'meteorite-landings API + deaths-by-risk-factors API' },
		});
	}

	function updateChart() {
		const series = buildSeries(selectedRisk, selectedYear);
		renderChart(series, selectedRisk, selectedYear);
	}

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
			const [meteorites, deaths] = await Promise.all([
				fetchWithAutoLoad(METEORITE_API, '?limit=0'),
				fetchWithAutoLoad(DEATHS_API),
			]);

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

<label for="riskSelect">Factor de riesgo (tooltip):</label>
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

<br><br>

{#if !loading && !error}
	<p>Países con datos en ambas APIs: <strong>{totalCrossed}</strong> &mdash;
	   Agrupados por continente &mdash; Tamaño = nº de meteoritos caídos</p>
{/if}

{#if loading}
	<p>Cargando datos de ambas APIs...</p>
{:else if error}
	<p>{error}</p>
{/if}

<div id="hc-container" style="width:100%; min-width:320px;"></div>

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>