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

export default function ComunidadPage() {
  return (
    <main>
      <UrgencyToast />
      <HeroReordered />
      <div className={styles.noOverlap}>
        <SuccessCases />
      </div>
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
