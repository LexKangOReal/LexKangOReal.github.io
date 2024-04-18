const htmlFileUploaderOpt1 = document.getElementById('html-file-uploader-opt1');
const csvFileUploaderOpt1 = document.getElementById('csv-file-uploader-opt1');

const contractSelectorOpt2 = document.getElementById('select-contract-opt2');

const htmlFileSelectorOpt3 = document.getElementById('html-file-selector-opt3');
const csvFileUploaderOpt3 = document.getElementById('csv-file-uploader-opt3');

let xpaths = []
let texts = []
let highlighted_xpaths = []
let sTexts = []
let tagged_sequence = []
updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence)
console.log('First updateStorage:', xpaths.length, xpaths);
// OPTION 1
// Listen to event - read a HTML file with Option 1
htmlFileUploaderOpt1.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const htmlText = await readHTML(file);
    if (htmlText !== undefined) {
        console.log("Successfully read html text");
        processHTML(htmlText);
    }
})

// Listen to event - read a CSV file with Option 1 -> Colornize
csvFileUploaderOpt1.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const csvText = await readCSV(file);
    if (csvText !== undefined) {
        console.log("Successfully read csv text");
        visualizeGroundTruth(csvText);
    }
})
// OPTION 2
// Listen to event - select a contract to visualize with Option 2 -> Colornize
contractSelectorOpt2.addEventListener('input', async () => {
    const selectedValue = contractSelectorOpt2.value;
    // console.log('User selected:', selectedValue);
    if (checkContractString(selectedValue)) {
        // console.log("True");
        const htmlText = await loadFile("contract/html/"+selectedValue+".html", "html");
        const csvText = await loadFile("contract/csv/"+selectedValue+".csv", "csv");
        if (htmlText !== undefined && csvText !== undefined) {
            console.log("Successfully load html file and csv file");
            processHTML(htmlText);
            visualizeGroundTruth(csvText);
        }
    }
});

// OPTION 3
// Listen to event - select a HTML with Option 3
htmlFileSelectorOpt3.addEventListener('input', async() => {
    const selectedValue = htmlFileSelectorOpt3.value;
    console.log('User Selected for Option 3:', selectedValue);
    if (checkContractString(selectedValue)) {
        const htmlText = await loadFile("contract/html/" + selectedValue + ".html", "html");
        if (htmlText != undefined) {
            console.log("Successfully load html file.");
            processHTML(htmlText);
        }
    }
});

// Listen to event -  read the uploaded CSV to visualize with Option 3 -> Colorize
csvFileUploaderOpt3.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const csvText = await readCSV(file);
    if (csvText !== undefined) {
        console.log("Successfully read csv text");
        visualizeGroundTruth(csvText);
    }
})


// Visualize the ground truth with CSV text
function visualizeGroundTruth(csvText) {
    const csvData = processCSV(csvText);
    const xpathMap = getXPathLabelMap(csvData.slice(1));
    colorize(xpathMap);
}

// Check whether user inputs a valid contract number for Option 2
function checkContractString(str) {
    if (str=="149") {
        return false;
    }
    const regex = /^contract_(?:[0-9]|[1-9][0-9]|1[0-4][0-9]|150|151)$/;
    return regex.test(str);
}


let isMenuOpen = false;
let selectedOption = null;

function findNextOccurrence(xpath, startIndex) {
  for (let i = startIndex + 1; i < xpaths.length; i++) {
      if (xpaths[i] === xpath) {
          return i;
      }
  }
  return -1; // If not found
}

// document.addEventListener('keydown', (event) => {
//     if (event.code === 'Space') {
//         event.preventDefault();
//         let highlightedText = window.getSelection().toString();
//         console.log(highlightedText);
//         let selectionRange = window.getSelection().getRangeAt(0);
//         let text = selectionRange.startContainer.textContent;
//         console.log(text);
//         let sel = window.getSelection();
//         let range = sel.getRangeAt(0);
//         let xpaths_text = getElementInfo(sel, range);
//         console.log(xpaths_text);
//         let highlightedXpaths = xpaths_text.xpaths; // xpath of the highlighted text
//         let highlightedSegmentedText = xpaths_text.selectedTexts; // Array of strings; text contents of the highlighted text
//         console.log('keydown: highlightedSegmentedText -->', highlightedSegmentedText);

