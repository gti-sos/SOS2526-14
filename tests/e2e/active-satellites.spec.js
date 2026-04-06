import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e Active Satellites', () => {

  test.beforeEach(async ({ page }) => {
    // Manejador global: acepta todos los diálogos automáticamente
    page.on('dialog', dialog => dialog.accept());
    
    await page.goto(BASE_URL);
    
    // Carga de datos resiliente: si no hay filas, intentamos cargar
    const filas = page.locator('table tbody tr');
    if (await filas.count() === 0) {
      const btnCargar = page.getByRole('button', { name: /Cargar Datos/i });
      if (await btnCargar.isVisible()) {
        await btnCargar.click();
        // Esperamos un momento a que aparezca al menos una fila, pero sin bloquear el test si falla
        await filas.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      }
    }
  });

  // ... (Tests 1, 3, 4 y 5 se mantienen igual ya que indicas que están bien)

  test('2. Debe crear un recurso', async ({ page }) => {
    const nombreUnico = 'Sat-' + Date.now();
    const formulario = page.locator('section.formulario');
    await formulario.getByPlaceholder('Nombre').fill(nombreUnico);
    await formulario.getByPlaceholder('País').fill('Spain');
    await formulario.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await formulario.getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Verificación por alerta (como funcionaba antes)
    await expect(page.locator('.alerta.exito, .alert-success')).toBeVisible({ timeout: 10000 });
  });

  test('6. Debe borrar todos', async ({ page }) => {
    // 1. Aseguramos que el botón es visible antes de hacer clic
    const btnBorrarTodo = page.getByRole('button', { name: /Borrar Todo/i });
    await expect(btnBorrarTodo).toBeVisible();
    
    // 2. Clic en borrar todo (el diálogo se acepta solo gracias al beforeEach)
    await btnBorrarTodo.click(); 
    
    // 3. Verificamos que la tabla quede vacía
    // Usamos una aserción que reintenta automáticamente por si la API es lenta
    await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 10000 });
  });

});