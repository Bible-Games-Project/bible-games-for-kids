import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSettings } from "@/lib/i18n";

// Privacy policy, linked from Settings and used as the privacy URL in the
// App Store and Google Play listings (https://<site>/privacy).
// Keep it true to the code: the game collects nothing, has no ads, no
// analytics, no accounts and no purchases, and makes no network requests.
// If any of that changes (in-app purchases, analytics...), update this page.

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Bibledoo · Privacy policy" }] }),
  component: PrivacyPage,
});

type PolicyLang = "en" | "es" | "ca";

const UPDATED = "2026-11-24";

const POLICY: Record<
  PolicyLang,
  { name: string; title: string; updated: string; back: string; sections: [string, string][] }
> = {
  en: {
    name: "English",
    title: "Privacy policy",
    updated: "Last updated",
    back: "Back to the game",
    sections: [
      [
        "Who we are",
        "Bibledoo is a game of Bible stories for children, made by the Bible Games Project. This policy explains what happens to your information when you or your child play it.",
      ],
      [
        "We do not collect any data",
        "Bibledoo does not collect, store on our servers, share or sell any personal information. There are no accounts, no sign-in, no names, no email addresses, no photos and no location. The game does not use the camera or the microphone.",
      ],
      [
        "No ads, no tracking",
        "The game shows no advertising and contains no analytics, tracking or third-party data collection tools. It does not follow children across other apps or websites.",
      ],
      [
        "What stays on the device",
        "To let children continue where they left off, the game saves a few things only on the device itself: the chosen language, the sound setting, finished puzzles, drawings in the coloring game and game progress. This information never leaves the device. Deleting the app removes it completely.",
      ],
      [
        "Internet",
        "Everything the game needs (pictures, music and sounds) comes inside the app, so it works without an internet connection and does not send anything over the internet.",
      ],
      [
        "Purchases and links",
        "The game is free and has no in-app purchases and no links to other apps, websites or social networks.",
      ],
      [
        "Children",
        "Bibledoo is made for children and follows the rules for children's apps, such as the US Children's Online Privacy Protection Act (COPPA) and the EU General Data Protection Regulation (GDPR): because no personal information is collected, there is nothing to review, export or delete.",
      ],
      [
        "Changes",
        "If a future version of the game changes any of this (for example, by adding optional purchases), we will update this page before that version is released and change the date at the top.",
      ],
      [
        "Contact",
        "If you have any question about this policy, write to us using the developer contact shown on the game's page in the App Store or Google Play.",
      ],
    ],
  },
  es: {
    name: "Español",
    title: "Política de privacidad",
    updated: "Última actualización",
    back: "Volver al juego",
    sections: [
      [
        "Quiénes somos",
        "Bibledoo es un juego de historias de la Biblia para niños, creado por Bible Games Project. Esta política explica qué pasa con tu información cuando tú o tus hijos juegan.",
      ],
      [
        "No recogemos ningún dato",
        "Bibledoo no recoge, no guarda en nuestros servidores, no comparte y no vende ninguna información personal. No hay cuentas, ni inicio de sesión, ni nombres, ni correos electrónicos, ni fotos, ni ubicación. El juego no usa la cámara ni el micrófono.",
      ],
      [
        "Sin anuncios ni seguimiento",
        "El juego no muestra publicidad y no contiene herramientas de analítica, seguimiento ni recogida de datos de terceros. No sigue a los niños por otras apps o webs.",
      ],
      [
        "Lo que se queda en el dispositivo",
        "Para que los niños puedan seguir donde lo dejaron, el juego guarda algunas cosas solo en el propio dispositivo: el idioma elegido, el ajuste del sonido, los puzles terminados, los dibujos del juego de colorear y el progreso de las partidas. Esta información nunca sale del dispositivo. Al borrar la app se elimina por completo.",
      ],
      [
        "Internet",
        "Todo lo que el juego necesita (dibujos, música y sonidos) viene dentro de la app, así que funciona sin conexión a internet y no envía nada por internet.",
      ],
      [
        "Compras y enlaces",
        "El juego es gratuito y no tiene compras dentro de la app ni enlaces a otras apps, webs o redes sociales.",
      ],
      [
        "Niños",
        "Bibledoo está hecho para niños y cumple las normas para apps infantiles, como la ley COPPA de Estados Unidos y el Reglamento General de Protección de Datos (RGPD) de la UE: como no se recoge ninguna información personal, no hay nada que consultar, exportar ni borrar.",
      ],
      [
        "Cambios",
        "Si una versión futura del juego cambia algo de esto (por ejemplo, al añadir compras opcionales), actualizaremos esta página antes de publicar esa versión y cambiaremos la fecha de arriba.",
      ],
      [
        "Contacto",
        "Si tienes cualquier pregunta sobre esta política, escríbenos al contacto del desarrollador que aparece en la página del juego en el App Store o en Google Play.",
      ],
    ],
  },
  ca: {
    name: "Català",
    title: "Política de privadesa",
    updated: "Darrera actualització",
    back: "Tornar al joc",
    sections: [
      [
        "Qui som",
        "Bibledoo és un joc d'històries de la Bíblia per a infants, creat per Bible Games Project. Aquesta política explica què passa amb la teva informació quan tu o els teus fills hi jugueu.",
      ],
      [
        "No recollim cap dada",
        "Bibledoo no recull, no desa als nostres servidors, no comparteix i no ven cap informació personal. No hi ha comptes, ni inici de sessió, ni noms, ni correus electrònics, ni fotos, ni ubicació. El joc no fa servir la càmera ni el micròfon.",
      ],
      [
        "Sense anuncis ni seguiment",
        "El joc no mostra publicitat i no conté eines d'analítica, de seguiment ni de recollida de dades de tercers. No segueix els infants per altres apps o webs.",
      ],
      [
        "El que es queda al dispositiu",
        "Perquè els infants puguin continuar on ho havien deixat, el joc desa algunes coses només al mateix dispositiu: l'idioma triat, l'ajust del so, els trencaclosques acabats, els dibuixos del joc de pintar i el progrés de les partides. Aquesta informació no surt mai del dispositiu. Si s'esborra l'app, s'elimina del tot.",
      ],
      [
        "Internet",
        "Tot el que el joc necessita (dibuixos, música i sons) ve dins l'app, de manera que funciona sense connexió a internet i no envia res per internet.",
      ],
      [
        "Compres i enllaços",
        "El joc és gratuït i no té compres dins l'app ni enllaços a altres apps, webs o xarxes socials.",
      ],
      [
        "Infants",
        "Bibledoo està fet per a infants i compleix les normes per a apps infantils, com la llei COPPA dels Estats Units i el Reglament General de Protecció de Dades (RGPD) de la UE: com que no es recull cap informació personal, no hi ha res a consultar, exportar ni esborrar.",
      ],
      [
        "Canvis",
        "Si una versió futura del joc canvia alguna cosa d'això (per exemple, si s'hi afegeixen compres opcionals), actualitzarem aquesta pàgina abans de publicar aquesta versió i canviarem la data de dalt.",
      ],
      [
        "Contacte",
        "Si tens qualsevol pregunta sobre aquesta política, escriu-nos al contacte del desenvolupador que apareix a la pàgina del joc a l'App Store o a Google Play.",
      ],
    ],
  },
};