//         // Open dialog box in new window
//         if (!isMenuOpen) {
//             isMenuOpen = true;
//             const menuWindow = window.open("", "Dialog Box", `width=700,height=700`);
//             const dialog = menuWindow.document.createElement("div");
//             dialog.style.display = "flex";
//             dialog.style.flexDirection = "column";
//             dialog.style.justifyContent = "center";
//             dialog.style.alignItems = "center";
//             dialog.style.backgroundColor = "gray";
//             menuWindow.document.body.appendChild(dialog);
//             const message = menuWindow.document.createElement("p");
//             const xpath_text_message = menuWindow.document.createElement("p");
//             xpath_text_message.textContent = "XPATHS: " + highlightedXpaths.map(xpath_ => xpath_ + '\n\n');
//             message.textContent = "Classes: t, tn, n, st, sn, sst, ... , ssssn. Press SPACE when done; any other key to reset";
//             message.style.fontSize = "12px";
//             xpath_text_message.style.fontSize = "12px";
//             dialog.appendChild(message);
//             dialog.appendChild(xpath_text_message);

//             let sequence = ''; // sequence of user input
//             const allowedKeys = new Set(['t', 'n', 's'])
//             const labelTypes = new Set(['t', 'tn', 'n', 'st', 'sn', 'sst', 'ssn', 'ssst', 'sssn', 'ssssn', 'sssst'])

//             function handleKeyDown(event) {
//                 // Intermediate input: if user input character is t or n or s, add to the sequence and consider the current sequence legit
//                 if (allowedKeys.has(event.key)) {
//                   sequence += event.key;
//                 } 
//                 // Final input: if user input space and sequence is legit
//                 else if (event.code === 'Space' && sequence.length > 0 && labelTypes.has(sequence)) {
//                     // Pass the information to the main window for highlighting
//                     // If highlighted text spans over multiple elements
//                     if (highlightedXpaths.length > 1) {
//                         let flag = 0;
//                         let flag_bef = 0;
//                         let flag_aft = 0;
//                         let xpathIndex;
//                         // Iterate through all elements that the highlighted text spans
//                         for (let i = 0; i < highlightedSegmentedText.length; i++) {
//                             let taggedSeq;
//                             if (i - flag_bef === 0) {
//                             taggedSeq = 's_' + sequence; // first word of the expression
//                             } else if (i === highlightedSegmentedText.length - 1) {
//                             taggedSeq = 'e_' + sequence; // last word of the expression
//                             } else {
//                             taggedSeq = 'i_' + sequence;
//                             }   
//                             // Find the text intersection between highlightedSegmentedText[i] and highlightedText
//                             // WHY NECESSARY?
//                             const commonPart = [...highlightedSegmentedText[i]].filter(char => [...highlightedText].includes(char)).join('');
//                             console.log('commonPart when spans over multiple elements:', commonPart);
//                             // If there are common characters between highlightedSegmentedText[i] and highlightedText
//                             if (commonPart != '') {
//                                 flag = 1
//                                 // highlightElementSelected(xpath, highlightedText, sequence)
//                                 // Used sequence for colorMap color extraction
//                                 // xpath is updated with an appended <span>
//                                 highlightElementSelected(highlightedXpaths[i], commonPart, sequence);
//                                 // Remove structural xpath resulting from nested webpage
//                                 // xpath.substring(0, 11) => '/html/body/'
//                                 imp_part_with_span = highlightedXpaths[i].substring(0, 11) + highlightedXpaths[i].substring(34);
//                                 let imp_part;
//                                 // WHY not check imp_part_with_span.lastIndexOf('/span[')???
//                                 // ALERT: Rely on the condition that text is successfully highlighted and <span> was appended????
//                                 if (imp_part_with_span.indexOf('/span[') != -1) {
//                                     imp_part = imp_part_with_span.substring(0, imp_part_with_span.lastIndexOf('/span['));
//                                 } else {
//                                     imp_part = imp_part_with_span;
//                                 }
//                                 // WHERE is the xpaths called??? List of xpaths to what? Straight from csv?
//                                 xpathIndex = xpaths.indexOf(imp_part);
//                                 if (xpathIndex != -1) {
//                                     if (tagged_sequence[xpathIndex] !== 'o') {
//                                         // Counter corner cases: part of the text of the xpath is tagged non-o
//                                         while(tagged_sequence[xpathIndex] !== 'o') {
//                                             const nextIndex = findNextOccurrence(imp_part, xpathIndex);
//                                             if (nextIndex !== -1) {
//                                                 // Next occurrence found
//                                                 console.log("Next occurrence index:", nextIndex);
//                                                 xpathIndex = nextIndex; // Update xpathIndex for the next iteration
//                                             } else {
//                                                 console.log("No next occurrence found.");
//                                                 break; // Exit the loop if no next occurrence is found
//                                             }

