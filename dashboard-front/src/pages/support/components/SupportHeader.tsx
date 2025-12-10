// src/pages/support/components/SupportHeader.tsx

interface SupportHeaderProps {
    title?: string;
    subtitle?: string;
}

export function SupportHeader({
    title = "Customer Support",
    subtitle = "Get help, report issues, or request new features",
}: SupportHeaderProps) {
    return (
        <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-blue-700">
                {title.split(" ").map((word, i) =>
                    i === 1 ? (
                        <span key={i} className="text-sky-500">{word}</span>
                    ) : (
                        <span key={i}>{word} </span>
                    )
                )}
            </h1>
            <p className="text-sm text-muted-foreground">
                {subtitle}
            </p>
        </section>
    );
}
