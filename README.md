# L'Universo di Italo Calvino: Un Viaggio Interattivo

Benvenuto nel repository del progetto dedicato all'esplorazione interattiva della vita, del pensiero e delle opere di **Italo Calvino**. Questo progetto è una **Single-Page Application (SPA)** sviluppata interamente con tecnologie web standard (Vanilla HTML, CSS, JavaScript) che mira a offrire un'esperienza immersiva, cinematografica e multisensoriale.

## 📖 Descrizione del Progetto

L'obiettivo di questo sito non è essere una semplice enciclopedia o biografia, ma un vero e proprio **spazio esplorativo**. L'utente è invitato a navigare attraverso le idee e le opere di Calvino come se stesse sfogliando gli appunti sulla sua scrivania o viaggiando attraverso le sue visioni.

L'interfaccia utente fa ampio uso di animazioni fluide, effetti sonori (audio feedback per i clic, glitch, macchina da scrivere), temi visivi dinamici e interazioni complesse per tradurre i concetti letterari (come la *combinatoria*, il *labirinto*, la *leggerezza* e la *metanarrazione*) in meccaniche digitali e interattive.

## 🗺️ Struttura delle Sezioni

Il progetto è suddiviso in 12 sezioni cronologiche e tematiche:

1. **La Valigia (Hub Centrale / Vita)**: Il punto di partenza. Una mappa interattiva e una timeline che tracciano i momenti salienti della vita dell'autore, dai monti liguri fino a Parigi e alle *Lezioni Americane*.
2. **Pensiero e Poetica**: Una sezione in cui l'utente interagisce con delle "concept cards" (Esattezza, Labirinto, Combinatoria, Molteplicità) per svelare frammenti del pensiero calviniano.
3. **Il Neorealismo**: Un approfondimento sul rapporto tra Calvino, la Resistenza e *Il sentiero dei nidi di ragno*, presentato con un suggestivo layout in stile "articolo di giornale d'epoca".
4. **La Leggerezza e l'Immaginazione**: Basato sulle *Lezioni Americane*, dove delle sfere luminose interattive fluttuanti rivelano riflessioni sull'arte di "planare dall'alto".
5. **Il Ruolo del Lettore (Metanarrazione)**: Un'esperienza di rottura della quarta parete ispirata a *Se una notte d'inverno un viaggiatore*, in cui l'utente è chiamato a confrontarsi con la propria identità di "Lettore" di fronte allo "Specchio delle Parole".
6. **Il visconte dimezzato**: Interazione con il concetto di divisione e interezza (tema dell'alienazione contemporanea).
7. **Il barone rampante**: Esplorazione del punto di vista "dall'alto" (distanza critica).
8. **Il cavaliere inesistente**: L'armatura vuota e l'identità formale.
9. **Le cosmicomiche**: Atmosfera spaziale e genesi dell'universo.
10. **Il castello dei destini incrociati**: Una delle sezioni tecnicamente più avanzate. Un tavolo virtuale in cui l'utente seleziona 3 carte dei Tarocchi e, tramite un sistema di slot 3D, svela una narrazione procedurale e combinatoria del proprio destino.

## 💻 Stack Tecnologico

- **HTML5**: Struttura semantica, suddivisione in `<section>` nascoste/visualizzate dinamicamente tramite classi `.active`. Uso massiccio di SVG inline per grafiche vintage e stilizzate.
- **CSS3 (Vanilla)**: 
  - Variabili CSS per un *Design System* coerente.
  - Media queries per un approccio **Mobile-First e Responsive**.
  - Transizioni, keyframes e prospettive 3D (particolarmente usate nel flip delle carte dei Tarocchi).
  - Utilizzo di filtri CSS (SVG noise filters) e gradienti per creare texture tangibili (carta rovinata, legno, pergamena).
- **JavaScript (Vanilla)**:
  - Gestione dello stato della Single-Page Application (apertura/chiusura sezioni).
  - Motore Audio (`AudioEngine`) per il sound design interattivo (macchina da scrivere, sussurri, glitch).
  - Iniezione dinamica di contenuti basata su attributi `data-*` per le interazioni (Tarocchi, Concetti, Leggerezza).

## 🎨 Design & UX

Il design è profondamente legato al concetto del **"Libro come Labirinto"**. L'estetica mescola elementi analogici e tipografici d'epoca (macchine da scrivere, polaroid, font serif monospazio) con micro-animazioni moderne e transizioni soft:
- **Tema Chiaro (Paper Theme)**: Utilizzato per i saggi, il neorealismo e la vita. Colori caldi, texture di carta, inchiostro.
- **Tema Scuro (Dark Theme)**: Utilizzato per le atmosfere più oniriche, esoteriche e cosmiche (Il Castello, Le Cosmicomiche, Il Visconte).

## 🚀 Come avviare il progetto

Essendo basato su file statici (HTML, CSS, JS), non è necessario alcun processo di build o installazione tramite NPM.

1. Clona il repository o scarica i file.
2. Apri il file `index.html` direttamente nel tuo browser.
3. *Consiglio*: Per godere appieno degli effetti sonori e del caricamento dinamico dei font, è raccomandato servire la cartella tramite un semplice Live Server locale (es. l'estensione "Live Server" di VS Code o `npx serve`).

## ✍️ Note di Sviluppo

- **Scalabilità Interazioni**: I listener in JavaScript sono progettati in modo da non duplicarsi se una sezione viene aperta e chiusa più volte (utilizzando tecniche di rigenerazione del nodo DOM per il cleanup automatico o rimozione classi mirate).
- **Tarocchi (Il Castello)**: Le carte utilizzano `transform-style: preserve-3d;` per simulare un reale "flip" della carta. Quando cliccate, ricevono dinamicamente una classe `.slot-X` che calcola via CSS la loro posizione finale in alto al centro dello schermo.

---
*"La letteratura è una mappa che ci permette di trovare il mondo intero nello spazio di una pagina."* — I. Calvino
