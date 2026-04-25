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
    await page.getByRole('button', { name: 'Filtrar' }).click();

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

    await page.getByRole('button', { name: 'Cargar datos iniciales' }).click();
    const primerBotonEliminar = page.getByRole('button', { name: 'Eliminar' }).first();
    await expect(primerBotonEliminar).toBeVisible({ timeout: 10000 });

    await primerBotonEliminar.click();

    await expect(page.locator('p').filter({ hasText: /✅ Misión .+ eliminada correctamente/ }))
      .toBeVisible({ timeout: 8000 });
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
    await expect(page.getByRole('button', { name: 'Eliminar' }).first()).toBeVisible({ timeout: 10000 });

    const idUnico = Math.floor(Math.random() * 1000000).toString();

    // exact: true para no coincidir con los "Ej: X" del buscador por parámetros
    await page.getByPlaceholder('1001',           { exact: true }).fill(idUnico);
    await page.getByPlaceholder('SpaceX',         { exact: true }).fill('Empresa E2E');
    await page.getByPlaceholder('Cape Canaveral', { exact: true }).fill('Sevilla');
    await page.getByPlaceholder('2024',           { exact: true }).fill('2025');
    await page.getByPlaceholder('Falcon 9',       { exact: true }).fill('Cohete E2E');

    // nth(1): el primer select es el del buscador (-- Todos --),
    // el segundo es el del formulario de crear (-- Estado --)
    await page.locator('select').nth(1).selectOption('Success');

    await page.getByPlaceholder('USA', { exact: true }).fill('España');

    await page.getByRole('button', { name: 'Crear' }).click();

    await expect(async () => {
      await expect(page.getByText(idUnico)).toBeVisible();
    }).toPass({ timeout: 10000 });
  });

});