import styles from "./page.module.scss";
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
import { precioComunidad } from "@/lib/comunidad";

// Se rehace cada minuto: así el 1-12 pasa sola de 99 € a 199 € (src/lib/comunidad.ts).
export const revalidate = 60;

export default function ComunidadPage() {
  const { euros, subio } = precioComunidad();
  return (
    <main>
      <UrgencyToast />
      <HeroReordered euros={euros} subio={subio} />
      <div className={styles.noOverlap}>
        <SuccessCases />
      </div>
      <SocialProof />
      <PainPoints />
      <AboutArianny />
      <Alumnas />
      <WhyAcademy />
      <Pricing euros={euros} />
      <Urgency subio={subio} />
      <Objections euros={euros} />
      <FinalCta euros={euros} subio={subio} />
      <Footer euros={euros} />
    </main>
  );
}
