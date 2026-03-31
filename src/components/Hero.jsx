import heroImg    from "../assets/hero_wc.png";
import bannerMovil from "../assets/banner_movil.png";

export default function Hero() {
  return (
    <section style={{ position: "relative", width: "100%", overflow: "hidden", lineHeight: 0 }}>
      {/*
        <picture> muestra banner_movil.png en pantallas ≤ 768px
        y hero_wc.png en desktop/tablet.
      */}
      <picture>
        <source media="(max-width: 768px)" srcSet={bannerMovil} />
        <img
          src={heroImg}
          alt="FIFA World Cup 2026"
          style={{ display: "block", width: "100%", height: "auto", objectFit: "cover" }}
        />
      </picture>
    </section>
  );
}
