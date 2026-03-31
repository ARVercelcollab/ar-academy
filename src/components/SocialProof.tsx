import styles from "./SocialProof.module.scss";

export default function SocialProof() {
  const tags = [
    "Sin experiencia.",
    "Sin agencia.",
    "Sin importar tu ciudad.",
    "Sin cuerpo perfecto.",
  ];

  return (
    <section className={styles.socialProof}>
      <div className={styles.container}>
        <div className={styles.tags}>
          {tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
