interface Props {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-hero)" }}>
      <div className="container mx-auto px-4 py-16 md:py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-brand to-brand-glow bg-clip-text text-transparent">{title}</span>
        </h1>
        {subtitle && <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
      </div>
    </section>
  );
}
