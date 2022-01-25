var ViaReportButton = document.getElementById("Button");
if (ViaReportButton) {
    ViaReportButton.onclick = function() {

        isEregKsrzisSignedIn(function(isSignedIn) {

            if(isSignedIn) {
                getRegistrLoginCookies(function (cookieParams) {

                    var kodOsoby = cookieParams.get("kodOsoby");
                    var heslo = cookieParams.get("heslo");

                    if(!kodOsoby || !heslo) {
                        alert("Je potřeba být přihlášený do registru Žadanky Covid-19.")
                    } else {
                        var url = chrome.runtime.getURL("assets/Zadanky.xlsx");
                        fetch(url)
                            .then(response => {
                                response.arrayBuffer().then(xlsxBytes => {

                                    var workbook = XLSX.readFile(xlsxBytes);

                                    var firstSheetName = workbook.SheetNames[0];
                                    var worksheet = workbook.Sheets[firstSheetName];
                                    var startIndex = 2;

                                    tryToFindProfile(startIndex, worksheet); 
                                });
                        });
                    }
                });
            } else {
                alert("Je potřeba být přihlášený do ereg registru.")
            }
        });
    }
}

function getRegistrLoginCookieName() {
    return "MyUniqueKey";
}

function getRegistrLoginCookies(callback) {
    var registrUrl = getRegistrUrl();

    chrome.cookies.get({
        url: registrUrl, 
        name: getRegistrLoginCookieName()
    }, function(cookie) {
        if(!cookie) {
            callback(new URLSearchParams());
        } else {
            var cookieParams = new URLSearchParams(cookie.value);
            callback(cookieParams);
        }
    });
}

async function tryToFindProfile(index, worksheet) {
    var CisloZadanky = worksheet["B" + index].h;

    while(CisloZadanky) {

        // testing purpose
        // var CisloZadanky = 1749458103;
        // var CisloPacienta = 8225858620;

        await tryToFindProfileByCisloZadanky(index, CisloZadanky); 

        index++;
        try {
            CisloZadanky = worksheet["B" + index].h;
            //CisloZadanky = null;  // only testing purpose
        } catch(e) {
            break;
        }
    }
}

async function tryToFindProfileByCisloZadanky(index, CisloZadanky) {
    return new Promise(function (resolve, reject) {
        getZadankaData(CisloZadanky).then(function(ZadankaData) {
            tryToFindProfileByZadankaData(ZadankaData, function(Profily) {
                if(Profily.filter(function(Profil) {
                    return Profil.Pacient_DiscriminacniPCRMutace.length;
                }).length) {
                    Profily.forEach(function(Profile) {
                        Profile.Pacient_DiscriminacniPCRMutace.forEach(function(DiscriminacniPCR) {
                            DiscriminacniPCR.Mutace.forEach(Mutace => {
                                console.log("Mutace", DiscriminacniPCR.Datum, CisloZadanky, Mutace.Kod);
                            });
                        });
                    });
                } else {
                    console.log(index);
                }
                resolve();
            });
        });
    });
}

function isEregKsrzisSignedIn(callback) {
    var url = getEregRegistrUrl();
  
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if(xhr.readyState === XMLHttpRequest.DONE) {
  
            if(xhr.status == 200) {
  
                var parser = new DOMParser();
                var responseDocument = parser.parseFromString(xhr.responseText,"text/html");
  
                if(responseDocument.title.includes("Přihlášení")) {
                    callback(false);
                } else {
                    callback(true);
                }
            } else {
                callback(false);
            }
        }
    };
    xhr.send();
}


function getSpatneStatniPrislustnost(StatniPrislusnost) {

    // správně, return špatně vytvořený profil s danou státní příslušností
    switch(StatniPrislusnost) {
        // Irsko
        case "IE":
            // Írán
            return "IR";
        // Írán
        case "IR":
            // Irsko
            return "IE";
        // Moldavsko
        case "MD":
            // Makao
            return "MO";
        // Makao
        case "MO":
            // Moldavsko
            return "MD";
        // Ukrajina
        case "UA":
            // Spojené království
            return "UK";
        // Spojené království
        case "UK":
            // Ukrajina
            return "UA";
        // Arménie
        case "AM":
            // Argentina
            return "AR";
        // Arménie
        case "AR":
            // Argentina
            return "AM";
        // Rumunsko
        case "RO":
            // Rusko
            return "RU";
        // Rusko
        case "RU":
            // Rumunsko
            return "RO";
        default:
            return StatniPrislusnost;
    }
}

