// Página de STAGING: clona /comunidad entera reutilizando los componentes reales
// (mismos tamaños, tipografía y estilos). Solo cambia el Hero por HeroReordered
// (vídeo arriba) y añade el toast de urgencia. Cuando el cliente valide, se porta
// a /comunidad. No toca producción.

import HeroReordered from "@/components/HeroReordered";
import UrgencyToast from "@/components/UrgencyToast";
import SuccessCases from "@/components/SuccessCases";
import SocialProof from "@/components/SocialProof";
import PainPoints from "@/components/PainPoints";
import AboutArianny from "@/components/AboutArianny";
import Alumnas from "@/components/Alumnas";
import WhyAcademy from "@/components/WhyAcademy";
import Pricing from "@/components/Pricing";
import Urgency from "@/components/Urgency";
import Objections from "@/components/Objections";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function ComunidadPreviewPage() {
  return (
    <main>
      <UrgencyToast />
      <HeroReordered />
      <SuccessCases />
      <SocialProof />
      <PainPoints />
      <AboutArianny />
      <Alumnas />
      <WhyAcademy />
      <Pricing />
      <Urgency />
      <Objections />
      <FinalCta />
      <Footer />
    </main>
  );
}
