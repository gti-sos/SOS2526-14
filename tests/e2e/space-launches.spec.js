import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:10000/space-launches';

test.describe('Tests e2e Space Launches', () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /Cargar datos iniciales/i }).click();
    await page.waitForTimeout(2000);
    await page.close();
  });

  test('1. Debe listar recursos', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('table').last()).toBeVisible();
  });

  test('3. Debe buscar recursos', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByPlaceholder('Desde (ej: 2000)').fill('2000');
    await page.getByRole('button', { name: 'Buscar' }).click();

    await page.waitForTimeout(1000);

    await expect(page.locator('table').last()).toBeVisible();
  });

  test('4. Debe editar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: 'Editar' }).first().click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/.*\/space-launches\/edit\/.+\/.+/);

    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page).toHaveURL(BASE_URL, { timeout: 10000 });
  });

  test('5. Debe borrar un recurso', async ({ page }) => {
    await page.goto(BASE_URL);

    // Cargar datos y esperar a que la tabla se renderice con botones Eliminar
    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    const primerBotonEliminar = page.getByRole('button', { name: 'Eliminar' }).first();
    await expect(primerBotonEliminar).toBeVisible({ timeout: 10000 });

    const todosLosBotonesEliminar = page.getByRole('button', { name: 'Eliminar' });
    const countBefore = await todosLosBotonesEliminar.count();

    if (countBefore > 0) {
      await primerBotonEliminar.click();

      // Esperar a que el DOM actualice: el conteo debe bajar
      await expect(async () => {
        const countAfter = await todosLosBotonesEliminar.count();
        expect(countAfter).toBeLessThan(countBefore);
      }).toPass({ timeout: 8000 });
    }
  });

  test('6. Debe borrar todos', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: 'Borrar todos' }).click();
    await page.waitForTimeout(1000);

    await expect(page.locator('text=No hay misiones')).toBeVisible();
  });

  test('2. Debe crear un recurso', async ({ page }) => {
    await page.goto(BASE_URL);

    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    // Esperar a que los datos carguen (botones Eliminar visibles = tabla lista)
    await expect(page.getByRole('button', { name: 'Eliminar' }).first()).toBeVisible({ timeout: 10000 });

    const idUnico = Math.floor(Math.random() * 1000000).toString();

    await page.getByPlaceholder('1001').fill(idUnico);
    await page.getByPlaceholder('SpaceX').fill('Empresa E2E');
    await page.getByPlaceholder('Cape Canaveral').fill('Sevilla');
    await page.getByPlaceholder('2024').fill('2025');
    await page.getByPlaceholder('Falcon 9').fill('Cohete E2E');
    await page.locator('select').selectOption('Success');
    await page.getByPlaceholder('USA').fill('España');

    await page.getByRole('button', { name: 'Crear' }).click();

    // El .svelte navega a la última página donde está el nuevo registro.
    // Esperar con toPass para que Playwright reintente hasta que aparezca.
    await expect(async () => {
      await expect(page.getByText(idUnico)).toBeVisible();
    }).toPass({ timeout: 10000 });
  });

});