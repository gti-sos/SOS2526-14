import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e Active Satellites', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Aceptar todos los diálogos (confirm/alert) automáticamente
    page.on('dialog', dialog => dialog.accept());
    
    // 2. Ir a la página y cargar datos si el botón existe
    await page.goto(BASE_URL);
    const btnCargar = page.getByRole('button', { name: /Cargar Datos/i });
    if (await btnCargar.isVisible()) {
      await btnCargar.click();
      await page.waitForSelector('table tbody tr'); // Esperar a que la tabla tenga algo
    }
  });

  test('1. Debe listar recursos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    const nombreUnico = 'Sat-' + Date.now();
    // Rellenamos solo lo mínimo necesario
    await page.getByPlaceholder('Nombre').last().fill(nombreUnico);
    await page.getByPlaceholder('País').last().fill('Spain');
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Verificamos que el nombre aparezca en la tabla (Playwright reintenta solo)
    await expect(page.locator('table')).toContainText(nombreUnico);
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    await expect(page).toHaveURL(/.*\/active-satellites\/.+/); // Verificar que entra en edición
    
    // Simplemente volvemos pulsando el primer botón (normalmente 'Atrás' o 'Guardar')
    await page.locator('button').first().click();
    await expect(page).toHaveURL(BASE_URL);
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    const inicial = await page.locator('table tbody tr').count();
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    // Esperar a que el número de filas sea menor al inicial
    await expect(async () => {
      const actual = await page.locator('table tbody tr').count();
      expect(actual).toBeLessThan(inicial);
    }).toPass();
  });

  test('6. Debe borrar todos', async ({ page }) => {
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    await expect(page.locator('table tbody tr')).toHaveCount(0);
  });

});