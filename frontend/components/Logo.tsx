export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { sueldo: "text-lg", ya: "text-xl", yp: "text-2xl" },
    md: { sueldo: "text-2xl", ya: "text-3xl", yp: "text-4xl" },
    lg: { sueldo: "text-4xl", ya: "text-5xl", yp: "text-6xl" },
  };

  return (
    <span className={`inline-flex items-baseline font-black italic ${sizes[size].sueldo}`}>
      <span className="text-cyan-400 tracking-tight">SUELDO</span>
      <span className={`font-extrabold not-italic ${sizes[size].ya} text-yellow-400 ml-0.5`}>
        YA
      </span>
      <span className={`font-black not-italic ${sizes[size].yp} text-yellow-300 ml-0.5 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]`}>
        ý
      </span>
    </span>
  );
}