function tryToFindProfileByZadankaData(ZadankaData, callback) {
    if(ZadankaData.TestovanyNarodnostKod == "CZ") {
        tryToFindCzechProfileByZadankaData(ZadankaData, callback);
    } else {
        tryToFindForeignProfileByZadankaData(ZadankaData, callback);
    }
}

function tryToFindCzechProfileByZadankaData(ZadankaData, callback) {

    var searchVariantJmenoPrijmeniDatumNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "JmenoPrijmeniRC"
    };

    var Profiles = [];
    loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeni, function(Profile) {
        if(Profile.Cislo) {
            Profiles.push(Profile);
        }
        callback(Profiles);
    });
}

function tryToFindForeignProfileByZadankaData(ZadankaData, callback) {

    var searchVariantJmenoPrijmeniDatumNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "JmenoPrijmeniRC"
    };

    var searchVariantJmenoPrijmeniDatumNarozeniSpatne = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni:  "01" + ZadankaData.TestovanyDatumNarozeniText.substring(ZadankaData.TestovanyDatumNarozeniText.indexOf("."), ZadankaData.TestovanyDatumNarozeniText.length),
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "JmenoPrijmeniRC"
    };

    var searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        CisloPojistence: ZadankaData.TestovanyCisloPojistence,
        TypVyhledani: "JmenoPrijmeniDatumNarozeniMistoNarozeni"
    };

    var searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeniSpatneStatniPrislusnost = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: getSpatneStatniPrislustnost(ZadankaData.TestovanyNarodnostKod),
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "JmenoPrijmeniDatumNarozeniMistoNarozeni"
    };

    var searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeniSpatneDatumNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: "01" + ZadankaData.TestovanyDatumNarozeniText.substring(ZadankaData.TestovanyDatumNarozeniText.indexOf("."), ZadankaData.TestovanyDatumNarozeniText.length),
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "JmenoPrijmeniDatumNarozeniMistoNarozeni"
    };

    var searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeniSpatneDatumNarozeniSpatneStatniPrislusnost = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: "01" + ZadankaData.TestovanyDatumNarozeniText.substring(ZadankaData.TestovanyDatumNarozeniText.indexOf("."), ZadankaData.TestovanyDatumNarozeniText.length),
        StatniPrislusnost: getSpatneStatniPrislustnost(ZadankaData.TestovanyNarodnostKod),
        TypVyhledani: "JmenoPrijmeniDatumNarozeniMistoNarozeni"
    };

    var searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstvi = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "CizinecJmenoPrijmeniDatumNarozniObcanstvi"
    };

    var searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstviSpatneStatniPrislusnost = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: getSpatneStatniPrislustnost(ZadankaData.TestovanyNarodnostKod),
        TypVyhledani: "CizinecJmenoPrijmeniDatumNarozniObcanstvi"
    };

    var searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstviSpatneDatumNarozeniSpatneStatniPrislusnost = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: "01" + ZadankaData.TestovanyDatumNarozeniText.substring(ZadankaData.TestovanyDatumNarozeniText.indexOf("."), ZadankaData.TestovanyDatumNarozeniText.length),
        StatniPrislusnost: getSpatneStatniPrislustnost(ZadankaData.TestovanyNarodnostKod),
        TypVyhledani: "CizinecJmenoPrijmeniDatumNarozniObcanstvi"
    };

    var searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstviSpatneDatumNarozeni = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: "01" + ZadankaData.TestovanyDatumNarozeniText.substring(ZadankaData.TestovanyDatumNarozeniText.indexOf("."), ZadankaData.TestovanyDatumNarozeniText.length),
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        TypVyhledani: "CizinecJmenoPrijmeniDatumNarozniObcanstvi"
    };

    var searchVariantCizinecCisloPojistence = {
        Jmeno: ZadankaData.TestovanyJmeno,
        Prijmeni: ZadankaData.TestovanyPrijmeni,
        DatumNarozeni: ZadankaData.TestovanyDatumNarozeniText,
        StatniPrislusnost: ZadankaData.TestovanyNarodnostKod,
        CisloPojistence: ZadankaData.TestovanyCisloPojistence,
        TypVyhledani: "CizinecCisloPojistence"
    };

    var Profiles = [];
    loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeni, function(Profile1) {
        if(Profile1.Cislo) {
            Profiles.push(Profile1);
        }
        loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeniSpatne, function(Profile2) {
            if(Profile2.Cislo) {
                Profiles.push(Profile2);
            }
            loadOckoUzisPatientInfo(searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstvi, function(Profile3) {
                if(Profile3.Cislo) {
                    Profiles.push(Profile3);
                }
                loadOckoUzisPatientInfo(searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstviSpatneDatumNarozeni, function(Profile4) {
                    if(Profile4.Cislo) {
                        Profiles.push(Profile4);
                    }
                    loadOckoUzisPatientInfo(searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstviSpatneStatniPrislusnost, function(Profile5) {
                        if(Profile5.Cislo) {
                            Profiles.push(Profile5);
                        }
                        loadOckoUzisPatientInfo(searchVariantCizinecJmenoPrijmeniDatumNarozniObcanstviSpatneDatumNarozeniSpatneStatniPrislusnost, function(Profile6) {
                            if(Profile6.Cislo) {
                                Profiles.push(Profile6);
                            }
                            loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeni, function(Profile7) {
                                if(Profile7.Cislo) {
                                    Profiles.push(Profile7);
                                }
                                loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeniSpatneDatumNarozeni, function(Profile8) {
                                    if(Profile8.Cislo) {
                                        Profiles.push(Profile8);
                                    }
                                    loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeniSpatneStatniPrislusnost, function(Profile9) {
                                        if(Profile9.Cislo) {
                                            Profiles.push(Profile9);
                                        }
                                        loadOckoUzisPatientInfo(searchVariantJmenoPrijmeniDatumNarozeniMistoNarozeniSpatneDatumNarozeniSpatneStatniPrislusnost, function(Profile10) {
                                            if(Profile10.Cislo) {
                                                Profiles.push(Profile10);
                                            }
                                            loadOckoUzisPatientInfo(searchVariantCizinecCisloPojistence, function(Profile11) {
                                                if(Profile11.Cislo) {
                                                    Profiles.push(Profile11);
                                                }                                                

                                                const filteredProfiles = Profiles.filter((obj, index, arr) => {
                                                    return arr.map(mapObj => mapObj.Cislo).indexOf(obj.Cislo) === index;
                                                });

                                                callback(filteredProfiles);
                                            });
                                        })
                                    });                            
                                });
                            });
                        });                        
                    });
                });
            });
        });
    });
}

