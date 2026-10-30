import { expect, test, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Trải nghiệm bản demo' }).click()
  await expect(
    page.getByRole('heading', { name: 'Tổng quan điều hành', exact: true }),
  ).toBeVisible()
}
async function openPage(page: Page, title: string) {
  await page.getByRole('button', { name: 'Tìm kiếm trang' }).click()
  await page.getByRole('dialog').getByRole('link').filter({ hasText: title }).first().click()
}

test('login, school identity, validation and logout', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Trường THCS Xuân Phương', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByText('Nhập tên đăng nhập hoặc email.', { exact: true })).toBeVisible()
  await page.getByLabel('Tên đăng nhập hoặc email', { exact: true }).fill('bgh.xuanphuong')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('edusmart-demo')
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click()
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.getByRole('button', { name: 'Đăng xuất bản demo' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('all existing Stitch page families render without runtime errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await login(page)
  const routes = [
    '/dashboard',
    '/boarding/overview',
    '/boarding/menus',
    '/boarding/menu-approvals/menu-w44',
    '/boarding/duties',
    '/boarding/inspections',
    '/boarding/meals',
    '/boarding/reports',
    '/teaching/overview',
    '/teaching/assignments',
    '/teaching/assignments/new',
    '/teaching/approvals/plan-hk1',
    '/teaching/timetable',
    '/teaching/substitutions',
    '/teaching/reconciliation',
  ]
  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('main h1')).toBeVisible()
    await expect(page.locator('body')).not.toContainText('An Bình')
    await expect(page.getByText('Trường THCS Xuân Phương', { exact: true })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
  }
  expect(errors).toEqual([])
})

test('menu approval updates shared dashboard and cannot be repeated', async ({ page }) => {
  await login(page)
  await openPage(page, 'Duyệt thực đơn')
  await page.getByRole('button', { name: 'Phê duyệt thực đơn', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Xác nhận phê duyệt', exact: true })
    .click()
  await expect(page.getByRole('button', { name: 'Phê duyệt thực đơn', exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Xét duyệt thực đơn tuần 9', exact: true }),
  ).toBeVisible()
  await openPage(page, 'Tổng quan điều hành')
  await expect(page.locator('.approval-item')).toHaveCount(1)
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Hồ sơ chờ duyệt' }).locator('.metric-value'),
  ).toHaveText('1')
})

test('edit a menu draft and submit it to the approval queue', async ({ page }) => {
  await login(page)
  await openPage(page, 'Quản lý thực đơn')
  await page.getByLabel('Chọn tuần thực đơn').selectOption('menu-w45')
  await page.getByRole('button', { name: 'Chỉnh sửa thực đơn' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Tên thực đơn *', { exact: true }).fill('Thực đơn tuần 10 · Cập nhật')
  await dialog.getByRole('button', { name: 'Lưu bản nháp' }).click()
  await expect(dialog).not.toBeVisible()
  await page.getByRole('button', { name: 'Gửi duyệt', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Gửi duyệt', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Gửi duyệt', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Xem hồ sơ duyệt' })).toBeVisible()
})

test('meal reconciliation blocks unresolved close and becomes read-only after close', async ({
  page,
}) => {
  await login(page)
  await openPage(page, 'Suất ăn & đối soát')
  await page.getByRole('button', { name: 'Chốt đối soát ngày', exact: true }).click()
  await expect(
    page.getByRole('dialog').getByRole('button', { name: 'Xác nhận chốt ngày' }),
  ).toBeDisabled()
  await page.getByRole('dialog').getByRole('button', { name: 'Quay lại' }).click()
  await page.getByRole('button', { name: 'Đối soát', exact: true }).click()
  await page.getByRole('dialog').getByLabel('Số suất thực nhận *', { exact: true }).fill('42')
  await page
    .getByRole('dialog')
    .getByLabel('Lý do & nội dung xác minh *', { exact: true })
    .fill('Đã bổ sung đủ 5 khay theo biên bản demo.')
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận số liệu' }).click()
  await page.getByRole('button', { name: 'Chốt đối soát ngày', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận chốt ngày' }).click()
  await expect(page.getByRole('button', { name: 'Chốt đối soát ngày', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Chi tiết / sửa' })).toHaveCount(0)
})

test('create an assignment and protect unsaved changes', async ({ page }) => {
  await login(page)
  await openPage(page, 'Tạo phân công')
  await page.getByLabel('Giáo viên giảng dạy *', { exact: true }).selectOption('t4')
  await page.getByRole('checkbox', { name: /Lớp 8A2/ }).check()
  await page.getByRole('link', { name: 'Bảng phân công chuyên môn', exact: true }).last().click()
  await expect(page.getByRole('dialog', { name: 'Bạn có thay đổi chưa lưu' })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục chỉnh sửa' }).click()
  await page.getByRole('button', { name: 'Lưu bản nháp', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Bảng phân công chuyên môn', exact: true }),
  ).toBeVisible()
  await expect(
    page.locator('.metric-card').filter({ hasText: 'Tiến độ phê duyệt' }).locator('.metric-value'),
  ).toContainText('/ 13')
})

test('assign a substitute and add exactly one confirmed lesson', async ({ page }) => {
  await login(page)
  await openPage(page, 'Phân công dạy thay')
  const row = page.getByRole('row').filter({ hasText: 'Lớp 8A2' })
  await row.getByRole('button', { name: 'Chọn GV thay' }).click()
  await page.getByRole('dialog').getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Xác nhận phân công', exact: true }).click()
  await row.getByRole('button', { name: 'Xác nhận demo' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận thực dạy' }).click()
  await expect(row.getByRole('button', { name: 'Xem xác nhận' })).toBeVisible()
  await openPage(page, 'Đối soát tiết giảng dạy')
  await expect(
    page
      .locator('.metric-card')
      .filter({ hasText: 'Dạy thay đã ghi nhận' })
      .locator('.metric-value'),
  ).toHaveText('2 tiết')
})

test('reject invalid detail identifiers and unknown paths', async ({ page }) => {
  await login(page)
  for (const [path, title] of [
    ['/boarding/menu-approvals/unknown', 'Không tìm thấy thực đơn'],
    ['/teaching/approvals/unknown', 'Không tìm thấy kế hoạch'],
    ['/teaching/assignments/unknown/edit', 'Không tìm thấy phân công'],
    ['/unknown', 'Trang này chưa có trong không gian làm việc'],
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  }
})

test('responsive widths and mobile navigation', async ({ page }) => {
  await login(page)
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of [
      '/dashboard',
      '/boarding/menus',
      '/boarding/duties',
      '/teaching/assignments',
      '/teaching/timetable',
    ]) {
      await page.goto(route)
      await expect(page.locator('main h1')).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `overflow at ${width}: ${route}`,
      ).toBe(true)
    }
  }
  await page.getByRole('button', { name: 'Mở menu điều hướng' }).click()
  await expect(page.getByRole('dialog', { name: 'Điều hướng EduSmart' })).toBeVisible()
  await page.getByRole('dialog').getByRole('link', { name: 'Tổng quan', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Tổng quan điều hành', exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('CSV download is real and search shortcut works', async ({ page }) => {
  await login(page)
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog', { name: 'Bạn muốn tìm gì?' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Tìm trang' }).fill('suat an')
  await page.getByRole('dialog').getByRole('link').click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Xuất CSV', exact: true }).click()
  expect((await download).suggestedFilename()).toBe('doi-soat-suat-an.csv')
})
