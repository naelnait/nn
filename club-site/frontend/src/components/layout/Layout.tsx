import type { PropsWithChildren } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2">
        Aller au contenu
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
