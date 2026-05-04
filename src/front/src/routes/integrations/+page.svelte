<script>
	import { goto } from '$app/navigation';
</script>

<h2>Menú de Integraciones (Grupo SOS2526-14)</h2>

<p>
    En esta vista se agrupan todos los usos e integraciones de APIs externas 
    realizadas por los miembros del grupo, cumpliendo con el requisito D03.B.
</p>

<hr>

<h3>Integraciones de Meteoritos (Jeremías J. Pluas Charcopa)</h3>
<div style="display: flex; flex-direction: column; gap: 10px; max-width: 400px;">
    
    <button onclick={() => goto('/integrations/meteorite-landings/deaths-by-risk-factors')}>
        1. API deaths-by-risk-factors (Integración Compañero SOS) - Widget
    </button>

    <button onclick={() => goto('/integrations/meteorite-landings/national-team-rankings-per-years')}>
        2. API national-team-rankings-per-years (Integración Compañero SOS) - Widget
    </button>

    <button onclick={() => goto('/integrations/meteorite-landings/spacex')}>
        3. API SpaceX (Uso api externa) - Tabla
    </button>
    
    <button onclick={() => goto('/integrations/meteorite-landings/weather')}>
        4. API Open-Meteo (Uso api externa) - Tabla
    </button>
    
    <button onclick={() => goto('/integrations/meteorite-landings/personajes')}>
        5. API Rick & Morty (Uso api externa con PROXY PROPIO) - Tabla
    </button>
    
    <button onclick={() => goto('/integrations/meteorite-landings/earthquakes')}>
        6. API USGS Terremotos (Uso api externa) - Widget
    </button>

    <button onclick={() => goto('/integrations/meteorite-landings/nyc-trees')}>
        7. API NYC Trees (Uso api externa) - Widget
    </button>

    <button onclick={() => goto('/integrations/meteorite-landings/social-drinking-behaviors')}>
        8. API social-drinking-behaviors (Integración Compañero SOS) - Widget
    </button>

</div>

<br><hr><br>

<h3>Integraciones de active-satellites [Jaime García Algarra]</h3>
<div style="display: flex; flex-direction: column; gap: 10px; max-width: 400px;">
    
    <button onclick={() => goto('/integrations/active-satellites/literacy-rates')}>
        1. API literacy-rates (Integración Compañero SOS) - Widget
    </button>
    <button onclick={() => goto('/integrations/active-satellites/food-supply-utilization-accounts')}>
        2. API food-supply-utilization-accounts (Integración Compañero SOS) - Widget
    </button>

    <button onclick={() => goto('/integrations/active-satellites/fifa23-players')}>
        3. API fifa23-players (Uso Externo) - Widget
    </button>
     <button onclick={() => goto('/integrations/active-satellites/COVID-19-statics')}>
        4. API COVID-19-statics (Uso Externo) - Widget
    </button>
     <button onclick={() => goto('/integrations/active-satellites/formula1')}>
        5. API Formula1 (Integración externa) - Widget
    </button>
    </div>

<br><hr><br>

<h3>Integraciones de [Fernando Reguera Bueno]</h3>
<div style="display: flex; flex-direction: column; gap: 10px; max-width: 400px;">
    
    <button onclick={() => goto('/integrations/space-launches/pandemics')}>
        1. API pandemics (Integración Compañero SOS) - Widget
    </button>
    <button onclick={() => goto('/integrations/space-launches/soporte-cost-of-healthy-diet')}>
        2. API soporte-cost-of-healthy-diet (Integración Compañero SOS) - Widget
    </button>
    <button onclick={() => goto('/integrations/space-launches/iss-location')}>
        3. API iss-location (Uso api externa con PROXY PROPIO) - Widget
    </button>

</div>
<br><br>










<button onclick={() => goto('/')}>Volver a la Página Principal</button>










<style>
    button {
        padding: 10px;
        text-align: left;
        cursor: pointer;
    }
</style>