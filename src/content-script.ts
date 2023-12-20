let language = localStorage.getItem("language");

if (language === null) {
    language = chrome.i18n.getUILanguage();
}

if (language !== "cs") {
    language = "en";
}

interface Message {
    [key: string]: string;
}

const message: Message = {};

if (language === "cs") {
    message.settings = "Nastavení";
    message.predictor = "Předvídač";
    message.wideMode = "Široký režim";
    message.bigMarks = "Velké známky";
    message.hideWeightPoints = "Skrýt váhu ze známek s body";
    message.addMark = "Přidat známku";
    message.removeMarks = "Odstranit známky";
    message.instaRemoveMarks = "Ihned odstranit známky";
    message.inputMarkPlaceholder = "Známka";
    message.inputMarkPlaceholderPoints = "Body";
    message.inputWeightPlaceholder = "Váha";
    message.inputWeightPlaceholderPoints = "Max body";
    message.average = "Průměr";
    message.percentage = "Počet %";
    message.markIsInvalid = "Známka je neplatná.";
    message.weightIsInvalid = "Váha je neplatná.";
    message.pointsAreInvalid = "Počet bodů je neplatný.";
    message.maxPointsAreInvalid = "Maximalní počet bodů je neplatný.";
    message.removeMark = "Opravdu chcete odstranit známku? ";
    message.overallAverage = "Celkový průměr";
    message.subject = "Předmět";
    message.replaceTypeWithWeight = "Nahradit typ za váhu";
    message.clickOnBtReplaceTypeWithWeight = "Změna se projeví po znovu načtení stránky.";
} else {
    message.settings = "Settings";
    message.predictor = "Predictor";
    message.wideMode = "Wide mode";
    message.bigMarks = "Big marks";
    message.hideWeightPoints = "Hide weight from marks with points";
    message.addMark = "Add mark";
    message.removeMarks = "Remove marks";
    message.instaRemoveMarks = "Insta remove marks";
    message.inputMarkPlaceholder = "Mark";
    message.inputMarkPlaceholderPoints = "Points";
    message.inputWeightPlaceholder = "Weight";
    message.inputWeightPlaceholderPoints = "Max points";
    message.average = "Average";
    message.percentage = "Percentage";
    message.markIsInvalid = "Mark is invalid.";
    message.weightIsInvalid = "Weight is invalid.";
    message.pointsAreInvalid = "Points are invalid.";
    message.maxPointsAreInvalid = "Max points are invalid.";
    message.removeMark = "Are you sure you want to remove a mark?";
    message.overallAverage = "Overall average";
    message.subject = "Subject";
    message.replaceTypeWithWeight = "Replace type with weight";
    message.clickOnBtReplaceTypeWithWeight = "Change will take effect after the page is refreshed.";
}

let isResizeNeeded = false;

let isSelectedSubjectProgramovani = false;

let isSubjectMarkWorseThan3Left = false;
let isSubjectMarkWorseThan3Right = false;

let isWideModeOn = localStorage.getItem("wideModeOn") === "true";
let areHugeMarksOn = localStorage.getItem("hugeMarksOn") === "true";
let isSettingsOn = localStorage.getItem("settingsOn") === "true";
let isHideWeightFromPointsOn = localStorage.getItem("hideWeightFromPointsOn") === "true";
let isPredictorOn = localStorage.getItem("predictorOn") === "true";
let isRemoveMarksOn = localStorage.getItem("removeMarkOn") === "true";
let isInstaRemoveMarksOn = localStorage.getItem("instaRemoveMarksOn") === "true";
let isReplaceTypeWithWeightOn = localStorage.getItem("replaceTypeWithWeightOn") === "true";

const subjectArray: string[] = [];
const markArray: string[] = [];
const weightArray: string[] = [];

const allSubjects: string[] = [];

const subjectsWithPoints: string[] = [];

let numberOfTries = 0;


function stipendium(prumer: number, typeOfAverage: string) {
    if (
        (typeOfAverage === "left" && isSubjectMarkWorseThan3Left) ||
        (typeOfAverage === "right" && isSubjectMarkWorseThan3Right) ||
        prumer >= 1.51
    ) {
        return 0;
    }
    if (prumer >= 1.41) {
        return 2000;
    }
    if (prumer >= 1.31) {
        return 2500;
    }
    if (prumer >= 1.21) {
        return 3000;
    }
    if (prumer >= 1.11) {
        return 3500;
    }
    if (prumer >= 1.01) {
        return 4000;
    }
    if (prumer === 1) {
        return 5000;
    }
    return Number.NaN;
}

function isNanStrict(a: string) {
    return Number.isNaN(Number(a)) || a.trim() === "";
}

function convertMarkToNumber(mark: string ) {
    const markTemporary: string = mark.replaceAll(/(?<!e)-/giv, ".5");
    if (markTemporary.startsWith(".5") && markTemporary.length > 2) {
        return `-${markTemporary.slice(2)}`;
    }

    return markTemporary;
}

function getpredmetRadekFromIndex(index: number) {
    const cphmain = document.querySelector("#cphmain_DivBySubject")!.querySelectorAll("div.predmet-radek:is([id])");

    const temporary = cphmain[index];

    if (temporary === undefined) {
        throw new Error(`predmetRadek with index ${index} doesn't exist`);
    }

    return temporary;

}

