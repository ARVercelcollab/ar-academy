import Image from "next/image";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#000",
      }}
    >
      <Image
        src="/img/logos-footer.svg"
        alt="AR Academy"
        width={235}
        height={47}
        priority
      />
    </main>
  );
}
