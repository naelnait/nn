import type { Locator, Page } from "@playwright/test";

export class BilletteriePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nextHomeGame: Locator;
  readonly tierCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
    this.nextHomeGame = page.getByText("Prochain match à domicile");
    this.tierCards = page.getByText(/Tarif|Carte 10 matchs/);
  }

  async goto() {
    await this.page.goto("/billetterie");
    await this.page.waitForLoadState("networkidle");
  }
}