function fixAbxNext(index: number) {
    const divZnamkyDiv = getpredmetRadekFromIndex(index).querySelectorAll(
        `div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div`
    );

    const aBxNextSelector = getpredmetRadekFromIndex(index).querySelector(
        `div.bx-wrapper:nth-child(2) > div.bx-controls.bx-has-controls-direction:nth-child(2) > div.bx-controls-direction > a.bx-next:nth-child(2)`
    );

    if (divZnamkyDiv.length > 1) {
        const isMarksWidthBiggerThanViewport =
            divZnamkyDiv.length * divZnamkyDiv[0]!.clientWidth >
            getpredmetRadekFromIndex(index).querySelector(`div.bx-wrapper > div.bx-viewport`)!.clientWidth;

        if (
            (!isMarksWidthBiggerThanViewport && !aBxNextSelector!.classList.contains("disabled")) ||
            isMarksWidthBiggerThanViewport
        ) {
            isResizeNeeded = true;

            window.dispatchEvent(new Event("resize"));
        }
    }
}

function isSubjectWithPoints(subject: string): boolean {
    return subjectsWithPoints.includes(subject);
}

function convertPercentageToAverage(percentage: number, markPercentage: readonly number[]): number {

    if (markPercentage[4]) {
        if (isNaN(percentage)) {
            return Number.NaN;
        }
        if (percentage >= markPercentage[0]!) {
            return 1;
        }
        if (percentage >= markPercentage[1]!) {
            return 2;
        }
        if (percentage >= markPercentage[2]!) {
            return 3;
        }
        if (percentage >= markPercentage[3]!) {
            return 4;
        }
        return 5;
    }

    if (isNaN(percentage)) {
        return Number.NaN;
    }
    if (percentage > markPercentage[0]!) {
        return 1;
    }
    if (percentage > markPercentage[1]!) {
        return 2;
    }
    if (percentage > markPercentage[2]!) {
        return 3;
    }
    if (percentage > markPercentage[3]!) {
        return 4;
    }
    return 5;
}

function headerInnerHTML(string1: string, string2: string, title1: string, title2: string) {
    return `<div id="h2OverallAverage" style="padding-left: 14px; color: black; padding-bottom: 20px;">
                <h2 title="${title1}" style="color: black;margin-right: 140px;font-size: 1.5em;width: 60px;">${string1}</h2>
                <h2 title="${title2}" title="" style="color: black;font-size: 1.5em;">${string2}</h2>
            </div>`;
}

function refreshOrCreateAverage(addedMarkOn: boolean) {

    isSubjectMarkWorseThan3Left = false;
    isSubjectMarkWorseThan3Right = false;

    let sumLeft = 0;

    const textBelowSubject = document.querySelectorAll(
        `div.info-text > ${addedMarkOn ? "h2:nth-child(1)" : "span.fl:nth-child(1)"}`
    );

    let numberOfValidTextsBelowSubject = 0;

    for (const [y, allSubject] of allSubjects.entries()) {
        let sum = 0;
        let quantity = 0;

        for (const [index, element] of subjectArray.entries()) {
            if (element !== allSubject) {
                continue;
            }

            if (isSubjectWithPoints(element)) {
                sum += Number(convertMarkToNumber(markArray[index]!).split("/")[0]!) * Number(convertMarkToNumber(weightArray[index]!));
                quantity += Number(convertMarkToNumber(markArray[index]!).split("/")[1]!) * Number(convertMarkToNumber(weightArray[index]!));

            } else {
                sum += Number(convertMarkToNumber(markArray[index]!)) * Number(convertMarkToNumber(weightArray[index]!));
                quantity += Number(convertMarkToNumber(weightArray[index]!));
            }
        }

        if (isSubjectWithPoints(allSubject)) {
            const percentage = (sum / quantity) * 100;

            console.log(`${message.subject!}: ${allSubject}   ${message.percentage!}: ${percentage}`);

            let markPercentage: number[];

            if (allSubject === "Databáze") {
                markPercentage = [88, 76, 64, 51, 1];
            } else if (allSubject === "Matematika") {
                markPercentage = [85, 67, 49, 33, 0];
            } else {
                markPercentage = [83, 67, 50, 33, 1];
            }

            // eslint-disable-next-line no-unsanitized/property
            textBelowSubject[y]!.outerHTML = `<h2 title="${
                message.percentage!
            }: ${percentage}% (${convertPercentageToAverage(
                percentage, markPercentage
            )})" class="ext-h2">${message.percentage!}: ${(
                Math.round((percentage + Number.EPSILON) * 100_000) / 100_000
            ).toFixed(2)}% (${convertPercentageToAverage(percentage, markPercentage)})</h2>`;

            if (!Number.isNaN(percentage)) {
                numberOfValidTextsBelowSubject++;

                const sumLeftTemporary = convertPercentageToAverage(percentage, markPercentage);

                if (sumLeftTemporary === 4 || sumLeftTemporary === 5) {
                    isSubjectMarkWorseThan3Left = true;
                }

                sumLeft += sumLeftTemporary;
            }
        } else {
            const average = sum / quantity;

            console.log(`${message.subject!}: ${allSubject}   ${message.average!}: ${average}`);

            // eslint-disable-next-line no-unsanitized/property
            textBelowSubject[y]!.outerHTML = `<h2 title="${
                message.average!
            }: ${average}" class="ext-h2">${message.average!}: ${(
                Math.round((average + Number.EPSILON) * 100) / 100
            ).toFixed(2)}</h2>`;

            if (!Number.isNaN(average)) {
                sumLeft += Math.round(average);
                if (Math.round(average) >= 4) {
                    isSubjectMarkWorseThan3Left = true;
                }
                numberOfValidTextsBelowSubject++;
            }
        }
    }

    const subjectMark = document.querySelectorAll<HTMLElement>("div.leva > div.hlavni > div");

    let sumRight = 0;

    if (subjectMark.length > 0) {
        for (let index = 0; index < allSubjects.length; index++) {
            sumRight += Number.parseInt(subjectMark[index]!.textContent!, 10);

            if (Number.parseInt(subjectMark[index]!.textContent!, 10) >= 4) {
                isSubjectMarkWorseThan3Right = true;
            }
        }
    }

    const overallAverageLeft = sumLeft / numberOfValidTextsBelowSubject;
    const overallAverageRight = sumRight / allSubjects.length;

    const overallAverageLeftRounded = Math.round((overallAverageLeft + Number.EPSILON) * 100) / 100;
    const overallAverageRightRounded = Math.round((overallAverageRight + Number.EPSILON) * 100) / 100;

    console.log(`overallAverageLeft: ${overallAverageLeft}`);
    console.log(`overallAverageRight: ${overallAverageRight}`);

    let headerOverallAverage;

    if (addedMarkOn) {
        headerOverallAverage = document.querySelector<HTMLElement>("#headerOverallAverage")!;
    } else {
        headerOverallAverage = document.createElement("header");
        headerOverallAverage.id = "headerOverallAverage";
        document.querySelector("main")!.append(headerOverallAverage);
    }

    headerOverallAverage.setAttribute("style", "padding-left: 0px;padding-right: 0px;padding-top: 0px;padding-bottom: 0px;");

    // eslint-disable-next-line no-unsanitized/property
    headerOverallAverage.innerHTML = headerInnerHTML(
        overallAverageLeftRounded.toString(),
        subjectMark.length > 0 &&
            !addedMarkOn &&
            !isNanStrict(overallAverageRightRounded.toString())
            ? overallAverageRightRounded.toString()
            : "",
        `${message.overallAverage!}: ${overallAverageLeft}`,
        `${message.overallAverage!}: ${overallAverageRight}`
    );

    let headerStipendium;

    if (addedMarkOn) {
        headerStipendium = document.querySelector<HTMLElement>("#headerStipendium")!;
    } else {
        headerStipendium = document.createElement("header");
        headerStipendium.id = "headerStipendium";
        document.querySelector("main")!.append(headerStipendium);
    }

    headerStipendium.setAttribute("style", "padding-left: 0px;padding-right: 0px;padding-top: 0px;padding-bottom: 0px;");

    // eslint-disable-next-line no-unsanitized/property
    headerStipendium.innerHTML = headerInnerHTML(
        `${stipendium(overallAverageLeftRounded, "left")},-`,
        subjectMark.length > 0 && !isNanStrict(overallAverageRightRounded.toString())
            ? `${stipendium(overallAverageRightRounded, "right")},-`
            : "",
        "Stipendium",
        "Stipendium"
    );
}

