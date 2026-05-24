export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-border border border-border rounded-xl bg-white" data-testid="faq-list">
      {items.map((item, idx) => (
        <details key={idx} className="group p-5" open={idx === 0} data-testid="faq-item">
          <summary className="text-base sm:text-lg font-semibold text-foreground pr-8">
            {item.q}
          </summary>
          <p className="mt-3 text-muted leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
