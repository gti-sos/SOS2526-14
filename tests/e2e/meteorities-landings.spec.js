// @ts-check
import { test, expect } from '@playwright/test';

const APP_URL = 'http://localhost:10000';
const PAGE_PATH = '/meteorite-landings';

// ============================================================
// LAYOUT BÁSICO
// ============================================================
test.describe('Test layout', () => {

  test('La página principal carga y muestra el título', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const title = page.locator('h2', { hasText: 'Meteoritos' });
    await expect(title).toBeVisible();
  });

  test('El botón de cargar datos iniciales es visible', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /cargar datos iniciales/i })).toBeVisible();
  });

  test('El botón de borrar todos es visible', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /borrar todos/i })).toBeVisible();
  });

  test('El formulario de creación tiene todos los campos', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder('Spain')).toBeVisible();
    await expect(page.getByPlaceholder('Nombre')).toBeVisible();
    await expect(page.getByPlaceholder('12345')).toBeVisible();
    await expect(page.getByPlaceholder('500')).toBeVisible();
    await expect(page.getByPlaceholder('1990')).toBeVisible();
    await expect(page.getByPlaceholder('(40.4, -3.7)')).toBeVisible();
  });

  test('La sección de filtro por rango de años es visible', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder(/desde/i)).toBeVisible();
    await expect(page.getByPlaceholder(/hasta/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^buscar$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^limpiar$/i })).toBeVisible();
  });
});

// ============================================================
// CREACIÓN DE RECURSOS
// ============================================================
test.describe('Tests de Creación de Recursos', () => {

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });
    if (await borrarBtn.isVisible()) {
      await borrarBtn.click();
      await page.waitForTimeout(500);
    }
    await page.close();
  });

  test('Debería crear un nuevo meteorito correctamente', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    page.on('dialog', dialog => dialog.accept());

    await page.getByPlaceholder('Spain').fill('TestCountry');
    await page.getByPlaceholder('Nombre').fill('TestMeteor');
    await page.getByPlaceholder('12345').fill('99999');
    await page.getByPlaceholder('500').fill('1234');
    await page.getByPlaceholder('1990').fill('2001');
    await page.getByPlaceholder('(40.4, -3.7)').fill('(10.0, 20.0)');

    await page.getByRole('button', { name: /crear/i }).click();
    await page.waitForTimeout(800);

    await expect(page.locator('table').last()).toContainText('TestMeteor');
  });

  test('Debería mostrar error si el meteorito ya existe (409)', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const dialog1Promise = page.waitForEvent('dialog');
    await page.getByPlaceholder('Spain').fill('DupeCountry');
    await page.getByPlaceholder('Nombre').fill('DupeMeteor');
    await page.getByPlaceholder('12345').fill('11111');
    await page.getByPlaceholder('500').fill('500');
    await page.getByPlaceholder('1990').fill('2005');
    await page.getByPlaceholder('(40.4, -3.7)').fill('(1.0, 1.0)');
    await page.getByRole('button', { name: /crear/i }).click();
    await (await dialog1Promise).accept();
    await page.waitForTimeout(500);

    const dialog2Promise = page.waitForEvent('dialog');
    await page.getByPlaceholder('Spain').fill('DupeCountry');
    await page.getByPlaceholder('Nombre').fill('DupeMeteor');
    await page.getByPlaceholder('12345').fill('11111');
    await page.getByPlaceholder('500').fill('500');
    await page.getByPlaceholder('1990').fill('2005');
    await page.getByPlaceholder('(40.4, -3.7)').fill('(1.0, 1.0)');
    await page.getByRole('button', { name: /crear/i }).click();
    const d2 = await dialog2Promise;
    expect(d2.message()).toMatch(/ya existe/i);
    await d2.accept();
  });

  test('No debería crear si faltan campos obligatorios', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: /crear/i }).click();
    await page.waitForTimeout(1000);

    expect(dialogMessage).toMatch(/obligatorios/i);
  });
});

// ============================================================
// LISTADO DE RECURSOS
// ============================================================
test.describe('Tests de Listado de Recursos', () => {

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });
    if (await borrarBtn.isVisible()) {
      await borrarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /cargar datos iniciales/i }).click();
    await page.waitForTimeout(1000);
    await page.locator('table').last().locator('tbody tr').first().waitFor({ state: 'visible' });
    await page.close();
  });

  test('Debería mostrar la tabla con al menos un recurso', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const tabla = page.locator('table').last();
    await expect(tabla).toBeVisible();

    const rows = tabla.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Debería mostrar las columnas correctas', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const headers = page.locator('table').last().locator('thead th');
    await expect(headers.nth(0)).toHaveText(/país/i);
    await expect(headers.nth(1)).toHaveText(/nombre/i);
    await expect(headers.nth(2)).toHaveText(/id/i);
    await expect(headers.nth(3)).toHaveText(/masa/i);
    await expect(headers.nth(4)).toHaveText(/año/i);
    await expect(headers.nth(5)).toHaveText(/geolocalización/i);
  });

  test('La paginación muestra máximo 10 recursos por página', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const rows = page.locator('table').last().locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test('El botón Siguiente navega a la página 2', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const nextBtn = page.getByRole('button', { name: /siguiente/i });
    await expect(nextBtn).toBeVisible();

    if (await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/página 2/i)).toBeVisible();
    }
  });

  test('El botón Anterior se deshabilita en la primera página', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const prevBtn = page.getByRole('button', { name: /anterior/i });
    await expect(prevBtn).toBeVisible();
    await expect(prevBtn).toBeDisabled();
  });
});

