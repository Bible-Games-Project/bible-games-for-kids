import type { Lang } from "@/lib/translations";

// Text of the privacy policy page (src/routes/privacy.tsx), in every game
// language plus Catalan. Every language must say the same thing: if the
// policy changes, change all of them and UPDATED.

export type PolicyLang = Lang | "ca";

export const UPDATED = "2026-11-24";

// Shown in the Contact section of every language, as plain text (no mailto
// link: Kids-category apps must not open other apps without a parental gate).
export const CONTACT_EMAIL = "biblegamesproject@gmail.com";

type Policy = {
  name: string;
  title: string;
  updated: string;
  back: string;
  sections: [string, string][];
};

export const POLICY: Record<PolicyLang, Policy> = {
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
        "If you have any question about this policy, write to us at biblegamesproject@gmail.com.",
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
        "Si tienes cualquier pregunta sobre esta política, escríbenos a biblegamesproject@gmail.com.",
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
        "Si tens qualsevol pregunta sobre aquesta política, escriu-nos a biblegamesproject@gmail.com.",
      ],
    ],
  },
  de: {
    name: "Deutsch",
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert",
    back: "Zurück zum Spiel",
    sections: [
      [
        "Wer wir sind",
        "Bibledoo ist ein Spiel mit biblischen Geschichten für Kinder, entwickelt vom Bible Games Project. Diese Erklärung beschreibt, was mit deinen Daten geschieht, wenn du oder dein Kind es spielt.",
      ],
      [
        "Wir erheben keine Daten",
        "Bibledoo erhebt keine personenbezogenen Daten, speichert sie nicht auf unseren Servern, gibt sie nicht weiter und verkauft sie nicht. Es gibt keine Konten, keine Anmeldung, keine Namen, keine E-Mail-Adressen, keine Fotos und keinen Standort. Das Spiel verwendet weder Kamera noch Mikrofon.",
      ],
      [
        "Keine Werbung, kein Tracking",
        "Das Spiel zeigt keine Werbung und enthält keine Analyse-, Tracking- oder Datenerfassungswerkzeuge von Dritten. Es verfolgt Kinder nicht über andere Apps oder Websites.",
      ],
      [
        "Was auf dem Gerät bleibt",
        "Damit Kinder dort weitermachen können, wo sie aufgehört haben, speichert das Spiel einige Dinge nur auf dem Gerät selbst: die gewählte Sprache, die Toneinstellung, fertige Puzzles, Bilder aus dem Malspiel und den Spielfortschritt. Diese Daten verlassen das Gerät nie. Wenn die App gelöscht wird, werden sie vollständig entfernt.",
      ],
      [
        "Internet",
        "Alles, was das Spiel braucht (Bilder, Musik und Töne), ist in der App enthalten. Es funktioniert daher ohne Internetverbindung und sendet nichts über das Internet.",
      ],
      [
        "Käufe und Links",
        "Das Spiel ist kostenlos und hat keine In-App-Käufe und keine Links zu anderen Apps, Websites oder sozialen Netzwerken.",
      ],
      [
        "Kinder",
        "Bibledoo ist für Kinder gemacht und hält die Regeln für Kinder-Apps ein, etwa das US-Gesetz COPPA und die Datenschutz-Grundverordnung (DSGVO) der EU: Da keine personenbezogenen Daten erhoben werden, gibt es nichts einzusehen, zu exportieren oder zu löschen.",
      ],
      [
        "Änderungen",
        "Wenn eine künftige Version des Spiels etwas davon ändert (zum Beispiel durch optionale Käufe), aktualisieren wir diese Seite, bevor diese Version erscheint, und ändern das Datum oben.",
      ],
      [
        "Kontakt",
        "Wenn du Fragen zu dieser Erklärung hast, schreib uns an biblegamesproject@gmail.com.",
      ],
    ],
  },
  fr: {
    name: "Français",
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour",
    back: "Retour au jeu",
    sections: [
      [
        "Qui sommes-nous",
        "Bibledoo est un jeu d'histoires de la Bible pour les enfants, créé par le Bible Games Project. Cette politique explique ce qu'il advient de tes informations quand toi ou ton enfant y jouez.",
      ],
      [
        "Nous ne collectons aucune donnée",
        "Bibledoo ne collecte, ne conserve sur nos serveurs, ne partage et ne vend aucune information personnelle. Il n'y a ni compte, ni connexion, ni nom, ni adresse e-mail, ni photo, ni localisation. Le jeu n'utilise ni la caméra ni le micro.",
      ],
      [
        "Pas de publicité, pas de suivi",
        "Le jeu n'affiche aucune publicité et ne contient aucun outil d'analyse, de suivi ou de collecte de données de tiers. Il ne suit pas les enfants dans d'autres applis ou sites web.",
      ],
      [
        "Ce qui reste sur l'appareil",
        "Pour que les enfants puissent reprendre là où ils s'étaient arrêtés, le jeu enregistre quelques éléments uniquement sur l'appareil lui-même : la langue choisie, le réglage du son, les puzzles terminés, les dessins du jeu de coloriage et la progression des parties. Ces informations ne quittent jamais l'appareil. Supprimer l'appli les efface complètement.",
      ],
      [
        "Internet",
        "Tout ce dont le jeu a besoin (images, musique et sons) est inclus dans l'appli : il fonctionne sans connexion Internet et n'envoie rien par Internet.",
      ],
      [
        "Achats et liens",
        "Le jeu est gratuit, sans achats intégrés et sans liens vers d'autres applis, sites web ou réseaux sociaux.",
      ],
      [
        "Enfants",
        "Bibledoo est conçu pour les enfants et respecte les règles des applis pour enfants, comme la loi américaine COPPA et le Règlement général sur la protection des données (RGPD) de l'UE : comme aucune information personnelle n'est collectée, il n'y a rien à consulter, exporter ou supprimer.",
      ],
      [
        "Modifications",
        "Si une future version du jeu change l'un de ces points (par exemple en ajoutant des achats facultatifs), nous mettrons cette page à jour avant la sortie de cette version et changerons la date en haut.",
      ],
      [
        "Contact",
        "Pour toute question sur cette politique, écris-nous à biblegamesproject@gmail.com.",
      ],
    ],
  },
  it: {
    name: "Italiano",
    title: "Informativa sulla privacy",
    updated: "Ultimo aggiornamento",
    back: "Torna al gioco",
    sections: [
      [
        "Chi siamo",
        "Bibledoo è un gioco di storie della Bibbia per bambini, creato dal Bible Games Project. Questa informativa spiega cosa succede alle tue informazioni quando tu o tuo figlio ci giocate.",
      ],
      [
        "Non raccogliamo alcun dato",
        "Bibledoo non raccoglie, non conserva sui nostri server, non condivide e non vende alcuna informazione personale. Non ci sono account, accessi, nomi, indirizzi e-mail, foto né posizione. Il gioco non usa la fotocamera né il microfono.",
      ],
      [
        "Niente pubblicità, niente tracciamento",
        "Il gioco non mostra pubblicità e non contiene strumenti di analisi, tracciamento o raccolta dati di terze parti. Non segue i bambini in altre app o siti web.",
      ],
      [
        "Cosa resta sul dispositivo",
        "Per permettere ai bambini di riprendere da dove avevano lasciato, il gioco salva alcune cose solo sul dispositivo stesso: la lingua scelta, l'impostazione del suono, i puzzle completati, i disegni del gioco da colorare e i progressi delle partite. Queste informazioni non lasciano mai il dispositivo. Eliminando l'app vengono cancellate del tutto.",
      ],
      [
        "Internet",
        "Tutto ciò che serve al gioco (immagini, musica e suoni) è incluso nell'app, quindi funziona senza connessione a Internet e non invia nulla tramite Internet.",
      ],
      [
        "Acquisti e link",
        "Il gioco è gratuito e non ha acquisti in-app né link ad altre app, siti web o social network.",
      ],
      [
        "Bambini",
        "Bibledoo è pensato per i bambini e rispetta le regole per le app per bambini, come la legge statunitense COPPA e il Regolamento generale sulla protezione dei dati (GDPR) dell'UE: poiché non viene raccolta alcuna informazione personale, non c'è nulla da consultare, esportare o cancellare.",
      ],
      [
        "Modifiche",
        "Se una versione futura del gioco cambierà qualcosa di tutto ciò (per esempio aggiungendo acquisti facoltativi), aggiorneremo questa pagina prima dell'uscita di quella versione e cambieremo la data in alto.",
      ],
      ["Contatti", "Se hai domande su questa informativa, scrivici a biblegamesproject@gmail.com."],
    ],
  },
  pt: {
    name: "Português",
    title: "Política de privacidade",
    updated: "Última atualização",
    back: "Voltar ao jogo",
    sections: [
      [
        "Quem somos",
        "Bibledoo é um jogo de histórias da Bíblia para crianças, criado pelo Bible Games Project. Esta política explica o que acontece com suas informações quando você ou seu filho jogam.",
      ],
      [
        "Não coletamos nenhum dado",
        "Bibledoo não coleta, não guarda em nossos servidores, não compartilha e não vende nenhuma informação pessoal. Não há contas, login, nomes, e-mails, fotos nem localização. O jogo não usa a câmera nem o microfone.",
      ],
      [
        "Sem anúncios, sem rastreamento",
        "O jogo não mostra publicidade e não contém ferramentas de análise, rastreamento ou coleta de dados de terceiros. Ele não segue as crianças em outros apps ou sites.",
      ],
      [
        "O que fica no aparelho",
        "Para que as crianças possam continuar de onde pararam, o jogo salva algumas coisas apenas no próprio aparelho: o idioma escolhido, a configuração de som, os quebra-cabeças concluídos, os desenhos do jogo de colorir e o progresso das partidas. Essas informações nunca saem do aparelho. Ao apagar o app, elas são removidas por completo.",
      ],
      [
        "Internet",
        "Tudo o que o jogo precisa (imagens, música e sons) já vem dentro do app, por isso ele funciona sem internet e não envia nada pela internet.",
      ],
      [
        "Compras e links",
        "O jogo é gratuito e não tem compras dentro do app nem links para outros apps, sites ou redes sociais.",
      ],
      [
        "Crianças",
        "Bibledoo é feito para crianças e segue as regras para apps infantis, como a lei americana COPPA e o Regulamento Geral sobre a Proteção de Dados (RGPD) da UE: como nenhuma informação pessoal é coletada, não há nada para consultar, exportar ou apagar.",
      ],
      [
        "Mudanças",
        "Se uma versão futura do jogo mudar algo disso (por exemplo, ao adicionar compras opcionais), atualizaremos esta página antes de lançar essa versão e mudaremos a data no topo.",
      ],
      [
        "Contato",
        "Se tiver qualquer dúvida sobre esta política, escreva para biblegamesproject@gmail.com.",
      ],
    ],
  },
  pl: {
    name: "Polski",
    title: "Polityka prywatności",
    updated: "Ostatnia aktualizacja",
    back: "Wróć do gry",
    sections: [
      [
        "Kim jesteśmy",
        "Bibledoo to gra z historiami biblijnymi dla dzieci, stworzona przez Bible Games Project. Ta polityka wyjaśnia, co dzieje się z Twoimi informacjami, gdy Ty lub Twoje dziecko w nią gracie.",
      ],
      [
        "Nie zbieramy żadnych danych",
        "Bibledoo nie zbiera, nie przechowuje na naszych serwerach, nie udostępnia i nie sprzedaje żadnych danych osobowych. Nie ma kont, logowania, imion, adresów e-mail, zdjęć ani lokalizacji. Gra nie używa aparatu ani mikrofonu.",
      ],
      [
        "Bez reklam i śledzenia",
        "Gra nie wyświetla reklam i nie zawiera narzędzi analitycznych, śledzących ani zbierających dane firm trzecich. Nie śledzi dzieci w innych aplikacjach ani na stronach internetowych.",
      ],
      [
        "Co zostaje na urządzeniu",
        "Aby dzieci mogły kontynuować tam, gdzie skończyły, gra zapisuje kilka rzeczy wyłącznie na samym urządzeniu: wybrany język, ustawienie dźwięku, ukończone puzzle, rysunki z kolorowanki i postęp w grach. Te informacje nigdy nie opuszczają urządzenia. Usunięcie aplikacji całkowicie je kasuje.",
      ],
      [
        "Internet",
        "Wszystko, czego gra potrzebuje (obrazy, muzyka i dźwięki), jest zawarte w aplikacji, więc działa ona bez połączenia z internetem i niczego przez internet nie wysyła.",
      ],
      [
        "Zakupy i linki",
        "Gra jest darmowa i nie ma zakupów w aplikacji ani linków do innych aplikacji, stron internetowych czy sieci społecznościowych.",
      ],
      [
        "Dzieci",
        "Bibledoo powstało z myślą o dzieciach i przestrzega zasad dotyczących aplikacji dla dzieci, takich jak amerykańska ustawa COPPA i unijne ogólne rozporządzenie o ochronie danych (RODO): ponieważ nie zbieramy żadnych danych osobowych, nie ma niczego do wglądu, eksportu ani usunięcia.",
      ],
      [
        "Zmiany",
        "Jeśli przyszła wersja gry coś z tego zmieni (na przykład doda opcjonalne zakupy), zaktualizujemy tę stronę przed wydaniem tej wersji i zmienimy datę na górze.",
      ],
      [
        "Kontakt",
        "Jeśli masz pytania dotyczące tej polityki, napisz do nas na adres biblegamesproject@gmail.com.",
      ],
    ],
  },
  ru: {
    name: "Русский",
    title: "Политика конфиденциальности",
    updated: "Последнее обновление",
    back: "Вернуться в игру",
    sections: [
      [
        "Кто мы",
        "Bibledoo — это игра с библейскими историями для детей, созданная Bible Games Project. Эта политика объясняет, что происходит с вашей информацией, когда вы или ваш ребёнок играете в неё.",
      ],
      [
        "Мы не собираем никаких данных",
        "Bibledoo не собирает, не хранит на наших серверах, не передаёт и не продаёт никакую личную информацию. Здесь нет учётных записей, входа, имён, адресов электронной почты, фотографий и геолокации. Игра не использует камеру и микрофон.",
      ],
      [
        "Без рекламы и отслеживания",
        "В игре нет рекламы и нет инструментов аналитики, отслеживания или сбора данных третьих сторон. Она не следит за детьми в других приложениях или на сайтах.",
      ],
      [
        "Что остаётся на устройстве",
        "Чтобы дети могли продолжить с того места, где остановились, игра сохраняет немного данных только на самом устройстве: выбранный язык, настройку звука, собранные пазлы, рисунки из раскраски и прогресс в играх. Эта информация никогда не покидает устройство. При удалении приложения она полностью стирается.",
      ],
      [
        "Интернет",
        "Всё, что нужно игре (картинки, музыка и звуки), уже есть внутри приложения, поэтому она работает без интернета и ничего не отправляет через интернет.",
      ],
      [
        "Покупки и ссылки",
        "Игра бесплатная, в ней нет встроенных покупок и ссылок на другие приложения, сайты или социальные сети.",
      ],
      [
        "Дети",
        "Bibledoo создана для детей и соблюдает правила для детских приложений, такие как американский закон COPPA и Общий регламент ЕС по защите данных (GDPR): поскольку личная информация не собирается, просматривать, выгружать или удалять нечего.",
      ],
      [
        "Изменения",
        "Если будущая версия игры что-то из этого изменит (например, добавит необязательные покупки), мы обновим эту страницу до выхода этой версии и изменим дату вверху.",
      ],
      [
        "Контакты",
        "Если у вас есть вопросы об этой политике, напишите нам на biblegamesproject@gmail.com.",
      ],
    ],
  },
  ja: {
    name: "日本語",
    title: "プライバシーポリシー",
    updated: "最終更新日",
    back: "ゲームにもどる",
    sections: [
      [
        "私たちについて",
        "Bibledoo は、Bible Games Project が作った子ども向けの聖書のお話ゲームです。このポリシーでは、あなたやお子さまが遊ぶときに情報がどう扱われるかを説明します。",
      ],
      [
        "データは一切収集しません",
        "Bibledoo は個人情報を収集せず、私たちのサーバーに保存せず、共有も販売もしません。アカウント、ログイン、名前、メールアドレス、写真、位置情報はありません。カメラやマイクも使いません。",
      ],
      [
        "広告なし、トラッキングなし",
        "ゲームには広告がなく、第三者による分析・トラッキング・データ収集のツールも含まれていません。ほかのアプリやウェブサイトでお子さまを追跡することもありません。",
      ],
      [
        "端末に残るもの",
        "お子さまが続きから遊べるように、ゲームはいくつかの情報を端末の中だけに保存します。選んだ言語、サウンドの設定、完成したパズル、ぬりえの絵、ゲームの進み具合です。これらの情報が端末の外に出ることはありません。アプリを削除すると、すべて消去されます。",
      ],
      [
        "インターネット",
        "ゲームに必要なもの(絵、音楽、効果音)はすべてアプリに含まれているため、インターネットに接続しなくても遊べ、インターネットで何かを送ることもありません。",
      ],
      [
        "購入とリンク",
        "ゲームは無料で、アプリ内課金や、ほかのアプリ・ウェブサイト・SNSへのリンクはありません。",
      ],
      [
        "お子さまについて",
        "Bibledoo は子ども向けに作られており、米国の児童オンラインプライバシー保護法(COPPA)や EU の一般データ保護規則(GDPR)など、子ども向けアプリのルールを守っています。個人情報を収集しないため、確認・書き出し・削除する情報はありません。",
      ],
      [
        "変更について",
        "今後のバージョンでこの内容が変わる場合(たとえば任意の購入を追加する場合)は、そのバージョンの公開前にこのページを更新し、上の日付を変更します。",
      ],
      [
        "お問い合わせ",
        "このポリシーについてご質問があれば、biblegamesproject@gmail.com までご連絡ください。",
      ],
    ],
  },
  ko: {
    name: "한국어",
    title: "개인정보 처리방침",
    updated: "최종 업데이트",
    back: "게임으로 돌아가기",
    sections: [
      [
        "우리는 누구인가요",
        "Bibledoo는 Bible Games Project가 만든 어린이를 위한 성경 이야기 게임입니다. 이 방침은 여러분이나 자녀가 게임을 할 때 정보가 어떻게 처리되는지 설명합니다.",
      ],
      [
        "어떤 데이터도 수집하지 않습니다",
        "Bibledoo는 어떤 개인정보도 수집하거나, 서버에 저장하거나, 공유하거나, 판매하지 않습니다. 계정, 로그인, 이름, 이메일 주소, 사진, 위치 정보가 없습니다. 게임은 카메라와 마이크를 사용하지 않습니다.",
      ],
      [
        "광고 없음, 추적 없음",
        "게임에는 광고가 없으며 제3자의 분석, 추적 또는 데이터 수집 도구가 없습니다. 다른 앱이나 웹사이트에서 아이들을 추적하지 않습니다.",
      ],
      [
        "기기에 남는 정보",
        "아이들이 하던 곳부터 이어서 할 수 있도록, 게임은 몇 가지 정보를 기기 안에만 저장합니다. 선택한 언어, 소리 설정, 완성한 퍼즐, 색칠 놀이 그림, 게임 진행 상황입니다. 이 정보는 기기 밖으로 나가지 않습니다. 앱을 삭제하면 모두 지워집니다.",
      ],
      [
        "인터넷",
        "게임에 필요한 모든 것(그림, 음악, 소리)이 앱 안에 들어 있어서 인터넷 없이도 작동하며 인터넷으로 아무것도 보내지 않습니다.",
      ],
      [
        "구매와 링크",
        "게임은 무료이며 앱 내 구매가 없고 다른 앱, 웹사이트, 소셜 네트워크로 가는 링크도 없습니다.",
      ],
      [
        "어린이",
        "Bibledoo는 어린이를 위해 만들어졌으며 미국의 아동 온라인 개인정보 보호법(COPPA)과 EU 일반 개인정보 보호법(GDPR) 같은 어린이 앱 규칙을 따릅니다. 개인정보를 수집하지 않으므로 열람, 내보내기, 삭제할 정보가 없습니다.",
      ],
      [
        "변경 사항",
        "앞으로 게임의 새 버전에서 이 내용이 바뀌면(예: 선택형 구매 추가) 그 버전을 출시하기 전에 이 페이지를 업데이트하고 위의 날짜를 바꾸겠습니다.",
      ],
      ["문의", "이 방침에 대해 궁금한 점이 있으면 biblegamesproject@gmail.com 으로 문의해 주세요."],
    ],
  },
  ar: {
    name: "العربية",
    title: "سياسة الخصوصية",
    updated: "آخر تحديث",
    back: "العودة إلى اللعبة",
    sections: [
      [
        "من نحن",
        "Bibledoo لعبة قصص من الكتاب المقدس للأطفال، من إعداد Bible Games Project. توضح هذه السياسة ما يحدث لمعلوماتك عندما تلعبها أنت أو طفلك.",
      ],
      [
        "لا نجمع أي بيانات",
        "لا تجمع Bibledoo أي معلومات شخصية، ولا تحفظها على خوادمنا، ولا تشاركها، ولا تبيعها. لا توجد حسابات ولا تسجيل دخول ولا أسماء ولا عناوين بريد إلكتروني ولا صور ولا موقع. ولا تستخدم اللعبة الكاميرا أو الميكروفون.",
      ],
      [
        "لا إعلانات ولا تتبّع",
        "لا تعرض اللعبة أي إعلانات، ولا تحتوي على أدوات تحليل أو تتبّع أو جمع بيانات تابعة لجهات خارجية. ولا تتتبّع الأطفال عبر تطبيقات أو مواقع أخرى.",
      ],
      [
        "ما يبقى على الجهاز",
        "لكي يتمكن الأطفال من المتابعة من حيث توقفوا، تحفظ اللعبة بعض الأشياء على الجهاز نفسه فقط: اللغة المختارة، وإعداد الصوت، والألغاز المكتملة، ورسومات لعبة التلوين، والتقدّم في الألعاب. لا تغادر هذه المعلومات الجهاز أبداً، وتُحذف بالكامل عند حذف التطبيق.",
      ],
      [
        "الإنترنت",
        "كل ما تحتاجه اللعبة (الصور والموسيقى والأصوات) موجود داخل التطبيق، لذلك تعمل دون اتصال بالإنترنت ولا ترسل أي شيء عبر الإنترنت.",
      ],
      [
        "المشتريات والروابط",
        "اللعبة مجانية، وليس فيها مشتريات داخل التطبيق ولا روابط إلى تطبيقات أو مواقع أو شبكات تواصل اجتماعي أخرى.",
      ],
      [
        "الأطفال",
        "صُممت Bibledoo للأطفال وتلتزم بقواعد تطبيقات الأطفال، مثل قانون COPPA الأمريكي واللائحة العامة لحماية البيانات (GDPR) في الاتحاد الأوروبي: وبما أنه لا تُجمع أي معلومات شخصية، فلا يوجد ما يمكن الاطلاع عليه أو تصديره أو حذفه.",
      ],
      [
        "التغييرات",
        "إذا غيّر إصدار مستقبلي من اللعبة أيّاً من ذلك (مثل إضافة مشتريات اختيارية)، فسنحدّث هذه الصفحة قبل صدور ذلك الإصدار ونغيّر التاريخ في الأعلى.",
      ],
      ["التواصل", "إذا كان لديك أي سؤال عن هذه السياسة، فراسلنا على biblegamesproject@gmail.com."],
    ],
  },
  tr: {
    name: "Türkçe",
    title: "Gizlilik politikası",
    updated: "Son güncelleme",
    back: "Oyuna dön",
    sections: [
      [
        "Biz kimiz",
        "Bibledoo, Bible Games Project tarafından yapılmış, çocuklar için Kutsal Kitap hikâyeleri oyunudur. Bu politika, sen ya da çocuğun oynarken bilgilerine ne olduğunu açıklar.",
      ],
      [
        "Hiçbir veri toplamıyoruz",
        "Bibledoo hiçbir kişisel bilgiyi toplamaz, sunucularımızda saklamaz, paylaşmaz ve satmaz. Hesap, giriş, isim, e-posta adresi, fotoğraf veya konum yoktur. Oyun kamerayı ya da mikrofonu kullanmaz.",
      ],
      [
        "Reklam yok, takip yok",
        "Oyun reklam göstermez ve üçüncü taraf analiz, takip veya veri toplama araçları içermez. Çocukları başka uygulamalarda ya da web sitelerinde takip etmez.",
      ],
      [
        "Cihazda kalanlar",
        "Çocuklar kaldıkları yerden devam edebilsin diye oyun birkaç şeyi yalnızca cihazın kendisinde saklar: seçilen dil, ses ayarı, tamamlanan yapbozlar, boyama oyunundaki resimler ve oyun ilerlemesi. Bu bilgiler cihazdan hiç çıkmaz. Uygulama silindiğinde tamamen kaldırılır.",
      ],
      [
        "İnternet",
        "Oyunun ihtiyaç duyduğu her şey (resimler, müzik ve sesler) uygulamanın içindedir; bu yüzden internet bağlantısı olmadan çalışır ve internet üzerinden hiçbir şey göndermez.",
      ],
      [
        "Satın almalar ve bağlantılar",
        "Oyun ücretsizdir; uygulama içi satın alma ve başka uygulamalara, web sitelerine ya da sosyal ağlara bağlantı yoktur.",
      ],
      [
        "Çocuklar",
        "Bibledoo çocuklar için yapılmıştır ve ABD'deki COPPA yasası ile AB Genel Veri Koruma Tüzüğü (GDPR) gibi çocuk uygulamaları kurallarına uyar: Hiçbir kişisel bilgi toplanmadığı için görüntülenecek, dışa aktarılacak ya da silinecek bir şey yoktur.",
      ],
      [
        "Değişiklikler",
        "Oyunun gelecekteki bir sürümü bunlardan birini değiştirirse (örneğin isteğe bağlı satın almalar eklerse), o sürüm yayımlanmadan önce bu sayfayı güncelleyecek ve yukarıdaki tarihi değiştireceğiz.",
      ],
      [
        "İletişim",
        "Bu politika hakkında bir sorun varsa bize biblegamesproject@gmail.com adresinden yaz.",
      ],
    ],
  },
  zh: {
    name: "简体中文",
    title: "隐私政策",
    updated: "最后更新",
    back: "返回游戏",
    sections: [
      [
        "我们是谁",
        "Bibledoo 是由 Bible Games Project 制作的儿童圣经故事游戏。本政策说明你或你的孩子玩游戏时,你的信息会如何处理。",
      ],
      [
        "我们不收集任何数据",
        "Bibledoo 不收集、不在我们的服务器上存储、不分享也不出售任何个人信息。没有账户、没有登录、没有姓名、电子邮件地址、照片或位置信息。游戏不使用摄像头或麦克风。",
      ],
      [
        "没有广告,没有跟踪",
        "游戏不显示任何广告,也不包含任何第三方分析、跟踪或数据收集工具。它不会在其他应用或网站上跟踪孩子。",
      ],
      [
        "保存在设备上的内容",
        "为了让孩子能从上次停下的地方继续,游戏只在设备本身上保存少量内容:所选语言、声音设置、完成的拼图、涂色游戏中的画作以及游戏进度。这些信息绝不会离开设备。删除应用后,它们会被完全清除。",
      ],
      [
        "互联网",
        "游戏需要的一切(图片、音乐和声音)都包含在应用中,因此无需联网即可使用,也不会通过互联网发送任何内容。",
      ],
      ["购买和链接", "游戏免费,没有应用内购买,也没有指向其他应用、网站或社交网络的链接。"],
      [
        "儿童",
        "Bibledoo 专为儿童设计,遵守儿童应用的相关规定,例如美国《儿童在线隐私保护法》(COPPA)和欧盟《通用数据保护条例》(GDPR):由于不收集任何个人信息,因此没有可查看、导出或删除的内容。",
      ],
      [
        "变更",
        "如果游戏的未来版本改变了上述任何内容(例如加入可选购买),我们会在该版本发布前更新本页面,并修改顶部的日期。",
      ],
      [
        "联系我们",
        "如果你对本政策有任何疑问,请发送邮件至 biblegamesproject@gmail.com 与我们联系。",
      ],
    ],
  },
};
