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
let csvFileName = 'N/A';
const csvNamePlacement = document.getElementById('csv-file-name');
csvNamePlacement.innerText = csvFileName;
let lastSelectedSeq = "sssn";
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
	csvFileName = file.name.split('.')[0];
	csvNamePlacement.innerText = csvFileName;
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
    if (checkContractString(selectedValue)) {
		csvNamePlacement.innerText = selectedValue;
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
	csvFileName = file.name.split('.')[0];
	csvNamePlacement.innerText = csvFileName;
    if (csvText !== undefined) {
        console.log("Successfully read csv text");
		console.log("You are viewing: ", file.name);
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


const scrollUpBtn = document.getElementById('scroll-up-button');
scrollUpBtn.addEventListener('click', function(){
	document.body.scrollTop = 1000;
	document.documentElement.scrollTop = 1000;
})

function findNextOccurrence(xpath, startIndex) {
  for (let i = startIndex + 1; i < xpaths.length; i++) {
      if (xpaths[i] === xpath) {
          return i;
      }
  }
  return -1; // If not found
}

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

// Helper function to get xpath and textContent of highlighted string
function getElementInfo(sel, range) {
    const container = range.commonAncestorContainer;
    const nodeXPaths = [];
    const nodeTexts = [];
    let currSelectCopy = sel.toString().trim();
	console.log('traverse() currSelectCopy: "'+currSelectCopy+'"');
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
            // console.log(startIndex, nodeText.indexOf(currSelectCopy), nodeText, currSelectCopy);
			// console.log('traverse():\n Start index: '+startIndex+'\nnodeText.indexOf(highlightedText): '+nodeText.indexOf(currSelectCopy)+'\nnodeText: '+nodeText+'\nhighlightedText: '+ currSelectCopy);
            let endIndex = Math.min(
              startIndex + currSelectCopy.length,
              nodeText.length
            );
            if (startIndex !== -1) {
				// Why needed to slice the text node?
            //   console.log('Entered startIndex !== -1 when current node is text node.');
              let selectedText = nodeText.substring(startIndex, endIndex);
              // remove selectedText from currSelectCopy
              currSelectCopy = currSelectCopy.replace(selectedText, "");
			//   console.log('traverse() selectedText: "'+selectedText+'";\ncurrSelectCopy: "'+currSelectCopy+'"');
            //   nodeTexts.push(selectedText);
			  nodeTexts.push(nodeText);
              nodeXPaths.push(nodeXPath);
			//   console.log('traverse(): Current node is just a text node;\nnodeTexts:',nodeTexts,'\nnodeXpaths:', nodeXPaths);
            }
          }
        } 
        // if current node is not TextNode
        else {
          // if current node has at least 1 child node
          if (node.childNodes.length > 0) {
			console.log('traverse(): \n\tEntered Recursive portion for multiple child nodes');
              // recursively traverse through all child nodes
              for (let i = 0; i < node.childNodes.length; i++) {
				console.log('traverse(): \n\tRecursive portion Current child node:\n', node.childNodes[i]);
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
                // console.log('Entered startIndex !== -1 when current node is not textnode has 0 children.');
                let selectedText = nodeText.substring(startIndex, endIndex);
                currSelectCopy = currSelectCopy.replace(selectedText, "");
                // nodeTexts.push(selectedText);
				nodeTexts.push(nodeText)
                nodeXPaths.push(nodeXPath);
				// console.log('traverse(): Curr node has no child nodes;\nnodeTexts:',nodeTexts,'\nnodeXpaths:', nodeXPaths);
              }
            }
          }
        }
      }
    }
  
    traverse(container);
  
    return { xpaths: nodeXPaths, selectedTexts: nodeTexts };
  }

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
			lastSelectedSeq = sequence;
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

