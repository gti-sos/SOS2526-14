import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e para Active Satellites', () => {

  // ✅ NUEVO: Carga datos iniciales antes de cada test para asegurar un estado consistente
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Manejamos el diálogo de confirmación que lanza el botón de carga
    page.once('dialog', dialog => dialog.accept());
    
    const btnCargar = page.getByRole('button', { name: '📥 Cargar Datos Iniciales' });
    if (await btnCargar.isVisible()) {
      await btnCargar.click();
      // Esperamos a que la tabla tenga contenido antes de empezar el test
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
    }
  });

  test('1. Debe listar recursos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    // Verificamos que hay al menos una fila tras la carga del beforeEach
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    const nombreUnico = 'Sat-' + Date.now(); 
    
    const formulario = page.locator('section.formulario');
    await formulario.getByPlaceholder('Nombre').fill(nombreUnico);
    await formulario.getByPlaceholder('País').fill('Spain');
    await formulario.getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await formulario.getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // Buscamos la alerta de éxito de forma más flexible
    await expect(page.locator('.alerta.exito, .alert-success')).toBeVisible({ timeout: 7000 });
    // Confirmamos que el nombre aparece en la tabla general
    await expect(page.locator('table')).toContainText(nombreUnico);
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    // Localizamos el botón de editar de la primera fila
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    
    // Verificamos que la URL cambia a la ruta de edición
    await expect(page).toHaveURL(/.*\/active-satellites\/.+\/.+/);
    
    // Pulsamos el botón de guardar/actualizar en la vista de edición
    const btnGuardar = page.getByRole('button', { name: /Guardar|Actualizar|Aceptar/i });
    await btnGuardar.first().click();
    
    await expect(page).toHaveURL(BASE_URL);
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    const countBefore = await page.locator('table tbody tr').count();
    
    // Configuramos el manejador para el diálogo de confirmación de borrado
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    // Usamos una aserción que reintenta hasta que el contador baje
    await expect(async () => {
      const countAfter = await page.locator('table tbody tr').count();
      expect(countAfter).toBeLessThan(countBefore);
    }).toPass();
  });

  test('6. Debe borrar todos', async ({ page }) => {
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    
    // Comprobamos que el cuerpo de la tabla queda vacío
    await expect(page.locator('table tbody tr')).toHaveCount(0);
  });

});