// ============================================================
// BORRADO DE TODOS LOS RECURSOS
// ============================================================
test.describe('Test de borrado de colección', () => {

  test('Los datos se borran correctamente', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const cargarBtn = page.getByRole('button', { name: /cargar datos iniciales/i });
    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });

    page.on('dialog', dialog => dialog.accept());

    if (await cargarBtn.isVisible()) {
      await cargarBtn.click();
      await page.waitForTimeout(1000);
    }

    await borrarBtn.click();
    await page.waitForTimeout(800);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/no hay meteoritos/i)).toBeVisible();
  });
});

// ============================================================
// BORRADO DE UN RECURSO CONCRETO
// ============================================================
test.describe('Tests de Borrado de un Recurso', () => {

  test.beforeEach(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });
    if (await borrarBtn.isVisible()) {
      await borrarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.getByPlaceholder('Spain').fill('DeleteCountry');
    await page.getByPlaceholder('Nombre').fill('DeleteMe');
    await page.getByPlaceholder('12345').fill('77777');
    await page.getByPlaceholder('500').fill('100');
    await page.getByPlaceholder('1990').fill('1999');
    await page.getByPlaceholder('(40.4, -3.7)').fill('(5.0, 5.0)');
    await page.getByRole('button', { name: /crear/i }).click();
    await page.waitForTimeout(800);
    await page.close();
  });

  test('Debería eliminar un recurso concreto de la tabla', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const fila = page.locator('tr', { hasText: 'DeleteMe' });
    await expect(fila).toBeVisible();

    page.on('dialog', dialog => dialog.accept());

    await fila.getByRole('button', { name: /eliminar/i }).click();
    await page.waitForTimeout(800);

    await expect(fila).not.toBeVisible();
  });

  test('No debería eliminar si el usuario cancela el diálogo', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    page.on('dialog', dialog => dialog.dismiss());

    const fila = page.locator('tr', { hasText: 'DeleteMe' });
    await fila.getByRole('button', { name: /eliminar/i }).click();
    await page.waitForTimeout(300);

    await expect(fila).toBeVisible();
  });
});

// ============================================================
// EDICIÓN DE UN RECURSO (vista separada)
// ============================================================
test.describe('Tests de Edición de Recursos', () => {

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });
    if (await borrarBtn.isVisible()) {
      await borrarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.getByPlaceholder('Spain').fill('EditCountry');
    await page.getByPlaceholder('Nombre').fill('EditMeteor');
    await page.getByPlaceholder('12345').fill('55555');
    await page.getByPlaceholder('500').fill('200');
    await page.getByPlaceholder('1990').fill('2010');
    await page.getByPlaceholder('(40.4, -3.7)').fill('(3.0, 3.0)');
    await page.getByRole('button', { name: /crear/i }).click();
    await page.waitForTimeout(800);
    await page.close();
  });

  test('Navegar al detalle del meteorito con el botón Editar', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const fila = page.locator('tr', { hasText: 'EditMeteor' });
    await fila.getByRole('button', { name: /editar/i }).click();

    await expect(page).toHaveURL(new RegExp(`${PAGE_PATH}/EditCountry/EditMeteor`));
    await expect(page.getByRole('heading', { name: /detalles/i })).toBeVisible();
  });

  test('Debería actualizar la masa del meteorito correctamente', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}/EditCountry/EditMeteor`);
    await page.waitForLoadState('networkidle');

    const inputMasa = page.locator('table tbody tr td').nth(3).locator('input');
    await expect(inputMasa).toBeVisible();
    await inputMasa.fill('9999');

    const dialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: /actualizar recurso/i }).click();
    const dialog = await dialogPromise;

    expect(dialog.message()).toMatch(/actualizado/i);
    await dialog.accept();

    await expect(page).toHaveURL(`${APP_URL}${PAGE_PATH}`);
  });

  test('Debería poder eliminar el recurso desde la vista de detalle', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}/EditCountry/EditMeteor`);
    await page.waitForLoadState('networkidle');

    page.on('dialog', dialog => dialog.accept());

    await page.getByRole('button', { name: /eliminar recurso/i }).click();
    await page.waitForTimeout(800);

    await expect(page).toHaveURL(`${APP_URL}${PAGE_PATH}`);
  });
});

