import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/HomePage";
import { HeaderNav } from "../pages/HeaderNav";

test.describe("Navigation", () => {
  test("cliquer une rubrique navigue et marque le lien actif", async ({ page }) => {
    const home = new HomePage(page);
    const nav = new HeaderNav(page);
    await home.goto();

    await nav.link("Effectif").click();
    await expect(page).toHaveURL(/\/effectif$/);
    await expect(nav.activeLink()).toHaveText("Effectif");
  });

  test("le lien actif change de rubrique en rubrique (une seule pastille active à la fois)", async ({ page }) => {
    const home = new HomePage(page);
    const nav = new HeaderNav(page);
    await home.goto();

    await nav.link("Calendrier").click();
    await expect(page).toHaveURL(/\/calendrier$/);
    await expect(nav.activeLink()).toHaveText("Calendrier");
    await expect(nav.activeLink()).toHaveCount(1);
  });
});