//                                         }
//                                     }
//                                     sTexts[xpathIndex] = highlightedSegmentedText[i];
//                                     tagged_sequence[xpathIndex] = taggedSeq;
//                                     highlighted_xpaths[xpathIndex] = imp_part;
//                                 } 
//                                 // WHAT if the highlighted text does not have a specific xpath in the csv or in `xpaths`???
//                             } else {
//                                 // flag_aft could be dropped since never aggregated??? If entered this else, flag has to be 0.
//                                 if (flag == 0) flag_bef += 1;
//                                 else flag_aft += 1;
//                             }
//                         }
//                     if (flag_aft > 0) {
//                         console.log('!!!!!Entered if (flag_aft > 0)!!!!!')
//                         console.log(tagged_sequence[xpathIndex][0]);
//                         if (tagged_sequence[xpathIndex][0] !== 's') {
//                             tagged_sequence[xpathIndex] = 'e_'+sequence;
//                         }
//                         console.log(tagged_sequence[xpathIndex][0]);
//                     }
//                         updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
//                     } else {
//                         highlightElementSelected(highlightedXpaths, highlightedText, sequence);
//                         imp_part_with_span = highlightedXpaths[0].substring(0, 11) + highlightedXpaths[0].substring(34);
//                         let imp_part;
//                         if (imp_part_with_span.indexOf('/span[') != -1) {
//                             imp_part = imp_part_with_span.substring(0, imp_part_with_span.lastIndexOf('/span['));
//                         } else {
//                             // when clicked for highlight removal
//                             imp_part = imp_part_with_span;
//                         }
//                         const xpathIndex = xpaths.indexOf(imp_part);
//                         if (xpathIndex != -1) {
//                             sTexts[xpathIndex] = highlightedSegmentedText;
//                             tagged_sequence[xpathIndex] = 's_' + sequence;
//                             highlighted_xpaths[xpathIndex] = imp_part;
//                         } 
//                         updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
//                     }
//                     isMenuOpen = false;
//                     menuWindow.close();
//                 } 
//                 // Void if input is improper
//                 else {
//                     sequence = '';
//                 }
//                 console.log(sequence);
//                 const currSeq = menuWindow.document.createElement("p");
//                 currSeq.textContent = `Curr sequence: ${sequence}`;
//                 currSeq.style.fontSize = "12px";
//                 dialog.appendChild(currSeq);
//             }

//             menuWindow.addEventListener('keydown', handleKeyDown);

//             menuWindow.addEventListener('unload', function() {
//                 menuWindow.removeEventListener('keydown', handleKeyDown);
//                 isMenuOpen = false;
//             });
//         }
//     }
// });