function getParentPredmetRadek(element: Element) {
    let parent = element;
    while (parent.className !== "predmet-radek") {
        parent = parent.parentElement!;
    }
    return parent;
}

function removeMark(addedMark: Element) {

    function removeMarkIdk() {

        let subjectTemporary: string;
        let markTemporary: string;
        let weightTemporary: string;

        let subjectIndex = 0;

        if (addedMark.getAttribute("data-clasif") === null) {
            const predmetRadek = getParentPredmetRadek(addedMark);
            const cphmain = document.querySelector("#cphmain_DivBySubject")!.querySelectorAll("div.predmet-radek:is([id])");

            subjectIndex = Array.from(cphmain).indexOf(predmetRadek);

            subjectTemporary = allSubjects[subjectIndex]!;
            markTemporary = isSubjectWithPoints(subjectTemporary)
                ? `${addedMark
                      .querySelector<HTMLElement>("div.ob")!
                      .textContent!.trim()}/${addedMark
                      .querySelector<HTMLElement>("div.bod")!
                      .textContent!.trim()}`
                : addedMark.querySelector<HTMLElement>("div.ob")!.textContent!.trim();
            weightTemporary = addedMark.querySelector<HTMLElement>("span.w-100")!.textContent!;
        } else {
            const splitArray: unknown = JSON.parse(addedMark.getAttribute("data-clasif")!);

            subjectTemporary = splitArray.nazev;
            subjectIndex = allSubjects.indexOf(subjectTemporary);

            markTemporary = isSubjectWithPoints(subjectTemporary)
                ? `${splitArray.MarkText}/${splitArray.bodymax}`
                : splitArray.MarkText;

            if (subjectIndex === -1) {
                throw new TypeError(`subject "${subjectTemporary}" is not in allSubjects\nallSubjects: ${allSubjects.toString()}`);
            }

            if (!Number(convertMarkToNumber(splitArray.MarkText))) {
                addedMark.remove();

                fixAbxNext(subjectIndex);

                const allTooltipsSelector = document.querySelectorAll("div.ui-tooltip");

                allTooltipsSelector.forEach((element) => {
                    element.remove();
                });

                return;
            }

            weightTemporary = splitArray.vaha.toString();
        }

        addedMark.remove();

        let isMarkFound = false;

        for (let index = 0; index < subjectArray.length; index++) {
            if (
                subjectArray[index] === subjectTemporary &&
                markArray[index] === markTemporary &&
                weightArray[index] === weightTemporary
            ) {
                subjectArray.splice(index, 1);
                markArray.splice(index, 1);
                weightArray.splice(index, 1);

                isMarkFound = true;
                break;
            }
        }

        if (!isMarkFound) {
            throw new Error(`mark to remove not found:\nsubjectTemporary: ${subjectTemporary}\nmarkTemporary: ${markTemporary}\nweightTemporary: ${weightTemporary}\nsubjectArray: ${subjectArray.toString()}\nmarkArray: ${markArray.toString()}\nweightArray: ${weightArray.toString()}`);
        }

        fixAbxNext(subjectIndex);

        const allTooltipsSelector = document.querySelectorAll("div.ui-tooltip");

        allTooltipsSelector.forEach(element => { element.remove() });

        refreshOrCreateAverage(true);
    }

    if (isInstaRemoveMarksOn || (isRemoveMarksOn && confirm(message.removeMark))) {
        removeMarkIdk();
    }
}

