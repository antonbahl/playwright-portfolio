import { type Locator, type Page, expect } from '@playwright/test';

export class InventoryPage {
  readonly items: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.cartBadge = page.getByTestId('cart-badge');
    this.cartLink = page.getByTestId('cart-link');
    this.logoutButton = page.getByTestId('logout');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/inventory$/);
    await expect(this.items.first()).toBeVisible();
  }

  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('item-name').getByText(name, { exact: true }) });
  }

  addToCartButton(name: string): Locator {
    return this.item(name).getByTestId('add-to-cart');
  }

  async addToCart(name: string) {
    await this.addToCartButton(name).click();
  }

  async openCart() {
    await this.cartLink.click();
  }
}