let isTextSelected = false;
let selectionMap;
let colorPopup;
let colorPopups;
let popupContainer;
document.addEventListener("DOMContentLoaded", function() {
	colorPopups = [];
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
	contract.addEventListener("mouseup", function() {

		let highlightedText = window.getSelection().toString().trim();
		console.log('highlightedText:::::', highlightedText);
		let selectionRange = window.getSelection().getRangeAt(0);
		let text = selectionRange.startContainer.textContent;
		let sel = window.getSelection();
		let range = sel.getRangeAt(0);
		let xpaths_text = getElementInfo(sel, range);
		let highlightedXpaths = xpaths_text.xpaths; // xpath of the highlighted text
		let highlightedSegmentedText = xpaths_text.selectedTexts; // Array of strings; text contents of the highlighted text
		console.log('highlightedSegmentedText -->', highlightedSegmentedText);
		let highlightedTextStartIndices;
		const xpathsCnt = highlightedXpaths.length;
		if (xpathsCnt === 2) {
			highlightedTextStartIndices = [range.startOffset, 0];
		} else if (xpathsCnt > 2) {
			highlightedTextStartIndices = [range.startOffset].concat(Array(xpathsCnt-1).fill(0));
		} else {
			highlightedTextStartIndices = [range.startOffset];
		}
		console.log('highlightedTextStartIndices:::::', highlightedTextStartIndices);
		let selectionObj = {
			'highlightedText':highlightedText,
			'selectionRange':selectionRange,
			'text':text,
			'sel':sel,
			'range':range,
			'xpaths_text':xpaths_text,
			'highlightedXpaths':highlightedXpaths,
			'highlightedSegmentedText':highlightedSegmentedText,
			'highlightedTextStartIndices':highlightedTextStartIndices
		};
		selectionMap = new Map(Object.entries(selectionObj));

		// If user highlighted text, create color popup for sequence input
		if (highlightedText !== '') {
			console.log('ENTERED highlighted text');
			isTextSelected = true;
			colorPopup = createColorPopup(colorPopups, selectionMap);
			let rangeY = range.getBoundingClientRect().bottom;
			let rangeX = range.getBoundingClientRect().left;

			colorPopup.style.top = rangeY +'px';
            colorPopup.style.left = rangeX + 'px';
			colorPopups.push(colorPopup);
			
			popupContainer= document.createElement('div');
            popupContainer.className = 'popup-container';
			// colorPopup inserted at the start of the range (i.e. the first user selected character)
			// range.startContainer.parentNode.appendChild(popupContainer);
			document.body.appendChild(popupContainer);
            popupContainer.appendChild(colorPopup);

            popupContainer.addEventListener('click', function(event) {
                isClickedInsidePopupContainer = true;
                if (!colorPopup.contains(event.target)) {
                    isClickedOutsidePopup = true;
                }
                isClickedInsideContainerNOutsidePopup = isClickedInsidePopupContainer && isClickedOutsidePopup;
				if (isOptionClicked || isClickedInsideContainerNOutsidePopup) {
					colorPopup.remove();
                    colorPopups.pop();
                    popupContainer.remove();
				}
            });
		} 
		
	});
});
window.addEventListener('keydown', function(event) {
	if (event.code === 'Space' && event.target == document.body && isTextSelected) {
		event.preventDefault();
		highlightAndUpdateStorage(lastSelectedSeq, selectionMap);
		colorPopup.remove();
		colorPopups.pop();
		popupContainer.remove();
		isTextSelected = false;
	}
});
// NEEDS checking: when highlightedText is longer than nodeTextContent
function findCommonPart(highlightedText, nodeTextContent) {
	let idx = nodeTextContent.indexOf(highlightedText);
	let text = highlightedText;
	if (idx > -1) {
		return [idx, highlightedText];
	}
	while (highlightedText.length > 0) {
		highlightedText = highlightedText.slice(0,-1);
		idx = nodeTextContent.indexOf(highlightedText);
		if ((idx > -1) && (idx + highlightedText.length === nodeTextContent.length)) {
			//   console.log('1st:', highlightedText, idx)
			return [idx, highlightedText];
		}
	}
	highlightedText = text;
	while (highlightedText.length > 0) {
		highlightedText = highlightedText.slice(1);
		idx = nodeTextContent.indexOf(highlightedText);
		// console.log('2nd:', highlightedText, idx);
		if (idx === 0) {
			return [idx, highlightedText];
		}
	}
	return -1;
}
function highlightAndUpdateStorage(sequence, selectionMap){
	// Pass the information to the main window for highlighting
	// If highlighted text spans over multiple nodes	
	let highlightedText = selectionMap.get('highlightedText');
	let highlightedXpaths = selectionMap.get('highlightedXpaths');
	let highlightedSegmentedText = selectionMap.get('highlightedSegmentedText');
	let highlightedTextStartIndices = selectionMap.get('highlightedTextStartIndices');
	console.log('highlightedXpaths::::::::::',highlightedXpaths);

	if (highlightedXpaths.length > 1) {
		let flag = 0;
		let flag_bef = 0;
		let flag_aft = 0;
		let xpathIndex;
		let idx;
		let commonPart;
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
			// Find the portion of selected text within the current text node
			// const commonPart = [...highlightedSegmentedText[i]].filter(char => [...highlightedText].includes(char)).join('');
			// idx = findCommonPart(highlightedText, highlightedSegmentedText[i])[0];
			// commonPart = findCommonPart(highlightedText, highlightedSegmentedText[i])[1];
			[idx, commonPart] = findCommonPart(highlightedText, highlightedSegmentedText[i])
			//// BETTER FIND COMMON PART RATHER THAN INDEX
			// console.log('commonPart when spans over multiple elements:', commonPart, highlightedTextStartIdx);
			// If there are common characters between highlightedSegmentedText[i] and highlightedText
			console.log('highlightedSegmentedText[i]:::: "'+highlightedSegmentedText[i]+'";\nhighlightedText::: "'+highlightedText+ '";\nCOMMON PART (MULTI-xpaths): "'+commonPart+'"');
			// if (commonPart != '') {
			if (idx > -1) {
				console.log('MATCHED MULTIPLE XPATHS NO.[', i, ']: highlightedText = ', highlightedText, '; \nhighlightedSegmentedText[i] = ', highlightedSegmentedText[i], '; \nidx:', idx);
				flag = 1
				// highlightElementSelected(xpath, highlightedText, sequence)
				// Used sequence for colorMap color extraction
				// xpath is updated with an appended <span>
				console.log(highlightedTextStartIndices[i])
				highlightElementSelected(highlightedXpaths[i], commonPart, sequence, highlightedTextStartIndices[i]);
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
		console.log(highlightedTextStartIndices[0]);
		highlightElementSelected(highlightedXpaths, highlightedText, sequence, highlightedTextStartIndices[0]);
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
			// sTexts[xpathIndex] = highlightedSegmentedText;
			sTexts[xpathIndex] = highlightedText;
			tagged_sequence[xpathIndex] = 's_' + sequence;
			highlighted_xpaths[xpathIndex] = imp_part;
		} 
		updateStorage(xpaths, texts, highlighted_xpaths, sTexts, tagged_sequence);
	}
}
