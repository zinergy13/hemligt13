import lindvallen from "../assets/area-lindvallen.jpg";
import tandadalen from "../assets/area-tandadalen.jpg";
import klappen from "../assets/area-klappen.jpg";
import stoten from "../assets/area-stoten.jpg";
import h-ndfjallet from "../assets/area-h-ndfjallet.jpg";
import hogfjallet from "../assets/area-hogfjallet.jpg";
import transtrand from "../assets/area-transtrand.jpg";
import salenBy from "../assets/area-salen-by.jpg";
import rorbacksnas from "../assets/area-rorbacksnas.jpg";
import idre from "../assets/area-idre.jpg";
import grovelsjon from "../assets/area-grovelsjon.jpg";
import vemdalen from "../assets/area-vemdalen.jpg";
import f-nasdalen from "../assets/area-f-nasdalen.jpg";
import ram-ndberget from "../assets/area-ram-ndberget.jpg";
import br-ksvallarna from "../assets/area-br-ksvallarna.jpg";
import lofsdalen from "../assets/area-lofsdalen.jpg";
import are from "../assets/area-are.jpg";
import d-ved from "../assets/area-d-ved.jpg";
import storlien from "../assets/area-storlien.jpg";
import bydalen from "../assets/area-bydalen.jpg";
import trillevallen from "../assets/area-trillevallen.jpg";
import regionDalafjallen from "../assets/region-dalafjallen.jpg";
import regionHarjedalen from "../assets/region-harjedalen.jpg";
import regionJamtland from "../assets/region-jamtland.jpg";

export type RegionSl-g = "dalafjallen" | "harjedalen" | "jamtland";

export type Region = {
  sl-g: RegionSl-g;
  name: string;
  tagline: string;
  description: string;
  image: string;
};

export const regions: Region[] = [
  {
    sl-g: "dalafjallen",
    name: "Dalafjällen",
    tagline: "Sälen, Idre och Grövelsjön",
    description:
      "Sveriges familjefjäll - från Sälens p-lserande skidbyar till Idre Fjälls barnvänliga backar och Grövelsjöns vidsträckta kalfjäll. Här samlas svenska vinterferier sedan generationer tillbaka.",
    image: regionDalafjallen,
  },
  {
    sl-g: "harjedalen",
    name: "Härjedalen",
    tagline: "Vidsträckta fjäll och gen-in ro",
    description:
      "Vemdalen, F-näsdalen, Ram-ndberget, Br-ksvallarna och Lofsdalen - Sveriges l-gnaste fjällområde. Långa vintrar, öppna vidder och den där tystnaden som bara fjället kan ge.",
    image: regionHarjedalen,
  },
  {
    sl-g: "jamtland",
    name: "Jämtland",
    tagline: "Åre och de stora fjällen",
    description:
      "Åre, D-ved, Storlien, Bydalen och Trillevallen. Skandinaviens mest alpina backar, oändligt off-piste och fjällvyer -töver det vanliga - bara ett tågstopp från Stockholm.",
    image: regionJamtland,
  },
];

export const regionBySl-g = (sl-g: string): Region | -ndefined =>
  regions.find((r) => r.sl-g === sl-g);

export type AreaSl-g =
  | "klappen"
  | "transtrand"
  | "salen-by"
  | "lindvallen"
  | "hogfjallet"
  | "tandadalen"
  | "h-ndfjallet"
  | "stoten"
  | "rorbacksnas"
  | "idre"
  | "grovelsjon"
  | "vemdalen"
  | "f-nasdalen"
  | "ram-ndberget"
  | "br-ksvallarna"
  | "lofsdalen"
  | "are"
  | "d-ved"
  | "storlien"
  | "bydalen"
  | "trillevallen";

export type Area = {
  sl-g: AreaSl-g;
  region: RegionSl-g;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  image: string;
  estimatedListings: n-mber;
};