function addMarkButton() {
    const select: HTMLSelectElement = document.querySelector("#selectSubject")!;
    const subjectTemporary: string = select.options[select.selectedIndex]!.text;

    const markTemporary: string = document.querySelector<HTMLInputElement>("#inputMark")!.value;

    const maxPointsTemporary: string = document.querySelector<HTMLInputElement>("#inputMaxPoints")!.value;
    const weightTemporary: string = document.querySelector<HTMLInputElement>("#inputWeight")!.value;

    let alertText = "";

    if (isSelectedSubjectProgramovani) {
        if (isNanStrict(convertMarkToNumber(markTemporary))) {
            alertText += message.pointsAreInvalid;
        }
        if (isNanStrict(convertMarkToNumber(maxPointsTemporary))) {
            alertText += message.maxPointsAreInvalid;
        }
    } else if (isNanStrict(convertMarkToNumber(markTemporary))) {
        alertText += message.markIsInvalid;
    }
    if (isNanStrict(convertMarkToNumber(weightTemporary))) {
        alertText += message.weightIsInvalid;
    }

    if (alertText.length > 0) {
        alert(alertText.replaceAll(".", ".\n"));

        return;
    }

    subjectArray.push(subjectTemporary);
    markArray.push(
        isSelectedSubjectProgramovani ? `${markTemporary}/${maxPointsTemporary}` : markTemporary
    );
    weightArray.push(weightTemporary);

    const cphmain = document.querySelector("#cphmain_DivBySubject")!.querySelectorAll("div.predmet-radek:is([id])");

    const predmetRadek = cphmain[select.selectedIndex];
    

    const divPredmetRadekSelector = predmetRadek!.querySelector(`div > div > div.znamky`);

    const addedMarkCreate = document.createElement("div");
    addedMarkCreate.id = "addedMark";
    divPredmetRadekSelector!.append(addedMarkCreate);

    const spanStyle: string = isSelectedSubjectProgramovani
        ? isHideWeightFromPointsOn
            ? 'style="visibility: hidden;"'
            : ""
        : areHugeMarksOn
          ? 'style="height: 20px; padding-top: 10px; font-size: 25px;"'
          : "";

    // eslint-disable-next-line no-unsanitized/property
    document.querySelector(
        "#addedMark"
    )!.outerHTML = `<div class="znamka-v tooltip-bubble addedMark" style="float: left; list-style: none; position: relative; width: 56px; background-color: #ffa50069;" id="addedMark">
                        <div class="cislovka  obrovsky" id="obrovsky">
                            <div class="ob">${markTemporary}</div>
                        </div>
                        <div class="bod" ${isSelectedSubjectProgramovani && areHugeMarksOn && isHideWeightFromPointsOn ? 'style="height: 30px; margin-top: -15px; font-size: 25px; line-height: 30px;"' : isSelectedSubjectProgramovani && isHideWeightFromPointsOn ? 'style="height: 30px; margin-top: -15px; font-size: 9px; line-height: 50px;"' : ""}>${isSelectedSubjectProgramovani ? maxPointsTemporary : ""}</div>
                        <div class="dodatek" ${areHugeMarksOn && !isSelectedSubjectProgramovani ? 'style="height: 42px;"' : ""}>
                            <span class="w-100 d-inline-block" ${spanStyle}>${weightTemporary}</span>
                        </div>
                    </div>`;

    document.querySelector("#addedMark")!.addEventListener(
        "click",
        function () {
            removeMark(this);
        },
        false
    );

    document.querySelector("#addedMark")!.id = "";

    if (predmetRadek!.classList.contains("hide-bx-wrapper")) {
        predmetRadek!.classList.remove("hide-bx-wrapper");
        window.dispatchEvent(new Event("resize"));
    }

    fixAbxNext(select.selectedIndex);

    refreshOrCreateAverage(true);
}

function fixAllAbxNext() {
    isResizeNeeded = false;

    const divZnamkySelector = document.querySelectorAll("div.znamky");

    for (let index = 0; index < divZnamkySelector.length; index++) {
        fixAbxNext(index);

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (isResizeNeeded) {
            return;
        }
    }
}

function wideModeButton() {
  
    const btWideModeSelector = document.querySelector<HTMLElement>("#btWideMode");

    if (isWideModeOn) {
        document
            .querySelector("div#obsah._loadingContainer > div")!
            .setAttribute("style", "max-width: 1000px");

        if (btWideModeSelector) {
            btWideModeSelector.style.cssText += "background: #fff; color: #00A2E2;";
        }

    } else {
        document
            .querySelector("div#obsah._loadingContainer > div")!
            .setAttribute("style", "max-width: 10000px");

        if (btWideModeSelector) {
            btWideModeSelector.style.cssText += "background: #00a2e2; color: #ffff";
        }
    }

    fixAllAbxNext();

    isWideModeOn = !isWideModeOn;

    localStorage.setItem("wideModeOn", isWideModeOn.toString());
}

