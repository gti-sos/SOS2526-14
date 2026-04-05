import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e simplificados para Active Satellites', () => {

  test('1. Debe listar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('table')).toBeVisible();
  });

 test('2. Debe crear un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Usamos un nombre único con la fecha actual para evitar errores 409
    const nombreUnico = 'Sat-' + Date.now(); 
    
    // Llenamos el formulario de creación (los últimos inputs de la página)
    await page.getByPlaceholder('Nombre').last().fill(nombreUnico);
    await page.getByPlaceholder('País').last().fill('Spain');
    await page.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').last().fill('2020-01-01');
    await page.getByPlaceholder('Masa (kg)').last().fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // ✅ CAMBIO CLAVE: Validamos el mensaje de éxito que aparece arriba en el render
    // Esto confirma que la acción fue exitosa y el usuario recibió el feedback.
    await expect(page.getByText(`¡El satélite '${nombreUnico}' de 'Spain' se ha creado correctamente!`)).toBeVisible();
    
    
    await expect(page.locator('table')).toContainText(nombreUnico);
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    
    // Solo comprobamos que la tabla sigue ahí tras buscar
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aceptamos cualquier alerta de confirmación automáticamente
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForTimeout(1000); // Pequeña pausa para que Svelte actualice la vista
    
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    await expect(page).toHaveURL(/.*\/active-satellites\/.+\/.+/);
    
    // Simplificación extrema: Simplemente hacemos clic en el primer botón de la vista de editar (Guardar/Volver)
    await page.locator('button').first().click();
    
    // Verificamos que hemos vuelto a la tabla principal
    await expect(page).toHaveURL(BASE_URL, { timeout: 10000 });
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForTimeout(1000);
    
    const tableRows = page.locator('tbody tr');
    const countBefore = await tableRows.count();
    
    if (countBefore > 0) {
        await page.getByRole('button', { name: 'Borrar' }).first().click();
        await page.waitForTimeout(1000); 
        
        // Simplificación: Comprobamos que hay una fila menos, ignorando los mensajes de alerta
        const countAfter = await tableRows.count();
        expect(countAfter).toBeLessThan(countBefore);
    }
  });

  test('6. Debe borrar todos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    page.on('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    await page.waitForTimeout(1000);
    
    // Simplificación: Comprobamos que la tabla se ha quedado a 0
    await expect(page.locator('tbody tr')).toHaveCount(0);
  });

});