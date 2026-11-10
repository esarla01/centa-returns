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

/** A day in Turkey, `daysFromToday` away, in the given style. */
function istanbulDay(daysFromToday: number, style: 'long' | 'dotted'): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' })
    .format(new Date(Date.now() + daysFromToday * 86_400_000)).split('-');
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  return style === 'long'
    ? `${Number(parts[2])} ${months[Number(parts[1]) - 1]} ${parts[0]}`
    : `${parts[2]}.${parts[1]}.${parts[0]}`;
}
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
  const context = await browser.newContext({ timezoneId: 'Europe/Istanbul', ...(viewport ? { viewport } : {}) });
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
    // The arrival date defaults to today as the user's calendar has it.
    await expect(caseRow(page)).toContainText(istanbulDay(0, 'long'));
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
    // The production month saved through the API shows in the month picker.
    await expect(page.getByPlaceholder('Ay seçin')).toHaveValue('2024-03');
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
    // The shipping date is the day that was typed, not the day before.
    await expect(caseRow(page)).toContainText('20 Mayıs 2024');
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

    // Date filter on the case list: the case arrived today.
    await expect(caseRow(page)).toBeVisible();
    await page.getByPlaceholder('Bitiş').filter({ visible: true }).fill(istanbulDay(-1, 'dotted'));
    await page.keyboard.press('Escape');
    await expect(page.locator('tr:visible', { hasText: CUSTOMER })).toHaveCount(0);
    await page.getByPlaceholder('Bitiş').filter({ visible: true }).fill(istanbulDay(0, 'dotted'));
    await page.keyboard.press('Escape');
    await expect(caseRow(page)).toBeVisible();
    await page.getByPlaceholder('Başlangıç').filter({ visible: true }).fill(istanbulDay(0, 'dotted'));
    await page.keyboard.press('Escape');
    await expect(caseRow(page)).toBeVisible();

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

// The tests below run after the one above and use the case it finished:
// 2 x DT-25 (Fotosel), produced 2024-03, "Teknik Sorun", "Tamir", one fault type found.

test('statistics: every chart shows the finished case, and the filters work', async ({ browser }) => {
  const page = await loginAs(browser, 'manager');
  const before = problems.length;
  await page.goto('/view-statistics');
  const card = (title: string) =>
    page.locator('div.bg-white.rounded.shadow.p-4', { has: page.getByRole('heading', { name: title, exact: true }) });

  const topDefects = card('En Sık Görülen Arıza Tipleri (Top 5)');
  await expect(topDefects).toContainText('Toplam İade Ürün Adedi: 2');
  await expect(topDefects).toContainText('Toplam Tespit Edilen Arıza: 2');
  await expect(topDefects.locator('tbody tr')).toHaveCount(1);
  await expect(topDefects.locator('tbody tr')).toContainText('100%');

  const production = card('Üretim Dönemi Dağılım Analizi');
  await expect(production.locator('tbody tr')).toContainText('2024-03');
  await expect(production.locator('tbody tr')).toContainText('100%');

  for (const [title, slice] of [
    ['Hata Sorumluluğuna Göre Arıza Dağılımı', 'Teknik Sorun'],
    ['Çözüm Yöntemine Göre Arıza Dağılımı', 'Tamir'],
    ['Ürün Türüne Göre Arıza Dağılımı', 'Fotosel'],
    ['Ürün Modeline Arıza Adedi', 'DT-25'],
  ]) {
    await expect(card(title)).toContainText('Toplam İade Ürün Adedi: 2');
    await expect(card(title)).toContainText(slice);
    await expect(card(title)).toContainText('100%');
  }

  const customers = card('Müşterilere Göre Arıza Adedi (Top 5)');
  await expect(customers.locator('tbody tr')).toContainText(CUSTOMER);
  await expect(customers.locator('tbody tr')).toContainText('100%');

  // Filtering to a product type with no returns empties the chart but keeps the filters usable.
  const productType = topDefects.locator('select').first();
  const faultType = topDefects.locator('select').nth(1);
  await expect(faultType).toBeDisabled();
  await productType.selectOption('overload');
  await expect(topDefects).toContainText('Seçilen tarih aralığında veri bulunamadı');
  await productType.selectOption('door_detector');
  await expect(topDefects.locator('tbody tr')).toHaveCount(1);
  await expect(faultType).toBeEnabled();
  await expect(faultType.locator('option')).toHaveCount(17); // "Tümü" + the 16 Fotosel fault types

  // The production trend has its own range. The units were produced in March 2024.
  const trend = card('Üretim Dönemi Arıza Trend Analizi');
  await expect(trend).toContainText('Kas 2026');
  await expect(trend).not.toContainText('Mar 2024');
  await trend.locator('select').first().selectOption('5');
  await expect(trend).toContainText('(61 / 61 ay)');
  // Many months: narrow to a 12-month window and move it.
  await trend.getByRole('button', { name: '12 Ay Göster' }).click();
  await expect(trend).toContainText('(12 / 61 ay)');
  await expect(trend.getByRole('button', { name: '← Önceki' })).toBeDisabled();
  await trend.getByRole('button', { name: 'Sonraki →' }).click();
  await expect(trend.getByRole('button', { name: '← Önceki' })).toBeEnabled();
  // A custom range around the production month shows it.
  await trend.locator('select').first().selectOption('custom');
  await trend.locator('input[type=date]').first().fill('2024-01-01');
  await trend.locator('input[type=date]').nth(1).fill('2024-06-30');
  await expect(trend).toContainText('Mar 2024');
  await expect(trend).toContainText('Haz 2024');
  // A range shorter than a month is explained rather than charted.
  await trend.locator('input[type=date]').first().fill('2024-06-20');
  await expect(trend).toContainText('en az bir aylık bir tarih aralığı seçin');

  await page.context().close();
  expect(problems.slice(before)).toEqual([]);
});


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
