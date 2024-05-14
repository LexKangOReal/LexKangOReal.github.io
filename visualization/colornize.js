function colorize(xpathMap) {
    console.log("Start to colorize");
    var colorizeCount = 0
    try {
        // 1. Traverse to the node that needs highlight
        for (let [xpath, [text, highlightedText, tagged_sequence]] of xpathMap) {
            // Check if tag is not 'outside'
            if (tagged_sequence.includes('_')) {
                var tag_type = tagged_sequence.split('_')[0];
                var tag = tagged_sequence.split('_')[1];
            } else {
                tag = tagged_sequence;
            };

            highlightElement(xpath, text, highlightedText, tag);
            colorizeCount += 1;
        }
        const paragraph = document.getElementById("visualization-status");
        paragraph.innerHTML = "Successfully visualize. Colorize " + colorizeCount + " tokens";
        paragraph.style.color = "green";
    }
    catch (error) {
      console.log(error)
      const paragraph = document.getElementById("visualization-status");
      paragraph.innerHTML = "Fail to visualize. Please check console output to figure out the error or refresh to retry";
      paragraph.style.color = "red";
    }
};
// text: column from csv
window.highlightElement = function(xpath, text, highlightedText, sequence) {
    // Retrieve highlight color based on sequence
    const colorMap = getColorMap();
    const highlightColor = colorMap.get(sequence);

    // Find the result element in the main window
    let result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // Create a tree walker as there will be multiple text nodes sharing the same xpath
    const walker = document.createTreeWalker(
        result, // Root node
        NodeFilter.SHOW_TEXT, // Show text nodes
        {
            acceptNode: function(node) {
                // Custom filter function
                if (node.parentNode === result) {
                    // Text node is a direct child of the result element
                    return NodeFilter.FILTER_ACCEPT;
                } else {
                    // Text node is in a deeper element, reject it
                    return NodeFilter.FILTER_REJECT;
                }
            }
        },
        false // Not iterating over entity references
    );

    // Iterate over text nodes and apply highlighting to each occurrence
    while (textNode = walker.nextNode()) {
        let textContent = textNode.textContent.trim();
        let index = text.indexOf(highlightedText);
        // const textContent = textNode.textContent.trim().split(/[\s,\t,\n]+/).join(' ');
        // if (text != textContent) {
        //     console.log('textContent Mis-matched:','\nxpath:', xpath, '\ntext:', text, '\ntextContent:', textContent, '\nhighlightedText:', highlightedText, '\nindex:', index);
        //     console.log('textNode', textNode);
        // }
        if (index === -1) {
            const textContentTrim = node.textContent.trim().split(/[\t\n\s]+/).join(' ');
            const indexTrim = textContentTrim.indexOf(highlightedText);
            if (indexTrim !== -1){
                textContent = textContentTrim;
                index = indexTrim;
            }
            console.log('textContentTrim:', textContentTrim, 'highlightedText:', highlightedText, indexTrim);
        }
        if (textContent.length > 0) {
            const beforeText = text.substring(0, index);
            const afterText = text.substring(index + highlightedText.length);
            const parent = textNode.parentNode;
            if (beforeText.length > 0) {
                const beforeNode = document.createTextNode(beforeText);
                parent.insertBefore(beforeNode, textNode);
            }
            const span = document.createElement('span');
            span.className = "highlighted";
            span.style.backgroundColor = highlightColor;
            span.textContent = highlightedText;
            span.style.cursor = "pointer";

            const spanSeqText = createPopup(sequence,span);
            span.onclick = function() {
                remove_popup(spanSeqText);                
                remove_highlight(span);
            };
            parent.insertBefore(span, textNode);
            if (afterText.length > 0) {
                const afterNode = document.createTextNode(afterText);
                parent.insertBefore(afterNode, textNode);
            }
            parent.removeChild(textNode);
        }
};

window.highlightElementSelected = function(xpath, highlightedText, sequence, highlightedTextStartIdx) {
    console.log('XPATH: '+xpath);
    // Retrieve highlight color based on sequence
    const colorMap = getColorMap();
    const highlightColor = colorMap.get(sequence);

    // Find the result element in the main window
    let result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

    // Create a tree walker
    const walker = document.createTreeWalker(
        result, // Root node
        NodeFilter.SHOW_TEXT, // Show text nodes
        {
            acceptNode: function(node) {
                // Custom filter function
                if (node.parentNode === result) {
                    // Text node is a direct child of the result element
                    return NodeFilter.FILTER_ACCEPT;
                } else {
                    // Text node is in a deeper element, reject it
                    return NodeFilter.FILTER_REJECT;
                }
            }
        },
        false // Not iterating over entity references
    );

    // Iterate over text nodes and apply highlighting to each occurrence
    let node;
    // Node should be textNode; restricted by the treeWalker
    while (node = walker.nextNode()) {
        console.log('Entered highlightElementSelected with walker.nextNode():\nnode:', node);
        const parent = node.parentNode;
        let textContent = node.textContent;
        let index = textContent.indexOf(highlightedText);
        console.log('textContent:', textContent, '\nhighlightedText:', highlightedText, index);
        if (index === -1) {
            const textContentTrim = node.textContent.trim().split(/[\t\n\s]+/).join(' ');
            const indexTrim = textContentTrim.indexOf(highlightedText);
            if (indexTrim !== -1){
                textContent = textContentTrim;
                index = indexTrim;
            }
            console.log('textContentTrim: "'+textContentTrim+'";\nhighlightedText:"'+highlightedText+'";\nIndexTrim:',indexTrim);
        }
        if (index !== -1) {
            const beforeText = textContent.substring(0, index);
            const afterText = textContent.substring(index + highlightedText.length);

            // ADDED
            // const beforeText = textContent.substring(0, highlightedTextStartIdx);
            // const afterText = textContent.substring(highlightedTextStartIdx + highlightedText.length);
            // console.log('NEWLY ADDED highlightedTextStartIdx:::::',highlightedTextStartIdx);
            // console.log('Before text: "'+beforeText+'"; \nAfter text: "'+afterText+'"');
            // ADDED ENDED
            const span = document.createElement('span');
            span.className = "highlighted";
            span.style.backgroundColor = highlightColor;
            span.textContent = highlightedText;
            span.style.cursor = "pointer";

            if (beforeText.length > 0) {
                const beforeNode = document.createTextNode(beforeText);
                parent.insertBefore(beforeNode, node);
            }
            parent.insertBefore(span, node);
            if (afterText.length > 0) {
                const afterNode = document.createTextNode(afterText);
                parent.insertBefore(afterNode, node);
            }
            parent.removeChild(node);

            const spanSeqText = createPopup(sequence, span);
            // Remove popup and highlight when clicked
            span.onclick = function() {
                remove_popup(spanSeqText);
                remove_highlight(span);
            };
            // NEWLY ADDED
            break;
        }
    }
};
// Add popup for tag information
function createPopup(sequence, span) {
    const spanSeqText = document.createElement('span');
    spanSeqText.textContent = sequence;
    spanSeqText.className = "highlight-sequence-text";
    span.appendChild(spanSeqText);
    // Show popup when being hovered on
    span.onmouseover = function() {
        spanSeqText.style.display = 'inline';
    };
    // Hide popup when mouse leaves
    span.onmouseleave = function() {
        spanSeqText.style.display = 'None';
    };
    return spanSeqText;
};
function remove_popup(spanPopup) {
    console.log('spanPopup:', spanPopup);
    console.log('spanPopup.childNodes:', spanPopup.childNodes);
    spanPopup.removeChild(spanPopup.childNodes[0]);
    spanPopup.parentNode.removeChild(spanPopup);
};
function remove_highlight(span) {
    // Get the parent node of the span
    const parent = span.parentNode;

    // Create a text node containing the text of the span    
    const textNode = document.createTextNode(span.textContent);

    remove_index = sTexts.indexOf(textNode.data);
    sTexts[remove_index] = '';
    tagged_sequence[remove_index] = 'o';
    highlighted_xpaths[remove_index] = '';
    updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
    // Replace the span with the text node
    parent.replaceChild(textNode, span);

    // Check if there are consecutive text nodes as siblings to the current text node
    // If there are, join them together
    // ASSUME no text nodes are broken before highlight removal
    let currentNode = parent.firstChild;
    while (currentNode){
        if (currentNode.nodeType===3 && currentNode.nextSibling && currentNode.nextSibling.nodeType===3){
            currentNode.textContent += currentNode.nextSibling.textContent;
            parent.removeChild(currentNode.nextSibling);
        } else {
            currentNode = currentNode.nextSibling;
        }
    }
}
}
