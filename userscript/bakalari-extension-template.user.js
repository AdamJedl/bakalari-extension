// ==UserScript==
// @name        Bakalari - Average, predictor...
// @description Average by subject, average overall, predictor, wide mode, big marks, stipendium...
// @namespace   Violentmonkey Scripts
// @match       https://*/next/prubzna.aspx
// @match       https://*/next/pololetni.aspx
// @grant       GM_addStyle
// @run-at      document-start
// @version     1.1.1
// @author      AdamJedl
// @homepageURL https://github.com/AdamJedl/bakalari-extension
// @license     GPL-3.0
// ==/UserScript==

let url = window.location.href

if (url.includes("prubzna.aspx")) {

  GM_addStyle (`

    //content.css

  `);

  
  let language2;
  const html = document.querySelector('html')
  if (html && html.lang !== "") {
      language2 = html.lang
  } else {
      language2 = navigator.language
  }

  if (language2 !== "cs") {
    language2 = "en"
  }

  //content_script.js
}
else {

  //content_script_2.js
}
