import { Youtube, Send } from "lucide-react";

type Social = { name: string; href: string; icon: (p: { className?: string }) => JSX.Element; primary?: boolean };

export const SOCIAL_LINKS: Social[] = [
  { name: "Discord", href: "https://discord.com/invite/7MRsuqqT3n", icon: DiscordIcon, primary: true },
  { name: "X (Twitter)", href: "https://x.com/propfirm_forex", icon: XIcon },
  { name: "Telegram", href: "https://telegram.dog/free_propfirm_accounts", icon: Send },
  { name: "YouTube", href: "https://www.youtube.com/@propfirm_knowledge", icon: Youtube },
];

export function SocialLinks({ size = "md" }: { size?: "sm" | "md" }) {
  const sz = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const ic = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  return (
    <div className="flex items-center gap-2">
      {SOCIAL_LINKS.map(s => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          title={s.name}
          className={`${sz} inline-flex items-center justify-center rounded-md border transition-all ${
            s.primary
              ? "bg-[#5865F2] border-[#5865F2] text-white hover:opacity-90 shadow-glow"
              : "border-border bg-card hover:bg-muted text-foreground"
          }`}
        >
          <s.icon className={ic} />
        </a>
      ))}
    </div>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.07.07 0 0 0-.073.035c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.249.07.07 0 0 0-.073-.035 19.74 19.74 0 0 0-3.76 1.169.06.06 0 0 0-.03.025C2.79 8.045 2.07 11.6 2.42 15.112a.08.08 0 0 0 .031.054 19.9 19.9 0 0 0 5.993 3.03.07.07 0 0 0 .077-.027 14.2 14.2 0 0 0 1.226-1.994.07.07 0 0 0-.038-.098 13.1 13.1 0 0 1-1.872-.892.07.07 0 0 1-.007-.118c.126-.094.252-.192.372-.291a.07.07 0 0 1 .073-.01c3.928 1.793 8.18 1.793 12.062 0a.07.07 0 0 1 .074.009c.12.099.246.198.373.292a.07.07 0 0 1-.006.118 12.3 12.3 0 0 1-1.873.892.07.07 0 0 0-.037.099c.36.698.772 1.362 1.225 1.993a.07.07 0 0 0 .078.028 19.84 19.84 0 0 0 6.002-3.03.08.08 0 0 0 .031-.053c.5-4.06-.838-7.584-3.548-10.718a.06.06 0 0 0-.03-.026ZM8.02 12.99c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.97 6.817H1.677l7.73-8.834L1.25 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}
