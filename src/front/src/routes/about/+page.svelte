<script>
	import { goto } from '$app/navigation';
</script>

<h2>Acerca de / Presentaciones del Grupo (D03)</h2>

<p>
	En esta sección se encuentran los vídeos demostrativos de cada componente del grupo 
	explicando las funcionalidades y el desarrollo del entregable D03 (Backend, Frontend e Integraciones).
</p>

<hr>

<!-- VÍDEO 1: EL TUYO -->
<div class="video-card">
	<h3>1. Jeremías J. Pluas Charcopa - Meteorite Landings</h3>
	<p>Duración: Menos de 5 minutos.</p>
	
	<!-- INSTRUCCIONES: Cambia "ID_DE_TU_VIDEO" por las letras raras que salen en tu URL de YouTube después de "v=" -->
	<div class="iframe-container">
		<iframe 
			src="https://www.youtube.com/embed/ID_DE_TU_VIDEO" 
			title="Presentación D03 - Jeremías J. Pluas Charcopa" 
			frameborder="0" 
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
			allowfullscreen>
		</iframe>
	</div>
</div>

<br>

<!-- VÍDEO 2: COMPAÑERO 1 -->
<div class="video-card">
	<h3>2. Fernando Reguera Bueno - Space Launches</h3>
	<p>Duración: Menos de 5 minutos.</p>
	
	<div class="iframe-container">
		<iframe 
			src="https://www.youtube.com/embed/ID_VIDEO_COMPAÑERO_1" 
			title="Presentación D03 - Fernando Reguera Bueno" 
			frameborder="0" 
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
			allowfullscreen>
		</iframe>
	</div>
</div>

<br>

<!-- VÍDEO 3: COMPAÑERO 2 (Si sois 3 en el grupo) -->
<div class="video-card">
	<h3>3. Jaime García Algarra - Active Satellites</h3>
	<p>Duración: Menos de 5 minutos.</p>
	
	<div class="iframe-container">
		<iframe 
			src="https://www.youtube.com/embed/ID_VIDEO_COMPAÑERO_2" 
			title="Presentación D03 - Jaime García Algarra" 
			frameborder="0" 
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
			allowfullscreen>
		</iframe>
	</div>
</div>

<br><hr><br>

<button onclick={() => goto('/')}> Volver a la portada</button>

<style>
	/* Estilos para mantener todo limpio, ordenado y minimalista */
	.video-card {
		background-color: #f8fafc;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
	}

	.video-card h3 {
		margin-top: 0;
		color: #334155;
	}

	/* Esto hace que el iframe de YouTube sea responsive y no se rompa en móviles */
	.iframe-container {
		position: relative;
		width: 100%;
		padding-bottom: 56.25%; /* Ratio 16:9 de YouTube */
		height: 0;
		overflow: hidden;
		border-radius: 4px;
	}

	.iframe-container iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	button {
		padding: 10px 20px;
		cursor: pointer;
		font-size: 16px;
	}
</style>