function getEregRegistrDomain() {
    return "ereg.ksrzis.cz";
}

function getEregRegistrUrl() {
    return "https://" + getEregRegistrDomain();
}

function getRegistrDomain() {
    return "eregpublicsecure.ksrzis.cz";
}

function getRegistrUrl() {
    return "https://" + getRegistrDomain();
}

function getRegistrCUDOvereniCisloZadankyUrl(kodOsoby, heslo, cisloZadanky) {
    var urlParams = new URLSearchParams();
      
    urlParams.set("PracovnikKodOsoby", kodOsoby);
    urlParams.set("heslo", heslo);
    urlParams.set("Cislo", cisloZadanky);
      
    return getRegistrUrl() + "/Registr/CUD/Overeni/Json" + "?" + urlParams.toString();
}

function getRegistrCUDVyhledaniPacientaUrl() {
    return getEregRegistrUrl() + "/Registr/CUDZadanky/VyhledaniPacienta";
}

function getRegistrCUDVyhledaniPacientaUrlParams(zadanka) {
    var urlParams = new URLSearchParams();
    urlParams.set("DuvodVyhledani", "VyhledatPacienta");
    urlParams.set("TypVyhledani", zadanka.StatniPrislusnost == "CZ" ? "JmenoPrijmeniRC" : zadanka.TypVyhledani ? zadanka.TypVyhledani : "CizinecJmenoPrijmeniDatumNarozniObcanstvi");
    if(zadanka.TypVyhledani != "CizinecCisloPojistence") {
        urlParams.set("Jmeno", zadanka.Jmeno);
        urlParams.set("Prijmeni", zadanka.Prijmeni);
    }
    if(zadanka.CisloPojistence) {
        urlParams.set("CisloPojistence", zadanka.CisloPojistence);
    }
    if(zadanka.StatniPrislusnost == "CZ") {
      urlParams.set("RodneCislo", zadanka.CisloPojistence);
    } else {
        if(zadanka.TypVyhledani != "CizinecCisloPojistence") {
            urlParams.set("DatumNarozeni", zadanka.DatumNarozeni);

            urlParams.set("ZemeKod", zadanka.StatniPrislusnost);
        }
    }
    urlParams.set("_submit", "None");
    return urlParams;
}

