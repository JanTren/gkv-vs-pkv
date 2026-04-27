# GKV vs. PKV Simulator

Ein hochdetaillierter, datengetriebener interaktiver Simulator zum finanziellen Vergleich zwischen Gesetzlicher Krankenversicherung (GKV) und Privater Krankenversicherung (PKV) über den gesamten Lebenszyklus hinweg (Erwerbsphase und Rentenphase).

Dieses Projekt ist eine isolierte, eigenständige React-Anwendung.

## Features

* Langfristige GKV-Beitragsdynamik: Ich simuliere zukünftige systemische Belastungen der GKV durch den demografischen Wandel (Demografie-Rampe), anpassbar über Parameter.
* PKV-Beitragsentwicklung: Detaillierte Berechnung der PKV-Beiträge mit und ohne Beitragsentlastungstarife (BET), inklusive Arbeitgeberzuschuss und Altersrückstellungen.
* DRV-Zuschuss (Rentenphase): Ich berechne präzise den Zuschuss der Deutschen Rentenversicherung zur Krankenversicherung der Rentner, unter Berücksichtigung von Beitragsbemessungsgrenzen.
* Depot-Verzehr und Kapitalaufbau: 
  * In der Erwerbsphase: Die monatliche Differenz aus geringeren PKV-Beiträgen im Vergleich zur GKV lege ich mit einer angenommenen Rendite in einem ETF-Depot an.
  * In der Rentenphase: Das aufgebaute Depot entspare ich, um die in der Rente meist höheren PKV-Beiträge auszugleichen. Mein Simulator berechnet exakt, wann das Depot erschöpft ist (Depot-Exhaustion).
* Visuelle Analysen: Interaktive Charts (Recharts) visualisieren Beitragsverläufe und Depot-Entwicklungen über Jahrzehnte.

## Tech Stack

* React (v19): UI-Bibliothek
* Vite: Build Tool und Dev Server
* Tailwind CSS: Utility-first CSS-Framework für modernes und responsives Styling
* Recharts: Für komplexe interaktive Diagramme (GKV vs PKV Beiträge, Depotwert)
* Lucide React: Für moderne und skalierbare Icons

## Lokale Installation und Start

### Voraussetzungen
* Node.js (Version 18 oder höher empfohlen)
* npm (wird mit Node.js installiert)

### Schritte

1. Repository klonen:
   ```bash
   git clone https://github.com/JanTren/gkv-vs-pkv.git
   cd "gkv-vs-pkv"
   ```

2. Abhängigkeiten installieren:
   Da mein Projekt spezifische ältere Peer-Dependencies enthält, empfehle ich die Installation mit dem Flag `--legacy-peer-deps`, um ERESOLVE-Fehler zu vermeiden:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Entwicklungsserver starten:
   ```bash
   npm run dev
   ```
   Meine Applikation ist nun unter `http://localhost:5173/` erreichbar.

## Build für Produktion

Um eine optimierte Produktionsversion zu erstellen:

```bash
npm run build
```
Die statischen Dateien werden im Ordner `dist` abgelegt und können auf jeder statischen Hosting-Plattform (zum Beispiel Vercel, Netlify, GitHub Pages) bereitgestellt werden.

## Detaillierte Berechnungslogik

Die folgenden Abschnitte beschreiben die exakten finanzmathematischen, steuerlichen und sozialversicherungsrechtlichen Annahmen, die ich im Hintergrund meiner Engine implementiert habe.

### 1. Grundlegende Parameter und Dynamiken

Ich simuliere den Finanzverlauf jahrweise (iterativ) vom aktuellen Alter bis zur angegebenen Lebenserwartung (zum Beispiel 90 Jahre).

* Lohnwachstum: Das Bruttogehalt lasse ich jährlich um den von mir gewählten Parameter steigen.
* BBG-Dynamik: Die Beitragsbemessungsgrenze (BBG) der gesetzlichen Krankenversicherung wächst jährlich exakt gekoppelt mit dem Lohnwachstum. Den Startwert habe ich für 2026 auf 66.150 Euro pro Jahr gesetzt.
* ETF-Rendite: Das Netto-Delta (die Ersparnis nach Steuern) zahle ich jährlich in das Depot ein und verzinse es mit der angegebenen Rendite.
* PKV-Zulassungsgrenze (JAEG 2026): 73.800 Euro pro Jahr. Liegt das Startgehalt darunter, schließe ich einen PKV-Wechsel faktisch aus.

### 2. Die Erwerbsphase (bis zum Renteneintritt)

In jedem Jahr bis zum Erreichen des Rentenalters wende ich folgende Regeln an:

