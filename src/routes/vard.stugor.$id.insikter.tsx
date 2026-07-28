import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2, Languages, TrendingUp, BarChart3, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useServerFn } from '@tanstack/react-start'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import {
  getCabinInsights,
  translateCabin,
  type HeatmapMonth,
  type PriceRecommendation,
} from '@/lib/insights.functions'

export const Route = createFileRoute('/vard/stugor/$id/insikter')({
  head: () => ({ meta: [{ title: 'Stuginsikter - Fjällportalen' }] }),
  component: InsightsPage,
})

const MONTH_LABELS_SV = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec',
]

function InsightsPage() {
  const { id } = Route.useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fetchInsights = useServerFn(getCabinInsights)
  const runTranslate = useServerFn(translateCabin)

  const [cabin, setCabin] = useState<{
    id: string
    title: string
    title_en: string | null
    title_de: string | null
    description_en: string | null
    description_de: string | null
    translated_at: string | null
  } | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapMonth[] | null>(null)
  const [priceRec, setPriceRec] = useState<PriceRecommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [translating, setTranslating] = useState<null | 'en' | 'de' | 'both'>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/logga-in', search: { redirect: `/vard/stugor/${id}/insikter` } })
    }
  }, [authLoading, user, id, navigate])

  const reload = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [{ data: c }, insights] = await Promise.all([
        supabase
          .from('cabins')
          .select('id, title, title_en, title_de, description_en, description_de, translated_at, host_id')
          .eq('id', id)
          .maybeSingle(),
        fetchInsights({ data: { cabinId: id } }),
      ])
      if (!c || c.host_id !== user.id) {
        toast.error('Stugan hittades inte')
        navigate({ to: '/vard' })
        return
      }
      setCabin(c)
      setHeatmap(insights.heatmap)
      setPriceRec(insights.priceRec)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kunde inte hämta insikter')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id])

  const doTranslate = async (languages: ('en' | 'de')[]) => {
    setTranslating(languages.length === 2 ? 'both' : languages[0])
    try {
      await runTranslate({ data: { cabinId: id, languages } })
      toast.success('Översättning klar')
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Översättning misslyckades')
    } finally {
      setTranslating(null)
    }
  }

  if (authLoading || loading || !cabin || !heatmap || !priceRec) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const maxOcc = Math.max(0.01, ...heatmap.map((h) => h.occupancy))
  const avgOcc =
    heatmap.reduce((a, h) => a + h.occupancy, 0) / heatmap.length
  const totalBookedNights = heatmap.reduce((a, h) => a + h.bookedNights, 0)

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
      <Link
        to="/vard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Tillbaka
      </Link>
      <h1 className="font-serif text-3xl text-foreground md:text-4xl">Insikter</h1>
      <p className="mt-1 text-sm text-muted-foreground">{cabin.title}</p>

      {/* Occupancy heatmap */}
      <div className="mt-10 rounded-3xl border border-border bg-background p-6 md:p-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Beläggning - senaste 12 månaderna</h2>
        </div>
        <div className="mt-2 flex flex-wrap gap-6 text-sm text-muted-foreground">
          <span>Snittbeläggning: <strong className="text-foreground">{Math.round(avgOcc * 100)}%</strong></span>
          <span>Totalt bokade nätter: <strong className="text-foreground">{totalBookedNights}</strong></span>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-2 md:grid-cols-12">
          {heatmap.map((h) => {
            const intensity = h.occupancy / maxOcc
            const bg = h.bookedNights === 0
              ? 'bg-muted'
              : `rgba(155, 59, 44, ${(0.15 + intensity * 0.85).toFixed(2)})`
            return (
              <div key={`${h.year}-${h.month}`} className="text-center">
                <div
                  className={`aspect-square rounded-xl border border-border/50 flex flex-col items-center justify-center ${h.bookedNights === 0 ? 'bg-muted' : ''}`}
                  style={h.bookedNights > 0 ? { backgroundColor: bg } : undefined}
                  title={`${MONTH_LABELS_SV[h.month - 1]} ${h.year}: ${h.bookedNights}/${h.totalNights} nätter`}
                >
                  <span className={`text-xs font-medium ${intensity > 0.4 ? 'text-white' : 'text-foreground'}`}>
                    {Math.round(h.occupancy * 100)}%
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  {MONTH_LABELS_SV[h.month - 1]}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Låg</span>
          <div className="flex flex-1 gap-1">
            {[0.15, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <div
                key={v}
                className="h-2 flex-1 rounded"
                style={{ backgroundColor: `rgba(155, 59, 44, ${v})` }}
              />
            ))}
          </div>
          <span>Hög</span>
        </div>
      </div>

      {/* Price recommendation */}
      <div className="mt-8 rounded-3xl border border-border bg-background p-6 md:p-8">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Prisrekommendation</h2>
        </div>
        {priceRec.comparableCount < 2 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Vi hittade för få jämförbara stugor i området för att räkna fram en rekommendation ännu.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Baserat på <strong className="text-foreground">{priceRec.comparableCount}</strong> jämförbara stugor i samma område med liknande storlek.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Ditt pris" value={`${priceRec.currentPrice.toLocaleString('sv-SE')} kr`} highlight />
              <Stat label="Områdes-median" value={`${priceRec.areaMedian!.toLocaleString('sv-SE')} kr`} />
              <Stat label="Områdes-snitt" value={`${priceRec.areaAvg!.toLocaleString('sv-SE')} kr`} />
              <Stat
                label="Din percentil"
                value={`${priceRec.yourPercentile}%`}
                sub={priceRec.yourPercentile != null && priceRec.yourPercentile < 25 ? 'billigare än de flesta' : priceRec.yourPercentile != null && priceRec.yourPercentile > 75 ? 'dyrare än de flesta' : 'i mitten'}
              />
            </div>
            <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/20 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Föreslaget prisintervall
              </div>
              <div className="mt-2 font-serif text-2xl text-primary">
                {priceRec.suggestedLow!.toLocaleString('sv-SE')} - {priceRec.suggestedHigh!.toLocaleString('sv-SE')} kr/natt
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Motsvarar 25:e till 75:e percentilen bland jämförbara stugor.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Translation */}
      <div className="mt-8 rounded-3xl border border-border bg-background p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl text-foreground">Översättningar</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Låt AI översätta titel och beskrivning så att gäster från utlandet också hittar stugan.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
            lang="Deutsch"
            title={cabin.title_de}
            description={cabin.description_de}
            onTranslate={() => doTranslate(['de'])}
            loading={translating === 'de' || translating === 'both'}
          />
        </div>

        <button
          onClick={() => doTranslate(['en', 'de'])}
          disabled={translating !== null}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {translating === 'both' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Översätter…</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Översätt till båda språken</>
          )}
        </button>

        {cabin.translated_at && (
          <p className="mt-3 text-xs text-muted-foreground">
            Senast uppdaterad {new Date(cabin.translated_at).toLocaleString('sv-SE')}
          </p>
        )}
      </div>
    </section>
  )
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted/20'}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-serif text-xl text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function TranslationCard({
  flag, lang, title, description, onTranslate, loading,
}: {
  flag: string; lang: string
  title: string | null; description: string | null
  onTranslate: () => void; loading: boolean
}) {
  const hasTranslation = Boolean(title || description)
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-lg">{flag}</span> {lang}
        </div>
        {hasTranslation && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <Check className="h-3 w-3" /> översatt
          </span>
        )}
      </div>
      {hasTranslation ? (
        <div className="mt-3 space-y-2">
          {title && <div className="font-serif text-base text-foreground">{title}</div>}
          {description && (
            <p className="line-clamp-4 whitespace-pre-line text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Inte översatt ännu.</p>
      )}
      <button
        onClick={onTranslate}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Översätter…</>
        ) : hasTranslation ? (
          <><Sparkles className="h-3.5 w-3.5" /> Uppdatera</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5" /> Översätt</>
        )}
      </button>
    </div>
  )
}