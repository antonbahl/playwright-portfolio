import { type Locator, type Page } from '@playwright/test';

export class CartPage {
  readonly items: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('cart-item');
    this.subtotal = page.getByTestId('subtotal');
    this.tax = page.getByTestId('tax');
    this.total = page.getByTestId('total');
    this.checkoutButton = page.getByTestId('checkout');
  }

  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('item-name').getByText(name, { exact: true }) });
  }

  async remove(name: string) {
    await this.item(name).getByTestId('remove').click();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}
