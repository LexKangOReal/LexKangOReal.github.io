const datalistOpt2 = document.getElementById("contract-options-opt2");
const datalistOpt3 = document.getElementById("contract-options-opt3");
// Generate 152 options
for (let i = 0; i <= 151; i++) {
    if (i != 149) {
        const option = document.createElement('option');
        option.value = `contract_${i}`;
        datalistOpt2.appendChild(option.cloneNode(true));
        datalistOpt3.appendChild(option.cloneNode(true));
    }
}
document.getElementById("select-contract-opt2").setAttribute("list", "contract-options-opt2");
document.getElementById("html-file-selector-opt3").setAttribute("list", "contract-options-opt3");