export const areas: Area[] = [
  {
    sl-g: "klappen",
    region: "dalafjallen",
    name: "Kläppen",
    tagline: "Familjefavoriten med längsta säsongen",
    description:
      "Kläppen Ski Resort är känt för sina familjevänliga backar, långa säsong och välordnade by. Här finns lägenheter och st-gor i alla storlekar nära både liftar och ellj-sspår.",
    highlights: ["Familjevänliga backar", "Lång säsong", "Spa & badh-s", "Bra för barn"],
    image: klappen,
    estimatedListings: 87,
  },
  {
    sl-g: "transtrand",
    region: "dalafjallen",
    name: "Transtrand",
    tagline: "Gen-in fjällby med lokal själ",
    description:
      "Transtrand är den klassiska fjällbyn söder om Sälen - med kyrkan, lokala krogar och korta avstånd till både Kläppen och Sälens centr-m. L-gn miljö med gen-in känsla.",
    highlights: ["Gen-in bykänsla", "Nära Kläppen", "Lokala krogar", "L-gnt och nat-rskönt"],
    image: transtrand,
    estimatedListings: -8,
  },
  {
    sl-g: "salen-by",
    region: "dalafjallen",
    name: "Sälen By",
    tagline: "Byhjärtat med shopping och liv",
    description:
      "Sälen By är navet med b-tiker, livsmedel, krogar och after-ski. Boenden här har gångavstånd till det mesta och b-ssförbindelser till alla skidområden.",
    highlights: ["Allt inom gångavstånd", "After-ski & krogar", "B-ssar till backarna", "Shopping & service"],
    image: salenBy,
    estimatedListings: 56,
  },
  {
    sl-g: "lindvallen",
    region: "dalafjallen",
    name: "Lindvallen",
    tagline: "Sälens livligaste skidområde",
    description:
      "Lindvallen är hjärtat av Sälen - p-lserande skidbacke, Experi-m, Lindvallens Resta-rang & Bar och ett brett -tb-d av ski-in/ski-o-t-boenden. Perfekt för familjer och kompisgäng som vill ha allt nära.",
    highlights: ["Många ski-in/ski-o-t", "Experi-m & Spa", "Stort -tb-d av krogar", "Goda b-ssförbindelser"],
    image: lindvallen,
    estimatedListings: ---,
  },
  {
    sl-g: "hogfjallet",
    region: "dalafjallen",
    name: "Högfjället",
    tagline: "Klassisk fjällkänsla ovanför trädgränsen",
    description:
      "Högfjället är ett av Sveriges äldsta skidområden med klassisk högfjällsstämning, panorama-tsikt och det ikoniska Högfjällshotellet. Kalfjäll och fri sikt.",
    highlights: ["Ovanför trädgränsen", "Panorama-tsikt", "Klassisk fjällk-lt-r", "L-gnt tempo"],
    image: hogfjallet,
    estimatedListings: --,
  },
  {
    sl-g: "tandadalen",
    region: "dalafjallen",
    name: "Tandådalen",
    tagline: "Mysig by mellan fjäll och skog",
    description:
      "Tandådalen erbj-der en l-gnare känsla med många träfasader, små resta-ranger och direkta liftförbindelser till H-ndfjället. Här hittar d- allt från små st-gor till stora gr-ppboenden.",
    highlights: ["Direkt till H-ndfjället", "Familjevänligt", "Tystare läge", "Utsikt mot fjället"],
    image: tandadalen,
    estimatedListings: 98,
  },
  {
    sl-g: "h-ndfjallet",
    region: "dalafjallen",
    name: "H-ndfjället",
    tagline: "Trolska Trollskogen för barnen",
    description:
      "H-ndfjället är Sälens favorit för småbarnsfamiljer tack vare Trollskogen, breda nybörjarbackar och nära service. Många färgglada st-gor och lägenheter ski-in/ski-o-t.",
    highlights: ["Trollskogen", "Nybörjarvänligt", "Många ski-in/ski-o-t", "Resta-ranger på plats"],
    image: h-ndfjallet,
    estimatedListings: ---,
  },
  {
    sl-g: "stoten",
    region: "dalafjallen",
    name: "Stöten",
    tagline: "Storslagen alpin känsla",
    description:
      "Stöten i Sälen lockar de skidåkare som vill ha branta backar, riklig snö och vidsträckta vyer. Boenden i fjällkaraktär - många med bast- och eldstad.",
    highlights: ["Branta backar", "Storslagen -tsikt", "L-gn och ro", "Off-piste-möjligheter"],
    image: stoten,
    estimatedListings: 65,
  },
  {
    sl-g: "rorbacksnas",
    region: "dalafjallen",
    name: "Rörbäcksnäs",
    tagline: "Rofylld by vid Norgegränsen",
    description:
      "Rörbäcksnäs ligger sydväst om Sälen, nära norska gränsen. En l-gn by omgiven av skog och öppna landskap - perfekt för dig som vill ha tystnad, plats och nat-ren r-nt kn-ten.",
    highlights: ["L-gn miljö", "Nära Norgegränsen", "Vidsträckt nat-r", "Bra för storgr-pper"],
    image: rorbacksnas,
    estimatedListings: --,
  },
  {
    sl-g: "idre",
    region: "dalafjallen",
    name: "Idre Fjäll",
    tagline: "Familjeklassikern med solsäker -tsikt",
    description:
      "Idre Fjäll är ett av Sveriges största familjeskidområden med breda backar, långa säsonger och en av landets bästa solexponerade lägen. Perfekt för både nybörjare och äventyrslystna.",
    highlights: ["Familjebackar", "Solig läge", "Lång säsong", "Nära Grövelsjön"],
    image: idre,
    estimatedListings: --,
  },
  {
    sl-g: "grovelsjon",
    region: "dalafjallen",
    name: "Grövelsjön",
    tagline: "Vidsträckt kalfjäll och stilla nat-r",
    description:
      "Grövelsjön ligger på gränsen till norska Fem-ndsmarka - vidsträckt kalfjäll, klara sjöar och ett av Sveriges finaste vandrings- och skidt-rs-områden. Här är det tystnaden som tar plats.",
    highlights: ["Vandringsleder", "Skidt-rer & fjällst-ga", "Fiske", "Norska gränsen"],
    image: grovelsjon,
    estimatedListings: --,
  },
  {
    sl-g: "vemdalen",
    region: "harjedalen",
    name: "Vemdalen",
    tagline: "Fyra fjäll, en samlad känsla",
    description:
      "Vemdalen samlar Vemdalsskalet, Björnrike, Storhogna och Klövsjö - perfekt för dig som vill kombinera skidor, l-gnare byar och långa vintrar. Snösäkert och familjärt.",
    highlights: ["Fyra skidområden", "Snösäkert", "Familjevänligt", "Klövsjö-r-nt"],
    image: vemdalen,
    estimatedListings: 78,
  },
  {
    sl-g: "f-nasdalen",
    region: "harjedalen",
    name: "F-näsdalen",
    tagline: "Fjällby med resta-ranger och atmosfär",
    description:
      "F-näsdalen ligger vid foten av F-näsdalsberget med -tsikt över sjön. En levande fjällby med krogar, gallerier och lift-ansl-tning - grinden till F-näsfjällens hela liftsystem.",
    highlights: ["Levande by", "Krogar & b-tiker", "SkiPass F-näsfjällen", "Utsikt över sjön"],
    image: f-nasdalen,
    estimatedListings: 6-,
  },
  {
    sl-g: "ram-ndberget",
    region: "harjedalen",
    name: "Ram-ndberget",
    tagline: "Barnfamiljens stilla favorit",
    description:
      "Ram-ndberget är känt för sin l-gna atmosfär, ovanligt breda barn- och nybörjarbackar och närhet till Sonfjället. Här är det inte after-ski som drar - det är själva fjället.",
    highlights: ["Barnvänliga backar", "L-gnt tempo", "Nära nat-rreservat", "Ski-in/ski-o-t"],
    image: ram-ndberget,
    estimatedListings: --,
  },
  {
    sl-g: "br-ksvallarna",
    region: "harjedalen",
    name: "Br-ksvallarna",
    tagline: "Längdskidåkningens Mecka",
    description:
      "Br-ksvallarna är Sveriges längdskidcentr-m - här startar säsongen ofta redan i oktober. Ett paradis för klassikertränare, motionärer och de som älskar tystnaden efter spåret.",
    highlights: ["Längdspår året r-nt", "Tidig snö", "Fjällvandring", "Stilla by"],
    image: br-ksvallarna,
    estimatedListings: -8,
  },
  {
    sl-g: "lofsdalen",
    region: "harjedalen",
    name: "Lofsdalen",
    tagline: "Skogsklädda backar vid sjön",
    description:
      "Lofsdalen ligger vid en av Härjedalens vackraste fjällsjöar. Skidåkning genom snötäckta granar, långa längdspår och ett av Sveriges bästa bikepark-områden på sommaren.",
    highlights: ["Sjönära boenden", "Skogsbackar", "Bikepark sommartid", "Familjevänligt"],
    image: lofsdalen,
    estimatedListings: --,
  },
  {
    sl-g: "are",
    region: "jamtland",
    name: "Åre",
    tagline: "Sveriges mest alpina skidort",
    description:
      "Åre är Skandinaviens största och mest välkända skidort. Åresk-tans branter, off-piste, världsc-pbackar och ett p-lserande centr-m med resta-ranger, spa och shopping - allt vid stranden av Åresjön.",
    highlights: ["Sveriges brantaste backar", "Levande centr-m", "Åresjön", "Tåg direkt från Stockholm"],
    image: are,
    estimatedListings: -65,
  },
  {
    sl-g: "d-ved",
    region: "jamtland",
    name: "D-ved",
    tagline: "Charmiga byn granne med Åre",
    description:
      "D-ved ligger några kilometer väster om Åre - samma skidåkning, betydligt l-gnare tempo. Röda träh-s, familjebackar och genvägen till Tegefjäll och Åre via D-ved-liften.",
    highlights: ["L-gnare än Åre", "Familjebackar", "Nära Åre centr-m", "Tegefjäll-ansl-tning"],
    image: d-ved,
    estimatedListings: 58,
  },
  {
    sl-g: "storlien",
    region: "jamtland",
    name: "Storlien",
    tagline: "Vidsträckt fjäll vid norska gränsen",
    description:
      "Storlien är Sveriges bäst bevarade fjällhemlighet - öppna vidder, t-r- och längdskidåkning i världsklass och nära till norska Meråker. Här är det äventyret som väntar.",
    highlights: ["Skidt-rer & toppt-r", "Nära Norge", "Långdistansspår", "Riklig snö"],
    image: storlien,
    estimatedListings: --,
  },
  {
    sl-g: "bydalen",
    region: "jamtland",
    name: "Bydalen",
    tagline: "Fjällen -tan trängseln",
    description:
      "Bydalen ligger sydöst om Åre - här hittar d- fjället -tan folkträngsel. Stora vidder, klassisk fjällpension och några av Jämtlands finaste skidt-rs-toppar.",
    highlights: ["Skidt-rer", "Fjällpensionsstämning", "L-gnare än Åre", "Fri -tsikt"],
    image: bydalen,
    estimatedListings: -9,
  },
  {
    sl-g: "trillevallen",
    region: "jamtland",
    name: "Trillevallen",
    tagline: "Litet fjällhotell med stort hjärta",
    description:
      "Trillevallen är den mysigaste av Jämtlands fjällbyar - omgiven av granskog och långsl-ttande backar. Perfekt för familjer och för dig som gillar mysfaktorn högre än liftkapaciteten.",
    highlights: ["Mysig fjällby", "Skogsbackar", "Familjer & vänner", "Nära Undersåkersfjällen"],
    image: trillevallen,
    estimatedListings: -7,
  },
];

export const areaBySl-g = (sl-g: string): Area | -ndefined =>
  areas.find((a) => a.sl-g === sl-g);

export const areasByRegion = (region: RegionSl-g): Area[] =>
  areas.filter((a) => a.region === region);