function PrivacyPage() {
  const { lang } = useSettings();
  const [shown, setShown] = useState<PolicyLang>(lang === "es" ? "es" : "en");
  const p = POLICY[shown];

  return (
    <main
      className="theme-bedtime min-h-[100dvh] bg-[oklch(0.95_0.04_82)] text-foreground"
      lang={shown}
      dir="ltr"
    >
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-foreground/80 transition active:scale-95"
          >
            {/* Inline, not ArrowIcon: that one flips for Arabic, but this page is always left-to-right. */}
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                d="M20 12H5M11 6l-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {p.back}
          </Link>
          <div className="flex gap-1">
            {(Object.keys(POLICY) as PolicyLang[]).map((id) => (
              <button
                key={id}
                onClick={() => setShown(id)}
                aria-pressed={shown === id}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                  shown === id
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "bg-card text-foreground/70"
                }`}
              >
                {POLICY[id].name}
              </button>
            ))}
          </div>
        </div>

        <article className="paint-box paint-tall paint-solid p-6 sm:p-8">
          <h1 className="font-display text-3xl">Bibledoo · {p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {p.updated}: {UPDATED}
          </p>
          {p.sections.map(([heading, body]) => (
            <section key={heading} className="mt-6">
              <h2 className="font-display text-xl">{heading}</h2>
              <p className="mt-1 leading-relaxed">{body}</p>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
