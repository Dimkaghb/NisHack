import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "80vh", paddingTop: "160px", paddingBottom: "0" }}
    >
      {/* Sky gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, #9ac5de 0%, #aed3e7 18%, #c4e0ef 38%, #ddeef7 58%, #edf6fa 76%, #f9f8f8 100%)",
        }}
      />

      {/* Left cloud cluster */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className="absolute"
          style={{
            top: "28%",
            left: "-8%",
            width: "480px",
            height: "220px",
            background: "rgba(255,255,255,0.72)",
            borderRadius: "50%",
            filter: "blur(36px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "18%",
            left: "-4%",
            width: "340px",
            height: "160px",
            background: "rgba(255,255,255,0.6)",
            borderRadius: "50%",
            filter: "blur(28px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "36%",
            left: "2%",
            width: "260px",
            height: "120px",
            background: "rgba(255,255,255,0.55)",
            borderRadius: "50%",
            filter: "blur(22px)",
          }}
        />

        {/* Right cloud cluster */}
        <div
          className="absolute"
          style={{
            top: "22%",
            right: "-6%",
            width: "440px",
            height: "200px",
            background: "rgba(255,255,255,0.7)",
            borderRadius: "50%",
            filter: "blur(34px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "14%",
            right: "-2%",
            width: "300px",
            height: "150px",
            background: "rgba(255,255,255,0.58)",
            borderRadius: "50%",
            filter: "blur(26px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "34%",
            right: "3%",
            width: "230px",
            height: "110px",
            background: "rgba(255,255,255,0.5)",
            borderRadius: "50%",
            filter: "blur(20px)",
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center w-full px-6">
        <div
          className="flex flex-col items-center w-full gap-16"
          style={{ maxWidth: "1072px" }}
        >
          {/* Text block + buttons */}
          <div
            className="flex flex-col items-center gap-10 w-full"
            style={{ maxWidth: "792px" }}
          >
            {/* Heading + subtitle */}
            <div className="flex flex-col items-center gap-4 w-full">
              <h1
                className="w-full text-center font-semibold leading-[120%] tracking-[-0.03em]"
                style={{
                  fontSize: "clamp(40px, 6vw, 76px)",
                  color: "var(--neutral-30)",
                  maxWidth: "792px",
                }}
              >
                Run your freelance business like a pro
              </h1>
              <p
                className="text-center leading-[150%]"
                style={{
                  fontSize: "clamp(16px, 2vw, 20px)",
                  color: "var(--neutral-20)",
                  maxWidth: "700px",
                }}
              >
                All-in-one platform for managing clients, projects, and payments
                without the chaos. From first contract to final invoice,
                we&apos;ve got your back.
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Link
                href="/contact-us"
                className="inline-flex items-center px-6 py-[18px] rounded-full font-semibold text-white text-[16px] leading-[1.2] transition-opacity duration-150 hover:opacity-85"
                style={{ backgroundColor: "var(--neutral-30)" }}
              >
                Try Dreelio free
              </Link>
              <Link
                href="/#features"
                className="inline-flex items-center px-6 py-[18px] rounded-full font-semibold text-[16px] leading-[1.2] transition-colors duration-150 hover:bg-black/5"
                style={{ color: "var(--neutral-30)" }}
              >
                See features
              </Link>
            </div>
          </div>

          {/* Dashboard image */}
          <div
            className="w-full relative overflow-hidden shadow-2xl"
            style={{
              borderRadius: "20px",
              aspectRatio: "1.531",
              maxWidth: "1072px",
            }}
          >
            <Image
              src="https://framerusercontent.com/images/JeI7uULY0av9DxD7q7NVLTuoNc.png"
              alt="Dreelio dashboard — manage clients, projects and payments"
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, 1072px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
