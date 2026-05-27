import Image from "next/image";

const SIZES = {
  sm: { height: 28, width: 28 },
  md: { height: 36, width: 36 },
  lg: { height: 44, width: 44 },
  xl: { height: 72, width: 72 },
} as const;

export default function Brand({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dims = SIZES[size];
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Tredific®"
        width={dims.width}
        height={dims.height}
        className="object-contain"
        priority
      />
      <span
        className={`brand-mark font-serif tracking-tight font-medium ${
          {
            sm: "text-base",
            md: "text-xl",
            lg: "text-2xl",
            xl: "text-4xl md:text-5xl",
          }[size]
        }`}
      >
        Tredific<sup>®</sup>
      </span>
    </span>
  );
}
