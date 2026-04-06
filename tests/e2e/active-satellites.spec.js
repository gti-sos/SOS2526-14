import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e Active Satellites', () => {

  test.beforeEach(async ({ page }) => {
    // ✅ Manejador global: Acepta todos los diálogos automáticamente para evitar errores de conflicto
    page.on('dialog', dialog => dialog.accept());
    
    await page.goto(BASE_URL);
    
    // Cargamos datos iniciales para asegurar que hay contenido en la tabla
    const btnCargar = page.getByRole('button', { name: /Cargar Datos/i });
    if (await btnCargar.isVisible()) {
      await btnCargar.click();
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
    }
  });

  test('1. Debe listar recursos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    const nombreUnico = 'Sat-' + Date.now();
    
    // Usamos el contenedor de la sección formulario para evitar los inputs de búsqueda
    const formulario = page.locator('section.formulario');
    await formulario.getByPlaceholder('Nombre').fill(nombreUnico);
    await formulario.getByPlaceholder('País').fill('Spain');
    await formulario.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await formulario.getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // ✅ VERIFICACIÓN: Esperamos la alerta de éxito (como funcionaba antes)
    await expect(page.locator('.alerta.exito, .alert-success')).toBeVisible({ timeout: 10000 });
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    await expect(page).toHaveURL(/.*\/active-satellites\/.+/);
    
    // Regresamos a la lista principal
    await page.locator('button').first().click();
    await expect(page).toHaveURL(BASE_URL);
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    const inicial = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    await expect(async () => {
      const actual = await page.locator('table tbody tr').count();
      expect(actual).toBeLessThan(inicial);
    }).toPass();
  });

  test('6. Debe borrar todos', async ({ page }) => {
    // ✅ SIMPLIFICADO: El diálogo ya se acepta en el beforeEach
    await page.getByRole('button', { name: /Borrar Todo/i }).click(); 
    
    // Verificamos que la tabla no tenga filas de datos
    await expect(page.locator('table tbody tr')).toHaveCount(0);
  });

});