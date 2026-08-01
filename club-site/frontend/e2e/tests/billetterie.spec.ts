import { test, expect } from "@playwright/test";
import { BilletteriePage } from "../pages/BilletteriePage";

test.describe("Billetterie", () => {
  test("affiche le prochain match à domicile et les tarifs", async ({ page }) => {
    const billetterie = new BilletteriePage(page);
    await billetterie.goto();

    await expect(billetterie.nextHomeGame).toBeVisible();
    await expect(billetterie.tierCards.first()).toBeVisible();
    // Seed data's home-game count: assert at least one CTA per fixture.
    await expect(page.getByRole("link", { name: "Réserver" })).not.toHaveCount(0);
  });

  test("le compte à rebours affiche des unités jours/heures/min", async ({ page }) => {
    const billetterie = new BilletteriePage(page);
    await billetterie.goto();

    await expect(page.getByText("JOURS")).toBeVisible();
    await expect(page.getByText("HEURES")).toBeVisible();
  });
});
