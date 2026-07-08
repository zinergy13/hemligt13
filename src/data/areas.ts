import lindvallen from "../assets/area-lindvallen.jpg";
import tandadalen from "../assets/area-tandadalen.jpg";
import klappen from "../assets/area-klappen.jpg";
import stoten from "../assets/area-stoten.jpg";
import hundfjallet from "../assets/area-hundfjallet.jpg";
import hogfjallet from "../assets/area-hogfjallet.jpg";
import transtrand from "../assets/area-transtrand.jpg";
import salenBy from "../assets/area-salen-by.jpg";
import rorbacksnas from "../assets/area-rorbacksnas.jpg";
import idre from "../assets/area-idre.jpg";
import grovelsjon from "../assets/area-grovelsjon.jpg";
import vemdalen from "../assets/area-vemdalen.jpg";
import funasdalen from "../assets/area-funasdalen.jpg";
import ramundberget from "../assets/area-ramundberget.jpg";
import bruksvallarna from "../assets/area-bruksvallarna.jpg";
import lofsdalen from "../assets/area-lofsdalen.jpg";
import are from "../assets/area-are.jpg";
import duved from "../assets/area-duved.jpg";
import storlien from "../assets/area-storlien.jpg";
import bydalen from "../assets/area-bydalen.jpg";
import trillevallen from "../assets/area-trillevallen.jpg";
import regionDalafjallen from "../assets/region-dalafjallen.jpg";
import regionHarjedalen from "../assets/region-harjedalen.jpg";
import regionJamtland from "../assets/region-jamtland.jpg";

export type RegionSlug = "dalafjallen" | "harjedalen" | "jamtland";

export type Region = {
  slug: RegionSlug;
  name: string;
  tagline: string;
  description: string;
  image: string;
};

export const regions: Region[] = [
  {
    slug: "dalafjallen",
    name: "Dalafjällen",
    tagline: "Sälen, Idre och Grövelsjön",
    description:
      "Sveriges familjefjäll — från Sälens pulserande skidbyar till Idre Fjälls barnvänliga backar och Grövelsjöns vidsträckta kalfjäll. Här samlas svenska vinterferier sedan generationer tillbaka.",
    image: regionDalafjallen,
  },
  {
    slug: "harjedalen",
    name: "Härjedalen",
    tagline: "Vidsträckta fjäll och genuin ro",
    description:
      "Vemdalen, Funäsdalen, Ramundberget, Bruksvallarna och Lofsdalen — Sveriges lugnaste fjällområde. Långa vintrar, öppna vidder och den där tystnaden som bara fjället kan ge.",
    image: regionHarjedalen,
  },
  {
    slug: "jamtland",
    name: "Jämtland",
    tagline: "Åre och de stora fjällen",
    description:
      "Åre, Duved, Storlien, Bydalen och Trillevallen. Skandinaviens mest alpina backar, oändligt off-piste och fjällvyer utöver det vanliga — bara ett tågstopp från Stockholm.",
    image: regionJamtland,
  },
];

export const regionBySlug = (slug: string): Region | undefined =>
  regions.find((r) => r.slug === slug);

export type AreaSlug =
  | "klappen"
  | "transtrand"
  | "salen-by"
  | "lindvallen"
  | "hogfjallet"
  | "tandadalen"
  | "hundfjallet"
  | "stoten"
  | "rorbacksnas"
  | "idre"
  | "grovelsjon"
  | "vemdalen"
  | "funasdalen"
  | "ramundberget"
  | "bruksvallarna"
  | "lofsdalen"
  | "are"
  | "duved"
  | "storlien"
  | "bydalen"
  | "trillevallen";

export type Area = {
  slug: AreaSlug;
  region: RegionSlug;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
  estimatedListings: number;
};