function downloadJson() {
  downloadObjectAsJson(sessionStorage, 'contract_saved');
}
function downloadObjectAsJson(exportObj, exportName) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// UNUSED Helper function to get xpath and textContent of highlighted string from getElementInfo()
function getAllXPathsAndTexts() {
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(document.body);
  sel.removeAllRanges();
  sel.addRange(range);

  const xpaths_text = getElementInfo(sel, range);
  const highlightedXpaths = xpaths_text.xpaths;
  const highlightedSegmentedText = xpaths_text.selectedTexts;
  
  return [highlightedSegmentedText, highlightedXpaths];
}

// Helper function to get xpath and textContent of highlighted string
function getElementInfo(sel, range) {
    const container = range.commonAncestorContainer;
    const nodeXPaths = [];
    const nodeTexts = [];
    let currSelectCopy = sel.toString().trim();

    // Start from the lowest level of node and traverse upwards to obtain the xpath
    function getXPath(node) {
      let xpath = "";
      // for (initialization; condition; afterthought)
      // When node is of type ELEMENT execute STMT and update node to its parentNode after execution
      for (; node && node.nodeType == Node.ELEMENT_NODE; node = node.parentNode) {
        let siblings = Array.from(node.parentNode.childNodes).filter(
          (sibling) => sibling.nodeName === node.nodeName
        );
        if (siblings.length > 1) {
          let index = siblings.indexOf(node) + 1;
          xpath = `/${node.nodeName.toLowerCase()}[${index}]${xpath}`;
        } else {
          xpath = `/${node.nodeName.toLowerCase()}${xpath}`;
        }
      }
      return xpath;
    }
  
    function traverse(node) {
      // if the selection range intersects with the node
      if (range.intersectsNode(node)) {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim().length > 0) {
            let nodeXPath = getXPath(node.parentNode);
            console.log('traverse() nodeXpath', nodeXPath);
            // let nodeText = node.textContent.trim();
            let nodeText = node.textContent.trim().split(/[\s,\t,\n]+/).join(' ');
            let startIndex = Math.max(nodeText.indexOf(currSelectCopy), 0);
            console.log(startIndex, nodeText.indexOf(currSelectCopy), nodeText, currSelectCopy);
            let endIndex = Math.min(
              startIndex + currSelectCopy.length,
              nodeText.length
            );
            if (startIndex !== -1) {
            // if (nodeText.indexOf(currSelectCopy) !== -1) {
              console.log('Entered startIndex !== -1 when current node is text node.');
              let selectedText = nodeText.substring(startIndex, endIndex);
              // remove selectedText from currSelectCopy
              currSelectCopy = currSelectCopy.replace(selectedText, "");
              nodeTexts.push(selectedText);
              nodeXPaths.push(nodeXPath);
            }
          }
        } 
        // if current node is not TextNode
        else {
          // if current node has at least 1 child node
          if (node.childNodes.length > 0) {
              // recursively traverse through all child nodes
              for (let i = 0; i < node.childNodes.length; i++) {
                traverse(node.childNodes[i]);
              }
            }
          // if current node has no child nodes
          else {
            // consider only nodes with text
            if (node.textContent.trim().length > 0) {
              let nodeXPath = getXPath(node);
              // let nodeText = node.textContent.trim();
              let nodeText = node.textContent.trim().split(/[\s,\t,\n]+/).join(' ');
              let startIndex = Math.max(nodeText.indexOf(currSelectCopy), 0);
              let endIndex = Math.min(
                startIndex + currSelectCopy.length,
                nodeText.length
              );
              if (startIndex !== -1) {
              // if (nodeText.indexOf(currSelectCopy) !== -1) {
                console.log('Entered startIndex !== -1 when current node is not textnode has 0 children.');
                let selectedText = nodeText.substring(startIndex, endIndex);
                currSelectCopy = currSelectCopy.replace(selectedText, "");
                nodeTexts.push(selectedText);
                nodeXPaths.push(nodeXPath);
              }
            }
          }
        }
      }
    }
  
    traverse(container);
  
    return { xpaths: nodeXPaths, selectedTexts: nodeTexts };
  }