#### 2.1. GKV-Kosten und Demografie-Rampe
* Den GKV-Beitragssatz (KV) setze ich für 2026 auf 17,3 % an (14,6 % Grundsatz plus 2,7 % Zusatzbeitrag).
* Die Pflegeversicherung (PV) berechne ich separat.
* Demografie-Rampe (KV): Den KV-Beitragssatz lasse ich von 2026 linear über 14 Jahre bis 2040 auf den von mir definierten maximalen GKV-Satz (zum Beispiel 24,0 %) ansteigen. Ab 2040 deckele ich ihn.
* GKV-Absetzbarkeit: Nach Paragraph 10 Absatz 1 Nummer 3 EStG sind Krankentagegeld-Anteile nicht absetzbar. Daher setze ich nur 96 % des KV-Arbeitnehmeranteils als absetzbar an.
* Berechnung: Die gesamten GKV-Kosten ergeben sich aus dem Minimum von Gehalt und BBG multipliziert mit der Summe aus KV-Satz und PV-Satz. Der Arbeitnehmer trägt davon die Hälfte.

#### 2.2. PKV-Kosten und Arbeitgeberzuschuss
* Den PKV-Beitrag lasse ich jährlich um die PKV-Kostensteigerung wachsen.
* 10 %-Zuschlag (Paragraph 12 Absatz 4a VAG): Vom Beginn bis einschließlich Alter 60 erhebe ich einen gesetzlichen Zuschlag von 10 % auf den Beitrag, der ab Alter 61 entfällt. Dieser Effekt ist unabhängig vom Renteneintritt.
* Krankengeldkürzung bei Renteneintritt: Mit Rentenbeginn lasse ich das Krankentagegeld (KTG) entfallen. Der Beitrag sinkt pauschal auf 94 % des Beitrags vom Vorjahr (alternativ ziehe ich den Beitragsentlastungstarif ab, falls dieser angegeben ist).
* AG-Zuschuss: Der Arbeitgeber zahlt 50 % des PKV-Beitrags, jedoch maximal die Hälfte des GKV-Höchstbeitrags.
* Arbeitnehmeranteil: Die PKV-Kosten des Arbeitnehmers sind der PKV-Beitrag abzüglich des AG-Zuschusses.

#### 2.3. Steuerliche Absetzbarkeit und Einkommensteuer
Ich berechne die exakte tarifliche Einkommensteuer nach folgendem Ablauf:

* Bis 2025: Ich nutze den Einkommensteuertarif 2024 (Grundfreibetrag 11.604 Euro).
* Ab 2026: Ich nutze den Einkommensteuertarif 2026 (Grundfreibetrag 12.347 Euro; Zonen 12.348 bis 17.443 Euro, 17.444 bis 68.481 Euro, 68.482 bis 277.825 Euro, ab 277.826 Euro). Ich wende keinen Soli und keinen Splittingtarif an.

* GKV: Der absetzbare GKV-Beitrag (96 % KV plus 100 % PV) ist als Vorsorgeaufwendung absetzbar. Das zu versteuernde Einkommen in der GKV ist das Gehalt abzüglich dieses absetzbaren Betrags.
* PKV: Nur die Basisabsicherung ist absetzbar (meine Pauschalannahme ist hier 80 % des Gesamtbeitrags). Von dieser Basisabsicherung ziehe ich den steuerfreien AG-Zuschuss ab.

#### 2.4. Netto-Delta und Depot
* Ich ermittle das Netto-Delta als Differenz des Nettoeinkommens in der PKV zum Nettoeinkommen in der GKV. Ist es positiv, buche ich es ins Depot; ist es negativ, entnehme ich es.
* Depot-Wachstum und Abgeltungsteuer: Bei Entnahmen (negatives Delta) fällt Abgeltungsteuer auf den Gewinnanteil an. Die effektive Steuer beträgt 26,375 % multipliziert mit 0,7 (Aktien-Teilfreistellung), also 18,46 %. Ich tracke das eingezahlte Kapital parallel zum Depotstand, um den Gewinnanteil stets korrekt zu berechnen.

#### 2.5. Pflegeversicherung
* Basissatz 2026: 3,6 % (ab 2025; davor 3,4 %).
* Kinderlosenzuschlag: 0,6 % schlage ich für Personen ohne Kinder ab 23 Jahren auf.
* Kinderabschlag: 0,25 % ziehe ich je Kind ab dem zweiten Kind ab, maximal jedoch 1,0 %.
* Für den Arbeitnehmer gilt: Er trägt die Hälfte des Basissatzes plus den Kinderlosenzuschlag abzüglich des Kinderabschlags.

### 3. Die Rentenphase (ab Renteneintritt)

#### 3.1. Rentenhöhe und Dynamik
* Hat der Nutzer eine erwartete Rente angegeben, dynamisiere ich diese von heute bis zum Renteneintritt mit dem Lohnwachstum.
* Ohne Angabe nutze ich ein Fallback: 48 % des letzten Bruttogehalts (Netto-Rentenniveau).
* Rentenanpassung im Alter: Die Rente lasse ich jährlich um das Lohnwachstum abzüglich 0,5 % wachsen (Demografischer Nachhaltigkeitsfaktor).

