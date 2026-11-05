import { type Locator, type Page } from '@playwright/test';

export type Customer = { firstName: string; lastName: string; postalCode: string };

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly placeOrderButton: Locator;
  readonly error: Locator;
  readonly completeHeader: Locator;
  readonly orderTotal: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.postalCode = page.getByTestId('postal-code');
    this.placeOrderButton = page.getByTestId('place-order');
    this.error = page.getByTestId('error');
    this.completeHeader = page.getByTestId('complete-header');
    this.orderTotal = page.getByTestId('order-total');
  }

  async fill(customer: Partial<Customer>) {
    if (customer.firstName !== undefined) await this.firstName.fill(customer.firstName);
    if (customer.lastName !== undefined) await this.lastName.fill(customer.lastName);
    if (customer.postalCode !== undefined) await this.postalCode.fill(customer.postalCode);
  }

  async placeOrder(customer: Partial<Customer>) {
    await this.fill(customer);
    await this.placeOrderButton.click();
  }
}