function hideWeightFromMarksWithPoints() {

    const firstMarkInSubjectPoint = document.querySelectorAll(
        "div.znamka-v.tooltip-bubble:nth-child(1) > div.bod"
    );

    for (const element of firstMarkInSubjectPoint) {

        if (element.innerHTML.trim() === "") {
            continue;
        }

        const cphmain = document.querySelector("#cphmain_DivBySubject")!.querySelectorAll("div.predmet-radek:is([id])");
        const predmetRadek = getParentPredmetRadek(element);

        const index = Array.from(cphmain).indexOf(predmetRadek);

        let allMarksOf1SubjectWeight = getpredmetRadekFromIndex(index).querySelectorAll<HTMLElement>(
            `div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div.znamka-v.tooltip-bubble > div.dodatek > span.w-100`
        );
        let allMarksOf1SubjectPoints = getpredmetRadekFromIndex(index).querySelectorAll<HTMLElement>(
            `div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div.znamka-v.tooltip-bubble > div.bod`
        );

        if (allMarksOf1SubjectWeight.length === 0) {
            allMarksOf1SubjectWeight = getpredmetRadekFromIndex(index).querySelectorAll(
                `div.znamky > div.znamka-v.tooltip-bubble > div.dodatek > span.w-100`
            );
        }

        if (allMarksOf1SubjectPoints.length === 0) {
            allMarksOf1SubjectPoints = getpredmetRadekFromIndex(index).querySelectorAll(
                `div.znamky > div.znamka-v.tooltip-bubble > div.bod`
            );
        }

        if (isHideWeightFromPointsOn) {
            for (const [y, element2] of allMarksOf1SubjectWeight.entries()) {
                element2.style.visibility = "";
                allMarksOf1SubjectPoints[y]!.style.height = "";
                allMarksOf1SubjectPoints[y]!.style.fontSize = "";
                allMarksOf1SubjectPoints[y]!.style.marginTop = "";
                allMarksOf1SubjectPoints[y]!.style.lineHeight = "";
            }
        } else {
            for (const [y, element2] of allMarksOf1SubjectWeight.entries()) {
                element2.style.visibility = "hidden";
                allMarksOf1SubjectPoints[y]!.style.height = "30px";
                allMarksOf1SubjectPoints[y]!.style.fontSize = "25px";
                allMarksOf1SubjectPoints[y]!.style.marginTop = "-15px";
                allMarksOf1SubjectPoints[y]!.style.lineHeight = "30px";
            }
        }

        if (areHugeMarksOn && !isHideWeightFromPointsOn) {
            for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {
                allMarksOf1SubjectPoints[y]!.style.cssText += "font-size: 25px; line-height: 30px;";
            }
        } else if (isHideWeightFromPointsOn) {
            for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {
                allMarksOf1SubjectPoints[y]!.style.cssText += "font-size: 9px;";
            }
        } else {
            for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {
                allMarksOf1SubjectPoints[y]!.style.cssText += "font-size: 9px; line-height: 50px;";
            }
        }
    }

    isHideWeightFromPointsOn = !isHideWeightFromPointsOn;

    if (document.querySelector("#btHideWeightFromPoints")) {
        if (isHideWeightFromPointsOn) {
            document
                .querySelector("#btHideWeightFromPoints")!
                .classList.remove("ext-disabled");
        } else {
            document
                .querySelector("#btHideWeightFromPoints")!
                .classList.add("ext-disabled");
        }
    }

    localStorage.setItem("hideWeightFromPointsOn", isHideWeightFromPointsOn.toString());
}

function hugeMarksButton() {
    const marksDivDodatek = document.querySelectorAll<HTMLElement>(
        "div.znamka-v > div.dodatek"
    );
    const marksDivDodatekSpan = document.querySelectorAll<HTMLElement>(
        "div.znamka-v > div.dodatek > span.w-100"
    );

    if (areHugeMarksOn) {
      
        const marksDivNumeralHuge = document.querySelectorAll(
            "div.znamka-v > div.obrovsky"
        );

        for (const element of marksDivNumeralHuge) {
            element.classList.remove("obrovsky");
            element.classList.add(String(element.id));
        }

        for (const [index, element] of marksDivDodatek.entries()) {
            element.style.height = "";

            marksDivDodatekSpan[index]!.style.height = "";
            marksDivDodatekSpan[index]!.style.paddingTop = "";
            marksDivDodatekSpan[index]!.style.fontSize = "";
        }

        const allMarksWithPoints = document.querySelectorAll<HTMLElement>(
            "#obrovsky_body, #velky_body, #stredni_body, #maly_body"
        );

        for (const allMarksWithPoint of allMarksWithPoints) {
            allMarksWithPoint.style.lineHeight = "";
        }

    } else {
      
        const marksDivNumeral = document.querySelectorAll<HTMLElement>(
            "div.znamka-v > div.maly, div.znamka-v > div.stredni, div.znamka-v > div.velky, div.znamka-v > div.obrovsky"
        );

        const marksDivNumeralPoints = document.querySelectorAll<HTMLElement>(
            "div.znamka-v > div.maly_body, div.znamka-v > div.stredni_body, div.znamka-v > div.velky_body, div.znamka-v > div.obrovsky_body"
        );

        for (const element of marksDivNumeral) {
            const lastClass = element.classList[2]! || element.classList[1]!;

            element.id = lastClass;
            element.classList.remove(lastClass);
            element.classList.add("obrovsky");
        }

        for (const marksDivNumeralPoint of marksDivNumeralPoints) {
            const lastClass =
                marksDivNumeralPoint.classList[2]! || marksDivNumeralPoint.classList[1]!;

            marksDivNumeralPoint.id = lastClass;
            marksDivNumeralPoint.classList.remove(lastClass);
            marksDivNumeralPoint.classList.add("obrovsky");
            marksDivNumeralPoint.style.cssText += "line-height: 27px;";
        }

        for (const [index, element] of marksDivDodatek.entries()) {
            if (element.parentNode!.querySelector("div.bod")!.innerHTML === "") {
                element.style.cssText += "height: 42px;";
                if (marksDivDodatekSpan[index] !== undefined) {
                    marksDivDodatekSpan[index]!.style.cssText +=
                        "height: 20px; padding-top: 10px; font-size: 25px;";
                }
            }
        }
    }

    areHugeMarksOn = !areHugeMarksOn;

    if (isHideWeightFromPointsOn) {
        hideWeightFromMarksWithPoints();
        hideWeightFromMarksWithPoints();
    }

    try {
        document.querySelector<HTMLElement>("#btHugeMarks")!.style.cssText += areHugeMarksOn
            ? "background: #00a2e2; color: #ffff;"
            : "background: #fff; color: #00A2E2;";
    } catch {}

    localStorage.setItem("hugeMarksOn", areHugeMarksOn.toString());
}

