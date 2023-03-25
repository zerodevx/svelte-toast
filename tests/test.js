// @ts-nocheck

import { expect, test } from '@playwright/test'

/** @param {number} t */
const sleep = (t) => new Promise((r) => setTimeout(r, t))

test('displays a toast', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('default').click()
  await expect(page.locator('._toastItem')).toBeVisible()
})

test('displays coloured toast', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('coloredToast').click()
  await expect(page.locator('._toastItem')).toHaveCSS('background-color', 'rgba(72, 187, 120, 0.9)')
})

test('displays rich html', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('richHtml').click()
  await expect(page.locator('._toastItem a')).toHaveCount(1)
})

test('can change duration', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  const id = await page.evaluate(`window.toast.push('test',{duration:100})`)
  expect(id).toBe(1)
  await expect(page.locator('._toastItem')).toBeVisible()
  await sleep(200)
  await expect(page.locator('._toastItem')).toHaveCount(0)
})

test('can be non-dismissable then popped', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('nonDismissable').click()
  await expect(page.locator('._toastItem')).toBeVisible()
  await expect(page.locator('._toastBtn')).toHaveCount(0)
  await page.getByTestId('removeLastToast').click()
  await expect(page.locator('._toastItem')).toHaveCount(0)
})

test('flips progress bar', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('flipProgressBar').click()
  const v0 = parseFloat(await page.locator('._toastBar').getAttribute('value'))
  await sleep(100)
  const v1 = parseFloat(await page.locator('._toastBar').getAttribute('value'))
  expect(v1).toBeGreaterThan(v0)
})

test('dynamically updates progress bar', async ({ page }) => {
  const get = async () => parseFloat(await page.locator('._toastBar').getAttribute('value'))
  await page.goto('./', { waitUntil: 'networkidle' })
  const id = await page.evaluate(`window.toast.push('test',{duration:1,initial:0,next:0})`)
  expect(await get()).toBe(0)
  await page.evaluate(`window.toast.set(${id},{next:0.2})`)
  await sleep(50)
  expect(await get()).toBe(0.2)
  await page.evaluate(`window.toast.set(${id},{next:1})`)
  await sleep(50)
  await expect(page.locator('._toastItem')).toHaveCount(0)
})

test('changes default colors', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('changeDefaultColors').click()
  await expect(page.locator('._toastItem')).toHaveCSS(
    'background-color',
    'rgba(245, 208, 254, 0.95)'
  )
})

test('positions to bottom, then restore defaults', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('positionToBottom').click()
  await expect(page.locator('._toastItem')).toHaveCSS('bottom', '0px')
  await page.locator('._toastBtn').click()
  await expect(page.locator('._toastItem')).toHaveCount(0)
  await page.getByTestId('restoreDefaults').click()
  await expect(page.locator('._toastItem')).toHaveCSS('right', '0px')
})

test('clears all active toasts', async ({ page }) => {
  await page.goto('./')
  for (let a = 0; a < 3; a++) {
    await page.getByTestId('default').click()
  }
  await expect(page.locator('._toastItem')).toHaveCount(3)
  await page.evaluate(`window.toast.pop(0)`)
  await expect(page.locator('._toastItem')).toHaveCount(0)
})

test('`push()` accepts both string and obj', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  await page.evaluate(`window.toast.push('push with string')`)
  await expect(page.getByText('push with string')).toBeVisible()
  await page.evaluate(`window.toast.push({msg:'push with obj'})`)
  await expect(page.getByText('push with obj')).toBeVisible()
})

test('pushes to correct container target', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('createNewToastContainer').click()
  await expect(page.locator('._toastItem')).toHaveCSS('top', '0px')
})

test('removes all toast from particular container', async ({ page }) => {
  await page.goto('./')
  for (let a = 0; a < 3; a++) {
    await page.getByTestId('createNewToastContainer').click()
  }
  await page.getByTestId('default').click()
  await expect(page.locator('._toastItem')).toHaveCount(4)
  await page.getByTestId('removeAllToastsFromContainer').click()
  await expect(page.locator('._toastItem')).toHaveCount(1)
})

test('renders custom component and is reactive', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('sendComponentAsAMessage').click()
  await expect(page.locator('._toastItem h1')).toHaveText('A Dummy Cookie Component')
  await page.getByTestId('removeLastToast').click()
  await expect(page.locator('._toastItem')).toHaveCount(0)
  await page.evaluate(`window.TEST_MODE=true`)
  await page.getByTestId('sendComponentAsAMessage').click()
  await expect(page.getByText('test reactivity')).toBeVisible()
  await page.getByTestId('default').click()
  await page.getByTestId('dummyAccept').click()
  await expect(page.locator('._toastItem h1')).toHaveCount(0)
})

