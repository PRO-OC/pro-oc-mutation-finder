# PRO OC Mutation finder

![Preview](preview/nahled.png)
![Preview](preview/nahled2.png)
![Preview](preview/nahled2.png)

Rozšíření do prohlížeče obsahující automatický skript, který prochází přiložené Covid-19 žádanky a k nim asociované profily pacientů s cílem vypsat všechny pacientovi zjištěné mutace diskriminačními RT-PCR testy.

## Zásady ochrany osobních údajů

Osobní informace pacientů podmíněné přihlášením do modulu [Pacienti COVID-19](https://ereg.ksrzis.cz/Registr/CUDZadanky/VyhledaniPacienta) jsou použity pouze pro zavolání již stávajících funkcí modulu. **Data nejsou jakkoliv zpracovávána ani přeposílána mimo tyto systémy.**

## Účel

Vypsat všechny mutace zjištěné (pozitivní i negativní) diskriminačními PCR testy.

## Použití


1. Vyexportovat žádanky na stránce [Moje žádanky](https://ereg.ksrzis.cz/Registr/CUDZadanky/MojeZadanky) s výsledkem pozitivní do souboru.

![Preview](preview/export.png)

a soubor přesunout do složky **Assets/Žádanky.xlsx** (je ve formátu):
- **1. řádek** obsahující sloupce v tomto pořadí: Datum, Číslo žádanky, Jméno, Příjmení, Číslo pojištěnce, Číslo pacienta, Stav žádanky, Pojišťovna (řádek je nepovinný, může zůstat prázdný, data se ale vždy začínají načítat až od 2. řádku)
- **2. až n. řádek** konkrétních dat (nepovinné sloupce jsou Datum, Stav žádanky a Pojišťovna) 

2. Přihlásit se do webové aplikace [Žádanky Covid-19](https://eregpublicsecure.ksrzis.cz/Registr/CUD/Overeni/Prihlaseni) a modulu [Pacienti Covid-19](https://eregotp.ksrzis.cz/), kde je potřeba zakliknout roli Vakcinace
3. Rozšíření nahrát do prohlížeče, kliknout na ikonu rozšíření (v případě potřeby zobrazení logování kliknout prozkoumat popup okno a otevřít záložku console),  kliknout na tlačítko pod ikonou rozšíření

![Preview](preview/tlacitko_spusteni.png)

4. Zobrazené logy uložené z console lze zpřehlednit např. takto:

```
# jednotlivé sloupce oddělené mezerami
cat report_file.log | grep '^popup.js:*' | cut -b 21- | sort -n -t"." -k3 -k2 -k1 | uniq | awk NF > report_file_formatted.log

# převedení na .csv s oddělovačem středníkem a hlavičkou
cat report_file_formatted.log | sed '-es/ /;/'{6..1} > report_file.csv
echo -e "Datum;Cislo_zadanky;Datum_narozeni;Pohlavi;Nazev_mutace;Vysledek_mutace;Laborator1;Laborator2;Laborator3" | cat - report_file.csv > report_file.cs
# otevřít a zavřít například v Libre Office Calc, aby se doplnili chybějící separátor pro Laboratoř č. 2 a 3
```

## Logování

- Každý záznam uvádí číslo žádanky ke které se vztahuje

```
...
 19.07.2021 6907778154 23.12.1992 žena E484K Negativní PHA-325&Všeobecná fakultní nemocnice v Praze&64165
 15.08.2021 3032525969 10.10.1991 žena L452R Pozitivní PHA-433&Všeobecná fakultní nemocnice v Praze, ULBLD, Sérologická laboratoř&64165
 15.08.2021 3032525969 10.10.1991 žena P681R Pozitivní PHA-433&Všeobecná fakultní nemocnice v Praze, ULBLD, Sérologická laboratoř&64165
 02.01.2022 2990218714 05.06.2001 žena Del69-70 Pozitivní PHA-325&Všeobecná fakultní nemocnice v Praze&64165
 02.01.2022 2990218714 05.06.2001 žena K417N Pozitivní PHA-325&Všeobecná fakultní nemocnice v Praze&64165
 05.01.2022 3030669682 01.12.1990 žena Del69-70 Pozitivní PHA-325&Všeobecná fakultní nemocnice v Praze&64165
...
```

## Problémy

- Stává se relativně často, že zadané mutace u konkrétního konfirmačního RT-PCR testu jsou duplikované

![Preview](preview/duplikovane_uvedene_mutace.png)


