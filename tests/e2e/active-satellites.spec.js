import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e Active Satellites', () => {

  test.beforeEach(async ({ page }) => {
    // Manejador global de diálogos para evitar conflictos
    page.on('dialog', dialog => dialog.accept());
    
    await page.goto(BASE_URL);
    
    // Carga de datos iniciales solo si la tabla está vacía para asegurar estabilidad
    const filas = page.locator('table tbody tr');
    if (await filas.count() === 0) {
      const btnCargar = page.getByRole('button', { name: /Cargar Datos/i });
      if (await btnCargar.isVisible()) {
        await btnCargar.click();
        await filas.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
    }
  });

  test('1. Debe listar recursos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    const nombreUnico = 'Sat-' + Date.now();
    const formulario = page.locator('section.formulario');
    
    await formulario.getByPlaceholder('Nombre').fill(nombreUnico);
    await formulario.getByPlaceholder('País').fill('Spain');
    await formulario.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await formulario.getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Verificamos por alerta de éxito que es lo más fiable
    await expect(page.locator('.alerta.exito, .alert-success')).toBeVisible({ timeout: 10000 });
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    // 1. Aseguramos que hay al menos un botón de editar y hacemos clic
    const btnEditar = page.getByRole('button', { name: 'Editar' }).first();
    await expect(btnEditar).toBeVisible();
    await btnEditar.click(); 
    
    // 2. Verificamos que no estamos en una página de error 404
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page).toHaveURL(/.*\/active-satellites\/.+/);
    
    // 3. Volvemos atrás usando el primer botón disponible (Guardar/Atras)
    const btnVolver = page.locator('button').first();
    await btnVolver.click();
    
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
    const btnBorrarTodo = page.getByRole('button', { name: /Borrar Todo/i });
    await btnBorrarTodo.click(); 
    
    // Verificación con reintento para dar tiempo a la API
    await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 10000 });
  });

});