#### 3.2. GKV-Kosten (KVdR)
* Rentner in der GKV tragen nach Paragraph 248 SGB V den halben KV-Satz, aber den vollen PV-Satz (es gibt keinen AG-Zuschuss in der Rente).
* Diesen Satz wende ich auf die stetig steigende Bruttorente an (gedeckelt an der BBG).

#### 3.3. PKV-Kosten und Beitragsdämpfung
* Beitragssprung bei Renteneintritt: Ich kürze das KTG auf 94 % des Beitrags auf Vorjahresbasis.
* Beitragsentlastungsmodul (BET): Falls ein BET größer als 0 eingegeben wurde, ziehe ich diesen Betrag ab Rentenbeginn monatlich vom Beitrag ab.
* Altersrückstellungen: Die PKV-Kostensteigerung wird ab Rentenbeginn durch den expliziten Parameter für die PKV-Inflation in der Rente (Standard 2,5 % p.a.) bestimmt. Diesen Wert setze ich in der Regel niedriger an als die Steigerung in der Erwerbsphase, da ab diesem Zeitpunkt die gesetzlich und tariflich angesparten Altersrückstellungen zur Beitragsstabilisierung eingesetzt werden.

#### 3.4. DRV-Zuschuss zur PKV (Paragraph 106 SGB VI)
* Die Deutsche Rentenversicherung zahlt die Hälfte des allgemeinen KV-Grundbeitragssatzes (7,3 %) bezogen auf die Bruttorente.
* Deckelung: Ich deckele diesen Zuschuss auf maximal 50 % des tatsächlichen PKV-Monatsbeitrags.

#### 3.5. Rentenbesteuerung und Rentenfreibetrag (Paragraph 22 EStG)
* Den steuerpflichtigen Anteil der Rente richte ich nach dem Renteneintrittsjahr aus (Wachstumschancengesetz 2024):
  * Bis 2023: 82,5 %
  * Ab 2024: Steigerung um 0,5 Prozentpunkte pro Jahr
  * Ab 2058: 100 %
* Rentenfreibetrag: Den steuerfreien Anteil in Euro schreibe ich im ersten Rentenjahr nominal fest; er bleibt für alle Folgejahre konstant. Damit bilde ich das korrekte Realwert-Absinken ab.

#### 3.6. Steuerliche Absetzbarkeit in der Rente
* PKV-Absetzbarkeit: 80 % des gedämpften Altersbeitrags setze ich als Basisabsicherung an. Davon ziehe ich den steuerfreien DRV-Zuschuss ab. Den Rest mache ich absetzbar.

#### 3.7. Depot-Verzehr
* In der Rentenphase ist mein berechnetes Netto-Delta meist negativ, da die PKV die GKV-Kosten übersteigt.
* Dieses negative Delta entnehme ich dem Depot, inklusive der Abgeltungsteuer auf den Gewinnanteil.
* Reicht das Depot nicht aus, registriere ich das Alter des Depot-Bankrotts.

### 4. Reale Werte

* Alle nominalen Depot-Werte weise ich zusätzlich als Realwert aus, indem ich den Depotwert durch die angenommene Inflation abzinse. Der Realwert ist damit bei einer Inflation über 0 % immer kleiner als der Nominalwert.

### 5. Vereinfachungen und Grenzen meines Modells

1. Steuern: Ich berücksichtige keinen Solidaritätszuschlag, keine Kirchensteuer und kein Ehegattensplitting.
2. ETF-Rendite: Die ETF-Rendite betrachte ich als Netto-Rendite nach laufenden Fondskosten und Vorabpauschale. Die Abgeltungsteuer auf Entnahmen modelliere ich jedoch explizit.
3. Krankengeld: GKV-Versicherte erhalten im Krankheitsfall Krankengeld; dies berücksichtige ich im Modell nicht explizit. Das ist eine konservative Vereinfachung zugunsten der GKV.
4. Zusatzversicherungen: Für GKV-Versicherte nehme ich im Modell keine privaten Krankenzusatzversicherungen an.
5. Kapitaleinkünfte: Depotentnahmen im Rentenalter betrachte ich steuerlich isoliert vom Renteneinkommen. Es gibt keinen Progressionsvorbehalt auf Kapitalerträge.
6. PKV-Beitragsrückerstattung (BRE): Eine Beitragsrückerstattung berücksichtige ich im Modell nicht.
7. JAEG-Prüfung: Ich prüfe die PKV-Zugangsberechtigung anhand des Startgehalts gegen die JAEG 2026. Eine dynamische Prüfung in Folgejahren führe ich nicht durch.

## Lizenz
Alle Rechte vorbehalten. Copyright JanTren.
