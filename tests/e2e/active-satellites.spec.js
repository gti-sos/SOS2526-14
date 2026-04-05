import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173/active-satellites';

test.describe('Tests e2e para Active Satellites', () => {

  test('1. Debe listar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('table')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    const nombreUnico = 'Sat-' + Date.now(); 
    
    // Usamos selectores más específicos para el formulario
    await page.locator('section.formulario').getByPlaceholder('Nombre').fill(nombreUnico);
    await page.locator('section.formulario').getByPlaceholder('País').fill('Spain');
    await page.locator('section.formulario').getByPlaceholder('Lanzamiento (YYYY-MM-DD)').fill('2020-01-01');
    await page.locator('section.formulario').getByPlaceholder('Masa (kg)').fill('1000');
    
    await page.getByRole('button', { name: 'Añadir Satélite' }).click();
    
    // ✅ ESPERAMOS A LA ALERTA: Esto sincroniza el test con la API
    await expect(page.locator('.alerta.exito')).toBeVisible();
    // Ahora comprobamos que el nombre está en la tabla
    await expect(page.locator('table')).toContainText(nombreUnico);
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.getByPlaceholder('Desde (ej. 2000)').fill('2000');
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Cargamos datos para asegurar que hay algo que editar
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForSelector('table tbody tr');
    
    // Click en Editar
    await page.getByRole('button', { name: 'Editar' }).first().click(); 
    
    // En la vista de edición, buscamos cualquier botón que diga "Guardar" o "Actualizar"
    const btnGuardar = page.getByRole('button', { name: /Guardar|Actualizar|Aceptar/i });
    await btnGuardar.click();
    
    // Verificamos que volvemos a la lista principal
    await expect(page).toHaveURL(BASE_URL);
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // 1. Cargar datos
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: '📥 Cargar Datos Iniciales' }).click();
    await page.waitForSelector('table tbody tr');
    
    const countBefore = await page.locator('table tbody tr').count();
    
    // 2. Borrar (Manejamos el confirm)
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: 'Borrar' }).first().click();
    
    // 3. ✅ CLAVE: Esperar a que la alerta de éxito sea visible
    await expect(page.locator('.alerta.exito')).toBeVisible();
    
    // 4. Verificar que el contador ha bajado
    const countAfter = await page.locator('table tbody tr').count();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test('6. Debe borrar todos', async ({ page }) => {
    await page.goto(BASE_URL);
    page.once('dialog', d => d.accept());
    await page.getByRole('button', { name: '🗑️ Borrar Todo' }).click(); 
    await expect(page.locator('table tbody tr')).toHaveCount(0);
  });

});