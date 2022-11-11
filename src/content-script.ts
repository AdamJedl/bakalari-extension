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
  message.replaceWeightXWith10 = "Nahradit váhu X na 10";
  message.clickOnBtReplaceWeightXWith10 =
    "Změna se projeví po znovu načtení stránky.";
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
  message.replaceWeightXWith10 = "Replace weight X with 10";
  message.clickOnBtReplaceWeightXWith10 =
    "Change will take effect after the page is refreshed.";
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
let isReplaceWeightXWith10On = localStorage.getItem("replaceWeightXWith10On") === "true";

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

function fixAbxNext(index: number) {
  const divZnamkyDiv = document.querySelectorAll(
    `div.predmet-radek:nth-child(${
      (index + 1) * 3 + 1
    }) > div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div`
  );

  const aBxNextSelector = document.querySelector(
    `div.predmet-radek:nth-child(${
      (index + 1) * 3 + 1
    }) > div.bx-wrapper:nth-child(2) > div.bx-controls.bx-has-controls-direction:nth-child(2) > div.bx-controls-direction > a.bx-next:nth-child(2)`
  );

  if (divZnamkyDiv.length > 1) {
    const isMarksWidthBiggerThanViewport =
      divZnamkyDiv.length * divZnamkyDiv[0].clientWidth >
      document.querySelector(
        `div.predmet-radek:nth-child(${
          (index + 1) * 3 + 1
        }) > div.bx-wrapper > div.bx-viewport`
      )!.clientWidth;

    if (
      (!isMarksWidthBiggerThanViewport &&
        !aBxNextSelector!.classList.contains("disabled")) ||
      isMarksWidthBiggerThanViewport
    ) {
      isResizeNeeded = true;

      window.dispatchEvent(new Event("resize"));
    }
  }
}

function isSubjectWithPoints(subject: string): boolean {
  for (const subjectsWithPoint of subjectsWithPoints) {
    if (subject === subjectsWithPoint) {
      return true;
    }
  }

  return false;
}

function convertPercentageToAverage(percentage: number, markPercentage: number[]): number {
  if (isNaN(percentage)) {
    return Number.NaN;
  }
  if (percentage >= markPercentage[0]) {
    return 1;
  }
  if (percentage >= markPercentage[1]) {
    return 2;
  }
  if (percentage >= markPercentage[2]) {
    return 3;
  }
  if (percentage >= markPercentage[3]) {
    return 4;
  }
  return 5;
}

function headerInnerHTML(string1: string, string2: string, title1: string) {
  return `<div id="h2OverallAverage" style="padding-left: 14px; color: black; padding-bottom: 20px;">
            <h2 title="${title1}" style="color: black;padding-right: 140px;font-size: 1.5em;width: 60px;">${string1}</h2>
            <h2 title="${title1}" title="" style="color: black;font-size: 1.5em;">${string2}</h2>
          </div>`;
}

