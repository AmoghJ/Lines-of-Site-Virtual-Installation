// set up text to print, each item in array is new line
const aText = new Array(
    
    ["How do we design for an ecology and economy of care?"],
    ["What are we turning to, for hope in the pandemic?"],
    ["How can design help us reclaim urban spaces?"],
    ["What lies at the sociological and technological intersection","in design?"],
    ["Can design become a tool for participatory policymaking?"],
    ["Can products be designed with regeneration and repair in mind?"],

    ["How did we collectively experience and document the pandemic as youth?"],
    ["How may we retain the heritage of a craft while bringing in", "new influences?"],
    ["What does it mean to be a Muslim in India?"],
    ["How can art be tailored for the body?"],
    ["How might we facilitate creatively constructive conversations?"],
    ["How can we bridge creative storytelling and market research together", "to create engaging narratives?"],
    ["Can self-expression subvert the normative design process?"],
    ["Can self-reflection become a tool for design?"],

    ["How do textiles become the medium for personal and communal histories?"],
    ["How can we inspire women to be themselves unabashedly and see their", "happy and liberated selves represented?"],
    ["What could identity beyond the Modernist paradigms look like?"],
    ["What would a Museum of Design in India look like?"],
    ["How can empathy and objectivity go hand in hand to tell a tale of love and loss?"],
    ["What is the politics of Ornament, and how does one make it visible?"],
    ["How to speculate for the future when reality is stranger than fiction?"],

    ["Can surface design be a tool for social commentary?"],
    ["How can we address the politics of gender in and through typography?"],
    ["Is nature the ultimate provider of ‘Service design’?"],
    ["How can systems be more inclusive to those conventionally excluded","by the patriarchy?"],
    ["Can Cinema become a driver of social change?"],
    ["How can we traverse the border between art and design?"],

    ["How do we visualise warning signs for the future in the present?"],
    ["How do algorithms envision us; who envisions the algorithm?"],
    ["When do we see the future start and the present end?"],
    ["Whose visions of the future are we designing for?"],
    ["How do we solve the problems of a future we can’t see yet?"]
);  

var currentCap = 0;
var maxCap = aText.length;

const iSpeed = 100; // time delay of print out
var iIndex = 0; // start printing array at this posision
var iArrLength = aText[currentCap][0].length; // the length of the text array
var iScrollAt = 300; // start scrolling up at this many lines
var iTextPos = 0; // initialise text position
var sContents = ''; // initialise contents variable
var iRow; // initialise current row

export function startType() {
    window.typewriter();
}

window.typewriter = function() {
    sContents =  ' ';
    iRow = Math.max(0, iIndex-iScrollAt);
    var destination = document.getElementById("Caption");
    
    while ( iRow < iIndex ) {
    sContents += aText[currentCap][iRow++] + '<br />';
    }

    destination.innerHTML = sContents + aText[currentCap][iIndex].substring(0, iTextPos) + "<span id='cursor'>_</span>";

    if ( iTextPos++ == iArrLength ) {

    iTextPos = 0;
    iIndex++;

    if ( iIndex != aText[currentCap].length ) {
    iArrLength = aText[currentCap][iIndex].length;
    setTimeout("javascript: typewriter();", 500);
    }

    } else {
    setTimeout("javascript: typewriter();", iSpeed);
    }

    if(iIndex == aText[currentCap].length)
        setTimeout("javascript: clearCaption();", 1000);
}

window.clearCaption = function() {

    currentCap++;

    if(currentCap >= maxCap)
        currentCap = 0;

    var destination = document.getElementById("Caption");
    destination.innerHTML = '';
    iIndex = 0;
    iTextPos = 0;
    iArrLength = aText[currentCap][0].length;

    startType();
}