import { expect, Locator, Page } from '@playwright/test';

export async function chooseRadio(page: Page, inputId: string) {
  const label = page.locator(`label[for="${inputId}"]`);
  await label.scrollIntoViewIfNeeded();
  await label.click();
  await expect(page.locator(`#${inputId}`)).toBeChecked();
}

export async function pickOption(
  page: Page,
  button: Locator,
  option: string | RegExp
) {
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const choice = page.getByRole('option', { name: option }).first();
  await expect(choice).toBeVisible();
  await choice.click();
}

export async function fillIfVisible(locator: Locator, value: string) {
  if (await locator.isVisible().catch(() => false)) {
    await locator.fill(value);
    return true;
  }
  return false;
}

export async function clickLabelIfVisible(page: Page, inputId: string) {
  const label = page.locator(`label[for="${inputId}"]`);
  if (await label.isVisible().catch(() => false)) {
    await label.scrollIntoViewIfNeeded();
    await label.click();
    return true;
  }
  return false;
}
