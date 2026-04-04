import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e para Active Satellites (Gestión completa)', () => {

  // 1. Listar todos los recursos
  test('Debe listar todos los recursos al cargar la página', async ({ page }) => {
    await page.goto(BASE_URL);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gestión de Satélites' })).toBeVisible();
  });

  // 2. Crear recursos
  test('Debe permitir crear un nuevo recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Solución: Buscamos la sección que contiene el título del formulario en lugar de usar 'region'
    const formCrear = page.locator('section').filter({ hasText: '➕ Nuevo Satélite' });
    
    await formCrear.getByPlaceholder('Nombre').fill('Paz-1');
    await formCrear.getByPlaceholder('País').fill('Spain');
    await formCrear.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2018-02-22');
    await formCrear.getByPlaceholder('Masa (kg)').fill('1400');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    const mensajeExito = page.getByText('¡Satélite Paz-1 añadido!');
    await expect(mensajeExito).toBeVisible();
    await expect(page.locator('table').getByText('Paz-1')).toBeVisible();
  });

  // 3. Buscar recursos
  test('Debe permitir buscar recursos con parámetros', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByPlaceholder('Hasta (ej. 2017)').fill('2017');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  // 4. Editar recursos
  test('Debe navegar a la vista dinámica, editar un recurso y volver', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Solución: Asegurarnos de que hay datos cargando los iniciales antes de intentar editar
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    // Esperamos a que la alerta de que se han cargado desaparezca o damos un pequeño margen
    await page.waitForTimeout(1000); 
    
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    await expect(page).toHaveURL(/.*\/active-satellites\/.+\/.+/);
    
    await page.getByLabel('Masa de Lanzamiento (kg):').fill('1200');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    
    const mensajeExito = page.getByText('¡Los cambios del satélite se han guardado correctamente!');
    await expect(mensajeExito).toBeVisible();
    await page.waitForURL(BASE_URL, { timeout: 3000 });
  });

  // 5. Borrar un recurso concreto
  test('Debe permitir borrar un recurso concreto', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aseguramos que hay datos
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForTimeout(1000); 
    
    const rowCountBefore = await page.locator('table tbody tr').count();
    
    if (rowCountBefore > 0) {
        page.on('dialog', dialog => dialog.accept());
        await page.getByRole('button', { name: 'Borrar' }).first().click();
        await expect(page.getByText('Eliminado correctamente.')).toBeVisible();
    }
  });

  // 6. Borrar todos los recursos
  test('Debe permitir borrar todos los recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aseguramos que hay datos antes de vaciar la tabla
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForTimeout(1000);
    
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    
    await expect(page.getByText('Base de datos vaciada.')).toBeVisible();

    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount(0);
  });

});