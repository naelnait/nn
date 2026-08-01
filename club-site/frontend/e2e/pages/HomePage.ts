import type { Locator, Page } from "@playwright/test";

export class HomePage {
  readonly page: Page;
  readonly headline: Locator;
  readonly reserveCta: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headline = page.getByRole("heading", { level: 1 });
    // Two "Réserver ma place" links exist by design on a home-game day: the
    // hero CTA and the one on the match card further down — grab the hero's.
    this.reserveCta = page.getByRole("link", { name: "Réserver ma place" }).first();
  }

  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }
}