function refreshOrCreateAverage(addedMarkOn: boolean) {

  isSubjectMarkWorseThan3Left = false;
  isSubjectMarkWorseThan3Right = false;

  let sumLeft = 0;

  const textBelowSubject = addedMarkOn
    ? document.querySelectorAll("div.info-text > h2:nth-child(1)")
    : document.querySelectorAll("div.info-text > span.fl:nth-child(1)");

  let numberOfValidTextsBelowSubject = 0;

  for (const [y, allSubject] of allSubjects.entries()) {
    let sum = 0;
    let quantity = 0;

    for (const [index, element] of subjectArray.entries()) {
      if (element === allSubject) {
        if (isSubjectWithPoints(element)) {
          sum += Number.parseInt(markArray[index], 10);
        } else {
          sum +=
            markArray[index][1] === "-"
              ? (Number.parseInt(markArray[index][0], 10) + 0.5) *
                Number.parseInt(weightArray[index], 10)
              : Number(markArray[index]) * Number(weightArray[index]);
        }

        quantity += Number.parseInt(weightArray[index], 10);
      }
    }

    if (isSubjectWithPoints(allSubject)) {
      const percentage = (sum / quantity) * 100;

      console.log(
        `${message.subject}: ${allSubject}   ${message.percentage}: ${percentage}`
      );

      const markPercentage: number[] = allSubject === "Databáze" ? [88, 76, 64, 51] : [83, 67, 50, 33];

      textBelowSubject[y].outerHTML = `<h2 title="${
        message.percentage
      }: ${percentage}% (${convertPercentageToAverage(
        percentage, markPercentage
      )})" class="ext-h2">${message.percentage}: ${(
        Math.round((percentage + Number.EPSILON) * 100_000) / 100_000
      ).toFixed(2)}% (${convertPercentageToAverage(percentage, markPercentage)})</h2>`;

      if (!isNaN(percentage)) {
        numberOfValidTextsBelowSubject++;

        const sumLeftTemporary = convertPercentageToAverage(percentage, markPercentage);

        if (sumLeftTemporary === 4 || sumLeftTemporary === 5) {
          isSubjectMarkWorseThan3Left = true;
        }

        sumLeft += sumLeftTemporary;
      }
    } else {
      const average = sum / quantity;

      console.log(`${message.subject}: ${allSubject}   ${message.average}: ${average}`);

      textBelowSubject[y].outerHTML = `<h2 title="${
        message.average
      }: ${average}" class="ext-h2">${message.average}: ${(
        Math.round((average + Number.EPSILON) * 100_000) / 100_000
      ).toFixed(2)}</h2>`;

      if (!isNaN(average)) {
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
      sumRight += Number.parseInt(subjectMark[index].textContent!, 10);

      if (Number.parseInt(subjectMark[index].textContent!, 10) >= 4) {
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

  headerOverallAverage.innerHTML = headerInnerHTML(
    overallAverageLeftRounded.toString(),
    subjectMark.length > 0 &&
      !addedMarkOn &&
      !isNanStrict(overallAverageRightRounded.toString())
      ? overallAverageRightRounded.toString()
      : "",
    message.overallAverage
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

  headerStipendium.innerHTML = headerInnerHTML(
    `${stipendium(overallAverageLeftRounded, "left")},-`,
    subjectMark.length > 0 && !isNanStrict(overallAverageRightRounded.toString()) ? `${stipendium(overallAverageRightRounded, "right")},-` : "",
    "Stipendium"
  );
}

function removeMark(addedMark: Element) {

  function parentElementXTimes(element: Element, x: number) {
    let parent = element;
    for (let index = 0; index < x; index++) {
      parent = parent.parentElement!;
    }
    return parent;
  }

  function removeMarkIdk() {

    const subjectIndex = Array.from(parentElementXTimes(addedMark, 5).children).indexOf(parentElementXTimes(addedMark, 4)) / 3 - 1;

    const subjectTemporary = allSubjects[subjectIndex];
    const markTemporary = addedMark.querySelector<HTMLElement>("div.ob")!.textContent?.trim();

    let weightTemporary;

    if (isSubjectWithPoints(subjectTemporary)) {
      weightTemporary = addedMark.querySelector<HTMLElement>("div.bod")!.textContent === "X" ? 10 : addedMark.querySelector<HTMLElement>("div.bod")!.textContent;
    } else if (addedMark.querySelector<HTMLElement>("span.w-100")!.textContent === "X") {
      weightTemporary = 10;
    } else {
      weightTemporary = addedMark.querySelector<HTMLElement>("span.w-100")!.textContent;
    }

    addedMark.remove();

    for (let index = 0; index < subjectArray.length; index++) {
      if (
        subjectTemporary === subjectArray[index] &&
        markArray[index] === markTemporary &&
        weightArray[index] === weightTemporary
      ) {
        subjectArray[index] = "";
        markArray[index] = "0";
        weightArray[index] = "0";

        break;
      }
    }

    fixAbxNext(subjectIndex);

    const allTooltipsSelector = document.querySelectorAll("div.ui-tooltip");

    for (const element of allTooltipsSelector) {
      element.remove();
    }

    refreshOrCreateAverage(true);

  }
  
  if (isInstaRemoveMarksOn || isRemoveMarksOn && confirm(message.removeMark)) {
    removeMarkIdk();
  }
}

function addMarkButton() {
  const select: HTMLSelectElement = document.querySelector("#selectSubject")!;
  const subjectTemporary: string = select.options[select.selectedIndex].text;

  const markTemporary: string = document.querySelector<HTMLInputElement>("#inputMark")!.value;

  const weightTemporary: string = document.querySelector<HTMLInputElement>("#inputWeight")!.value;

  let alertText = "";

  if (isSelectedSubjectProgramovani) {
    if (isNanStrict(markTemporary) || Number.parseInt(markTemporary, 10) < 0) {
      alertText += message.pointsAreInvalid;
    }
    if (isNanStrict(weightTemporary) || Number.parseInt(weightTemporary, 10) <= 0) {
      alertText += message.maxPointsAreInvalid;
    }
  } else {
    if (
      isNaN(Number.parseInt(markTemporary, 10)) ||
      Number(markTemporary) < 1 ||
      Number(markTemporary) > 5 ||
      markTemporary === "5-"
    ) {
      alertText += message.markIsInvalid;
    }
    if (
      isNanStrict(weightTemporary) ||
      Number(weightTemporary) < 1 ||
      Number(weightTemporary) > 10
    ) {
      alertText += message.weightIsInvalid;
    }
  }

  if (alertText.length > 0) {
    alert(alertText.replaceAll(".", ".\n"));

    return;
  }

  subjectArray.push(subjectTemporary);

  const hasMarkMinus = markTemporary.length > 1 && markTemporary[1] === "-";

  markArray.push(markTemporary);

  weightArray.push(weightTemporary);

  const divPredmetRadekSelector = document.querySelector(`div.predmet-radek:nth-child(${(select.selectedIndex + 1) * 3 + 1}) > div > div > div.znamky`);

  const addedMarkCreate = document.createElement("div");
  addedMarkCreate.id = "addedMark";
  divPredmetRadekSelector!.append(addedMarkCreate);

  document.querySelector(
    "#addedMark"
  )!.outerHTML = `<div class="znamka-v tooltip-bubble addedMark" style="float: left; list-style: none; position: relative; width: 56px; background-color: #ffa50069;" id="addedMark">
                    <div class="cislovka  obrovsky" id="obrovsky">
                      <div class="ob">${hasMarkMinus ? markTemporary : Number.parseInt(markTemporary, 10)}</div>
                    </div>
                    <div class="bod" ${isSelectedSubjectProgramovani && areHugeMarksOn && isHideWeightFromPointsOn ? 'style="height: 30px; margin-top: -15px; font-size: 25px; line-height: 30px;"' : isSelectedSubjectProgramovani && isHideWeightFromPointsOn ? 'style="height: 30px; margin-top: -15px; font-size: 9px; line-height: 50px;"' : ""}>${isSelectedSubjectProgramovani ? weightTemporary : ""}</div>
                    <div class="dodatek" ${areHugeMarksOn ? 'style="height: 42px;"' : ""}>
                      <span class="w-100 d-inline-block" ${isSelectedSubjectProgramovani ? 'style="visibility: hidden;"' : areHugeMarksOn ? 'style="height: 20px; padding-top: 10px; font-size: 25px;"' : ""}>${isSelectedSubjectProgramovani ? "" : weightTemporary}</span>
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

  fixAbxNext(select.selectedIndex);

  refreshOrCreateAverage(true);
}

function fixAllAbxNext() {
  isResizeNeeded = false;

  const divZnamkySelector = document.querySelectorAll("div.znamky");

  for (let index = 0; index < divZnamkySelector.length; index++) {
    fixAbxNext(index);

    if (isResizeNeeded) {
      return;
    }
  }
}

function wideModeButton() {
  
  const btWideModeSelector = document.querySelector<HTMLElement>("#btWideMode");

  if (isWideModeOn) {
    document
      .querySelector("div#obsah._loadingContainer:nth-child(10) > div")!
      .setAttribute("style", "max-width: 1000px");

    if (btWideModeSelector) {
      btWideModeSelector.style.cssText += "background: #fff; color: #00A2E2;";
    }

  } else {
    document
      .querySelector("div#obsah._loadingContainer:nth-child(10) > div")!
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

  function getParentPredmetRadek(element: Element) {
    let parent = element;
    while (parent.className !== "predmet-radek") {
      parent = parent.parentElement!;
    }
    return parent;
  }

  const firstMarkInSubjectPoint = document.querySelectorAll(
    "div.znamka-v.tooltip-bubble:nth-child(1) > div.bod"
  );

  for (const element of firstMarkInSubjectPoint) {

    if (element.innerHTML.trim() === "") {
      continue;
    }

    const index = Array.from(getParentPredmetRadek(element).parentElement!.children).indexOf(getParentPredmetRadek(element)) / 3 - 1;

    let allMarksOf1SubjectWeight = document.querySelectorAll<HTMLElement>(
      `div.predmet-radek:nth-child(${
        (index + 1) * 3 + 1
      }) > div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div.znamka-v.tooltip-bubble > div.dodatek > span.w-100`
    );
    let allMarksOf1SubjectPoints = document.querySelectorAll<HTMLElement>(
      `div.predmet-radek:nth-child(${
        (index + 1) * 3 + 1
      }) > div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div.znamka-v.tooltip-bubble > div.bod`
    );

    if (allMarksOf1SubjectWeight.length === 0) {
      allMarksOf1SubjectWeight = document.querySelectorAll(
        `div.predmet-radek:nth-child(${
          (index + 1) * 3 + 1
        }) > div.znamky > div.znamka-v.tooltip-bubble > div.dodatek > span.w-100`
      );
    }

    if (allMarksOf1SubjectPoints.length === 0) {
      allMarksOf1SubjectPoints = document.querySelectorAll(
        `div.predmet-radek:nth-child(${
          (index + 1) * 3 + 1
        }) > div.znamky > div.znamka-v.tooltip-bubble > div.bod`
      );
    }

    if (isHideWeightFromPointsOn) {
      for (const [y, element2] of allMarksOf1SubjectWeight.entries()) {
        element2.style.visibility = "";
        allMarksOf1SubjectPoints[y].style.height = "";
        allMarksOf1SubjectPoints[y].style.fontSize = "";
        allMarksOf1SubjectPoints[y].style.marginTop = "";
        allMarksOf1SubjectPoints[y].style.lineHeight = "";
      }
    } else {
      for (const [y, element2] of allMarksOf1SubjectWeight.entries()) {
        element2.style.visibility = "hidden";
        allMarksOf1SubjectPoints[y].style.height = "30px";
        allMarksOf1SubjectPoints[y].style.fontSize = "25px";
        allMarksOf1SubjectPoints[y].style.marginTop = "-15px";
        allMarksOf1SubjectPoints[y].style.lineHeight = "30px";
      }
    }

    if (areHugeMarksOn && !isHideWeightFromPointsOn) {
      for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {
        allMarksOf1SubjectPoints[y].style.cssText += "font-size: 25px; line-height: 30px;";
      }
    } else if (isHideWeightFromPointsOn) {
      for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {
        allMarksOf1SubjectPoints[y].style.cssText += "font-size: 9px;";
      }
    } else {
      for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {
        allMarksOf1SubjectPoints[y].style.cssText += "font-size: 9px; line-height: 50px;";
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

      marksDivDodatekSpan[index].style.height = "";
      marksDivDodatekSpan[index].style.paddingTop = "";
      marksDivDodatekSpan[index].style.fontSize = "";
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
      const lastClass = element.classList[2] || element.classList[1];

      element.id = lastClass;
      element.classList.remove(lastClass);
      element.classList.add("obrovsky");
    }

    for (const marksDivNumeralPoint of marksDivNumeralPoints) {
      const lastClass =
        marksDivNumeralPoint.classList[2] ||
        marksDivNumeralPoint.classList[1];

      marksDivNumeralPoint.id = lastClass;
      marksDivNumeralPoint.classList.remove(lastClass);
      marksDivNumeralPoint.classList.add("obrovsky");
      marksDivNumeralPoint.style.cssText += "line-height: 27px;";
    }

    for (const [index, element] of marksDivDodatek.entries()) {
      if (element.parentNode!.querySelector("div.bod")!.innerHTML === "") {
        element.style.cssText += "height: 42px;";
        if (marksDivDodatekSpan[index] !== undefined) {
          marksDivDodatekSpan[index].style.cssText +=  "height: 20px; padding-top: 10px; font-size: 25px;";
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

  if (isSettingsOn) {
    headerSelector!.style.cssText = "padding-top: 0px; padding-bottom: 0px; display: none;";
  } else {
    headerSelector!.style.cssText = "padding-top: 0px; padding-bottom: 0px;";
  }

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
  clickFunction: any,
  parent: Element | null
) {
  const btName = document.createElement("input");
  btName.value = value;
  btName.id = id;
  btName.type = "button";
  On
    ? btName.classList.add("ext-bt")
    : btName.classList.add("ext-disabled", "ext-bt");
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
    predictorMenuHeaderSelector!.style.cssText =
      "padding-top: 0px; padding-bottom: 0px;";
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

  if (isRemoveMarksOn) {
    document
      .querySelector("#btRemoveMarks")!
      .classList.remove("ext-disabled");
  } else {
    document.querySelector("#btRemoveMarks")!.classList.add("ext-disabled");
  }

  localStorage.setItem("removeMarkOn", isRemoveMarksOn.toString());

  if (!isRemoveMarksOn && isInstaRemoveMarksOn) {
    instaRemoveMarkButton();
  }
}

function instaRemoveMarkButton() {
  isInstaRemoveMarksOn = !isInstaRemoveMarksOn;

  if (isInstaRemoveMarksOn) {
    document
      .querySelector("#btInstaRemoveMarks")!
      .classList.remove("ext-disabled");
  } else {
    document
      .querySelector("#btInstaRemoveMarks")!
      .classList.add("ext-disabled");
  }

  localStorage.setItem("instaRemoveMarksOn", isInstaRemoveMarksOn.toString());

  if (isInstaRemoveMarksOn && !isRemoveMarksOn) {
    removeMarkButton();
  }
}

function ifSelectedSubjectHavePoints() {
  const select: HTMLSelectElement = document.querySelector("#selectSubject")!;
  const subjectTemporary = select.options[select.selectedIndex].text;

  const inputMarkSelector = document.querySelector<HTMLInputElement>("#inputMark")!;
  const inputWeightSelector = document.querySelector<HTMLInputElement>("#inputWeight")!;

  const bool = isSubjectWithPoints(subjectTemporary);

  inputMarkSelector.maxLength = bool ? 3 : 2;
  inputMarkSelector.placeholder = bool ? message.inputMarkPlaceholderPoints : message.inputMarkPlaceholder;

  inputWeightSelector.maxLength = bool ? 3 : 2;
  inputWeightSelector.placeholder = bool ? message.inputWeightPlaceholderPoints : message.inputWeightPlaceholder;

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

function replaceWeightXWith10() {
  if (isReplaceWeightXWith10On) {
    alert(message.clickOnBtReplaceWeightXWith10);
  } else {
    const allMarksWeight = document.querySelectorAll<HTMLElement>(
      "div.znamka-v.tooltip-bubble > div.dodatek > span.w-100"
    );

    for (const element of allMarksWeight) {
      if (element.textContent === "X") {
        element.textContent = "10";
      }
    }
  }

  isReplaceWeightXWith10On = !isReplaceWeightXWith10On;

  if (document.querySelector("#btReplaceWeightXWith10")) {
    if (isReplaceWeightXWith10On) {
      document
        .querySelector("#btReplaceWeightXWith10")!
        .classList.remove("ext-disabled");
    } else {
      document
        .querySelector("#btReplaceWeightXWith10")!
        .classList.add("ext-disabled");
    }
  }

  localStorage.setItem("replaceWeightXWith10On", isReplaceWeightXWith10On.toString());
}

function createSettingsMenu() {
  const mainSelector = document.querySelector("main");

  createHeaderAndDiv(
    "settingsMenuHeader",
    "settingsMenuDiv",
    isSettingsOn,
    mainSelector
  );

  createBt(
    isWideModeOn,
    message.wideMode,
    "btWideMode",
    wideModeButton,
    document.querySelector("#settingsMenuDiv")
  );
  createBt(
    areHugeMarksOn,
    message.bigMarks,
    "btHugeMarks",
    hugeMarksButton,
    document.querySelector("#settingsMenuDiv")
  );
  createBt(
    isHideWeightFromPointsOn,
    message.hideWeightPoints,
    "btHideWeightFromPoints",
    hideWeightFromMarksWithPoints,
    document.querySelector("#settingsMenuDiv")
  );
  createBt(
    isReplaceWeightXWith10On,
    message.replaceWeightXWith10,
    "btReplaceWeightXWith10",
    replaceWeightXWith10,
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
    function () {
      changeLanguage(this);
    },
    document.querySelector("#settingsMenuDiv")
  );
  document.querySelector<HTMLElement>("#btEn")!.style.cssText += "margin-left: 0px; border-radius: 0px 16px 16px 0px;";
}

function createPredictorMenu() {
  const mainSelector = document.querySelector("main");

  createHeaderAndDiv(
    "predictorMenuHeader",
    "predictorMenuDiv",
    isPredictorOn,
    mainSelector
  );
  document.querySelector<HTMLElement>("#predictorMenuDiv")!.style.cssText = "padding-top: 10px;";

  createBt(
    true,
    message.addMark,
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
    "inputWeight",
    document.querySelector("#predictorMenuDiv"),
    "width: 60px;"
  );

  ifSelectedSubjectHavePoints();

  createBt(
    isRemoveMarksOn,
    message.removeMarks,
    "btRemoveMarks",
    removeMarkButton,
    document.querySelector("#predictorMenuDiv")
  );

  createBt(
    isInstaRemoveMarksOn,
    message.instaRemoveMarks,
    "btInstaRemoveMarks",
    instaRemoveMarkButton,
    document.querySelector("#predictorMenuDiv")
  );
}


const observer = new MutationObserver((_, obs) => {
  const divWait = document.querySelector("div#obsah._loadingContainer:nth-child(10) > div > main > div");

  if (divWait) {
    const predmetySelector: HTMLElement = document.querySelector<HTMLElement>("#predmety")!;
    
    predmetySelector.style.paddingBottom = "20px";

    const allMarks = document.querySelectorAll<HTMLElement>("div.znamka-v.tooltip-bubble");

    for (const allMark of allMarks) {
      if (!allMark.classList.contains("addedMark")) {
        allMark.addEventListener(
          "click",
          function () {
            removeMark(this);
          },
          false
        );
      }
    }

    document.querySelector("div.bk-menu-hide")?.addEventListener(
      "click",
      function () {
        if (document.querySelector("div.bk-menu-hide")!.clientWidth < 150) {
          fixAllAbxNext();
        }
        else {
          setTimeout(() => {
            fixAllAbxNext();
          }, 300);
        }
      },
      false
    );

    if(document.querySelectorAll<HTMLElement>("div.znamka-v > div.dodatek").length !== document.querySelectorAll<HTMLElement>("div.znamka-v > div.dodatek > span.w-100").length) {
      for (const element of allMarks) {
        if (element.querySelector(".dodatek > span.w-100") === null) {
          const splitArray = element.dataset.clasif!.split('vaha":');
          const splitArray2 = splitArray[3].split('MarkText":"');

          const markWeight = document.createElement("span");
          markWeight.className = "w-100 d-inline-block";
          markWeight.textContent = splitArray2[0].split(",")[0];
          element.querySelector(".dodatek")!.prepend(markWeight);
        }
      }
    }

    const allSubjectNamesSelector = document.querySelectorAll(
      "div.leva:nth-child(1) > div.obal._subject_detail.link:nth-child(1) > h3:nth-child(1)"
    );

    for (const element of allSubjectNamesSelector) {
      allSubjects.push(element.innerHTML);
    }

    const pointsOfFirstMarkInAllSubjects: NodeListOf<Element> =
      document.querySelectorAll(
        "div.znamky > div.znamka-v.tooltip-bubble:nth-child(1) > div.bod"
      );

    for (const [
      index,
      pointsOfFirstMarkInAllSubject,
    ] of pointsOfFirstMarkInAllSubjects.entries()) {
      if (pointsOfFirstMarkInAllSubject.innerHTML !== "") {
        subjectsWithPoints.push(allSubjects[index]);
      }
    }

    isWideModeOn = !isWideModeOn;

    wideModeButton();

    const viewportSelector = document.querySelectorAll("div.bx-wrapper > div.bx-viewport");

    for (const element of viewportSelector) {
      element.setAttribute("style", "height: 79px");
    }

    if (areHugeMarksOn) {
      areHugeMarksOn = !areHugeMarksOn;

      hugeMarksButton();
    }

    if (isHideWeightFromPointsOn) {
      isHideWeightFromPointsOn = !isHideWeightFromPointsOn;

      hideWeightFromMarksWithPoints();
    }

    if (isReplaceWeightXWith10On) {
      isReplaceWeightXWith10On = !isReplaceWeightXWith10On;

      replaceWeightXWith10();
    }

    const allMarksSelector = document.querySelectorAll<HTMLElement>("div.znamka-v.tooltip-bubble");

    for (const element of allMarksSelector) {
      const splitArray = element.getAttribute("data-clasif")!.split('vaha":');

      const splitArray2 = splitArray[3].split('MarkText":"');

      const splitArrayMark = splitArray2[1].split('"')[0];

      if (
        !(
          splitArrayMark === "A" ||
          splitArrayMark === "N" ||
          splitArrayMark === "?" ||
          splitArrayMark === "X"
        )
      ) {
        const splitArraySubject = splitArray[2].split('"')[3];

        if (isSubjectWithPoints(splitArraySubject)) {
          const splitArrayWeight = splitArray[0].split('bodymax":')[1].split(',"')[0];

          weightArray.push(splitArrayWeight);

          console.debug(
            `subject: ${splitArraySubject} mark: ${splitArrayMark} weight: ${splitArrayWeight}`
          );
        } else {
          const splitArrayWeight = splitArray2[0].split(",")[0];

          weightArray.push(splitArrayWeight);

          console.debug(
            `subject: ${splitArraySubject} mark: ${splitArrayMark} weight: ${splitArrayWeight}`
          );
        }

        subjectArray.push(splitArraySubject);
        markArray.push(splitArrayMark);
      }
    }

    refreshOrCreateAverage(false);

    const h2Above = document.querySelector("header.bk-prubzna:nth-child(1) > h2:nth-child(1)");

    createBt(
      isSettingsOn,
      message.settings,
      "btSettings",
      settingsMenu,
      h2Above
    );

    createBt(
      isPredictorOn,
      message.predictor,
      "btPredictor",
      predictorMenu,
      h2Above
    );

    createSettingsMenu();

    createPredictorMenu();

    obs.disconnect();
    
  } else {

    if (numberOfTries === 200) {
      console.log(
        `"div#obsah._loadingContainer:nth-child(10) > div > main > div" is null`
      );
      obs.disconnect();
    }

    numberOfTries++;
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});