function settingsMenu() {
    const headerSelector = document.querySelector<HTMLElement>("#settingsMenuHeader");

    headerSelector!.style.cssText = isSettingsOn
        ? "padding-top: 0px; padding-bottom: 0px; display: none;"
        : "padding-top: 0px; padding-bottom: 0px;";

    document.querySelector<HTMLElement>("#btSettings")!.style.cssText += isSettingsOn
        ? "background: #fff; color: #00A2E2;"
        : "background: #00a2e2; color: #ffff;";

    isSettingsOn = !isSettingsOn;

    localStorage.setItem("settingsOn", isSettingsOn.toString());
}

function createBt(
    On: boolean,
    value: string,
    id: string,
    clickFunction: () => void,
    parent: Element | null
) {
    const btName = document.createElement("input");
    btName.value = value;
    btName.id = id;
    btName.type = "button";
    On ? btName.classList.add("ext-bt") : btName.classList.add("ext-disabled", "ext-bt");
    btName.addEventListener("click", clickFunction, false);
    parent!.append(btName);
}

function createElement(type: string, id: string, parent: Element | null, style = "") {
    const elementCreate = document.createElement(type);
    elementCreate.id = id;
    elementCreate.classList.add("ext-bt");
    elementCreate.style.cssText += style;
    parent!.append(elementCreate);
}

function predictorMenu() {
    const predictorMenuHeaderSelector = document.querySelector<HTMLElement>(
        "#predictorMenuHeader"
    );

    if (isPredictorOn) {
        predictorMenuHeaderSelector!.style.cssText =
            "padding-top: 0px; padding-bottom: 0px; display: none;";
        document.querySelector("#btPredictor")!.classList.add("ext-disabled");
    } else {
        predictorMenuHeaderSelector!.style.cssText = "padding-top: 0px; padding-bottom: 0px;";
        document
            .querySelector("#btPredictor")!
            .classList.remove("ext-disabled");
    }

    isPredictorOn = !isPredictorOn;

    localStorage.setItem("predictorOn", isPredictorOn.toString());
}

function createHeaderAndDiv(
    headerId: string,
    divId: string,
    isOn: boolean,
    elementAfter: HTMLElement | null
) {
    const header = document.createElement("header");
    header.id = headerId;

    header.style.cssText = isOn
        ? "padding-top: 0px; padding-bottom: 0px; "
        : "padding-top: 0px; padding-bottom: 0px; display: none;";

    elementAfter!.parentNode!.insertBefore(header, elementAfter);

    const headerSelector: HTMLElement = document.getElementById(headerId)!;

    const div = document.createElement("div");
    div.id = divId;
    headerSelector.append(div);
}

function removeMarkButton() {
    isRemoveMarksOn = !isRemoveMarksOn;

    isRemoveMarksOn
        ? document.querySelector("#btRemoveMarks")!.classList.remove("ext-disabled")
        : document.querySelector("#btRemoveMarks")!.classList.add("ext-disabled");

    localStorage.setItem("removeMarkOn", isRemoveMarksOn.toString());

    if (!isRemoveMarksOn && isInstaRemoveMarksOn) {
        instaRemoveMarkButton();
    }
}

function instaRemoveMarkButton() {
    isInstaRemoveMarksOn = !isInstaRemoveMarksOn;

    isInstaRemoveMarksOn
        ? document.querySelector("#btInstaRemoveMarks")!.classList.remove("ext-disabled")
        : document.querySelector("#btInstaRemoveMarks")!.classList.add("ext-disabled");

    localStorage.setItem("instaRemoveMarksOn", isInstaRemoveMarksOn.toString());

    if (isInstaRemoveMarksOn && !isRemoveMarksOn) {
        removeMarkButton();
    }
}

function ifSelectedSubjectHavePoints() {
    const select: HTMLSelectElement = document.querySelector("#selectSubject")!;
    const subjectTemporary = select.options[select.selectedIndex]!.text;

    const inputMarkSelector = document.querySelector<HTMLInputElement>("#inputMark")!;
    const inputMaxPointsSelector = document.querySelector<HTMLInputElement>("#inputMaxPoints")!;
    const inputWeightSelector = document.querySelector<HTMLInputElement>("#inputWeight")!;

    const bool = isSubjectWithPoints(subjectTemporary);

    inputMarkSelector.placeholder = bool
        ? message.inputMarkPlaceholderPoints!
        : message.inputMarkPlaceholder!;

    inputMaxPointsSelector.placeholder = message.inputWeightPlaceholderPoints!;
    inputMaxPointsSelector.style.display = bool ? "" : "none";

    inputWeightSelector.placeholder = message.inputWeightPlaceholder!;

    isSelectedSubjectProgramovani = bool;
}