// function handleKeyDown(event) {
//     // Intermediate input: if user input character is t or n or s, add to the sequence and consider the current sequence legit
//     if (allowedKeys.has(event.key)) {
//       	sequence += event.key;
//     } 
//     // Final input: if user input space and sequence is legit
//     else if (event.code === 'Space' && sequence.length > 0 && labelTypes.has(sequence)) {
//         // Pass the information to the main window for highlighting
//         // If highlighted text spans over multiple nodes
//         if (highlightedXpaths.length > 1) {
//             let flag = 0;
//             let flag_bef = 0;
//             let flag_aft = 0;
//             let xpathIndex;
//             // Iterate through all elements that the highlighted text spans
//             for (let i = 0; i < highlightedSegmentedText.length; i++) {
//                 let taggedSeq;
//                 if (i - flag_bef === 0) {
//                 taggedSeq = 's_' + sequence; // first word of the expression
//                 } else if (i === highlightedSegmentedText.length - 1) {
//                 taggedSeq = 'e_' + sequence; // last word of the expression
//                 } else {
//                 taggedSeq = 'i_' + sequence;
//                 }   
//                 // Find the text intersection between highlightedSegmentedText[i] and highlightedText
//                 // WHY NECESSARY?
//                 const commonPart = [...highlightedSegmentedText[i]].filter(char => [...highlightedText].includes(char)).join('');
//                 console.log('commonPart when spans over multiple elements:', commonPart);
//                 // If there are common characters between highlightedSegmentedText[i] and highlightedText
//                 if (commonPart != '') {
//                     flag = 1
//                     // highlightElementSelected(xpath, highlightedText, sequence)
//                     // Used sequence for colorMap color extraction
//                     // xpath is updated with an appended <span>
//                     highlightElementSelected(highlightedXpaths[i], commonPart, sequence);
//                     // Remove structural xpath resulting from nested webpage
//                     // xpath.substring(0, 11) => '/html/body/'
//                     imp_part_with_span = highlightedXpaths[i].substring(0, 11) + highlightedXpaths[i].substring(34);
//                     let imp_part;
//                     // WHY not check imp_part_with_span.lastIndexOf('/span[')???
//                     // ALERT: Rely on the condition that text is successfully highlighted and <span> was appended????
//                     if (imp_part_with_span.indexOf('/span[') != -1) {
//                         imp_part = imp_part_with_span.substring(0, imp_part_with_span.lastIndexOf('/span['));
//                     } else {
//                         imp_part = imp_part_with_span;
//                     }
//                     // WHERE is the xpaths called??? List of xpaths to what? Straight from csv?
//                     xpathIndex = xpaths.indexOf(imp_part);
//                     if (xpathIndex != -1) {
//                         if (tagged_sequence[xpathIndex] !== 'o') {
//                             // Counter corner cases: part of the text of the xpath is tagged non-o
//                             while(tagged_sequence[xpathIndex] !== 'o') {
//                                 const nextIndex = findNextOccurrence(imp_part, xpathIndex);
//                                 if (nextIndex !== -1) {
//                                     // Next occurrence found
//                                     console.log("Next occurrence index:", nextIndex);
//                                     xpathIndex = nextIndex; // Update xpathIndex for the next iteration
//                                 } else {
//                                     console.log("No next occurrence found.");
//                                     break; // Exit the loop if no next occurrence is found
//                                 }

