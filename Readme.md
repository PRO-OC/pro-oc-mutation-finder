# PRO OC Mutation finder

![Preview](preview/nahled.png)
![Preview](preview/nahled2.png)
![Preview](preview/nahled2.png)

Rozšíření do prohlížeče obsahující automatický skript, který prochází přiložené Covid-19 žádanky a k nim asociované profily pacientů s cílem vypsat všechny pacientovi zjištěné mutace diskriminačními RT-PCR testy.

## Zásady ochrany osobních údajů

Osobní informace pacientů podmíněné přihlášením do modulu [Pacienti COVID-19](https://ereg.ksrzis.cz/Registr/CUDZadanky/VyhledaniPacienta) jsou použity pouze pro zavolání již stávajících funkcí modulu. **Data nejsou jakkoliv zpracovávána ani přeposílána mimo tyto systémy.**

## Účel

Vypsat všechny pozitivní mutace zjištěné diskriminačními PCR testy.

## Použití

1. Přesunout soubor se žádankami do složky **Assets/Žádanky.xlsx** ve formátu:
- **1. řádek** obsahující sloupce v tomto pořadí: Datum, Číslo žádanky, Jméno, Příjmení, Číslo pojištěnce, Číslo pacienta, Stav žádanky, Pojišťovna (řádek je nepovinný, může zůstat prázdný, data se ale vždy začínají načítat až od 2. řádku)
- **2. až n. řádek** konkrétních dat (nepovinné sloupce jsou Datum, Stav žádanky a Pojišťovna) 
- žádanky za předchozí den je pro přihlášené zdravotnické zařízení možné v tomto formátu vyexportovat na stránce [Moje žádanky](https://ereg.ksrzis.cz/Registr/CUDZadanky/MojeZadanky)

![Preview](preview/export.png)

2. Přihlásit se do webové aplikace [Žádanky Covid-19](https://eregpublicsecure.ksrzis.cz/Registr/CUD/Overeni/Prihlaseni) a modulu [Pacienti Covid-19](https://eregotp.ksrzis.cz/), kde je potřeba zakliknout roli Vakcinace
3. Rozšíření nahrát do prohlížeče, kliknout na ikonu rozšíření (v případě potřeby zobrazení logování kliknout prozkoumat popup okno a otevřít záložku console),  kliknout na tlačítko pod ikonou rozšíření

![Preview](preview/tlacitko_spusteni.png)

4. Zobrazené logy v consoli lze zpřehlednit např. takto `cat ulozit-jako-z-console-f12.log | grep '^popup.js:*' | sort -k8 -n > output.log`

## Logování

- Každý záznam uvádí číslo žádanky ke které se vztahuje

```
...
782
popup.js:72 Mutace 16. 1. 2022 21:15:00 1698586963 Del69-70
popup.js:72 Mutace 16. 1. 2022 21:15:00 1698586963 E484K
popup.js:72 Mutace 16. 1. 2022 21:15:00 1698586963 K417N
popup.js:77 784
popup.js:72 Mutace 16. 1. 2022 21:14:00 2309808822 Del69-70
popup.js:72 Mutace 16. 1. 2022 21:14:00 2309808822 E484K
popup.js:72 Mutace 16. 1. 2022 21:14:00 2309808822 K417N
popup.js:77 786
popup.js:77 787
popup.js:77 788
popup.js:77 789
popup.js:77 790
popup.js:72 Mutace 16. 1. 2022 21:06:00 7781498573 Del69-70
popup.js:72 Mutace 16. 1. 2022 21:06:00 7781498573 E484K
popup.js:72 Mutace 16. 1. 2022 21:06:00 7781498573 K417N
popup.js:77 792
...
```
