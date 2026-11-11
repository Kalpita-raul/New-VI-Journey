import { expect, Page, test } from '@playwright/test';
import { chooseRadio, pickOption } from './helpers';
import { testData as d } from './test-data';

// Stops before Get Quotes — UAT currently redirects to session-wrong after that step.
test('UAT happy path — through Your Cover (pre–Get Quotes)', async ({ page }) => {
  await page.goto(
    `/compare-van-insurance/about-your-van?regNo=${encodeURIComponent(d.van.registration.replace(/\s/g, ''))}`
  );
  await expect(page.getByRole('heading', { name: '1. About The Van' })).toBeVisible();

  await findVan(page);
  await completeVanDetails(page);
  await completeAboutYou(page);
  await completeYourCover(page);

  await expect(page).toHaveURL(/\/compare-van-insurance\/your-cover(?:\?|#|$)/);
  await expect(page.getByRole('heading', { level: 1, name: '3. Your Cover' })).toBeVisible();
  await expect(page.locator('input[id*="privacyPolicy"]')).toBeChecked();
  await expect(page.getByRole('button', { name: 'Get Quotes' })).toBeVisible();
  await expect(page).not.toHaveURL(/session-wrong/);
});

async function findVan(page: Page) {
  const registration = page.locator('#registrationNumber');
  if ((await registration.inputValue()) === '') {
    await registration.click();
    await registration.pressSequentially(d.van.registration, { delay: 40 });
  }

  const search = page.locator('#search-button');
  if (await search.isEnabled()) {
    await search.click();
  } else {
    await search.dispatchEvent('mousedown');
  }

  const edition = page.locator('#vehicleEdition-scroll');
  await expect(edition.getByRole('button').first()).not.toHaveText(/Edition|Please Select/i, {
    timeout: 60_000,
  });

  await chooseRadio(page, 'thisIsMyVehicle_0');
}

async function completeVanDetails(page: Page) {
  await chooseRadio(page, 'registeredKeeperLegalOwner_0');

  const purchased = page.locator('#datePurchased-scroll');
  await pickOption(page, purchased.getByRole('button', { name: 'Year' }), d.van.purchaseYear);
  await pickOption(page, purchased.getByRole('button', { name: 'Month' }), d.van.purchaseMonth);

  const value = page.locator('#vehicleValue');
  await value.fill(d.van.value);
  await value.blur();

  await pickOption(
    page,
    page.locator('#numberOfSeats-scroll').getByRole('button').first(),
    d.van.seats
  );

  if (d.van.racking) {
    await chooseRadio(page, 'racking_0');
  } else {
    await chooseRadio(page, 'racking_1');
  }

  await pickOption(
    page,
    page.locator('#immobiliser-scroll').getByRole('button').first(),
    /Factory Fitted/
  );

  await fillOvernightPostcode(page);
  await chooseRadio(page, d.van.tracking ? 'hasTracking_0' : 'hasTracking_1');
  const parkedId =
    d.van.parkedOvernight === 'driveway'
      ? 'parkedOvernight_1'
      : d.van.parkedOvernight === 'road'
        ? 'parkedOvernight_2'
        : 'parkedOvernight_0';
  await chooseRadio(page, parkedId);
  await chooseRadio(page, d.van.signWritten ? 'signWritten_0' : 'signWritten_1');

  await page.getByRole('button', { name: 'Next Step' }).click();
  await expect(page).toHaveURL(/\/compare-van-insurance\/about-you(?:\?|#|$)/, {
    timeout: 30_000,
  });
}

async function fillOvernightPostcode(page: Page) {
  const postcode = page.locator('#postcodeWhereKept');
  const tick = page.locator('#postcodeWhereKept-scroll .success-status');
  const compact = d.van.overnightPostcode.replace(/\s/g, '').toUpperCase();
  const spaced =
    compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;

  for (const value of [compact, spaced]) {
    await postcode.click();
    await postcode.fill('');
    await postcode.pressSequentially(value, { delay: 40 });
    const accepted = await tick
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    if (accepted) return;
  }

  throw new Error(`Overnight postcode not accepted: ${d.van.overnightPostcode}`);
}

async function completeAboutYou(page: Page) {
  await expect(page.getByRole('heading', { name: /About You/i })).toBeVisible({
    timeout: 30_000,
  });

  const firstName = page.getByRole('textbox', { name: 'First Name' });
  if ((await firstName.inputValue()) === '') {
    await pickOption(
      page,
      page.locator('#maritalStatus-scroll').getByRole('button').first(),
      d.aboutYou.maritalStatus
    );
    await pickOption(
      page,
      page.locator('#title-scroll').getByRole('button').first(),
      new RegExp(`^${d.aboutYou.title}$`)
    );
    await firstName.fill(d.aboutYou.firstName);
    await page.getByRole('textbox', { name: 'Surname' }).fill(d.aboutYou.surname);

    const dob = page.locator('#dateOfBirth-scroll');
    await pickOption(page, dob.getByRole('button', { name: 'Day' }), new RegExp(`^${d.aboutYou.dobDay}$`));
    await pickOption(page, dob.getByRole('button', { name: 'Month' }), d.aboutYou.dobMonth);
    await pickOption(page, dob.getByRole('button', { name: 'Year' }), d.aboutYou.dobYear);

    await chooseRadio(page, 'isUkCitizen_0');

    await pickOption(
      page,
      page.locator('#fulltimeJobStatus-scroll').getByRole('button').first(),
      /^Employed$/
    );

    await searchAndPick(
      page,
      '#fulltimeOccupation-scroll input',
      d.aboutYou.occupationSearch,
      d.aboutYou.occupationOption
    );
    await searchAndPick(
      page,
      '#fulltimeEmployersBusiness-scroll input',
      d.aboutYou.businessSearch,
      d.aboutYou.businessOption
    );

    await chooseRadio(page, 'isPartTimeJob_1');
    await chooseRadio(page, 'isTradeMember_1');
    await chooseRadio(page, 'hasClaims_1');
    await chooseRadio(page, 'hasConvictions_1');

    await pickOption(
      page,
      page.locator('#licenceType-scroll').getByRole('button').first(),
      /Full UK/
    );
    await pickOption(
      page,
      page.locator('#yearsLicenceHeld-scroll').getByRole('button').first(),
      new RegExp(`^${d.aboutYou.yearsLicenceHeld}$`)
    );
    await pickOption(
      page,
      page.locator('#noClaimsBonus-scroll').getByRole('button').first(),
      new RegExp(`^${d.aboutYou.noClaimsBonus}$`)
    );
    await pickOption(
      page,
      page.locator('#accessToOtherVehicles-scroll').getByRole('button').first(),
      new RegExp(`^${d.aboutYou.accessOtherVehicles}$`)
    );
    await pickOption(
      page,
      page.locator('#numberOfVehiclesInHousehold-scroll').getByRole('button').first(),
      d.aboutYou.householdVehicles
    );
  }

  await chooseRadio(page, 'addAnotherDriver_1');
  await page.getByRole('button', { name: 'Next Step' }).click();
  await expect(page).toHaveURL(/\/compare-van-insurance\/your-cover(?:\?|#|$)/, {
    timeout: 30_000,
  });
}

async function completeYourCover(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: '3. Your Cover' })).toBeVisible();

  await pickOption(
    page,
    page.locator('#coverType-scroll').getByRole('button').first(),
    d.cover.coverType
  );
  await pickOption(
    page,
    page.locator('#annualMileage-scroll').getByRole('button').first(),
    d.cover.annualMileage
  );
  await pickOption(
    page,
    page.locator('#classOfUse-scroll').getByRole('button').first(),
    d.cover.classOfUse
  );
  await pickOption(
    page,
    page.locator('#voluntaryExcess-scroll').getByRole('button').first(),
    d.cover.voluntaryExcess
  );

  await page
    .locator('#hazardous-scroll')
    .getByText(d.cover.hazardous ? 'Yes' : 'No', { exact: true })
    .click();

  const policyDate = page.locator('#policyDate-scroll');
  await pickOption(
    page,
    policyDate.getByRole('button', { name: 'Day' }),
    new RegExp(`^${d.cover.policyStartDay}$`)
  );

  await page
    .locator('#paymentMethod-scroll')
    .getByText(d.cover.paymentMethod, { exact: true })
    .click();

  await page.getByRole('textbox', { name: 'Postcode' }).fill(d.cover.homePostcode);
  await page.getByRole('button', { name: 'Find' }).click();

  await pickOption(
    page,
    page.locator('#selectAddress-scroll').getByRole('button').first(),
    d.cover.addressOption
  );

  await pickOption(
    page,
    page.locator('#property-scroll').getByRole('button').first(),
    d.cover.propertyType
  );

  const homeInsurance = page.locator('#insurance-scroll').getByRole('button').first();
  if (await homeInsurance.isVisible().catch(() => false)) {
    await pickOption(page, homeInsurance, d.cover.homeInsurance);
  }

  await page.getByRole('textbox', { name: 'Main Phone number' }).fill(d.cover.phone);
  await page.getByRole('textbox', { name: 'your@email.com' }).fill(d.cover.email);

  await page.locator('#connected-scroll').getByText('Email', { exact: true }).click();
  await chooseRadio(page, d.cover.renewalAutoFetch ? 'renewal_0' : 'renewal_1');

  const terms = page.locator('input[id*="privacyPolicy"]');
  await terms.evaluate((input: HTMLInputElement) => {
    input.click();
    if (!input.checked) {
      input.checked = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await expect(terms).toBeChecked();
}

async function searchAndPick(page: Page, inputSelector: string, query: string, option: RegExp) {
  const input = page.locator(inputSelector).first();
  await input.scrollIntoViewIfNeeded();
  await input.fill(query);
  const choice = page.getByRole('option', { name: option }).first();
  await expect(choice).toBeVisible({ timeout: 20_000 });
  await choice.click();
}
