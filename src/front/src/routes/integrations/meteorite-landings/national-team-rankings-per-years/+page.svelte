<script>
	// @ts-nocheck
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const METEORITE_API = '/api/v2/meteorite-landings';
	const RANKINGS_API  = 'https://sos2526-26.onrender.com/api/v2/national-team-rankings-per-years';

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

	const ES_TO_EN = {
		'Afganistán':'Afghanistan','Albania':'Albania','Alemania':'Germany',
		'Algeria':'Algeria','Andorra':'Andorra','Angola':'Angola',
		'Arabia Saudita':'Saudi Arabia','Argentina':'Argentina','Armenia':'Armenia',
		'Australia':'Australia','Austria':'Austria','Azerbaiyán':'Azerbaijan',
		'Bahréin':'Bahrain','Bangladesh':'Bangladesh','Bélgica':'Belgium',
		'Bielorrusia':'Belarus','Bolivia':'Bolivia',
		'Bosnia y Herzegovina':'Bosnia and Herzegovina','Brasil':'Brazil',
		'Bulgaria':'Bulgaria','Camerún':'Cameroon','Canadá':'Canada',
		'Chile':'Chile','China':'China','Colombia':'Colombia',
		'Corea del Norte':'North Korea','Corea del Sur':'South Korea',
		'Costa Rica':'Costa Rica',"Costa de Marfil":"Côte d'Ivoire",
		'Croacia':'Croatia','Cuba':'Cuba','Dinamarca':'Denmark','Ecuador':'Ecuador',
		'Egipto':'Egypt','El Salvador':'El Salvador',
		'Emiratos Árabes Unidos':'United Arab Emirates','Escocia':'Scotland',
		'Eslovaquia':'Slovakia','Eslovenia':'Slovenia','España':'Spain',
		'Estados Unidos':'United States of America','Estonia':'Estonia',
		'Etiopía':'Ethiopia','Finlandia':'Finland','Francia':'France',
		'Gales':'Wales','Ghana':'Ghana','Grecia':'Greece','Guatemala':'Guatemala',
		'Honduras':'Honduras','Hungría':'Hungary','India':'India',
		'Indonesia':'Indonesia','Inglaterra':'United Kingdom','Irak':'Iraq',
		'Irán':'Iran','Irlanda':'Ireland','Islandia':'Iceland','Israel':'Israel',
		'Italia':'Italy','Jamaica':'Jamaica','Japón':'Japan','Jordania':'Jordan',
		'Kazajistán':'Kazakhstan','Kenia':'Kenya','Kosovo':'Kosovo',
		'Letonia':'Latvia','Líbano':'Lebanon','Libia':'Libya','Lituania':'Lithuania',
		'Luxemburgo':'Luxembourg','Malasia':'Malaysia','Mali':'Mali',
		'Marruecos':'Morocco','México':'Mexico','Montenegro':'Montenegro',
		'Nigeria':'Nigeria','Noruega':'Norway','Nueva Zelanda':'New Zealand',
		'Omán':'Oman','Países Bajos':'Netherlands','Pakistán':'Pakistan',
		'Panamá':'Panama','Paraguay':'Paraguay','Perú':'Peru','Polonia':'Poland',
		'Portugal':'Portugal','Qatar':'Qatar','República Checa':'Czechia',
		'República Dominicana':'Dominican Republic','Rumanía':'Romania',
		'Rusia':'Russia','Senegal':'Senegal','Serbia':'Serbia',
		'Siria':'Syrian Arab Republic','Sudáfrica':'South Africa','Suecia':'Sweden',
		'Suiza':'Switzerland','Tailandia':'Thailand',
		'Tanzania':'United Republic of Tanzania',
		'Trinidad y Tobago':'Trinidad and Tobago','Túnez':'Tunisia',
		'Turquía':'Turkey','Ucrania':'Ukraine','Uganda':'Uganda',
		'Uruguay':'Uruguay','Venezuela':'Venezuela','Vietnam':'Vietnam',
	};

	function normalizeRanking(raw) {
		if (!raw) return '';
		return ES_TO_EN[raw.trim()] ?? raw.trim();
	}

	let loading   = $state(true);
	let error     = $state('');
	let sortBy    = $state('meteorites');
	let chartData = $state([]);

	async function loadData() {
		const [meteorites, rankings] = await Promise.all([
			fetchWithAutoLoad(METEORITE_API, '?limit=0'),
			fetchWithAutoLoad(RANKINGS_API),
		]);

		const metCount = {};
		for (const m of meteorites) {
			if (!m.country) continue;
			metCount[m.country] = (metCount[m.country] || 0) + 1;
		}

		const fifaLatest = {};
		for (const r of rankings) {
			const country = normalizeRanking(r.country);
			if (!country) continue;
			if (!fifaLatest[country] || r.year > fifaLatest[country].year) {
				fifaLatest[country] = { score: r.score, rank: r.rank, year: r.year };
			}
		}

		const crossed = [];
		for (const country of Object.keys(metCount)) {
			if (!fifaLatest[country]) continue;
			crossed.push({
				country,
				meteorites: metCount[country],
				score:      fifaLatest[country].score,
				rank:       fifaLatest[country].rank,
				year:       fifaLatest[country].year,
			});
		}
		return crossed;
	}

	function sortData(data, by) {
		if (by === 'meteorites') return [...data].sort((a, b) => b.meteorites - a.meteorites);
		if (by === 'score')      return [...data].sort((a, b) => b.score - a.score);
		return [...data].sort((a, b) => a.country.localeCompare(b.country));
	}

	function renderChart(data) {
		if (!window.Highcharts || !data.length) return;
		const sorted      = sortData(data, sortBy);
		const categories  = sorted.map(d => d.country);
		const metSeries   = sorted.map(d => d.meteorites);
		const scoreSeries = sorted.map(d => ({ y: d.score, rank: d.rank, year: d.year }));

		window.Highcharts.chart('hc-container', {
			chart: { zooming: { type: 'xy' } },
			title: { text: 'Meteoritos caídos vs Puntuación FIFA por país', align: 'left' },
			subtitle: { text: 'Barras = total meteoritos históricos · Línea = puntuación FIFA más reciente', align: 'left' },
			xAxis: [{ categories, crosshair: true, labels: { rotation: -45, style: { fontSize: '10px' } } }],
			yAxis: [
				{ title: { text: 'Puntuación FIFA' }, lineColor: Highcharts.getOptions().colors[1], lineWidth: 2 },
				{ title: { text: 'Meteoritos caídos' }, opposite: true, lineColor: Highcharts.getOptions().colors[0], lineWidth: 2, min: 0, allowDecimals: false },
			],
			tooltip: {
				shared: true,
				formatter: function () {
					let s = `<b>${this.x}</b><br/>`;
					for (const pt of this.points) {
						if (pt.series.name === 'Puntuación FIFA') {
							s += `Puntuación FIFA: <b>${pt.y}</b> (ranking #${pt.point.rank}, año ${pt.point.year})<br/>`;
						} else {
							s += `Meteoritos caídos: <b>${pt.y}</b><br/>`;
						}
					}
					return s;
				},
			},
			legend: { align: 'left', verticalAlign: 'top' },
			series: [
				{ name: 'Puntuación FIFA', type: 'spline', yAxis: 0, data: scoreSeries, color: Highcharts.getOptions().colors[1] },
				{ name: 'Meteoritos caídos', type: 'column', yAxis: 1, data: metSeries, color: Highcharts.getOptions().colors[0] },
			],
			credits: { text: 'meteorite-landings API + national-team-rankings-per-years API' },
		});
	}

	function updateChart() { renderChart(chartData); }

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
			chartData = await loadData();
			loading   = false;
			renderChart(chartData);
		} catch (err) {
			error   = `❌ Error de red: ${err.message}`;
			loading = false;
		}
	});
</script>

<h2>Integración: Meteoritos × Ranking FIFA</h2>

<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>
<button onclick={() => goto('/')}>Volver a la portada</button>

<br><br>

<label for="sortSelect">Ordenar por:</label>
<select id="sortSelect" bind:value={sortBy} onchange={updateChart}>
	<option value="meteorites">Más meteoritos primero</option>
	<option value="score">Mayor puntuación FIFA primero</option>
	<option value="alpha">Alfabético</option>
</select>

{#if !loading && !error}
	&nbsp;<small>({chartData.length} países con datos en ambas APIs)</small>
{/if}

<br><br>

{#if loading}
	<p>Cargando datos de ambas APIs...</p>
{:else if error}
	<p>{error}</p>
{/if}

<div id="hc-container" style="width:100%; height:400px; min-width:310px;"></div>

<br>
<button onclick={() => goto('/meteorite-landings')}>← Volver a Meteoritos</button>