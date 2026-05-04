<main>
    <div class="portada">
        <h1>🚀 Proyecto SOS2526-14</h1>
        <p class="subtitulo">Sistemas Orientados a Servicios - Universidad de Sevilla</p>

        <section class="enlaces-box">
            <h2>🔗 Repositorio del Proyecto</h2>
            <a href="https://github.com/gti-sos/SOS2526-14" target="_blank" class="btn-github">Ver en GitHub</a>
            <a href="/integrations" target="_blank" class="btn-github">Ver Integraciones</a>
        </section>

        <section class="equipo-box">
            <h2>👥 Equipo y Fuentes de Datos</h2>
            <div class="grid-equipo">
                <div class="tarjeta-miembro">
                    <h3>Desarrollado por: Jeremías Pluas Charcopa</h3>
                    <p><strong>Fuente de datos:</strong> meteorite-landings</p>
                    <div class="botones-recursos">
                        <a href="/meteorite-landings" class="btn-front">💻 Ver Frontend</a>
                        <a href="/api/v1/meteorite-landings" target="_blank" class="btn-api">⚙️ API v1</a>
                        <a href="/api/v2/meteorite-landings" target="_blank" class="btn-api">⚙️ API v2</a>
                        <a href="/api/v1/meteorite-landings/docs" target="_blank" class="btn-docs">📚 Ver Documentación de la API v1</a>
                        <a href="/api/v2/meteorite-landings/docs" target="_blank" class="btn-docs">📚 Ver Documentación de la API v2</a>
                    </div>
                </div>

                <div class="tarjeta-miembro">
                    <h3>Desarrollado por: Fernando Reguera Bueno</h3>
                    <p><strong>Fuente de datos:</strong> space-launches</p>
                    <div class="botones-recursos">
                        <a href="/space-launches" class="btn-front">💻 Ver Frontend</a>
                        <a href="/api/v1/space-launches" target="_blank" class="btn-api">⚙️ API v1</a>
                        <a href="/api/v2/space-launches" target="_blank" class="btn-api">⚙️ API v2</a>
                        <a href="/api/v1/space-launches/docs" target="_blank" class="btn-docs">📚 Ver Documentación de la API</a>
                        <a href="/api/v2/space-launches/docs" target="_blank" class="btn-docs">📚 Ver Documentación de la API v2</a>

                    </div>
                </div>

                <div class="tarjeta-miembro">
                    <h3>Desarrollado por: Jaime García Algarra</h3>
                    <p><strong>Fuente de datos:</strong> active-satellites</p>
                    <div class="botones-recursos">
                        <a href="/active-satellites" class="btn-front">💻 Ver Frontend</a>
                        <a href="/api/v1/active-satellites" target="_blank" class="btn-api">⚙️ API v1</a>
                        <a href="/api/v1/active-satellites/docs" target="_blank" class="btn-docs">📚 Ver Documentación de la API</a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</main>

<style>
    :global(body) {
        background-color: #f8fafc;
        color: #334155;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 0;
    }

    main {
        max-width: 900px;
        margin: 40px auto;
        padding: 0 20px;
    }

    .portada {
        text-align: center;
    }

    h1 {
        color: #1e293b;
        font-size: 2.5rem;
        margin-bottom: 5px;
    }

    .subtitulo {
        color: #64748b;
        font-size: 1.1rem;
        margin-bottom: 40px;
    }

    section {
        background: #ffffff;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        margin-bottom: 30px;
        text-align: left;
    }

    h2 {
        color: #0f172a;
        font-size: 1.5rem;
        margin-top: 0;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }

    .grid-equipo {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }

    .tarjeta-miembro {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }

    h3 {
        margin-top: 0;
        color: #007bff;
        margin-bottom: 5px;
    }

    .botones-recursos {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 15px;
    }

    a {
        text-decoration: none;
        padding: 10px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        text-align: center;
        transition: opacity 0.2s;
        color: white;
    }

    a:hover { opacity: 0.85; }

    .btn-github { background-color: #24292e; display: inline-block; padding: 12px 24px; }
    .btn-front { background-color: #6f42c1; }
    .btn-api { background-color: #17a2b8; }
    .btn-docs { background-color: #ff6c37; } /* Naranja típico de Postman */
</style>