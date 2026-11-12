import { initials, type Member } from "@/lib/team";
import { cn } from "@/lib/utils";

export function MemberPhoto({ member, className }: { member: Member; className?: string }) {
  if (member.photo) {
    return <img src={member.photo} alt={member.name} className={cn("h-full w-full object-cover", className)} />;
  }
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center font-semibold tracking-tight", className)}
      style={{
        background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${member.accent} 55%, white), ${member.accent} 70%)`,
        color: member.accentInk,
      }}
      aria-label={`${member.name} (photo coming soon)`}
    >
      <span className="leading-none" style={{ fontSize: "clamp(1.5rem, 30cqw, 8rem)" }}>
        {initials(member.name)}
      </span>
    </div>
  );
}
