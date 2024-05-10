
const clone: Node = document
    .querySelector("#cphmain_divZnamky > table > tbody")!
    .lastElementChild!.cloneNode(true);

document.querySelector("#cphmain_divZnamky > table > tbody")?.append(clone);

const nameOfLastSubjectName: unknown = document.querySelector(
    "#cphmain_divZnamky > table > tbody"
)?.lastElementChild?.firstElementChild;

if (nameOfLastSubjectName instanceof HTMLElement) {
    nameOfLastSubjectName.textContent = "";
    nameOfLastSubjectName.style.paddingTop = "50px";
    nameOfLastSubjectName.style.paddingBottom = "0px";
} else {
    console.error(
        `"#cphmain_divZnamky > table > tbody".lastElementChild.firstElementChild is null | undefined`
    );
}

let index = 2;

while (true) {
    const idk: HTMLElement | null = document.querySelector<HTMLElement>(
        `#cphmain_divZnamky > table > tbody > tr:nth-child(1) > td:nth-child(${index})`
    );

    if (idk === null || idk.textContent === "") {
        break;
    }

    idk.style.fontSize = "17px";

    let sum = 0;
    let count = 0;

    for (
        let index2 = 3;
        index2 <
        document.querySelectorAll("#cphmain_divZnamky > table > tbody > tr").length;
        index2++
    ) {
        const idk2: HTMLElement | null =
            document.querySelector<HTMLElement>(
                `#cphmain_divZnamky > table > tbody > tr:nth-child(${index2}) > td:nth-child(${index}) > span`
            ) ??
            document.querySelector<HTMLElement>(
                `#cphmain_divZnamky > table > tbody > tr:nth-child(${index2}) > td:nth-child(${index})`
            );

        if (!idk2) {
            continue;
        }

        idk2.style.fontSize = "17px";

        if (!(Number.isNaN(Number(idk2.textContent!.trim())) || idk2.textContent!.trim().trim() === "")) {
            count++;
            sum += Number.parseInt(idk2.textContent!, 10);
        }
    }

    console.log(`overallAverage${index - 1}: ${sum / count}`);

    const overallAverageSelector: HTMLElement | null = document.querySelector(
        `#cphmain_divZnamky > table > tbody > tr:nth-child(${
            document.querySelectorAll("#cphmain_divZnamky > table > tbody > tr").length
        }) > td:nth-child(${index})`
    );

    overallAverageSelector!.textContent = (
        Math.round((sum / count + Number.EPSILON) * 100) / 100
    ).toString();
    overallAverageSelector!.style.fontSize = "22px";

    index++;
}