function changeLanguage(bt: HTMLInputElement) {
    if (bt.value === "CS") {
        document.querySelector("#btCs")!.classList.remove("ext-disabled");
        document.querySelector("#btEn")!.classList.add("ext-disabled");

        localStorage.setItem("language", "cs");

        alert("The language change will take effect after the page is refreshed.\nZměna jazyka se projeví po znovu načtení stránky.");
    } else {
        document.querySelector("#btCs")!.classList.add("ext-disabled");
        document.querySelector("#btEn")!.classList.remove("ext-disabled");

        localStorage.setItem("language", "en");

        alert(
            "Změna jazyka se projeví po znovu načtení stránky.\nThe language change will take effect after the page is refreshed."
        );
    }
}

function replaceTypeWithWeight() {
    if (isReplaceTypeWithWeightOn) {
        alert(message.clickOnBtReplaceTypeWithWeight);
    } else {
        const allMarksWeight = document.querySelectorAll<HTMLElement>(
            "div.znamka-v.tooltip-bubble > div.dodatek > span.w-100"
        );

        for (const element of allMarksWeight) {
            element.textContent = JSON.parse(
                element.parentElement!.parentElement!.getAttribute("data-clasif")!
            ).vaha;
        }
    }

    isReplaceTypeWithWeightOn = !isReplaceTypeWithWeightOn;

    if (document.querySelector("#btReplaceTypeWithWeight")) {
        if (isReplaceTypeWithWeightOn) {
            document
                .querySelector("#btReplaceTypeWithWeight")!
                .classList.remove("ext-disabled");
        } else {
            document
                .querySelector("#btReplaceTypeWithWeight")!
                .classList.add("ext-disabled");
        }
    }

    localStorage.setItem("replaceTypeWithWeightOn", isReplaceTypeWithWeightOn.toString());
}

function createSettingsMenu() {
    const mainSelector = document.querySelector("main");

    createHeaderAndDiv("settingsMenuHeader", "settingsMenuDiv", isSettingsOn, mainSelector);

    createBt(
        isWideModeOn,
        message.wideMode!,
        "btWideMode",
        wideModeButton,
        document.querySelector("#settingsMenuDiv")
    );
    createBt(
        areHugeMarksOn,
        message.bigMarks!,
        "btHugeMarks",
        hugeMarksButton,
        document.querySelector("#settingsMenuDiv")
    );
    createBt(
        isHideWeightFromPointsOn,
        message.hideWeightPoints!,
        "btHideWeightFromPoints",
        hideWeightFromMarksWithPoints,
        document.querySelector("#settingsMenuDiv")
    );
    createBt(
        isReplaceTypeWithWeightOn,
        message.replaceTypeWithWeight!,
        "btReplaceTypeWithWeight",
        replaceTypeWithWeight,
        document.querySelector("#settingsMenuDiv")
    );

    createBt(
        language === "cs",
        "CS",
        "btCs",
        function () {changeLanguage(this);},
        document.querySelector("#settingsMenuDiv")
    );

    document.querySelector<HTMLElement>("#btCs")!.style.cssText += "border-radius: 16px 0px 0px 16px;";

    createBt(
        language !== "cs",
        "EN",
        "btEn",
        function () {changeLanguage(this);},
        document.querySelector("#settingsMenuDiv")
    );
    document.querySelector<HTMLElement>("#btEn")!.style.cssText +=
        "margin-left: 0px; border-radius: 0px 16px 16px 0px;";
}

function createPredictorMenu() {
    const mainSelector = document.querySelector("main");

    createHeaderAndDiv("predictorMenuHeader", "predictorMenuDiv", isPredictorOn, mainSelector);
    document.querySelector<HTMLElement>("#predictorMenuDiv")!.style.cssText = "padding-top: 10px;";

    createBt(
        true,
        message.addMark!,
        "btAddMark",
        addMarkButton,
        document.querySelector("#predictorMenuDiv")
    );
    document.querySelector<HTMLElement>("#btAddMark")!.style.cssText += "border-radius: 0px;";

    createElement(
        "select",
        "selectSubject",
        document.querySelector("#predictorMenuDiv"),
        "height: 32px; padding: 0px 15px; -webkit-appearance: auto;"
    );

    for (const allSubject of allSubjects) {
        const optionCreate = document.createElement("option");
        optionCreate.text = allSubject;
        document.querySelector("#selectSubject")!.append(optionCreate);
    }

    document
        .querySelector("#selectSubject")!
        .addEventListener("change", ifSelectedSubjectHavePoints, false);

    createElement(
        "input",
        "inputMark",
        document.querySelector("#predictorMenuDiv"),
        "width: 50px;"
    );

    createElement(
        "input",
        "inputMaxPoints",
        document.querySelector("#predictorMenuDiv"),
        "width: 60px;"
    );

    createElement(
        "input",
        "inputWeight",
        document.querySelector("#predictorMenuDiv"),
        "width: 60px;"
    );

    ifSelectedSubjectHavePoints();

    createBt(
        isRemoveMarksOn,
        message.removeMarks!,
        "btRemoveMarks",
        removeMarkButton,
        document.querySelector("#predictorMenuDiv")
    );

    createBt(
        isInstaRemoveMarksOn,
        message.instaRemoveMarks!,
        "btInstaRemoveMarks",
        instaRemoveMarkButton,
        document.querySelector("#predictorMenuDiv")
    );
}


