import { test, expect } from "@playwright/test";

test.describe("Contact", () => {
  test("rejette un formulaire incomplet avec un message d'erreur", async ({ page }) => {
    await page.goto("/contact");
    // noValidate is set on the form on purpose (see Contact.tsx) — validation
    // is the backend's job, so submitting empty must round-trip to the API.
    await page.getByRole("button", { name: "Envoyer le message" }).click();
    await expect(page.getByText("Merci de compléter correctement tous les champs")).toBeVisible();
  });

  test("accepte un formulaire valide et affiche la confirmation", async ({ page }) => {
    await page.goto("/contact");
    await page.locator("#name").fill("Camille Test");
    await page.locator("#email").fill("camille@example.com");
    await page.locator("#subject").fill("Question billetterie");
    await page.locator("#message").fill("Bonjour, avez-vous encore des places pour le prochain match ?");
    await page.getByRole("button", { name: "Envoyer le message" }).click();

    await expect(page.getByText("Merci, votre message a bien été envoyé.")).toBeVisible();
    // Fields reset on success.
    await expect(page.locator("#name")).toHaveValue("");
  });
});
