export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <span className={`font-bold ${sizes[size]} inline-flex items-baseline`}>
      <span className="text-white">Sueldo</span>
      <span className="text-yellow-400 ml-0.5">Ya</span>
      <span className="text-yellow-400 text-[0.6em] ml-0.5 relative -top-[0.1em]">⚡</span>
    </span>
  );
}