export const areas: Area[] = [
  {
    slug: "klappen",
    region: "dalafjallen",
    name: "Kläppen",
    tagline: "Familjefavoriten med längsta säsongen",
    description:
      "Kläppen Ski Resort är känt för sina familjevänliga backar, långa säsong och välordnade by. Här finns lägenheter och stugor i alla storlekar nära både liftar och elljusspår.",
    highlights: ["Familjevänliga backar", "Lång säsong", "Spa & badhus", "Bra för barn"],
    image: klappen,
    estimatedListings: 87,
  },
  {
    slug: "transtrand",
    region: "dalafjallen",
    name: "Transtrand",
    tagline: "Genuin fjällby med lokal själ",
    description:
      "Transtrand är den klassiska fjällbyn söder om Sälen — med kyrkan, lokala krogar och korta avstånd till både Kläppen och Sälens centrum. Lugn miljö med genuin känsla.",
    highlights: ["Genuin bykänsla", "Nära Kläppen", "Lokala krogar", "Lugnt och naturskönt"],
    image: transtrand,
    estimatedListings: 48,
  },
  {
    slug: "salen-by",
    region: "dalafjallen",
    name: "Sälen By",
    tagline: "Byhjärtat med shopping och liv",
    description:
      "Sälen By är navet med butiker, livsmedel, krogar och after-ski. Boenden här har gångavstånd till det mesta och bussförbindelser till alla skidområden.",
    highlights: ["Allt inom gångavstånd", "After-ski & krogar", "Bussar till backarna", "Shopping & service"],
    image: salenBy,
    estimatedListings: 56,
  },
  {
    slug: "lindvallen",
    region: "dalafjallen",
    name: "Lindvallen",
    tagline: "Sälens livligaste skidområde",
    description:
      "Lindvallen är hjärtat av Sälen — pulserande skidbacke, Experium, Lindvallens Restaurang & Bar och ett brett utbud av ski-in/ski-out-boenden. Perfekt för familjer och kompisgäng som vill ha allt nära.",
    highlights: ["Många ski-in/ski-out", "Experium & Spa", "Stort utbud av krogar", "Goda bussförbindelser"],
    image: lindvallen,
    estimatedListings: 142,
  },
  {
    slug: "hogfjallet",
    region: "dalafjallen",
    name: "Högfjället",
    tagline: "Klassisk fjällkänsla ovanför trädgränsen",
    description:
      "Högfjället är ett av Sveriges äldsta skidområden med klassisk högfjällsstämning, panoramautsikt och det ikoniska Högfjällshotellet. Kalfjäll och fri sikt.",
    highlights: ["Ovanför trädgränsen", "Panoramautsikt", "Klassisk fjällkultur", "Lugnt tempo"],
    image: hogfjallet,
    estimatedListings: 42,
  },
  {
    slug: "tandadalen",
    region: "dalafjallen",
    name: "Tandådalen",
    tagline: "Mysig by mellan fjäll och skog",
    description:
      "Tandådalen erbjuder en lugnare känsla med många träfasader, små restauranger och direkta liftförbindelser till Hundfjället. Här hittar du allt från små stugor till stora gruppboenden.",
    highlights: ["Direkt till Hundfjället", "Familjevänligt", "Tystare läge", "Utsikt mot fjället"],
    image: tandadalen,
    estimatedListings: 98,
  },
  {
    slug: "hundfjallet",
    region: "dalafjallen",
    name: "Hundfjället",
    tagline: "Trolska Trollskogen för barnen",
    description:
      "Hundfjället är Sälens favorit för småbarnsfamiljer tack vare Trollskogen, breda nybörjarbackar och nära service. Många färgglada stugor och lägenheter ski-in/ski-out.",
    highlights: ["Trollskogen", "Nybörjarvänligt", "Många ski-in/ski-out", "Restauranger på plats"],
    image: hundfjallet,
    estimatedListings: 110,
  },
  {
    slug: "stoten",
    region: "dalafjallen",
    name: "Stöten",
    tagline: "Storslagen alpin känsla",
    description:
      "Stöten i Sälen lockar de skidåkare som vill ha branta backar, riklig snö och vidsträckta vyer. Boenden i fjällkaraktär — många med bastu och eldstad.",
    highlights: ["Branta backar", "Storslagen utsikt", "Lugn och ro", "Off-piste-möjligheter"],
    image: stoten,
    estimatedListings: 65,
  },
  {
    slug: "rorbacksnas",
    region: "dalafjallen",
    name: "Rörbäcksnäs",
    tagline: "Rofylld by vid Norgegränsen",
    description:
      "Rörbäcksnäs ligger sydväst om Sälen, nära norska gränsen. En lugn by omgiven av skog och öppna landskap — perfekt för dig som vill ha tystnad, plats och naturen runt knuten.",
    highlights: ["Lugn miljö", "Nära Norgegränsen", "Vidsträckt natur", "Bra för storgrupper"],
    image: rorbacksnas,
    estimatedListings: 22,
  },
  {
    slug: "idre",
    region: "dalafjallen",
    name: "Idre Fjäll",
    tagline: "Familjeklassikern med solsäker utsikt",
    description:
      "Idre Fjäll är ett av Sveriges största familjeskidområden med breda backar, långa säsonger och en av landets bästa solexponerade lägen. Perfekt för både nybörjare och äventyrslystna.",
    highlights: ["Familjebackar", "Solig läge", "Lång säsong", "Nära Grövelsjön"],
    image: idre,
    estimatedListings: 34,
  },
  {
    slug: "grovelsjon",
    region: "dalafjallen",
    name: "Grövelsjön",
    tagline: "Vidsträckt kalfjäll och stilla natur",
    description:
      "Grövelsjön ligger på gränsen till norska Femundsmarka — vidsträckt kalfjäll, klara sjöar och ett av Sveriges finaste vandrings- och skidturs-områden. Här är det tystnaden som tar plats.",
    highlights: ["Vandringsleder", "Skidturer & fjällstuga", "Fiske", "Norska gränsen"],
    image: grovelsjon,
    estimatedListings: 14,
  },
  {
    slug: "vemdalen",
    region: "harjedalen",
    name: "Vemdalen",
    tagline: "Fyra fjäll, en samlad känsla",
    description:
      "Vemdalen samlar Vemdalsskalet, Björnrike, Storhogna och Klövsjö — perfekt för dig som vill kombinera skidor, lugnare byar och långa vintrar. Snösäkert och familjärt.",
    highlights: ["Fyra skidområden", "Snösäkert", "Familjevänligt", "Klövsjö-runt"],
    image: vemdalen,
    estimatedListings: 78,
  },
  {
    slug: "funasdalen",
    region: "harjedalen",
    name: "Funäsdalen",
    tagline: "Fjällby med restauranger och atmosfär",
    description:
      "Funäsdalen ligger vid foten av Funäsdalsberget med utsikt över sjön. En levande fjällby med krogar, gallerier och lift-anslutning — grinden till Funäsfjällens hela liftsystem.",
    highlights: ["Levande by", "Krogar & butiker", "SkiPass Funäsfjällen", "Utsikt över sjön"],
    image: funasdalen,
    estimatedListings: 62,
  },
  {
    slug: "ramundberget",
    region: "harjedalen",
    name: "Ramundberget",
    tagline: "Barnfamiljens stilla favorit",
    description:
      "Ramundberget är känt för sin lugna atmosfär, ovanligt breda barn- och nybörjarbackar och närhet till Sonfjället. Här är det inte after-ski som drar — det är själva fjället.",
    highlights: ["Barnvänliga backar", "Lugnt tempo", "Nära naturreservat", "Ski-in/ski-out"],
    image: ramundberget,
    estimatedListings: 41,
  },
  {
    slug: "bruksvallarna",
    region: "harjedalen",
    name: "Bruksvallarna",
    tagline: "Längdskidåkningens Mecka",
    description:
      "Bruksvallarna är Sveriges längdskidcentrum — här startar säsongen ofta redan i oktober. Ett paradis för klassikertränare, motionärer och de som älskar tystnaden efter spåret.",
    highlights: ["Längdspår året runt", "Tidig snö", "Fjällvandring", "Stilla by"],
    image: bruksvallarna,
    estimatedListings: 28,
  },
  {
    slug: "lofsdalen",
    region: "harjedalen",
    name: "Lofsdalen",
    tagline: "Skogsklädda backar vid sjön",
    description:
      "Lofsdalen ligger vid en av Härjedalens vackraste fjällsjöar. Skidåkning genom snötäckta granar, långa längdspår och ett av Sveriges bästa bikepark-områden på sommaren.",
    highlights: ["Sjönära boenden", "Skogsbackar", "Bikepark sommartid", "Familjevänligt"],
    image: lofsdalen,
    estimatedListings: 33,
  },
  {
    slug: "are",
    region: "jamtland",
    name: "Åre",
    tagline: "Sveriges mest alpina skidort",
    description:
      "Åre är Skandinaviens största och mest välkända skidort. Åreskutans branter, off-piste, världscupbackar och ett pulserande centrum med restauranger, spa och shopping — allt vid stranden av Åresjön.",
    highlights: ["Sveriges brantaste backar", "Levande centrum", "Åresjön", "Tåg direkt från Stockholm"],
    image: are,
    estimatedListings: 165,
  },
  {
    slug: "duved",
    region: "jamtland",
    name: "Duved",
    tagline: "Charmiga byn granne med Åre",
    description:
      "Duved ligger några kilometer väster om Åre — samma skidåkning, betydligt lugnare tempo. Röda trähus, familjebackar och genvägen till Tegefjäll och Åre via Duved-liften.",
    highlights: ["Lugnare än Åre", "Familjebackar", "Nära Åre centrum", "Tegefjäll-anslutning"],
    image: duved,
    estimatedListings: 58,
  },
  {
    slug: "storlien",
    region: "jamtland",
    name: "Storlien",
    tagline: "Vidsträckt fjäll vid norska gränsen",
    description:
      "Storlien är Sveriges bäst bevarade fjällhemlighet — öppna vidder, tur- och längdskidåkning i världsklass och nära till norska Meråker. Här är det äventyret som väntar.",
    highlights: ["Skidturer & topptur", "Nära Norge", "Långdistansspår", "Riklig snö"],
    image: storlien,
    estimatedListings: 24,
  },
  {
    slug: "bydalen",
    region: "jamtland",
    name: "Bydalen",
    tagline: "Fjällen utan trängseln",
    description:
      "Bydalen ligger sydöst om Åre — här hittar du fjället utan folkträngsel. Stora vidder, klassisk fjällpension och några av Jämtlands finaste skidturs-toppar.",
    highlights: ["Skidturer", "Fjällpensionsstämning", "Lugnare än Åre", "Fri utsikt"],
    image: bydalen,
    estimatedListings: 19,
  },
  {
    slug: "trillevallen",
    region: "jamtland",
    name: "Trillevallen",
    tagline: "Litet fjällhotell med stort hjärta",
    description:
      "Trillevallen är den mysigaste av Jämtlands fjällbyar — omgiven av granskog och långsluttande backar. Perfekt för familjer och för dig som gillar mysfaktorn högre än liftkapaciteten.",
    highlights: ["Mysig fjällby", "Skogsbackar", "Familjer & vänner", "Nära Undersåkersfjällen"],
    image: trillevallen,
    estimatedListings: 17,
  },
];

export const areaBySlug = (slug: string): Area | undefined =>
  areas.find((a) => a.slug === slug);

export const areasByRegion = (region: RegionSlug): Area[] =>
  areas.filter((a) => a.region === region);