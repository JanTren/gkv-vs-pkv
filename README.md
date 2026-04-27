# GKV vs. PKV Simulator

Ein hochdetaillierter, datengetriebener interaktiver Simulator zum finanziellen Vergleich zwischen Gesetzlicher Krankenversicherung (GKV) und Privater Krankenversicherung (PKV) über den gesamten Lebenszyklus hinweg (Erwerbsphase und Rentenphase).

Dieses Projekt ist eine isolierte, eigenständige React-Anwendung (Standalone), die ursprünglich als Teil des Deltaeffekt-Projekts entwickelt wurde. 

## 🎯 Features

* **Langfristige GKV-Beitragsdynamik:** Simulation von zukünftigen systemischen Belastungen der GKV durch demografischen Wandel (Demografie-Rampe), anpassbar über Parameter.
* **PKV-Beitragsentwicklung:** Detaillierte Berechnung der PKV-Beiträge mit und ohne Beitragsentlastungstarife (BET), inklusive Arbeitgeberzuschuss und Altersrückstellungen.
* **DRV-Zuschuss (Rentenphase):** Präzise Berechnung des Zuschusses der Deutschen Rentenversicherung zur Krankenversicherung der Rentner, unter Berücksichtigung von Beitragsbemessungsgrenzen.
* **Depot-Verzehr & Kapitalaufbau:** 
  * In der **Erwerbsphase**: Die monatliche Differenz ("Deltaeffekt") aus geringeren PKV-Beiträgen im Vergleich zur GKV wird mit einer angenommenen Rendite in einem ETF-Depot angelegt.
  * In der **Rentenphase**: Das aufgebaute Depot wird entspart, um die in der Rente meist höheren PKV-Beiträge auszugleichen. Der Simulator berechnet exakt, wann das Depot erschöpft ist ("Depot-Exhaustion").
* **Visuelle Analysen:** Interaktive Charts (Recharts) visualisieren Beitragsverläufe und Depot-Entwicklungen über Jahrzehnte.

## 🛠️ Tech Stack

* **React (v19)** - UI-Bibliothek
* **Vite** - Build Tool und Dev Server
* **Tailwind CSS** - Utility-first CSS-Framework für modernes und responsives Styling
* **Recharts** - Für komplexe interaktive Diagramme (GKV vs PKV Beiträge, Depotwert)
* **Lucide React** - Für moderne und skalierbare Icons

## 🚀 Lokale Installation und Start

### Voraussetzungen
* [Node.js](https://nodejs.org/) (Version 18 oder höher empfohlen)
* npm (wird mit Node.js installiert)

### Schritte

1. Repository klonen:
   ```bash
   git clone https://github.com/JanTren/gkv-vs-pkv.git
   cd "gkv-vs-pkv"
   ```

2. Abhängigkeiten installieren:
   Da das Projekt spezifische ältere Peer-Dependencies enthält, empfehlen wir die Installation mit dem `--legacy-peer-deps` Flag, um ERESOLVE-Fehler zu vermeiden:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```
   Die Applikation ist nun unter `http://localhost:5173/` erreichbar.

## 📦 Build für Produktion

Um eine optimierte Produktionsversion zu erstellen:

```bash
npm run build
```
Die statischen Dateien werden im Ordner `dist` abgelegt und können auf jeder statischen Hosting-Plattform (z. B. Vercel, Netlify, GitHub Pages) bereitgestellt werden.

## 🧮 Berechnungslogik (Auszug)

Der Simulator nutzt komplexe Annahmen, die der Nutzer im Interface frei konfigurieren kann:
- **Einkommen & Inflation:** Gehaltsentwicklung und allgemeine Inflationsraten.
- **Rendite:** Angenommene ETF-Rendite nach Steuern und Inflation.
- **GKV Zusatzbeiträge & Beitragsbemessungsgrenze (BBG):** Dynamische Anpassung der BBG an die Lohnentwicklung.
- **PKV Prämienanpassung:** Historische und erwartete Beitragssteigerungen in der PKV.

Das Herzstück bildet die Ermittlung des Break-Even-Punkts im Alter: Reichen die in jungen Jahren durch den Wechsel in die PKV gesparten und angelegten Mittel aus, um die im Alter steigenden Prämien abzufedern?

## 📝 Lizenz
Alle Rechte vorbehalten. Copyright © JanTren / Deltaeffekt.
