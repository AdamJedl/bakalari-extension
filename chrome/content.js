let language = localStorage.getItem("language")

if (language == null) lang = chrome.i18n.getUILanguage()

if (language != "cs") language = "en"

let msg;

if (language == "cs") {
    
    msg = {
        
        settings:"Nastavení",
        predictor:"Předvídač",
        wideMode:"Široký režim",
        bigMarks:"Velké známky",
        hideWeightPoints:"Skrýt váhu ze známek s body",
        addMark:"Přidat známku",
        removeMarks:"Odstranit známky",
        instaRemoveMarks:"Ihned odstranit známky",
        inputMarkPlaceholder:"Známka",
        inputMarkPlaceholderPoints:"Body",
        inputWeightPlaceholder:"Váha",
        inputWeightPlaceholderPoints:"Max body",
        average:"Průměr",
        percentage:"Počet %",
        markIsInvalid:"Známka je neplatná.",
        weightIsInvalid:"Váha je neplatná.",
        pointsAreInvalid:"Počet bodů je neplatný.",
        maxPointsAreInvalid:"Maximalní počet bodů je neplatný.",
        removeMark:"Opravdu chcete odstranit známku? ",
        overallAverage:"Celkový průměr"
        
    }
}
else {

    msg = {
        
        settings:"Settings",
        predictor:"Predictor",
        wideMode:"Wide mode",
        bigMarks:"Big marks",
        hideWeightPoints:"Hide weight from marks with points",
        addMark:"Add mark",
        removeMarks:"Remove marks",
        instaRemoveMarks:"Insta remove marks",
        inputMarkPlaceholder:"Mark",
        inputMarkPlaceholderPoints:"Points",
        inputWeightPlaceholder:"Weight",
        inputWeightPlaceholderPoints:"Max points",
        average:"Average",
        percentage:"Percentage",
        markIsInvalid:"Mark is invalid.",
        weightIsInvalid:"Weight is invalid.",
        pointsAreInvalid:"Points are invalid.",
        maxPointsAreInvalid:"Max points are invalid.",
        removeMark:"Are you sure you want to remove a mark?",
        overallAverage:"Overall average"
    }
}

let resizeNeeded = false

let isSelectedSubjectProgramovani = false


let wideModeOn = JSON.parse(localStorage.getItem("wideModeOn"))
let hugeMarksOn = JSON.parse(localStorage.getItem("hugeMarksOn"))
let settingsOn = JSON.parse(localStorage.getItem("settingsOn"))
let hideWeightFromPointsOn = JSON.parse(localStorage.getItem("hideWeightFromPointsOn"))
let predictorOn = JSON.parse(localStorage.getItem("predictorOn"))
let removeMarksOn = JSON.parse(localStorage.getItem("removeMarkOn"))
let instaRemoveMarksOn = JSON.parse(localStorage.getItem("instaRemoveMarksOn"))


wideModeOn = wideModeOn || false
hugeMarksOn = hugeMarksOn || false
settingsOn =  settingsOn|| false
hideWeightFromPointsOn = hideWeightFromPointsOn || false
predictorOn = predictorOn || false
removeMarksOn = removeMarksOn || false
instaRemoveMarksOn = instaRemoveMarksOn || false


let subjectArray = []
let markArray = []
let weightArray = []

let average = []


let divSelector

const allSubjects = []

