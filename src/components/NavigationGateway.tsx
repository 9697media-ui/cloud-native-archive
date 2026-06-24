import { icons } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface NavigationOption {
  id: string;
  /** Nome do ícone Lucide (ex: "Users", "GraduationCap") */
  icon: keyof typeof icons;
  /** Cor do ícone (qualquer valor CSS válido) */
  iconColor: string;
  cardLabel: string;
  pillText: string;
  link: string;
}

export interface NavigationGatewayProps extends ComponentProps<"section"> {
  backgroundImage?: string;
  title: string;
  subtitle?: string;
  options: NavigationOption[];
  /** Texto do botão flutuante lateral. Omitir para esconder. */
  stickyLabel?: string;
  stickyLink?: string;
}

interface ActionCardProps {
  option: NavigationOption;
}

function ActionCard({ option }: ActionCardProps) {
  const LucideIcon = icons[option.icon];

  return (
    <div className="flex flex-col items-center gap-3">
      <a
        href={option.link}
        className={cn(
          "group flex h-44 w-44 flex-col items-center justify-center gap-4 rounded-3xl",
          "bg-white shadow-lg transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-xl focus-visible:-translate-y-1",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        )}
        aria-label={option.cardLabel}
      >
        {LucideIcon ? (
          <LucideIcon size={56} color={option.iconColor} strokeWidth={1.75} />
        ) : null}
        <span className="text-lg font-bold text-slate-800">{option.cardLabel}</span>
      </a>

      <span className="rounded-full bg-white/20 px-4 py-1 text-center text-xs font-medium text-white backdrop-blur-sm">
        {option.pillText}
      </span>
    </div>
  );
}

export function NavigationGateway({
  backgroundImage,
  title,
  subtitle,
  options,
  stickyLabel,
  stickyLink = "#",
  className,
  style,
  ...rest
}: NavigationGatewayProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-[600px] w-full items-center justify-center overflow-hidden bg-slate-900 bg-cover bg-center px-6 py-16",
        className
      )}
      style={{
        ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}),
        ...style,
      }}
      {...rest}
    >
      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
        <header className="mb-12 space-y-3">
          <h1 className="text-3xl font-bold text-white md:text-5xl">{title}</h1>
          {subtitle ? (
            <p className="text-base text-white/80 md:text-lg">{subtitle}</p>
          ) : null}
        </header>

        <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-start">
          {options.map((option) => (
            <ActionCard key={option.id} option={option} />
          ))}
        </div>
      </div>

      {/* Botão fixo lateral opcional */}
      {stickyLabel ? (
        <a
          href={stickyLink}
          className={cn(
            "fixed bottom-24 right-0 z-20 origin-bottom-right -rotate-90 rounded-t-lg",
            "bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg",
            "transition-colors hover:bg-primary/90"
          )}
        >
          {stickyLabel}
        </a>
      ) : null}
    </section>
  );
}

/** Dados mockados para demonstração do visual de referência. */
export const navigationGatewayDemoProps: NavigationGatewayProps = {
  title: "Bem-vindo",
  subtitle: "Escolha por onde deseja começar",
  options: [
    {
      id: "social",
      icon: "Users",
      iconColor: "#14b8a6",
      cardLabel: "Social",
      pillText: "Associação Nazarena",
      link: "#social",
    },
    {
      id: "educacao",
      icon: "GraduationCap",
      iconColor: "#eab308",
      cardLabel: "Educação",
      pillText: "Grupo de Oração",
      link: "#educacao",
    },
  ],
  stickyLabel: "Quero ajudar",
  stickyLink: "#ajudar",
};

export default NavigationGateway;
