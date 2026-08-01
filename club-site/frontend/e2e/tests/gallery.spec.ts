import { test, expect } from "@playwright/test";

test.describe("Galerie / visionneuse photo", () => {
  test("ouvre un album, ouvre la visionneuse et navigue au clavier", async ({ page }) => {
    await page.goto("/galerie");
    await page.locator('a[href^="/galerie/"]').first().click();
    await expect(page).toHaveURL(/\/galerie\/.+/);

    const firstPhoto = page.getByRole("button", { name: "Agrandir la photo 1" });
    await firstPhoto.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByText("1 / ")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("2 / ")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});
