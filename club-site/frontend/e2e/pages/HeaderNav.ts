import type { Locator, Page } from "@playwright/test";

export class HeaderNav {
  readonly page: Page;
  readonly ticketsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ticketsButton = page.getByRole("banner").getByRole("link", { name: "Billets" });
  }

  link(label: string): Locator {
    return this.page.getByRole("banner").getByRole("link", { name: label, exact: true });
  }

  /** React Router's <NavLink> sets aria-current="page" on the active link. */
  activeLink(): Locator {
    return this.page.getByRole("banner").locator('a[aria-current="page"]');
  }
}
