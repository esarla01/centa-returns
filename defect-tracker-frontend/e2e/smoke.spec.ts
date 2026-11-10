import { test, expect, type Browser, type Page } from '@playwright/test';

/**
 * One case, start to finish, with each role doing its own stage in the real
 * interface; then every other page is opened once.
 *
 * Throughout, any failed API call or JavaScript error fails the test.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:5000';
const PASSWORD = process.env.E2E_PASSWORD ?? '';
const CUSTOMER = 'Acme Asansör';

const problems: string[] = [];
// Refusals the test provokes on purpose, to check that their message is shown.
const expectedRefusals = ['complete-teknik-inceleme -> 400'];

test('a wrong password shows the reason', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#email', 'support@example.com');
  await page.fill('#password', 'definitely-wrong');
  await page.click('button[type=submit]');
  await expect(page.getByText('E-posta veya şifre yanlış! Lütfen tekrar deneyin.')).toBeVisible();
  await expect(page).toHaveURL(/login/);
});

async function loginAs(browser: Browser, role: string, viewport?: { width: number; height: number }): Promise<Page> {
  const context = await browser.newContext(viewport ? { viewport } : {});
  const page = await context.newPage();
  page.on('pageerror', (error) => problems.push(`[${role}] page error: ${error.message}`));
  await page.goto('/login');
  await page.fill('#email', `${role}@example.com`);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(/manage-returns/);
  // From here on (the "not logged in yet" check on the login page is expected
  // to be refused) every API call must succeed.
  page.on('response', (response) => {
    if (response.url().startsWith(API) && response.status() >= 400) {
      problems.push(`[${role}] ${response.request().method()} ${response.url()} -> ${response.status()}`);
    }
  });
  return page;
}

/** The table row of our case (the wide-screen layout). */
function caseRow(page: Page) {
  return page.locator('tr:visible', { hasText: CUSTOMER }).first();
}

async function selectCase(page: Page) {
  await expect(caseRow(page)).toBeVisible();
  await caseRow(page).locator('input[type=checkbox]').check();
}

async function completeStage(page: Page, stageName: string, nextStatus: string) {
  await caseRow(page).locator(`button[title="${stageName} aşamasını tamamla"]`).click();
  await page.getByRole('button', { name: 'Aşamayı Tamamla' }).click();
  await expect(caseRow(page)).toContainText(nextStatus);
}