//                             }
//                         }
//                         sTexts[xpathIndex] = highlightedSegmentedText[i];
//                         tagged_sequence[xpathIndex] = taggedSeq;
//                         highlighted_xpaths[xpathIndex] = imp_part;
//                     } 
//                     // WHAT if the highlighted text does not have a specific xpath in the csv or in `xpaths`???
//                 } else {
//                     // flag_aft could be dropped since never aggregated??? If entered this else, flag has to be 0.
//                     if (flag == 0) flag_bef += 1;
//                     else flag_aft += 1;
//                 }
//             }
//         if (flag_aft > 0) {
//             console.log('!!!!!Entered if (flag_aft > 0)!!!!!')
//             console.log(tagged_sequence[xpathIndex][0]);
//             if (tagged_sequence[xpathIndex][0] !== 's') {
//                 tagged_sequence[xpathIndex] = 'e_'+sequence;
//             }
//             console.log(tagged_sequence[xpathIndex][0]);
//         }
//             updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
//         } else {
// 			// User selected section contains only 1 node
//             highlightElementSelected(highlightedXpaths, highlightedText, sequence);
//             imp_part_with_span = highlightedXpaths[0].substring(0, 11) + highlightedXpaths[0].substring(34);
//             let imp_part;
//             if (imp_part_with_span.indexOf('/span[') != -1) {
//                 imp_part = imp_part_with_span.substring(0, imp_part_with_span.lastIndexOf('/span['));
//             } else {
//                 // when clicked for highlight removal
//                 imp_part = imp_part_with_span;
//             }
//             const xpathIndex = xpaths.indexOf(imp_part);
//             if (xpathIndex != -1) {
//                 sTexts[xpathIndex] = highlightedSegmentedText;
//                 tagged_sequence[xpathIndex] = 's_' + sequence;
//                 highlighted_xpaths[xpathIndex] = imp_part;
//             } 
//             updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
//         }
//         isMenuOpen = false;
//         menuWindow.close();
//     } 
//     // Void if input is improper
//     else {
//         sequence = '';
//     }
//     console.log(sequence);
//     const currSeq = menuWindow.document.createElement("p");
//     currSeq.textContent = `Curr sequence: ${sequence}`;
//     currSeq.style.fontSize = "12px";
//     dialog.appendChild(currSeq);
//   }

