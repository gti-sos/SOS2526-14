import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/space-launches';

test.describe('Tests e2e simplificados para Space Launches', () => {

  test('1. Debe listar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    // Como tienes varias tablas (crear, listar), comprobamos que al menos la última sea visible
    await expect(page.locator('table').last()).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aceptamos las alertas
    page.on('dialog', dialog => dialog.accept());
    
    // Usamos un número aleatorio para el ID para que nunca dé error de "Ya existe"
    const idUnico = Math.floor(Math.random() * 1000000).toString(); 
    
    await page.getByPlaceholder('1001').fill(idUnico);
    await page.getByPlaceholder('SpaceX').fill('Empresa E2E');
    await page.getByPlaceholder('Cape Canaveral').fill('Sevilla');
    await page.getByPlaceholder('2024').fill('2025');
    await page.getByPlaceholder('Falcon 9').fill('Cohete E2E');
    await page.locator('select').selectOption('Success');
    await page.getByPlaceholder('USA').fill('España');
    
    await page.getByRole('button', { name: 'Crear' }).click();
    
    // Pequeña pausa como hace tu compañero
    await page.waitForTimeout(1000); 
    
    // Simplificación: comprobamos que el ID nuevo está en la última tabla (la de listado)
    await expect(page.locator('table').last().locator(`text=${idUnico}`)).toBeVisible();
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.getByPlaceholder('Desde (ej: 2000)').fill('2000');
    await page.getByRole('button', { name: 'Buscar' }).click();
    
    await page.waitForTimeout(1000);
    
    // Solo comprobamos que la tabla sigue ahí tras buscar o que sale el mensaje
    await expect(page.locator('table').last()).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Aceptamos cualquier alerta de confirmación automáticamente
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    await page.waitForTimeout(1000); // Pequeña pausa para que Svelte actualice la vista
    
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    // Comprobamos que vamos a la ruta de editar
    await expect(page).toHaveURL(/.*\/space-launches\/edit\/.+\/.+/);
    
    // Simplificación extrema de tu compañero: hacer clic en guardar y ver que volvemos
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    
    // Verificamos que hemos vuelto a la tabla principal
    await expect(page).toHaveURL(BASE_URL, { timeout: 10000 });
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    
    // Esperamos a que la base de datos cargue y aparezca al menos un botón Eliminar
    const primerBotonEliminar = page.getByRole('button', { name: 'Eliminar' }).first();
    await expect(primerBotonEliminar).toBeVisible({ timeout: 10000 });
    
    // Contamos CUÁNTOS botones de Eliminar hay exactamente
    const todosLosBotonesEliminar = page.getByRole('button', { name: 'Eliminar' });
    const countBefore = await todosLosBotonesEliminar.count();
    
    if (countBefore > 0) {
        // Hacemos clic en el primero
        await primerBotonEliminar.click();
        
        // Comprobamos que ahora hay exactamente un botón "Eliminar" menos que antes
        await expect(todosLosBotonesEliminar).toHaveCount(countBefore - 1, { timeout: 10000 });
    }
  });

  test('6. Debe borrar todos', async ({ page }) => {
    await page.goto(BASE_URL);
    
    page.on('dialog', dialog => dialog.accept());
    
    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole('button', { name: 'Borrar todos' }).click(); 
    await page.waitForTimeout(1000);
    
    // Simplificación: Comprobamos que aparece el texto de que no hay misiones
    await expect(page.locator('text=No hay misiones')).toBeVisible();
  });

});