window.onload = function Main(){ 
    
    const allMarks = document.querySelectorAll("div.znamka-v.tooltip-bubble")

    for (let i = 0; i < allMarks.length; i++) {

        if (!allMarks[i].classList.contains("addedMark")) {

            allMarks[i].addEventListener("click", function () { removeMark(this) }, false)
        }
    }

    wideModeOn = !wideModeOn

    wideModeButton()

    let viewportSelector = document.querySelectorAll("div.bx-wrapper > div.bx-viewport")

    for (let i = 0; i < viewportSelector.length; i++) {
        
        viewportSelector[i].setAttribute("style", "height: 79px") 
    }
    
    if (hugeMarksOn) {
        
        hugeMarksOn = !hugeMarksOn

        hugeMarksButton()
    }

    if (hideWeightFromPointsOn) {
        
        hideWeightFromPointsOn = !hideWeightFromPointsOn

        hideWeightFromMarksWithPoints()
    }

    let allMarksSelector = document.querySelectorAll("div.znamka-v.tooltip-bubble")
    
    for (let i = 0; i < allMarksSelector.length; i++) {
        
        let splitArray = allMarksSelector[i].getAttribute("data-clasif").split(`vaha":`)
        
        let splitArray2 = splitArray[3].split(`MarkText":"`)

        let splitArraySubject = splitArray[2].split(`"`)[3]

        let splitArrayMark = splitArray2[1].split(`"`)[0]
        
        if (!(splitArrayMark == "A" || splitArrayMark == "N" || splitArrayMark == "?" || splitArrayMark == "X")) {
            
            if(splitArraySubject == "Programování" ){
                weightArray.push(splitArray[0].split(`bodymax":`)[1].split(`,"`)[0])
                
                //console.log(`subject: ${splitArraySubject} mark: ${splitArrayMark} weight: ${splitArray[0].split(`bodymax":`)[1].split(`,"`)[0]}`)
            }
            else {
                weightArray.push(splitArray2[0].split(`,`)[0])
                
                //console.log(`subject: ${splitArraySubject} mark: ${splitArrayMark} weight: ${splitArray2[0].split(`,`)[0]}`)
            }
    
            subjectArray.push(splitArraySubject)
            markArray.push(splitArrayMark)
        }
    }
    
    const allSubjectNamesSelector = document.querySelectorAll("div.leva:nth-child(1) > div.obal._subject_detail.link:nth-child(1) > h3:nth-child(1)")

    for (let i = 0; i < allSubjectNamesSelector.length; i++) {
        
        allSubjects.push(allSubjectNamesSelector[i].innerText)
    }


    refreshOrCreateAverage(false)
    

    const mainSelector = document.querySelector("main")
    
    const h2Above = document.querySelector("header.bk-prubzna:nth-child(1) > h2:nth-child(1)")
    
    createBt(settingsOn, msg.settings, "btSettings", settingsMenu, h2Above)
    
    createBt(predictorOn, msg.predictor, "btPredictor", predictorMenu, h2Above)
    
    //#region settingsMenu
    
    createHeaderAndDiv("settingsMenuHeader", "settingsMenuDiv", settingsOn, mainSelector)

    createBt(wideModeOn, msg.wideMode, "btWideMode", wideModeButton, settingsMenuDiv)
    createBt(hugeMarksOn, msg.bigMarks, "btHugeMarks", hugeMarksButton, settingsMenuDiv)
    createBt(hideWeightFromPointsOn, msg.hideWeightPoints, "btHideWeightFromPoints", hideWeightFromMarksWithPoints, settingsMenuDiv)

    createBt(language == "cs", "CS", "btCs", function () {changeLanguage(this)}, settingsMenuDiv)
    btCs.style.cssText += "border-radius: 16px 0px 0px 16px;"

    createBt(language != "cs", "EN", "btEn", function () {changeLanguage(this)}, settingsMenuDiv)
    btEn.style.cssText += "margin-left: 0px; border-radius: 0px 16px 16px 0px;"
    
    //#endregion
    
    //#region predictorMenu
    
    createHeaderAndDiv("predictorMenuHeader", "predictorMenuDiv", predictorOn, mainSelector)
    predictorMenuDiv.style.cssText = 'padding-top: 10px;'

    createBt(true, msg.addMark, "btAddMark", addMarkButton, predictorMenuDiv)
    btAddMark.style.cssText += 'border-radius: 0px;'

    createElement("select", "selectSubject", predictorMenuDiv)
    selectSubject.style.cssText += "height: 32px; padding: 0px 15px; -webkit-appearance: auto;" 

    for (let i = 0; i < allSubjects.length; i++) {
        
        let optionCreate = document.createElement("option")
        optionCreate.text = allSubjects[i]
        selectSubject.appendChild(optionCreate)
    }

    selectSubject.addEventListener("change", ifSelectedSubjectIsProgramovani, false)
    
    createElement("input", "inputMark", predictorMenuDiv, "width: 50px;")
    createElement("input", "inputWeight", predictorMenuDiv, "width: 60px;")
    
    ifSelectedSubjectIsProgramovani()

    createBt(removeMarksOn, msg.removeMarks, "btRemoveMarks", removeMarkButton, predictorMenuDiv)
    createBt(instaRemoveMarksOn, msg.instaRemoveMarks, "btInstaRemoveMarks", instaRemoveMarkButton, predictorMenuDiv)

    //#endregion 

    function stipendium(prumer) {
        
        if (prumer >= 1.81) return 0
        if (prumer >= 1.71) return 500
        if (prumer >= 1.61) return 1000
        if (prumer >= 1.51) return 1500
        if (prumer >= 1.41) return 2000
        if (prumer >= 1.31) return 2500
        if (prumer >= 1.21) return 3000
        if (prumer >= 1.11) return 3500
        if (prumer >= 1.01) return 4000
        return 5000
    }
    
    function addMarkButton () {
        
        let select = document.getElementById("selectSubject")
        let subjectTemp = select.options[select.selectedIndex].text

        let markTemp = document.getElementById("inputMark").value

        let weightTemp = document.getElementById("inputWeight").value
        
        let alertText = ""
        
        if (isSelectedSubjectProgramovani) {

            if (isNaNStrict(markTemp) || markTemp < 0) alertText += msg.pointsAreInvalid
            if (isNaNStrict(weightTemp) || weightTemp <= 0) alertText += msg.maxPointsAreInvalid
        }
        else {

            if (isNaN(parseInt(markTemp)) || Number(markTemp) < 1 || Number(markTemp) > 5 || markTemp == "5-") alertText += msg.markIsInvalid
            if (isNaNStrict(weightTemp) || Number(weightTemp) < 1 || Number(weightTemp) > 10) alertText += msg.weightIsInvalid
        }
        
        
        if (alertText.length != 0) {
            
            alert(alertText.replaceAll(".", ".\n"))

            return
        }
        
        subjectArray.push(subjectTemp)
        
        let MarkHaveMinus = markTemp.length > 1 && markTemp[1] == '-'
        
        if (MarkHaveMinus)
            markArray.push(markTemp)
        else
            markArray.push(parseInt(markTemp))
        
        weightArray.push(weightTemp)
        
        let divPredmetRadekSelector = document.querySelector(`div.predmet-radek:nth-child(${(select.selectedIndex + 1) * 3 + 1}) > div > div > div.znamky`)

        let addedMarkCreate = document.createElement("div")
        addedMarkCreate.id = `addedMark`
        divPredmetRadekSelector.appendChild(addedMarkCreate)

        addedMark.outerHTML = ` <div class="znamka-v tooltip-bubble addedMark" style="float: left; list-style: none; position: relative; width: 56px; background-color: #ffa50069;" id="addedMark">
                                    <div class="cislovka  obrovsky" id="obrovsky">
                                        <div class="ob">${MarkHaveMinus ? markTemp : parseInt(markTemp)}</div>
                                    </div>
                                    <div class="bod"></div>
                                        <div class="dodatek" ${hugeMarksOn ? `style="height: 42px;"` : ""}>
                                        <span class="w-100 d-inline-block" ${hugeMarksOn ? `style="height: 20px; padding-top: 10px; font-size: 25px;"` : ""}>${weightTemp}</span>
                                    </div>
                                </div>`

        addedMark.addEventListener("click", function () { removeMark(this) } , false)

        addedMark.id = ""

        fixABxNext(select.selectedIndex)
        
        refreshOrCreateAverage(true)
    }

    function wideModeButton () {
        
        if (wideModeOn) {
            
            document.querySelector("div#obsah._loadingContainer:nth-child(10) > div").setAttribute("style", "max-width: 1000px")

            try {btWideMode.style.cssText += 'background: #fff; color: #00A2E2;'} catch (error) {}
        }
        else {
            
            document.querySelector("div#obsah._loadingContainer:nth-child(10) > div").setAttribute("style", "max-width: 10000px")
            
            try {btWideMode.style.cssText += 'background: #00a2e2; color: #ffff'} catch (error) {}
        }

        fixAllABxNext()

        wideModeOn = !wideModeOn

        localStorage.setItem("wideModeOn", wideModeOn)
    }

    function hugeMarksButton () {
        
        let marksDivDodatek = document.querySelectorAll("div.znamka-v > div.dodatek")
        let marksDivDodatekSpan = document.querySelectorAll("div.znamka-v > div.dodatek > span.w-100")
        
        if (!hugeMarksOn) {

            let marksDivNumeral = document.querySelectorAll("div.znamka-v > div.maly, div.znamka-v > div.stredni, div.znamka-v > div.velky, div.znamka-v > div.obrovsky")

            let marksDivNumeralPoints = document.querySelectorAll("div.znamka-v > div.maly_body, div.znamka-v > div.stredni_body, div.znamka-v > div.velky_body, div.znamka-v > div.obrovsky_body")

            for (let i = 0; i < marksDivNumeral.length; i++) {
                let lastClass = marksDivNumeral[i].classList[2] || marksDivNumeral[i].classList[1]
                marksDivNumeral[i].id = lastClass
                marksDivNumeral[i].classList.remove(lastClass)
                marksDivNumeral[i].classList.add('obrovsky')
            }

            for (let i = 0; i < marksDivNumeralPoints.length; i++) { 
                let lastClass = marksDivNumeralPoints[i].classList[2] || marksDivNumeralPoints[i].classList[1]
                marksDivNumeralPoints[i].id = lastClass
                marksDivNumeralPoints[i].classList.remove(lastClass)
                marksDivNumeralPoints[i].classList.add('obrovsky')
                marksDivNumeralPoints[i].style.cssText += `line-height: 27px;`
            }

            for (let i = 0; i < marksDivDodatek.length; i++) {
                 
                if (marksDivDodatek[i].parentNode.querySelector("div.bod").innerText == "") {
                
                    marksDivDodatek[i].style.cssText += 'height: 42px;'
                    marksDivDodatekSpan[i].style.cssText += 'height: 20px; padding-top: 10px; font-size: 25px;'
                }
            }
        }
        else {

            let marksDivNumeralHuge = document.querySelectorAll("div.znamka-v > div.obrovsky")
            
            for (let i = 0; i < marksDivNumeralHuge.length; i++) {
                
                marksDivNumeralHuge[i].classList.remove('obrovsky')
                marksDivNumeralHuge[i].classList.add(`${marksDivNumeralHuge[i].id}`)
            }

            for (let i = 0; i < marksDivDodatek.length; i++) {
               
                marksDivDodatek[i].style.cssText -= 'height: 42px;'
                marksDivDodatekSpan[i].style.cssText -= 'height: 20px; padding-top: 10px; font-size: 25px;'
            }

            let allMarksWithPoints = document.querySelectorAll("#obrovsky_body, #velky_body, #stredni_body, #maly_body")

            for (let i = 0; i < allMarksWithPoints.length; i++) {
                
                allMarksWithPoints[i].style.cssText -= `line-height: 27px;` 
            }

        }
        
        hugeMarksOn = !hugeMarksOn

        if (hideWeightFromPointsOn) {

            hideWeightFromMarksWithPoints ()
            hideWeightFromMarksWithPoints ()
        }

        try {btHugeMarks.style.cssText += hugeMarksOn ? 'background: #00a2e2; color: #ffff;' : 'background: #fff; color: #00A2E2;'} catch (error) {}
        
        localStorage.setItem("hugeMarksOn", hugeMarksOn)
    }

    function settingsMenu () {
        
        let headerSelector = document.getElementById("settingsMenuHeader")
    
        if (settingsOn)
            headerSelector.style.cssText = 'padding-top: 0px; padding-bottom: 0px; display: none;'
        else
            headerSelector.style.cssText = 'padding-top: 0px; padding-bottom: 0px;'

        document.getElementById("btSettings").style.cssText += !settingsOn ? 'background: #00a2e2; color: #ffff;' : 'background: #fff; color: #00A2E2;'
        
        settingsOn = !settingsOn

        localStorage.setItem("settingsOn", settingsOn)
    }

    function removeMark (addedMark) {

        if (instaRemoveMarksOn) {

            removeMarkIdk()
            
        }
        else if (removeMarksOn){

            if (confirm(msg.removeMark)) {
        
                removeMarkIdk()
            }
        }
        
        function removeMarkIdk () {

            let subjectIndex = Array.from(parentNodeXTimes(addedMark, 5).children).indexOf(parentNodeXTimes(addedMark, 4)) / 3 - 1

            let subjectTemp = allSubjects[subjectIndex]
            let markTemp = addedMark.querySelector("div.ob").innerText
            
            let weightTemp
            
            if (subjectTemp == "Programování" && !addedMark.classList.contains("addedMark")) {
                
                if (addedMark.querySelector("div.bod").innerText == "X") 
                    weightTemp = 10;
                else
                    weightTemp = addedMark.querySelector("div.bod").innerText
            }
            else {
                
                if (addedMark.querySelector("span.w-100").innerText == "X") 
                    weightTemp = 10;
                else
                    weightTemp = addedMark.querySelector("span.w-100").innerText
            }

            addedMark.remove()

            for (let i = 0; i < subjectArray.length; i++) {

                if (subjectTemp == subjectArray[i] && markArray[i] == markTemp && weightArray[i] == weightTemp) {

                    subjectArray[i] = ""
                    markArray[i] = 0
                    weightArray[i] = 0

                    break
                }
            }

            fixABxNext(subjectIndex)
            
            let allTooltipsSelector = document.querySelectorAll("div.ui-tooltip")

            for (let i = 0; i < allTooltipsSelector.length; i++) 
                allTooltipsSelector[i].remove()
            
            refreshOrCreateAverage(true)

            function parentNodeXTimes(element, x) {
                let parent = element
                for (let i = 0; i < x; i++) {
                    parent = parent.parentNode
                }
                return parent
            }
        }
    }

    function fixAllABxNext () {

        resizeNeeded = false
        
        let div_znamkySelector = document.querySelectorAll("div.znamky")

        for (let i = 0; i < div_znamkySelector.length; i++) {
            
            fixABxNext(i)

            if (resizeNeeded) return
        }
    }

    function fixABxNext (i) {

        let div_znamky_div = document.querySelectorAll(`div.predmet-radek:nth-child(${(i + 1)*3+1}) > div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div`)

        let a_bx_nextSelector = document.querySelector(`div.predmet-radek:nth-child(${(i + 1)*3+1}) > div.bx-wrapper:nth-child(2) > div.bx-controls.bx-has-controls-direction:nth-child(2) > div.bx-controls-direction > a.bx-next:nth-child(2)`)

        if (div_znamky_div.length > 1) {

            let marksWidthBiggerThanViewport = div_znamky_div.length * div_znamky_div[0].clientWidth > document.querySelector(`div.predmet-radek:nth-child(${(i + 1)*3+1}) > div.bx-wrapper > div.bx-viewport`).clientWidth
        
            if (!marksWidthBiggerThanViewport && !a_bx_nextSelector.classList.contains("disabled") || marksWidthBiggerThanViewport) {
    
                resizeNeeded = true
    
                window.dispatchEvent(new Event('resize'))
            }
        }
    }

    function hideWeightFromMarksWithPoints () {

        let firstMarkInSubjectPoint = document.querySelectorAll("div.znamka-v.tooltip-bubble:nth-child(1) > div.bod")

        for (let i = 0; i < firstMarkInSubjectPoint.length; i++) {

            if (firstMarkInSubjectPoint[i].innerText.trim() == "") continue
                
            let allMarksOf1SubjectWeight = document.querySelectorAll(`div.predmet-radek:nth-child(${(i + 1) * 3 + 1}) > div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div.znamka-v.tooltip-bubble > div.dodatek > span.w-100`)
            let allMarksOf1SubjectPoints = document.querySelectorAll(`div.predmet-radek:nth-child(${(i + 1) * 3 + 1}) > div.bx-wrapper:nth-child(2) > div.bx-viewport:nth-child(1) > div.znamky > div.znamka-v.tooltip-bubble > div.bod`)

            if (!hideWeightFromPointsOn) {

                for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {

                    allMarksOf1SubjectWeight[y].style.cssText += `visibility: hidden;`
                    allMarksOf1SubjectPoints[y].style.cssText += `height: 30px; font-size: 25px; margin-top: -15px; line-height: 30px;`
                }
            }
            else {

                for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) {

                    allMarksOf1SubjectWeight[y].style.cssText -= `visibility: hidden;`
                    allMarksOf1SubjectPoints[y].style.cssText -= `height: 30px; font-size: 25px; margin-top: -15px; line-height: 30px;`
                }
            }
            
            if (hugeMarksOn && !hideWeightFromPointsOn) {

                for (let y = 0; y < allMarksOf1SubjectWeight.length; y++) 
                    allMarksOf1SubjectPoints[y].style.cssText += `font-size: 25px; line-height: 30px;`
            }
            else if (hideWeightFromPointsOn) {

                for (let y = 0; y < allMarksOf1SubjectWeight.length; y++)
                    allMarksOf1SubjectPoints[y].style.cssText += `font-size: 9px;`
            }
            else {

                for (let y = 0; y < allMarksOf1SubjectWeight.length; y++)
                    allMarksOf1SubjectPoints[y].style.cssText += `font-size: 9px; line-height: 50px;`
            }
            
            break  
        }

        hideWeightFromPointsOn = !hideWeightFromPointsOn
        
        if (document.getElementById("btHideWeightFromPoints")) {
            if (hideWeightFromPointsOn) btHideWeightFromPoints.classList.remove("ext-disabled")
            else btHideWeightFromPoints.classList.add("ext-disabled")
        }
        
        localStorage.setItem("hideWeightFromPointsOn", hideWeightFromPointsOn)
    }
    
    function createBt (On, value, id, clickFunction, parent) {

        let btName = document.createElement("input")
        btName.value = value
        btName.id = id
        btName.type = "button"
        !On ? btName.classList.add("ext-disabled", "ext-bt") : btName.classList.add("ext-bt")
        btName.addEventListener("click", clickFunction, false)
        parent.append(btName)
    }

    function createElement (type, id, parent, style = "") {
        
        let elementCreate = document.createElement(type)
        elementCreate.id = id
        elementCreate.classList.add("ext-bt")               
        elementCreate.style.cssText += style
        parent.appendChild(elementCreate)
    }

    function isNaNStrict (a) {
        
        if (a.toString().trim() == "") return true
        return isNaN(parseInt(Number(a)))
    }

    function predictorMenu () {

        let predictorMenuHeaderSelector = document.getElementById("predictorMenuHeader")
        
        if (predictorOn) {
            predictorMenuHeaderSelector.style.cssText = 'padding-top: 0px; padding-bottom: 0px; display: none;'
            btPredictor.classList.add("ext-disabled")
        }
        else {
            predictorMenuHeaderSelector.style.cssText = 'padding-top: 0px; padding-bottom: 0px;'
            btPredictor.classList.remove("ext-disabled")
        }
        
        predictorOn = !predictorOn

        localStorage.setItem("predictorOn", predictorOn)
    }

    function createHeaderAndDiv (HeaderId, DivId, On, elementAfter) {

        let header = document.createElement("header")
        header.id = HeaderId
        
        header.style.cssText = On ? 'padding-top: 0px; padding-bottom: 0px; ' : 'padding-top: 0px; padding-bottom: 0px; display: none;' 
        
        elementAfter.parentNode.insertBefore(header, elementAfter)

        let headerSelector = document.getElementById(HeaderId)

        let div = document.createElement("div")
        div.id = DivId
        headerSelector.append(div)
    }

    function removeMarkButton () {

        removeMarksOn = !removeMarksOn

        if (removeMarksOn) btRemoveMarks.classList.remove("ext-disabled")
        else btRemoveMarks.classList.add("ext-disabled")
        
        localStorage.setItem("removeMarkOn", removeMarksOn)

        if (!removeMarksOn && instaRemoveMarksOn) instaRemoveMarkButton()
    }

    function instaRemoveMarkButton () {

        instaRemoveMarksOn = !instaRemoveMarksOn

        if (instaRemoveMarksOn) btInstaRemoveMarks.classList.remove("ext-disabled")
        else btInstaRemoveMarks.classList.add("ext-disabled")
        
        localStorage.setItem("instaRemoveMarksOn", instaRemoveMarksOn)

        if (instaRemoveMarksOn && !removeMarksOn) removeMarkButton()
    }

    function ifSelectedSubjectIsProgramovani () {

        let select = document.getElementById("selectSubject")
        let subjectTemp = select.options[select.selectedIndex].text

        let inputMarkSelector = document.getElementById("inputMark")
        let inputWeightSelector = document.getElementById("inputWeight")

        let bool = subjectTemp == "Programování"
        
        inputMarkSelector.maxLength = bool ? 3 : 2
        inputMarkSelector.placeholder = bool ? msg.inputMarkPlaceholderPoints : msg.inputMarkPlaceholder

        inputWeightSelector.maxLength = bool ? 3 : 2
        inputWeightSelector.placeholder = bool ? msg.inputWeightPlaceholderPoints : msg.inputWeightPlaceholder
        
        isSelectedSubjectProgramovani = bool
    }

    function changeLanguage (bt) {

        if (bt.value == "CS") {
            
            btCs.classList.remove("ext-disabled")
            btEn.classList.add("ext-disabled")

            localStorage.setItem("language", "cs")

            alert("The language change will take effect after the page is refreshed.\nZměna jazyka se projeví po znovu načtení stránky.")
        }
        else {

            btCs.classList.add("ext-disabled")
            btEn.classList.remove("ext-disabled")

            localStorage.setItem("language", "en")

            alert("Změna jazyka se projeví po znovu načtení stránky.\nThe language change will take effect after the page is refreshed.")
        }
    }

    function refreshOrCreateAverage(addedMarkOn) {

        let sumLeft = 0
    
        let textBelowSubject = addedMarkOn ? 
            document.querySelectorAll("div.info-text > h2:nth-child(1)") : 
            document.querySelectorAll("div.info-text > span.fl:nth-child(1)")
        
        for (let y = 0; y < allSubjects.length; y++) {
            
            let sum = 0
            let quantity = 0

            for (let i = 0; i < subjectArray.length; i++) {
                
                if (subjectArray[i] == allSubjects[y]) {
                    
                    if (subjectArray[i] != "Programování") {
                        if (markArray[i][1] == "-")
                            sum += (parseInt(markArray[i][0]) + 0.5) * weightArray[i]
                        else 
                            sum += parseInt(markArray[i] * weightArray[i])
                    }
                    else 
                        sum += parseInt(markArray[i])   

                    quantity += parseInt(weightArray[i])         
                }
            }

            if (allSubjects[y] == "Programování") {
                
                let percentage = sum / quantity * 100
                
                console.log(`subject: ${allSubjects[y]}   percentage: ${percentage}`)

                textBelowSubject[y].innerText = `${msg.percentage}: ${(Math.round((percentage + Number.EPSILON) * 100000) / 100000).toFixed(2)}%`
                
                //#region This can be wrong ↴
                if (isNaN(percentage)) {}
                else if (percentage >= 83) sumLeft += 1
                else if (percentage >= 67) sumLeft += 2
                else if (percentage >= 50) sumLeft += 3
                else if (percentage >= 33) sumLeft += 4
                else sumLeft += 5
                //#endregion
            }
            else {
                
                let average = sum / quantity

                console.log(`subject: ${allSubjects[y]}   average: ${average}`)

                textBelowSubject[y].innerText = `${msg.average}: ${(Math.round((average + Number.EPSILON) * 100000) / 100000).toFixed(2)}`

                if (!isNaN(average)) sumLeft += Math.round(average)
            }
            
            if (!addedMarkOn) textBelowSubject[y].outerHTML = `<h2 class="ext-h2">${textBelowSubject[y].innerText}</h2>`  
        }

        const subjectMark = document.querySelectorAll("div.leva > div.hlavni > div")

        let sumRight = 0
        
        if (subjectMark.length != 0) {
            
            for (let i = 0; i < allSubjects.length ; i++) { 
                sumRight += subjectMark[i][1] == "-" ? 
                    parseInt(subjectMark[i][0].innerText) : 
                    parseInt(subjectMark[i].innerText)
            }
        }
        
        let numberOfValidTextsBelowSubject = 0

        for (let i = 0; i < textBelowSubject.length; i+= 1) { 
            
            if (textBelowSubject[i].innerText.search("NaN") == -1)
                numberOfValidTextsBelowSubject++
        }

        const overallAverageLeft = sumLeft / numberOfValidTextsBelowSubject
        const overallAverageRight = sumRight / allSubjects.length
        
        const overallAverageLeftRounded = Math.round((overallAverageLeft + Number.EPSILON) * 100) / 100
        const overallAverageRightRounded = Math.round((overallAverageRight + Number.EPSILON) * 100) / 100

        console.log(`overallAverageLeft: ${overallAverageLeft}`)
        console.log(`overallAverageRight: ${overallAverageRight}`)
        
        
        let headerOverallAverage
        
        if (addedMarkOn) {
            headerOverallAverage = document.getElementById("headerOverallAverage")
        }
        else {
            headerOverallAverage = document.createElement("header")
            headerOverallAverage.id = "headerOverallAverage"
            document.querySelector("main").appendChild(headerOverallAverage)
        }
        
        headerOverallAverage.style = "padding-left: 0px;padding-right: 0px;padding-top: 0px;padding-bottom: 0px;"
        
        headerOverallAverage.innerHTML = headerInnerHTML(overallAverageLeftRounded, subjectMark.length != 0 && !addedMarkOn && !isNaNStrict(overallAverageRightRounded) ? overallAverageRightRounded : "", msg.overallAverage)
        
        
        let headerStipendium
        
        if (addedMarkOn) {
            headerStipendium = document.getElementById("headerStipendium")
        }
        else {
            headerStipendium = document.createElement("header")
            headerStipendium.id = "headerStipendium"
            document.querySelector("main").appendChild(headerStipendium)
        }
        
        headerStipendium.style = "padding-left: 0px;padding-right: 0px;padding-top: 0px;padding-bottom: 0px;"
    
        headerStipendium.innerHTML = headerInnerHTML(`${stipendium(overallAverageLeftRounded)},-`, subjectMark.length != 0 && !isNaNStrict(overallAverageRightRounded) ? stipendium(overallAverageRightRounded) + ",-" : "", "Stipendium")

        function headerInnerHTML(string1, string2, title1){
            return `<div id="h2OverallAverage" style="padding-left: 14px; color: black; padding-bottom: 20px;">
                        <h2 title="${title1}" style="color: black;padding-right: 140px;font-size: 1.5em;width: 60px;">${string1}</h2>
                        <h2 title="${title1}" title="" style="color: black;font-size: 1.5em;">${string2}</h2>
                    </div>`
        }
    }
}