const colorMap = getColorMap();
function createColorOption(node, color, sequence) {
	var div = document.createElement('div');
	div.className = 'color-option';
	div.style.backgroundColor = color;
	var text = document.createElement('span');
	text.className = 'color-option-text';
	text.textContent = sequence;
	div.appendChild(text);
	node.appendChild(div);
}
function createColorOptions(node, colorMap) {
	let titleDiv = document.createElement('div');
	titleDiv.className = 'options-title';
	let numberDiv = document.createElement('div'); 
	numberDiv.className = 'options-number';
	node.appendChild(numberDiv);
	node.appendChild(titleDiv);
	colorMap.forEach((color, sequence) => {
		if (sequence.slice(-1) == 'n'){
			createColorOption(numberDiv, color, sequence);
		} else {
			createColorOption(titleDiv, color, sequence);
		}         
	});
}
function createColorPopup(colorPopups, selectionMap) {
	const colorPopup = document.createElement('div');
	colorPopup.className = 'color-popup';
	createColorOptions(colorPopup, colorMap);
	const colorOptions = colorPopup.querySelectorAll('.color-option');

	// Append colorize function to each option.
	colorOptions.forEach(function(option) {
		option.addEventListener("click", function() {
			let color = option.style.backgroundColor;
			let sequence = [...colorMap].find(([k, v]) => v.toLowerCase() === color)[0];
			colorPopup.remove();
			colorPopups.pop();
			console.log("color + sequence:", color, sequence);
			highlightAndUpdateStorage(sequence, selectionMap);
			console.log("colorPopups in create after removal:", colorPopups);
			console.log("color + sequence:", color, sequence); // Log selected color to console
		});
	});
	console.log('colorpopup created');
	return colorPopup;
};

  
document.addEventListener("DOMContentLoaded", function() {
	const colorPopups = [];
	let contract = document.getElementById('html-preview');
	let isOptionClicked = false;
	let isClickedInsidePopupContainer = false;
	let isClickedOutsidePopup = false;
	let isClickedInsideContainerNOutsidePopup = false;

	// Register event listeners for color options
	const colorOptions = document.getElementsByClassName('color-option');
	for (const option of colorOptions) {
		option.addEventListener('click', function() {
			isOptionClicked = true;
		});
	}
	contract.addEventListener("mouseup", function(event) {

		let highlightedText = window.getSelection().toString().trim();
		let selectionRange = window.getSelection().getRangeAt(0);
		let text = selectionRange.startContainer.textContent;
		let sel = window.getSelection();
		let range = sel.getRangeAt(0);
		let xpaths_text = getElementInfo(sel, range);
		let highlightedXpaths = xpaths_text.xpaths; // xpath of the highlighted text
		let highlightedSegmentedText = xpaths_text.selectedTexts; // Array of strings; text contents of the highlighted text
		console.log('highlightedSegmentedText -->', highlightedSegmentedText);
		let selectionObj = {
			'highlightedText':highlightedText,
			'selectionRange':selectionRange,
			'text':text,
			'sel':sel,
			'range':range,
			'xpaths_text':xpaths_text,
			'highlightedXpaths':highlightedXpaths,
			'highlightedSegmentedText':highlightedSegmentedText
		};
		let selectionMap = new Map(Object.entries(selectionObj));

		// If user highlighted text, create color popup for sequence input
		if (highlightedText !== '') {
			const colorPopup = createColorPopup(colorPopups, selectionMap);
			let rangeY = range.getBoundingClientRect().bottom;
			let rangeX = range.getBoundingClientRect().left;

			// colorPopup.style.top = document.documentElement.scrollTop + rangeY +'px';
            // colorPopup.style.left = document.documentElement.scrollLeft + rangeX + 'px';
			// colorPopup.style.top = window.scrollY + rangeY +'px';
            // colorPopup.style.left = window.scrollX + rangeX + 'px';
			colorPopup.style.top = rangeY +'px';
            colorPopup.style.left = rangeX + 'px';
			colorPopups.push(colorPopup);
			// colorPopup inserted at the start of the range (i.e. the first user selected character)
			// range.startContainer.parentNode.appendChild(colorPopup);
			
			const popupContainer= document.createElement('div');
            popupContainer.className = 'popup-container';
			// range.startContainer.parentNode.appendChild(popupContainer);
			document.body.appendChild(popupContainer);
            // contract.children[2].children[0].children[0].children[0].children[0].children[0].appendChild(popupContainer);
            popupContainer.appendChild(colorPopup);

            popupContainer.addEventListener('click', function(event) {
                isClickedInsidePopupContainer = true;
                if (!colorPopup.contains(event.target)) {
                    isClickedOutsidePopup = true;
                }
                isClickedInsideContainerNOutsidePopup = isClickedInsidePopupContainer && isClickedOutsidePopup;

                if (isOptionClicked) {
                    colorPopup.remove();
                    colorPopups.pop();
                    popupContainer.remove();
                    console.log('COLOR CHOSEN: colorpop and list cleared & popupContainer cleared after color is chosen');
                } else if (isClickedInsideContainerNOutsidePopup) {
                    colorPopup.remove();
                    colorPopups.pop();
                    popupContainer.remove();
                    console.log('INSIDE CONTRAINER CLICKED: colorpop and list cleared & popupContainer cleared');
                }
            });
		} 
		
	});
});
function highlightAndUpdateStorage(sequence, selectionMap){
        // Pass the information to the main window for highlighting
        // If highlighted text spans over multiple nodes
		
	let highlightedText = selectionMap.get('highlightedText');
	let selectionRange = selectionMap.get('selectionRange');
	let text = selectionMap.get('text');
	let sel = selectionMap.get('sel');
	let range = selectionMap.get('range');
	let xpaths_text = selectionMap.get('xpaths_text');
	let highlightedXpaths = selectionMap.get('highlightedXpaths');
	let highlightedSegmentedText = selectionMap.get('highlightedSegmentedText');

	if (highlightedXpaths.length > 1) {
		let flag = 0;
		let flag_bef = 0;
		let flag_aft = 0;
		let xpathIndex;
		// Iterate through all elements that the highlighted text spans
		for (let i = 0; i < highlightedSegmentedText.length; i++) {
			let taggedSeq;
			if (i - flag_bef === 0) {
			taggedSeq = 's_' + sequence; // first word of the expression
			} else if (i === highlightedSegmentedText.length - 1) {
			taggedSeq = 'e_' + sequence; // last word of the expression
			} else {
			taggedSeq = 'i_' + sequence;
			}   
			// Find the text intersection between highlightedSegmentedText[i] and highlightedText
			// WHY NECESSARY?
			const commonPart = [...highlightedSegmentedText[i]].filter(char => [...highlightedText].includes(char)).join('');
			console.log('commonPart when spans over multiple elements:', commonPart);
			// If there are common characters between highlightedSegmentedText[i] and highlightedText
			if (commonPart != '') {
				flag = 1
				// highlightElementSelected(xpath, highlightedText, sequence)
				// Used sequence for colorMap color extraction
				// xpath is updated with an appended <span>
				highlightElementSelected(highlightedXpaths[i], commonPart, sequence);
				// Remove structural xpath resulting from nested webpage
				// xpath.substring(0, 11) => '/html/body/'
				imp_part_with_span = highlightedXpaths[i].substring(0, 11) + highlightedXpaths[i].substring(34);
				let imp_part;
				// WHY not check imp_part_with_span.lastIndexOf('/span[')???
				// ALERT: Rely on the condition that text is successfully highlighted and <span> was appended????
				if (imp_part_with_span.indexOf('/span[') != -1) {
					imp_part = imp_part_with_span.substring(0, imp_part_with_span.lastIndexOf('/span['));
				} else {
					imp_part = imp_part_with_span;
				}
				xpathIndex = xpaths.indexOf(imp_part);
				if (xpathIndex != -1) {
					if (tagged_sequence[xpathIndex] !== 'o') {
						// Counter corner cases: part of the text of the xpath is tagged non-o
						while(tagged_sequence[xpathIndex] !== 'o') {
							const nextIndex = findNextOccurrence(imp_part, xpathIndex);
							if (nextIndex !== -1) {
								// Next occurrence found
								console.log("Next occurrence index:", nextIndex);
								xpathIndex = nextIndex; // Update xpathIndex for the next iteration
							} else {
								console.log("No next occurrence found.");
								break; // Exit the loop if no next occurrence is found
							}

						}
					}
					sTexts[xpathIndex] = highlightedSegmentedText[i];
					tagged_sequence[xpathIndex] = taggedSeq;
					highlighted_xpaths[xpathIndex] = imp_part;
				} 
				// WHAT if the highlighted text does not have a specific xpath in the csv or in `xpaths`???
			} else {
				// flag_aft could be dropped since never aggregated??? If entered this else, flag has to be 0.
				if (flag == 0) flag_bef += 1;
				else flag_aft += 1;
			}
		}
	if (flag_aft > 0) {
		console.log('!!!!!Entered if (flag_aft > 0)!!!!!')
		console.log(tagged_sequence[xpathIndex][0]);
		if (tagged_sequence[xpathIndex][0] !== 's') {
			tagged_sequence[xpathIndex] = 'e_'+sequence;
		}
		console.log(tagged_sequence[xpathIndex][0]);
	}
		updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
	} else {
		// User selected section contains only 1 node
		highlightElementSelected(highlightedXpaths, highlightedText, sequence);
		imp_part_with_span = highlightedXpaths[0].substring(0, 11) + highlightedXpaths[0].substring(34);
		let imp_part;
		if (imp_part_with_span.indexOf('/span[') != -1) {
			imp_part = imp_part_with_span.substring(0, imp_part_with_span.lastIndexOf('/span['));
		} else {
			// when clicked for highlight removal
			imp_part = imp_part_with_span;
		}
		const xpathIndex = xpaths.indexOf(imp_part);
		if (xpathIndex != -1) {
			sTexts[xpathIndex] = highlightedSegmentedText;
			tagged_sequence[xpathIndex] = 's_' + sequence;
			highlighted_xpaths[xpathIndex] = imp_part;
		} 
		updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
	}
}
