import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const items = [
  {
    q: 'Är Fjällportalen en mellanhand som tar extra betalt?',
    a: 'Nej. Fjällportalen är en trygghetsplattform — inte en mellanhand som lägger på extra pålägg. Priset du ser är priset du betalar. Vi tar en transparent serviceavgift som redovisas separat i kvittot.',
  },
  {
    q: 'Varför får inte värden pengarna direkt?',
    a: 'För att skydda dig som gäst. Om stugan inte stämmer med annonsen eller nyckeln inte fungerar kan vi hjälpa dig innan pengarna släpps. Utan escrow är det svårt att få tillbaka en betalning.',
  },
  {
    q: 'När exakt släpps pengarna till värden?',
    a: '24 timmar efter din incheckningsdag. Har du inte hört av dig med problem inom det fönstret betalas värden ut automatiskt. Du ser exakt datum i tidslinjen ovan.',
  },
  {
    q: 'Vad händer om jag avbokar?',
    a: 'Avbokar du mer än 48 timmar före incheckning återbetalas hela beloppet automatiskt till samma kort inom några bankdagar. Vid senare avbokning gäller värdens policy.',
  },
  {
    q: 'Vad händer om det är fel på stugan vid incheckning?',
    a: 'Kontakta oss direkt via chatten eller support@fjallportalen.com inom 24 timmar. Vi pausar utbetalningen och hjälper dig få rätt — antingen en lösning med värden eller full/delvis återbetalning.',
  },
  {
    q: 'Hur vet jag att betalningen är säker?',
    a: 'Betalningen sker via Stripe med samma säkerhet som storbanker (PCI DSS Level 1, 3D Secure). Fjällportalen ser aldrig ditt kortnummer och pengarna ligger på ett separat klientmedelskonto fram till utbetalning.',
  },
];

export function PayoutFAQ({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-label="Vanliga frågor om betalning och utbetalning"
      className={compact ? 'mt-4 rounded-lg border bg-card p-4' : 'mt-6 rounded-lg border bg-card p-5'}
    >
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <HelpCircle className="h-4 w-4 text-primary" />
        Vanliga frågor om betalning &amp; utbetalning
      </div>
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-b-0">
            <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}