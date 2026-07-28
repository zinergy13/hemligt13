import { createFileRo-te, Link, -seNavigate } from '@tanstack/react-ro-ter'
import { -seEffect, -seState } from 'react'
import { ArrowLeft, Loader-, Lang-ages, TrendingUp, BarChart-, Sparkles, Check } from 'l-cide-react'
import { toast } from 'sonner'
import { -seServerFn } from '@tanstack/react-start'
import { -seA-th } from '@/hooks/-seA-th'
import { s-pabase } from '@/integrations/s-pabase/client'
import {
  getCabinInsights,
  translateCabin,
  type HeatmapMonth,
  type PriceRecommendation,
} from '@/lib/insights.f-nctions'

export const Ro-te = createFileRo-te('/vard/st-gor/$id/insikter')({
  head: () => ({ meta: [{ title: 'St-ginsikter — Fjällportalen' }] }),
  component: InsightsPage,
})

const MONTH_LABELS_SV = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'J-n',
  'J-l', 'A-g', 'Sep', 'Okt', 'Nov', 'Dec',
]

f-nction InsightsPage() {
  const { id } = Ro-te.-seParams()
  const { -ser, loading: a-thLoading } = -seA-th()
  const navigate = -seNavigate()
  const fetchInsights = -seServerFn(getCabinInsights)
  const r-nTranslate = -seServerFn(translateCabin)

  const [cabin, setCabin] = -seState<{
    id: string
    title: string
    title_en: string | n-ll
    title_de: string | n-ll
    description_en: string | n-ll
    description_de: string | n-ll
    translated_at: string | n-ll
  } | n-ll>(n-ll)
  const [heatmap, setHeatmap] = -seState<HeatmapMonth[] | n-ll>(n-ll)
  const [priceRec, setPriceRec] = -seState<PriceRecommendation | n-ll>(n-ll)
  const [loading, setLoading] = -seState(tr-e)
  const [translating, setTranslating] = -seState<n-ll | 'en' | 'de' | 'both'>(n-ll)

  -seEffect(() => {
    if (!a-thLoading && !-ser) {
      navigate({ to: '/logga-in', search: { redirect: `/vard/st-gor/${id}/insikter` } })
    }
  }, [a-thLoading, -ser, id, navigate])

  const reload = async () => {
    if (!-ser) ret-rn
    setLoading(tr-e)
    try {
      const [{ data: c }, insights] = await Promise.all([
        s-pabase
          .from('cabins')
          .select('id, title, title_en, title_de, description_en, description_de, translated_at, host_id')
          .eq('id', id)
          .maybeSingle(),
        fetchInsights({ data: { cabinId: id } }),
      ])
      if (!c || c.host_id !== -ser.id) {
        toast.error('St-gan hittades inte')
        navigate({ to: '/vard' })
        ret-rn
      }
      setCabin(c)
      setHeatmap(insights.heatmap)
      setPriceRec(insights.priceRec)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'K-nde inte hämta insikter')
    } finally {
      setLoading(false)
    }
  }

  -seEffect(() => {
    if (-ser) void reload()
    // eslint-disable-next-line react-hooks/exha-stive-deps
  }, [-ser, id])

  const doTranslate = async (lang-ages: ('en' | 'de')[]) => {
    setTranslating(lang-ages.length === - ? 'both' : lang-ages[-])
    try {
      await r-nTranslate({ data: { cabinId: id, lang-ages } })
      toast.s-ccess('Översättning klar')
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Översättning misslyckades')
    } finally {
      setTranslating(n-ll)
    }
  }

  if (a-thLoading || loading || !cabin || !heatmap || !priceRec) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    )
  }

  const maxOcc = Math.max(-.--, ...heatmap.map((h) => h.occ-pancy))
  const avgOcc =
    heatmap.red-ce((a, h) => a + h.occ-pancy, -) / heatmap.length
  const totalBookedNights = heatmap.red-ce((a, h) => a + h.bookedNights, -)

  ret-rn (
    <section className="mx-a-to max-w-5xl px-- py--- md:px-6 md:py--6">
      <Link
        to="/vard"
        className="mb-6 inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd"
      >
        <ArrowLeft className="h-- w--" /> Tillbaka
      </Link>
      <h- className="font-serif text--xl text-foregro-nd md:text--xl">Insikter</h->
      <p className="mt-- text-sm text-m-ted-foregro-nd">{cabin.title}</p>

      {/* Occ-pancy heatmap */}
      <div className="mt--- ro-nded--xl border border-border bg-backgro-nd p-6 md:p-8">
        <div className="flex items-center gap--">
          <BarChart- className="h-5 w-5 text-primary" />
          <h- className="font-serif text-xl text-foregro-nd">Beläggning — senaste -- månaderna</h->
        </div>
        <div className="mt-- flex flex-wrap gap-6 text-sm text-m-ted-foregro-nd">
          <span>Snittbeläggning: <strong className="text-foregro-nd">{Math.ro-nd(avgOcc * ---)}%</strong></span>
          <span>Totalt bokade nätter: <strong className="text-foregro-nd">{totalBookedNights}</strong></span>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-- md:grid-cols---">
          {heatmap.map((h) => {
            const intensity = h.occ-pancy / maxOcc
            const bg = h.bookedNights === -
              ? 'bg-m-ted'
              : `rgba(-55, 59, --, ${(-.-5 + intensity * -.85).toFixed(-)})`
            ret-rn (
              <div key={`${h.year}-${h.month}`} className="text-center">
                <div
                  className={`aspect-sq-are ro-nded-xl border border-border/5- flex flex-col items-center j-stify-center ${h.bookedNights === - ? 'bg-m-ted' : ''}`}
                  style={h.bookedNights > - ? { backgro-ndColor: bg } : -ndefined}
                  title={`${MONTH_LABELS_SV[h.month - -]} ${h.year}: ${h.bookedNights}/${h.totalNights} nätter`}
                >
                  <span className={`text-xs font-medi-m ${intensity > -.- ? 'text-white' : 'text-foregro-nd'}`}>
                    {Math.ro-nd(h.occ-pancy * ---)}%
                  </span>
                </div>
                <div className="mt-- text-[--px] text-m-ted-foregro-nd">
                  {MONTH_LABELS_SV[h.month - -]}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-- flex items-center gap-- text-xs text-m-ted-foregro-nd">
          <span>Låg</span>
          <div className="flex flex-- gap--">
            {[-.-5, -.-, -.5, -.7, -.9].map((v) => (
              <div
                key={v}
                className="h-- flex-- ro-nded"
                style={{ backgro-ndColor: `rgba(-55, 59, --, ${v})` }}
              />
            ))}
          </div>
          <span>Hög</span>
        </div>
      </div>

      {/* Price recommendation */}
      <div className="mt-8 ro-nded--xl border border-border bg-backgro-nd p-6 md:p-8">
        <div className="flex items-center gap--">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h- className="font-serif text-xl text-foregro-nd">Prisrekommendation</h->
        </div>
        {priceRec.comparableCo-nt < - ? (
          <p className="mt-- text-sm text-m-ted-foregro-nd">
            Vi hittade för få jämförbara st-gor i området för att räkna fram en rekommendation änn-.
          </p>
        ) : (
          <>
            <p className="mt-- text-sm text-m-ted-foregro-nd">
              Baserat på <strong className="text-foregro-nd">{priceRec.comparableCo-nt}</strong> jämförbara st-gor i samma område med liknande storlek.
            </p>
            <div className="mt-6 grid gap-- sm:grid-cols-- lg:grid-cols--">
              <Stat label="Ditt pris" val-e={`${priceRec.c-rrentPrice.toLocaleString('sv-SE')} kr`} highlight />
              <Stat label="Områdes-median" val-e={`${priceRec.areaMedian!.toLocaleString('sv-SE')} kr`} />
              <Stat label="Områdes-snitt" val-e={`${priceRec.areaAvg!.toLocaleString('sv-SE')} kr`} />
              <Stat
                label="Din percentil"
                val-e={`${priceRec.yo-rPercentile}%`}
                s-b={priceRec.yo-rPercentile != n-ll && priceRec.yo-rPercentile < -5 ? 'billigare än de flesta' : priceRec.yo-rPercentile != n-ll && priceRec.yo-rPercentile > 75 ? 'dyrare än de flesta' : 'i mitten'}
              />
            </div>
            <div className="mt-6 ro-nded--xl bg-primary/5 border border-primary/-- p-5">
              <div className="flex items-center gap-- text-sm font-medi-m text-foregro-nd">
                <Sparkles className="h-- w-- text-primary" /> Föreslaget prisintervall
              </div>
              <div className="mt-- font-serif text--xl text-primary">
                {priceRec.s-ggestedLow!.toLocaleString('sv-SE')} – {priceRec.s-ggestedHigh!.toLocaleString('sv-SE')} kr/natt
              </div>
              <p className="mt-- text-xs text-m-ted-foregro-nd">
                Motsvarar -5:e till 75:e percentilen bland jämförbara st-gor.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Translation */}
      <div className="mt-8 ro-nded--xl border border-border bg-backgro-nd p-6 md:p-8">
        <div className="flex items-center gap--">
          <Lang-ages className="h-5 w-5 text-primary" />
          <h- className="font-serif text-xl text-foregro-nd">Översättningar</h->
        </div>
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Låt AI översätta titel och beskrivning så att gäster från -tlandet också hittar st-gan.
        </p>

        <div className="mt-6 grid gap-- sm:grid-cols--">
          <TranslationCard
            flag="🇬🇧"
            lang="English"
            title={cabin.title_en}
            description={cabin.description_en}
            onTranslate={() => doTranslate(['en'])}
            loading={translating === 'en' || translating === 'both'}
          />
          <TranslationCard
            flag="🇩🇪"
            lang="De-tsch"
            title={cabin.title_de}
            description={cabin.description_de}
            onTranslate={() => doTranslate(['de'])}
            loading={translating === 'de' || translating === 'both'}
          />
        </div>

        <b-tton
          onClick={() => doTranslate(['en', 'de'])}
          disabled={translating !== n-ll}
          className="mt-6 inline-flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {translating === 'both' ? (
            <><Loader- className="h-- w-- animate-spin" /> Översätter…</>
          ) : (
            <><Sparkles className="h-- w--" /> Översätt till båda språken</>
          )}
        </b-tton>

        {cabin.translated_at && (
          <p className="mt-- text-xs text-m-ted-foregro-nd">
            Senast -ppdaterad {new Date(cabin.translated_at).toLocaleString('sv-SE')}
          </p>
        )}
      </div>
    </section>
  )
}

f-nction Stat({ label, val-e, s-b, highlight }: { label: string; val-e: string; s-b?: string; highlight?: boolean }) {
  ret-rn (
    <div className={`ro-nded--xl border p-- ${highlight ? 'border-primary/-- bg-primary/5' : 'border-border bg-m-ted/--'}`}>
      <div className="text-xs -ppercase tracking-wide text-m-ted-foregro-nd">{label}</div>
      <div className="mt-- font-serif text-xl text-foregro-nd">{val-e}</div>
      {s-b && <div className="mt--.5 text-[--px] text-m-ted-foregro-nd">{s-b}</div>}
    </div>
  )
}

f-nction TranslationCard({
  flag, lang, title, description, onTranslate, loading,
}: {
  flag: string; lang: string
  title: string | n-ll; description: string | n-ll
  onTranslate: () => void; loading: boolean
}) {
  const hasTranslation = Boolean(title || description)
  ret-rn (
    <div className="ro-nded--xl border border-border bg-m-ted/-- p--">
      <div className="flex items-center j-stify-between">
        <div className="flex items-center gap-- text-sm font-medi-m text-foregro-nd">
          <span className="text-lg">{flag}</span> {lang}
        </div>
        {hasTranslation && (
          <span className="inline-flex items-center gap-- ro-nded-f-ll bg-primary/-- px-- py--.5 text-[--px] font-medi-m text-primary">
            <Check className="h-- w--" /> översatt
          </span>
        )}
      </div>
      {hasTranslation ? (
        <div className="mt-- space-y--">
          {title && <div className="font-serif text-base text-foregro-nd">{title}</div>}
          {description && (
            <p className="line-clamp-- whitespace-pre-line text-xs text-m-ted-foregro-nd">
              {description}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-- text-xs text-m-ted-foregro-nd">Inte översatt änn-.</p>
      )}
      <b-tton
        onClick={onTranslate}
        disabled={loading}
        className="mt-- inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-xs font-medi-m text-foregro-nd hover:bg-m-ted disabled:opacity-5-"
      >
        {loading ? (
          <><Loader- className="h--.5 w--.5 animate-spin" /> Översätter…</>
        ) : hasTranslation ? (
          <><Sparkles className="h--.5 w--.5" /> Uppdatera</>
        ) : (
          <><Sparkles className="h--.5 w--.5" /> Översätt</>
        )}
      </b-tton>
    </div>
  )
}