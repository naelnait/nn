import { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layout } from "./components/layout/Layout";
import { Skeleton } from "./components/ui/Skeleton";
import { PageTransition } from "./components/originkit/PageTransition";

const Home = lazy(() => import("./pages/Home"));
const Club = lazy(() => import("./pages/Club"));
const Team = lazy(() => import("./pages/Team"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Standings = lazy(() => import("./pages/Standings"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Gallery = lazy(() => import("./pages/Gallery"));
const AlbumDetail = lazy(() => import("./pages/AlbumDetail"));
const Partners = lazy(() => import("./pages/Partners"));
const Billetterie = lazy(() => import("./pages/Billetterie"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="container-page py-16">
      <Skeleton className="h-96" />
    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      {/* Keyed on the path so each section animates in and out as a unit.
          `mode="wait"` lets the outgoing view finish before the next arrives,
          which keeps the two from overlapping mid-scroll. */}
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/club" element={<Club />} />
              <Route path="/effectif" element={<Team />} />
              <Route path="/calendrier" element={<Calendar />} />
              <Route path="/classement" element={<Standings />} />
              <Route path="/actualites" element={<News />} />
              <Route path="/actualites/:slug" element={<NewsDetail />} />
              <Route path="/galerie" element={<Gallery />} />
              <Route path="/galerie/:id" element={<AlbumDetail />} />
              <Route path="/partenaires" element={<Partners />} />
              <Route path="/billetterie" element={<Billetterie />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </AnimatePresence>
    </Layout>
  );
}