// ============================================================
// FILTRO POR RANGO DE AÑOS (statistics)
// ============================================================
test.describe('Tests de Filtrado por Rango de Años', () => {

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });
    if (await borrarBtn.isVisible()) {
      await borrarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.getByRole('button', { name: /cargar datos iniciales/i }).click();
    await page.locator('table').last().locator('tbody tr').first().waitFor({ state: 'visible' });
    await page.close();
  });

  test('Debería filtrar meteoritos por rango de años y mostrar resultados', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/desde/i).fill('2000');
    await page.getByPlaceholder(/hasta/i).fill('2010');
    await page.getByRole('button', { name: /^buscar$/i }).click();

    const resultados = page.getByText(/meteoritos encontrados/i);
    const sinResultados = page.getByText(/no se encontraron meteoritos/i);

    await Promise.race([
      resultados.waitFor({ state: 'visible', timeout: 8000 }),
      sinResultados.waitFor({ state: 'visible', timeout: 8000 })
    ]);

    const hayResultados = await resultados.isVisible();
    if (hayResultados) {
      await expect(resultados).toBeVisible();
    } else {
      await expect(sinResultados).toBeVisible();
    }
  });

  test('El botón limpiar resetea los filtros', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/desde/i).fill('2000');
    await page.getByPlaceholder(/hasta/i).fill('2010');
    await page.getByRole('button', { name: /^buscar$/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /^limpiar$/i }).click();

    await expect(page.getByPlaceholder(/desde/i)).toHaveValue('');
    await expect(page.getByPlaceholder(/hasta/i)).toHaveValue('');
  });

  test('Debería mostrar mensaje si no hay resultados en el rango', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/desde/i).fill('1800');
    await page.getByPlaceholder(/hasta/i).fill('1800');
    await page.getByRole('button', { name: /^buscar$/i }).click();

    await expect(page.getByText(/no se encontraron meteoritos/i)).toBeVisible({ timeout: 8000 });
  });

  test('Debería mostrar alerta si no se introduce ningún año', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/desde/i).fill('');
    await page.getByPlaceholder(/hasta/i).fill('');

    let dialogMessage = '';
    page.on('dialog', async dialog => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.getByRole('button', { name: /^buscar$/i }).click();
    await page.waitForTimeout(1000);

    expect(dialogMessage).toMatch(/al menos un año/i);
  });
});

// ============================================================
// BÚSQUEDA POR CAMPO
// ============================================================
test.describe('Tests de Búsqueda por Campo', () => {

  // Creamos un meteorito conocido antes de todos los tests
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    page.on('dialog', dialog => dialog.accept());

    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    const borrarBtn = page.getByRole('button', { name: /borrar todos/i });
    if (await borrarBtn.isVisible()) {
      await borrarBtn.click();
      await page.waitForTimeout(500);
    }

    await page.getByPlaceholder('Spain').fill('SearchCountry');
    await page.getByPlaceholder('Nombre').fill('SearchMeteor');
    await page.getByPlaceholder('12345').fill('33333');
    await page.getByPlaceholder('500').fill('750');
    await page.getByPlaceholder('1990').fill('2003');
    await page.getByPlaceholder('(40.4, -3.7)').fill('(7.0, 7.0)');
    await page.getByRole('button', { name: /crear/i }).click();
    await page.waitForTimeout(800);
    await page.close();
  });

  test('Filtrar por nombre muestra solo los meteoritos coincidentes', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Filtrar por texto').fill('SearchMeteor');
    await page.waitForTimeout(800);

    const tabla = page.locator('table').last();
    await expect(tabla).toContainText('SearchMeteor');

    const rows = tabla.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Filtrar por país muestra solo los meteoritos de ese país', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Filtrar país').fill('SearchCountry');
    await page.waitForTimeout(800);

    const tabla = page.locator('table').last();
    await expect(tabla).toContainText('SearchCountry');

    const rows = tabla.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Filtrar por ID muestra el meteorito con ese ID', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Buscar ID').fill('33333');
    await page.waitForTimeout(800);

    const tabla = page.locator('table').last();
    await expect(tabla).toContainText('33333');
  });

  test('Filtrar por masa muestra el meteorito con esa masa', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Buscar Masa').fill('750');
    await page.waitForTimeout(800);

    const tabla = page.locator('table').last();
    await expect(tabla).toContainText('750');
  });

  test('Filtrar por año muestra el meteorito de ese año', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Buscar Año').fill('2003');
    await page.waitForTimeout(800);

    const tabla = page.locator('table').last();
    await expect(tabla).toContainText('2003');
  });

  test('Un filtro sin coincidencias muestra la tabla vacía', async ({ page }) => {
    await page.goto(`${APP_URL}${PAGE_PATH}`);
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Filtrar por texto').fill('ZZZNOMATCH999');
    await page.waitForTimeout(800);

    // Sin resultados: o la tabla desaparece o no hay filas en el listado
    const rows = page.locator('table').last().locator('tbody tr');
    const count = await rows.count();
    expect(count).toBe(0);
  });
});