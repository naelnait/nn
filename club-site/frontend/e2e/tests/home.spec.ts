import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { HeaderNav } from "../pages/HeaderNav";

test.describe("Accueil", () => {
  test("affiche le nom du club et un CTA billetterie pour le prochain match à domicile", async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.headline).toContainText("Chartres", { ignoreCase: true });
    // Seed data's next match is a home fixture, so the ticket CTA should
    // replace the generic calendar link rather than sit alongside it.
    await expect(home.reserveCta).toBeVisible();
  });

  test("le bouton Billets du header ouvre la billetterie", async ({ page }) => {
    const home = new HomePage(page);
    const nav = new HeaderNav(page);
    await home.goto();

    await nav.ticketsButton.click();
    await expect(page).toHaveURL(/\/billetterie$/);
  });
});