const observer = new MutationObserver((_, obs) => {

    if (!document.querySelector("div#obsah._loadingContainer:nth-child(10) > div > main > div")) {
        
        if (numberOfTries === 200) {
            console.log(`"div#obsah._loadingContainer:nth-child(10) > div > main > div" is null`);
            obs.disconnect();
        }
    
        numberOfTries++;

        return;
    }


    document.querySelector<HTMLElement>("#predmety")!.style.paddingBottom = "20px";

    const allMarks = document.querySelectorAll<HTMLElement>("div.znamka-v.tooltip-bubble");

    for (const allMark of allMarks) {
        if (!allMark.classList.contains("addedMark")) {
            allMark.addEventListener(
                "click",
                function () {removeMark(this);},
                false
            );
        }
    }

    document.querySelector("div.bk-menu-hide")?.addEventListener(
        "click",
        function () {
            if (document.querySelector("div.bk-menu-hide")!.clientWidth < 150) {
                fixAllAbxNext();
            } else {
                setTimeout(() => {
                    fixAllAbxNext();
                }, 300);
            }
        },
        false
    );

    if (document.querySelectorAll<HTMLElement>("div.znamka-v > div.dodatek").length !== document.querySelectorAll<HTMLElement>("div.znamka-v > div.dodatek > span.w-100").length) {
        for (const element of allMarks) {
            if (element.querySelector(".dodatek > span.w-100") === null) {
                const splitArray = element.getAttribute("data-clasif")!.split('vaha":');
                const splitArray2 = splitArray[3]!.split('MarkText":"');

                const markWeight = document.createElement("span");
                markWeight.className = "w-100 d-inline-block";
                markWeight.textContent = splitArray2[0]!.split(",")[0]!;
                element.querySelector(".dodatek")!.prepend(markWeight);
            }
        }
    }

    const allSubjectNamesSelector = document.querySelectorAll(
        "div.leva:nth-child(1) > div.obal._subject_detail.link:nth-child(1) > h3:nth-child(1)"
    );

    allSubjects.push(...Array.from(allSubjectNamesSelector, element => element.textContent!));

    const pointsOfFirstMarkInAllSubjects: NodeListOf<Element> = document.querySelectorAll(
        "div.znamky > div.znamka-v.tooltip-bubble:nth-child(1) > div.bod"
    );


    if (allMarks.length === pointsOfFirstMarkInAllSubjects.length) {
        for (const [
            index,
            pointsOfFirstMarkInAllSubject,
        ] of pointsOfFirstMarkInAllSubjects.entries()) {
            if (pointsOfFirstMarkInAllSubject.innerHTML !== "") {
                subjectsWithPoints.push(allSubjects[index]!);
            }
        }
    }
    else {
        for (
            const pointsOfFirstMarkInAllSubject
        of pointsOfFirstMarkInAllSubjects) {
            if (pointsOfFirstMarkInAllSubject.innerHTML !== "") {
                
                const predmetRadek = getParentPredmetRadek(pointsOfFirstMarkInAllSubject);
                const PredmetRadekChildrens = predmetRadek.parentElement!.querySelectorAll("div.predmet-radek:is([id])");

                subjectsWithPoints.push(allSubjects[Array.from(PredmetRadekChildrens).indexOf(predmetRadek)]!);
            }
        }
    }

    isWideModeOn = !isWideModeOn;

    wideModeButton();

    const viewportSelector = document.querySelectorAll("div.bx-wrapper > div.bx-viewport");

    for (const element of viewportSelector) {
        element.setAttribute("style", "height: 79px");
    }

    if (areHugeMarksOn) {
        areHugeMarksOn = false;

        hugeMarksButton();
    }

    if (isHideWeightFromPointsOn) {
        isHideWeightFromPointsOn = false;

        hideWeightFromMarksWithPoints();
    }

    if (isReplaceTypeWithWeightOn) {
        isReplaceTypeWithWeightOn = false;

        replaceTypeWithWeight();
    }

    const allMarksSelector = document.querySelectorAll<HTMLElement>(
        "div.znamka-v.tooltip-bubble"
    );

    for (const element of allMarksSelector) {
        const splitArray: unknown = JSON.parse(element.getAttribute("data-clasif")!);

        const splitArrayMark: string = splitArray.MarkText;

        if (!isNanStrict(convertMarkToNumber(splitArray.MarkText))) {
            const splitArraySubject: string = splitArray.nazev;
            const splitArrayWeight: number = splitArray.vaha;

            if (isSubjectWithPoints(splitArraySubject)) {
                
                const splitArrayMaxPoints: number = splitArray.bodymax;
                markArray.push(`${splitArrayMark}/${splitArrayMaxPoints}`);

                console.debug(
                    `subject: ${splitArraySubject} mark: ${splitArrayMark}/${splitArrayMaxPoints} weight: ${splitArrayWeight}`
                );
            } else {
                markArray.push(splitArrayMark);

                console.debug(
                    `subject: ${splitArraySubject} mark: ${splitArrayMark} weight: ${splitArrayWeight}`
                );
            }

            subjectArray.push(splitArraySubject);
            weightArray.push(splitArrayWeight.toString());
        }
    }

    refreshOrCreateAverage(false);

    const h2Above = document.querySelector("header.bk-prubzna:nth-child(1) > h2:nth-child(1)");

    createBt(isSettingsOn, message.settings!, "btSettings", settingsMenu, h2Above);

    createBt(isPredictorOn, message.predictor!, "btPredictor", predictorMenu, h2Above);

    createSettingsMenu();

    createPredictorMenu();

    obs.disconnect();
});

observer.observe(document, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    childList: true,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    subtree: true
});
