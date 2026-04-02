import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/space-launches';

test('carga la pagina y hay misiones', async ({ page }) => {
    await page.goto(BASE_URL);
    // esperamos ver la primera fila de la tabla
    const filas = page.locator('tbody tr');
    await expect(filas.first()).toBeVisible();
});
test('filtra misiones por año', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[placeholder="Desde (ej: 2000)"]', '2015');
    await page.fill('input[placeholder="Hasta (ej: 2020)"]', '2018');
    await page.click('button:has-text("Buscar")');
    
    // Con esta barrita "|" le decimos que acepte tanto si encuentra resultados como si no hay ninguno
    await expect(page.locator('text=/misiones encontradas|No se encontraron misiones/i')).toBeVisible();
});

test('crea una mision y comprueba que existe', async ({ page }) => {
    await page.goto(BASE_URL);

    // Generamos un ID aleatorio para que no dé error de repetido
    const idNuevo = Math.floor(Math.random() * 100000).toString();

    await page.fill('input[placeholder="1001"]', idNuevo);
    await page.fill('input[placeholder="SpaceX"]', 'Mi Empresa');
    await page.fill('input[placeholder="Cape Canaveral"]', 'Sevilla');
    
    // Le ponemos un año rarísimo para poder buscarlo luego
    await page.fill('input[placeholder="2024"]', '3000'); 
    
    await page.fill('input[placeholder="Falcon 9"]', 'Cohete X');
    await page.selectOption('select', 'Success');
    await page.fill('input[placeholder="USA"]', 'España');

    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Crear")');

    // Comprobamos que el input se vacía (esto confirma que tu código Svelte recargó bien)
    await expect(page.locator('input[placeholder="1001"]')).toHaveValue('');

    // Para ver si de verdad existe y sortear que la tabla esté paginada, la buscamos por el año 3000
    await page.fill('input[placeholder="Desde (ej: 2000)"]', '3000');
    await page.fill('input[placeholder="Hasta (ej: 2020)"]', '3000');
    await page.click('button:has-text("Buscar")');

    // Ahora sí tiene que aparecer nuestro ID nuevo en la minitabla del filtro
    await expect(page.locator('td', { hasText: idNuevo }).first()).toBeVisible();
});
test('edita una mision y vuelve', async ({ page }) => {
    await page.goto(BASE_URL);

    // clic en el boton editar del primer elemento
    await page.click('tbody tr:first-child button:has-text("Editar")');
    
    // nos aseguramos de que ha cambiado de pagina
    await expect(page).toHaveURL(/.*\/edit\/.*/);

    // pillamos el primer input de texto (empresa) y lo cambiamos
    const inputEmpresa = page.locator('input[type="text"]').first();
    await inputEmpresa.fill('Empresa Cambiada');

    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Guardar cambios")');

    // comprobamos que nos devuelve a la pagina principal
    await expect(page).toHaveURL(BASE_URL);
});