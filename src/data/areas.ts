import lindvallen from "../assets/area-lindvallen.jpg";
import tandadalen from "../assets/area-tandadalen.jpg";
import klappen from "../assets/area-klappen.jpg";
import stoten from "../assets/area-stoten.jpg";
import hundfjallet from "../assets/area-hundfjallet.jpg";
import hogfjallet from "../assets/area-hogfjallet.jpg";
import transtrand from "../assets/area-transtrand.jpg";
import salenBy from "../assets/area-salen-by.jpg";
import rorbacksnas from "../assets/area-rorbacksnas.jpg";

export type AreaSlug =
  | "klappen"
  | "transtrand"
  | "salen-by"
  | "lindvallen"
  | "hogfjallet"
  | "tandadalen"
  | "hundfjallet"
  | "stoten"
  | "rorbacksnas";

export type Area = {
  slug: AreaSlug;
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
    name: "Rörbäcksnäs",
    tagline: "Rofylld by vid Norgegränsen",
    description:
      "Rörbäcksnäs ligger sydväst om Sälen, nära norska gränsen. En lugn by omgiven av skog och öppna landskap — perfekt för dig som vill ha tystnad, plats och naturen runt knuten.",
    highlights: ["Lugn miljö", "Nära Norgegränsen", "Vidsträckt natur", "Bra för storgrupper"],
    image: rorbacksnas,
    estimatedListings: 22,
  },
];

export const areaBySlug = (slug: string): Area | undefined =>
  areas.find((a) => a.slug === slug);