test('a case moves through all five stages', async ({ browser }) => {
  expect(PASSWORD, 'E2E_PASSWORD must be set').not.toBe('');

  await test.step('Support creates the case and completes "Teslim Alındı"', async () => {
    const page = await loginAs(browser, 'support');
    await page.getByRole('button', { name: /Yeni Vaka Oluştur/ }).click();
    await page.getByRole('button', { name: /Müşteri Seçin/ }).click();
    await page.getByRole('button', { name: CUSTOMER, exact: true }).click();
    await page.locator('form#add-case-form select').selectOption('shipment');
    await page.locator('form#add-case-form textarea').fill('Tarayıcı testi');
    await page.getByRole('button', { name: 'Vaka Oluştur', exact: true }).click();

    await expect(caseRow(page)).toContainText('Teslim Alındı');
    await selectCase(page);
    await completeStage(page, 'Teslim Alındı', 'Teknik İnceleme');
    await page.context().close();
  });

  await test.step('Technician fills in and completes "Teknik İnceleme"', async () => {
    const page = await loginAs(browser, 'technician');
    await expect(caseRow(page)).toBeVisible();

    // Completing before anything is filled in is refused, and the reason is shown.
    await selectCase(page);
    await caseRow(page).locator('button[title="Teknik İnceleme aşamasını tamamla"]').click();
    await page.getByRole('button', { name: 'Aşamayı Tamamla' }).click();
    await expect(page.getByText(/Ürün bilgileri eksik/)).toBeVisible();
    await page.getByRole('button', { name: 'İptal' }).click();

    // The review form is long; its data is saved through the API here, then
    // the form is opened and saved again unchanged to exercise the interface.
    const cases = await (await page.request.get(`${API}/returns?limit=5`)).json();
    const products = await (await page.request.get(`${API}/products?limit=5`)).json();
    const services = await (await page.request.get(`${API}/returns/service-definitions/door_detector`)).json();
    const saved = await page.request.put(`${API}/returns/${cases.cases[0].id}/teknik-inceleme`, {
      data: {
        yedek_parca: 100, bakim: 50, iscilik: 25,
        performed_services: 'Kablo değiştirildi',
        items: [{
          product_model_id: products.products[0].id, product_count: 2, production_date: '2024-03',
          warranty_status: 'Garanti Dahilinde', fault_responsibility: 'Teknik Sorun', resolution_method: 'Tamir',
          has_control_unit: false, cable_check: true, profile_check: false, packaging: true,
          services: [{ service_definition_id: services.services[0].id, is_performed: true }],
        }],
      },
    });
    expect(saved.ok()).toBeTruthy();

    await page.reload();
    await selectCase(page);
    await expect(caseRow(page)).toContainText('DT-25');
    await caseRow(page).locator('button[title="Teknik İnceleme aşamasını düzenle"]').click();
    const save = page.getByRole('button', { name: 'Güncelle', exact: true });
    await save.click();
    await expect(save).toBeHidden();

    await selectCase(page);
    await completeStage(page, 'Teknik İnceleme', 'Ödeme Tahsilatı');
    await page.context().close();
  });

  await test.step('Sales records the payment and completes "Ödeme Tahsilatı"', async () => {
    const page = await loginAs(browser, 'sales');
    await selectCase(page);
    await caseRow(page).locator('button[title="Ödeme Tahsilatı aşamasını düzenle"]').click();
    await page.locator('select:has(option[value="waived"])').selectOption('paid');
    const save = page.getByRole('button', { name: 'Kaydet', exact: true });
    await save.click();
    await expect(save).toBeHidden();

    await selectCase(page);
    await completeStage(page, 'Ödeme Tahsilatı', 'Kargoya Veriliyor');
    await page.context().close();
  });

  await test.step('Logistics ships it and completes "Kargoya Verildi"', async () => {
    const page = await loginAs(browser, 'logistics');
    await selectCase(page);
    await caseRow(page).locator('button[title="Kargoya Verildi aşamasını düzenle"]').click();
    await page.getByPlaceholder('Kargo firması ve diğer bilgiler...').fill('Yurtiçi Kargo');
    await page.getByPlaceholder('Kargo takip numarası...').fill('TR123456');
    await page.getByPlaceholder('Tarih seçiniz').fill('20/05/2024');
    await page.keyboard.press('Escape');
    const save = page.getByRole('button', { name: 'Güncelle', exact: true });
    await save.click();
    await expect(save).toBeHidden();

    await selectCase(page);
    await completeStage(page, 'Kargoya Verildi', 'Tamamlandı');
    await expect(caseRow(page)).toContainText('TR123456');
    await page.context().close();
  });

  await test.step('Manager sees the statistics', async () => {
    const page = await loginAs(browser, 'manager');
    await page.goto('/view-statistics');
    await expect(page.getByRole('heading', { name: 'Raporlar' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    await page.context().close();
  });

  await test.step('Admin opens the remaining pages', async () => {
    const page = await loginAs(browser, 'admin');

    await page.goto('/admin-dashboard');
    await expect(page.getByRole('heading', { name: 'Yönetici Paneli' })).toBeVisible();
    await expect(page.getByText('admin@example.com').filter({ visible: true }).first()).toBeVisible();

    await page.goto('/manage-customers');
    await expect(page.getByRole('heading', { name: 'Müşteri Yönetimi' })).toBeVisible();
    await expect(page.getByText(CUSTOMER).filter({ visible: true }).first()).toBeVisible();

    await page.goto('/manage-products');
    await expect(page.getByRole('heading', { name: 'Ürün ve Arıza Tipleri Yönetimi' })).toBeVisible();
    await expect(page.getByText('DT-25').filter({ visible: true }).first()).toBeVisible();

    await page.goto('/user-action-logs');
    await expect(page.getByRole('heading', { name: 'Kullanıcı İşlem Geçmişi' })).toBeVisible();
    await expect(page.getByText('Vaka Oluşturuldu').filter({ visible: true }).first()).toBeVisible();
    await page.context().close();
  });

  const unexpected = problems.filter((problem) => !expectedRefusals.some((refusal) => problem.includes(refusal)));
  expect(unexpected, 'failed API calls or JavaScript errors').toEqual([]);
});

// The two tests below run after the one above and use the case it finished.

test('tablet layout shows every stage and offers the right buttons', async ({ browser }) => {
  const page = await loginAs(browser, 'manager', { width: 900, height: 1000 });
  const card = page.locator('div.rounded-lg.shadow.border', { hasText: CUSTOMER }).filter({ visible: true }).first();
  await expect(card).toContainText('Kargoya Verildi:');
  await expect(card).toContainText('Tamamlandı:');

  await card.locator('input[type=checkbox]').check();
  // Nobody holds the permission to complete the last stage, so it is not offered.
  await expect(card.locator('button[title="Bu aşamayı tamamlama yetkiniz yok"]')).toBeDisabled();
  // The manager may still correct the payment status of a finished case.
  await card.locator('button[title="Tamamlandı aşamasını düzenle"]').click();
  await expect(page.getByRole('button', { name: 'Güncelle', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'İptal' }).click();

  await card.locator('button[title="Görüntüle"]').click();
  await expect(page.getByText('TR123456').filter({ visible: true }).first()).toBeVisible();
  await page.context().close();
  expect(problems.filter((problem) => problem.startsWith('[manager]') && !problem.includes('whoami'))).toEqual([]);
});

test('phone layout: create a case, complete its stage, delete it', async ({ browser }) => {
  const page = await loginAs(browser, 'support', { width: 390, height: 800 });
  const before = problems.length;

  await page.getByRole('button', { name: /Ekle|Yeni Vaka Oluştur/ }).click();
  await page.getByRole('button', { name: /Müşteri Seçin/ }).click();
  await page.getByRole('button', { name: CUSTOMER, exact: true }).click();
  await page.locator('form#add-case-form select').selectOption('in_person');
  await page.getByRole('button', { name: 'Vaka Oluştur', exact: true }).click();

  const card = page.locator('div.rounded-lg', { hasText: 'Elden Teslim' }).filter({ visible: true }).first();
  await expect(card).toContainText('Teslim Alındı');

  await card.locator('button[title="Aşamayı Tamamla"]').click();
  await page.locator('button:has-text("Aşamayı Tamamla")').click();
  await expect(card).toContainText('Teknik İnceleme');
  // Support has nothing to edit or complete at this stage...
  await expect(card.locator('button[title="Vakayı Düzenle"]')).toHaveCount(0);
  await expect(card.locator('button[title="Aşamayı Tamamla"]')).toHaveCount(0);

  // ...but may still delete the case, as on the desktop table.
  await card.locator('button[title="Vakayı Sil"]').click();
  await page.getByRole('button', { name: 'Evet, Sil' }).click();
  await expect(page.locator('div.rounded-lg', { hasText: 'Elden Teslim' }).filter({ visible: true })).toHaveCount(0);

  await page.context().close();
  expect(problems.slice(before)).toEqual([]);
});
