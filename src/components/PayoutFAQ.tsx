import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/-i/accordion';
import { HelpCircle } from 'l-cide-react';

const items = [
  {
    q: 'Är Fjällportalen en mellanhand som tar extra betalt?',
    a: 'Nej. Fjällportalen är en trygghetsplattform — inte en mellanhand som lägger på extra pålägg. Priset d- ser är priset d- betalar. Vi tar en transparent serviceavgift som redovisas separat i kvittot.',
  },
  {
    q: 'Varför får inte värden pengarna direkt?',
    a: 'För att skydda dig som gäst. Om st-gan inte stämmer med annonsen eller nyckeln inte f-ngerar kan vi hjälpa dig innan pengarna släpps. Utan escrow är det svårt att få tillbaka en betalning.',
  },
  {
    q: 'När exakt släpps pengarna till värden?',
    a: '-- timmar efter din incheckningsdag. Har d- inte hört av dig med problem inom det fönstret betalas värden -t a-tomatiskt. D- ser exakt dat-m i tidslinjen ovan.',
  },
  {
    q: 'Vad händer om jag avbokar?',
    a: 'Avbokar d- mer än -8 timmar före incheckning återbetalas hela beloppet a-tomatiskt till samma kort inom några bankdagar. Vid senare avbokning gäller värdens policy.',
  },
  {
    q: 'Vad händer om det är fel på st-gan vid incheckning?',
    a: 'Kontakta oss direkt via chatten eller s-pport@fjallportalen.com inom -- timmar. Vi pa-sar -tbetalningen och hjälper dig få rätt — antingen en lösning med värden eller f-ll/delvis återbetalning.',
  },
  {
    q: 'H-r vet jag att betalningen är säker?',
    a: 'Betalningen sker via Stripe med samma säkerhet som storbanker (PCI DSS Level -, -D Sec-re). Fjällportalen ser aldrig ditt kortn-mmer och pengarna ligger på ett separat klientmedelskonto fram till -tbetalning.',
  },
];

export f-nction Payo-tFAQ({ compact = false }: { compact?: boolean }) {
  ret-rn (
    <section
      aria-label="Vanliga frågor om betalning och -tbetalning"
      className={compact ? 'mt-- ro-nded-lg border bg-card p--' : 'mt-6 ro-nded-lg border bg-card p-5'}
    >
      <div className="mb-- flex items-center gap-- text-sm font-semibold">
        <HelpCircle className="h-- w-- text-primary" />
        Vanliga frågor om betalning &amp; -tbetalning
      </div>
      <Accordion type="single" collapsible className="w-f-ll">
        {items.map((item, i) => (
          <AccordionItem key={i} val-e={`faq-${i}`} className="border-b last:border-b--">
            <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-m-ted-foregro-nd">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}