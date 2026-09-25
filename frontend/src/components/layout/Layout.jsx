import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import FlashMessages from "./FlashMessages.jsx";

export default function Layout() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, search, hash]);

  return (
    <>
      <a className="visually-hidden-focusable skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main" className="site-main">
        <div className="container-xl flash-stack">
          <FlashMessages />
        </div>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
