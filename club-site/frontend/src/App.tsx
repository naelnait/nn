import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Skeleton } from "./components/ui/Skeleton";

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
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
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
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
