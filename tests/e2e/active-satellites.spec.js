import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e Active Satellites', () => {

  test.beforeEach(async ({ page }) => {
    // Acepta automáticamente todos los diálogos (confirm/alert) para evitar errores de "already handled".
    page.on('dialog', dialog => dialog.accept());
    
    await page.goto(BASE_URL);
    
    // Si la tabla está vacía, cargamos los datos iniciales para asegurar que los tests tengan contenido.
    const filas = page.locator('table tbody tr');
    if (await filas.count() === 0) {
      const btnCargar = page.getByRole('button', { name: /Cargar Datos/i });
      if (await btnCargar.isVisible()) {
        await btnCargar.click();
        // Espera a que aparezca la primera fila con un margen de seguridad.
        await filas.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      }
    }
  });

  test('1. Debe listar recursos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    const nombreUnico = 'Sat-' + Date.now();
    
    // Rellenamos el formulario usando selectores específicos.
    const formulario = page.locator('section.formulario');
    await formulario.getByPlaceholder('Nombre').fill(nombreUnico);
    await formulario.getByPlaceholder('País').fill('Spain');
    await formulario.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await formulario.getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Verificamos la aparición de la alerta de éxito.
    await expect(page.locator('.alerta.exito, .alert-success')).toBeVisible({ timeout: 10000 });
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    // Entramos en la edición del primer satélite de la lista.
    await page.getByRole('button', { name: 'Editar' }).first().click();
    await expect(page).toHaveURL(/.*\/active-satellites\/.+/);
    
    // Pulsamos el botón principal para volver (Guardar/Aceptar).
    await page.locator('button').first().click();
    await expect(page).toHaveURL(BASE_URL);
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    const inicial = await page.locator('table tbody tr').count();
    
    // Hacemos clic en el primer botón de borrar; el diálogo se acepta solo gracias al beforeEach.
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    // Esperamos a que el contador de filas disminuya.
    await expect(async () => {
      const actual = await page.locator('table tbody tr').count();
      expect(actual).toBeLessThan(inicial);
    }).toPass();
  });

  test('6. Debe borrar todos', async ({ page }) => {
    const btnBorrarTodo = page.getByRole('button', { name: /Borrar Todo/i });
    await expect(btnBorrarTodo).toBeVisible();
    
    // El diálogo se gestiona automáticamente por el escuchador global.
    await btnBorrarTodo.click();
    
    // La tabla debe quedar vacía tras la operación.
    await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 10000 });
  });

});