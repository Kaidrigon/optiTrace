
import { SiteHeader } from "@/app/components/site-header";
import { Hero } from "@/app/components/hero";
import { Features } from "@/app/components/features";
import { Playground } from "@/app/components/playground";
import { SiteFooter } from "@/app/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <Features />
        <Playground />
      </main>
      <SiteFooter />
    </>
  );
}