test('pauses on mouse hover', async ({ page }) => {
  const get = async () => parseFloat(await page.locator('._toastBar').getAttribute('value'))
  await page.goto('./')
  await page.getByTestId('pauseOnMouseHover').click()
  await page.locator('._toastItem').hover()
  const v0 = await get()
  await sleep(50)
  const v1 = await get()
  expect(v0).toEqual(v1)
  await page.mouse.move(0, 0)
  await sleep(50)
  const v2 = await get()
  expect(v2).toBeLessThan(v1)
})

test('does not pause when `pausable` is false', async ({ page }) => {
  const get = async () => parseFloat(await page.locator('._toastBar').getAttribute('value'))
  await page.goto('./')
  await page.getByTestId('default').click()
  await page.locator('._toastItem').hover({ force: true })
  const v0 = await get()
  await sleep(50)
  const v1 = await get()
  expect(v0).toBeGreaterThan(v1)
})

test('passes pausable edge case when `next` is changed on hover', async ({ page }) => {
  const get = async () => parseFloat(await page.locator('._toastBar').getAttribute('value'))
  await page.goto('./', { waitUntil: 'networkidle' })
  const id = await page.evaluate(`window.toast.push('test',{pausable:true,duration:50})`)
  await page.locator('._toastItem').hover({ force: true })
  await page.evaluate(`window.toast.set(${id},{next:0.1})`)
  await sleep(100)
  expect(await get()).toBe(0.1)
  await sleep(50)
  expect(await get()).toBe(0.1)
})

test('runs callback when popped', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('runCallbackOnToastRemoval').click()
  await expect(page.locator('._toastItem')).toHaveText('Wait for it...')
  await page.locator('._toastBtn').click()
  await expect(page.locator('._toastItem')).toContainText('callback has been executed')
})

test('runs callback when popped programatically', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('runCallbackOnToastRemoval').click()
  await expect(page.locator('._toastItem')).toHaveText('Wait for it...')
  await page.evaluate(`window.toast.pop(0)`)
  await expect(page.locator('._toastItem')).toContainText('callback has been executed')
})

test('adds and merges user-defined classes', async ({ page }) => {
  await page.goto('./')
  await page.getByTestId('styleWithUserDefinedClasses').click()
  await expect(page.locator('._toastItem')).toHaveCSS('background-color', 'rgb(66, 153, 225)')
  await expect(page.locator('._toastContainer li')).toHaveClass(
    /(?=.*custom)(?=.*merge1)(?=.*merge2)/
  )
})

test('can change dismiss btn char', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(`window.TEST_MODE=true`)
  await page.getByTestId('customDismissButton').click()
  const btn = await page
    .locator('._toastBtn')
    .evaluate((e) => window.getComputedStyle(e, ':after').content)
  expect(btn).toBe('"x"')
})

test('removes all toasts from a container target', async ({ page }) => {
  await page.goto('./')
  for (let a = 0; a < 3; a++) {
    await page.getByTestId('createNewToastContainer').click()
  }
  await page.getByTestId('removeAllToastsFromContainer').click()
  await expect(page.locator('._toastItem')).toHaveCount(0)
})

test('toggles pause and resume on visibilitychange', async ({ page }) => {
  const get = async () => parseFloat(await page.locator('._toastBar').getAttribute('value'))
  const fire = async (hidden = false) =>
    await page.evaluate((value) => {
      Object.defineProperty(document, 'hidden', { value, writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }, hidden)
  await page.goto('./')
  await page.getByTestId('default').click()
  await fire(true)
  const v0 = await get()
  await sleep(100)
  const v1 = await get()
  expect(v0).toEqual(v1)
  await fire(false)
  await sleep(100)
  const v2 = await get()
  expect(v2).toBeLessThan(v1)
})

// Backward compatibility tests

test('`progress` key still works', async ({ page }) => {
  const get = async () => parseFloat(await page.locator('._toastBar').getAttribute('value'))
  await page.goto('./', { waitUntil: 'networkidle' })
  const id = await page.evaluate(`window.toast.push('test',{duration:1,initial:0,progress:0})`)
  expect(await get()).toBe(0)
  await page.evaluate(`window.toast.set(${id},{progress:0.2})`)
  await sleep(50)
  expect(await get()).toBe(0.2)
})

test('removes toasts from container via filter fn', async ({ page }) => {
  await page.goto('./', { waitUntil: 'networkidle' })
  for (let a = 0; a < 3; a++) {
    await page.getByTestId('createNewToastContainer').click()
  }
  await page.evaluate(`window.toast.pop(i=>i.target!=='new')`)
  await expect(page.locator('._toastItem')).toHaveCount(0)
})

test('deprecated css vars still work', async ({ page }) => {
  const snap = async (sel) => await page.locator(sel).screenshot({ animations: 'disabled' })
  await page.goto('./', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    window.toast.push('', { next: 1, theme: { '--toastBarBackground': 'red' } })
    window.toast.push('', { next: 1, theme: { '--toastProgressBackground': 'red' } })
  })
  const ss0 = await snap('._toastContainer li:first-child ._toastBar')
  const ss1 = await snap('._toastContainer li:last-child ._toastBar')
  expect(ss0).toEqual(ss1)
})