function loadOckoUzisPatientInfo(zadanka, callback) {

    var url = getRegistrCUDVyhledaniPacientaUrl();
    var urlParams = getRegistrCUDVyhledaniPacientaUrlParams(zadanka);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status == 200) {
  
            var parser = new DOMParser();
            var responseDocument = parser.parseFromString(xhr.responseText,"text/html");

            var results = {};

            var results = {
                Telefon: undefined,
                Email: undefined,
                Cislo: undefined,
                PacientDatumNarozeniText: undefined,
                Pacient_NarodnostKod: undefined,
                Pacient_RobObcanstviZemeKod: undefined,
                Pacient_DiscriminacniPCRMutace: []
            };

            var labels = responseDocument.getElementsByTagName('label');
            for (var i = 0; i < labels.length; i++) {
            switch(labels[i].htmlFor) {
                case 'Pacient_Telefon':
                    results.Telefon = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_Email':
                    results.Email = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_CisloPacienta':
                    results.Cislo = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'PacientDatumNarozeniText':
                    results.PacientDatumNarozeniText = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_NarodnostKod':
                    results.Pacient_NarodnostKod = labels[i].nextElementSibling.innerText.trim();
                    break;
                case 'Pacient_RobObcanstviZemeKod':
                    results.Pacient_RobObcanstviZemeKod = labels[i].nextElementSibling.innerText.trim();
                    break;
                }
            }

            if(results.Cislo) {
                var headersWithMutationsNodes = responseDocument.evaluate("//th[contains(text(), 'Kód mutace')]", responseDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

                for (i = 0; i < headersWithMutationsNodes.snapshotLength; i++) {

                    var mutationRow = null;

                    mutationRow = headersWithMutationsNodes.snapshotItem(i).parentNode.nextSibling;
                    var mutations = [];

                    while(mutationRow) {
                        
                        if(mutationRow.childNodes[1].innerText == "Pozitivní") {
                            mutations.push({ 
                                'Kod': mutationRow.childNodes[0].innerText,
                                'Vysledek': mutationRow.childNodes[1].innerText 
                            });
                        }
                        mutationRow = mutationRow.nextSibling;
                    }

                    results.Pacient_DiscriminacniPCRMutace.push({
                        'Datum': headersWithMutationsNodes.snapshotItem(i).parentNode.parentNode.parentNode.parentNode.parentNode.previousSibling.childNodes[2].innerText,
                        'Mutace': mutations,
                    });
                }
            }

            results.Link = xhr.responseURL;
            results.EditLink = xhr.responseURL.replace("Index", "Edit");
  
            callback(results);
        }
    }
    xhr.send(urlParams.toString());
}


async function getZadankaData(cisloZadanky) {

    return new Promise(function (resolve, reject) {

        getRegistrLoginCookies(function (cookieParams) {

            var kodOsoby = cookieParams.get("kodOsoby");
            var heslo = cookieParams.get("heslo");
        
            if(!kodOsoby || !heslo) {
                resolve();
            }

            var url = getRegistrCUDOvereniCisloZadankyUrl(kodOsoby, heslo, cisloZadanky);
  
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.setRequestHeader("Content-Type","application/json; charset=UTF-8");
            xhr.onreadystatechange = function() {
                if(xhr.readyState == XMLHttpRequest.DONE) {
                    if(xhr.status == 200) {
                        var data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } else {
                        resolve();
                    }
                }
            };
            xhr.send();
        });
    });
}