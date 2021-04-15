const socket = io()

let file = null;
const $getDataBtn = document.querySelector('button')

let footerTemplate = document.querySelector('#footer-template').innerHTML
let logsTemplate = document.querySelector('#logs-template').innerHTML

const renderedFooter = Mustache.render(footerTemplate, {
    date: new Date().getFullYear(),
})

document.querySelector('#footer').innerHTML = renderedFooter;

const buttonCurrentText = $getDataBtn.textContent;

const excelFieldsData = [
    {
        name: 'Brand',
        value: 'Brand',
        rus: '',
        checked: true,
        disabled: true,
    },
    {
        name: 'Article',
        value: 'Article',
        rus: '',
        checked: true,
        disabled: true,
    },
    {
        name: 'Name',
        value: 'Name',
        rus: '',
        checked: true,
        disabled: true,
    },
    {
        name: 'Price',
        value: 'Price',
        rus: '',
        checked: true,
    },
    {
        name: 'AvailableCount',
        value: 'AvailableCount',
        rus: '',
        checked: true,
    },
    {
        name: 'PriceWithoutDiscount',
        value: 'PriceWithoutDiscount',
        rus: '',
        checked: false,
    },
    {
        name: 'CleanArticle',
        value: 'CleanArticle',
        rus: '',
        checked: false,
    },
    {
        name: 'Presence',
        value: 'Presence',
        rus: '',
        checked: false,
    },
    {
        name: 'CurrencyCode',
        value: 'CurrencyCode',
        rus: '',
        checked: false,
    },
    {
        name: 'ExpectedShipmentDays',
        value: 'ExpectedShipmentDays',
        rus: '',
        checked: false,
    },
    {
        name: 'GuaranteedShipmentDays',
        value: 'GuaranteedShipmentDays',
        rus: '',
        checked: false,
    },
    {
        name: 'CountInPack',
        value: 'CountInPack',
        rus: '',
        checked: false,
    },
    {
        name: 'WarehouseId',
        value: 'WarehouseId',
        rus: '',
        checked: false,
    },
    {
        name: 'Warehouse',
        value: 'Warehouse',
        rus: '',
        checked: false,
    },
    {
        name: 'Unit',
        value: 'Unit',
        rus: '',
        checked: false,
    },
    {
        name: 'CategoryId',
        value: 'CategoryId',
        rus: '',
        checked: false,
    },
    {
        name: 'ItemId',
        value: 'ItemId',
        rus: '',
        checked: false,
    },
    {
        name: 'Discount',
        value: 'Discount',
        rus: '',
        checked: false,
    },
    {
        name: 'TotalDiscount',
        value: 'TotalDiscount',
        rus: '',
        checked: false,
    },
    {
        name: 'PriceWithoutDiscount',
        value: 'PriceWithoutDiscount',
        rus: '',
        checked: false,
    },
    {
        name: 'IsnotProduced',
        value: 'IsnotProduced',
        rus: '',
        checked: false,
    },
    {
        name: 'SupplierCode',
        value: 'SupplierCode',
        rus: '',
        checked: false,
    },
    {
        name: 'ExpectedDelivery',
        value: 'ExpectedDelivery',
        rus: '',
        checked: false,
    },
    {
        name: 'GuaranteedDelivery',
        value: 'GuaranteedDelivery',
        rus: '',
        checked: false,
    },
    {
        name: 'DeliveryProbability',
        value: 'DeliveryProbability',
        rus: '',
        checked: false,
    },
];

const filterFieldsData = [
    {
        name: 'Товары на складах Phaeton',
        value: 'InStock',
        rus: '',
        checked: true,
        disabled: true,
    },
    {
        name: 'Товары локальных поставщиков',
        value: 'LocalSuppliers',
        rus: '',
        checked: true,
        disabled: false,
    },
    {
        name: 'Товары удаленных поставщиков',
        value: 'RemoteSuppliers',
        rus: '',
        checked: true,
        disabled: false,
    },
];

const excelCheckboxTemplate = document.querySelector('#checkbox-template').innerHTML;

const renderExcelCheckBoxes = Mustache.render(excelCheckboxTemplate, {
    checkboxList: excelFieldsData,
    className: 'excel-checkbox'
})

const filterExcelCheckBoxes = Mustache.render(excelCheckboxTemplate, {
    checkboxList: filterFieldsData,
    className: 'filter-checkbox'
})

document.querySelector('#excel-checkboxes-wrapper').innerHTML = renderExcelCheckBoxes;
document.querySelector('#filter-checkboxes-wrapper').innerHTML = filterExcelCheckBoxes;


socket.on('excelFormationProcess', (messages) => {
    const html = Mustache.render(logsTemplate, {
        logs: messages.logs,
    })
    document.querySelector('#logs_wrapper').innerHTML = html
})

ss(socket).on('excelFile', function(stream,data) {

    let binaryString = "";

    stream.on('data', function (data) {

        for (let i = 0; i < data.length; i++) {
            binaryString += String.fromCharCode(data[i]);
        }

    });

    stream.on('end', function (data) {
        const url = "data:application/vnd.ms-excel;base64," + window.btoa(binaryString);
        let a = document.createElement('a');
        a.href = url;
        a.download = `PhaetonParsedData.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
});

const methodSelector = document.querySelector('.method');
const excelUploadElement = document.querySelector("#excelFile");
const helperTextExcel = document.querySelector('.helper-text-excel');


excelUploadElement.addEventListener("change", function () {
    if (this.files && this.files[0]) {

        if (this.files[0] && this.files[0].name.slice(-4) === 'xlsx') {
            helperTextExcel.style.display = 'none';
            $getDataBtn.removeAttribute('disabled')
            file = this.files[0];
        } else {
            $getDataBtn.setAttribute('disabled', 'true');
            helperTextExcel.style.display = 'block';
            helperTextExcel.textContent = 'Неверный формат файла! Нужен xlsx excel файл!';
        }

    }
}, false);


if (methodSelector.value === 'methodBrute') {
    document.querySelector('.method-brute').style.display = 'block';
    document.querySelector('.method-brand-article').style.display = 'none';
    document.querySelector('.method-import-excel').style.display = 'none';
    $getDataBtn.removeAttribute('disabled')
} else if (methodSelector.value === 'methodBrandArticle') {
    document.querySelector('.method-import-excel').style.display = 'none';
    document.querySelector('.method-brute').style.display = 'none';
    document.querySelector('.method-brand-article').style.display = 'block';
    $getDataBtn.removeAttribute('disabled')
} else if (methodSelector.value === 'methodImportExcel') {
    document.querySelector('.method-import-excel').style.display = 'block';
    document.querySelector('.method-brute').style.display = 'none';
    document.querySelector('.method-brand-article').style.display = 'none';
    $getDataBtn.setAttribute('disabled', true)
}


methodSelector.addEventListener('change',(e) => {
    if (e.target.value === 'methodBrute') {
        document.querySelector('.method-brute').style.display = 'block';
        document.querySelector('.method-brand-article').style.display = 'none';
        document.querySelector('.method-import-excel').style.display = 'none';
        $getDataBtn.removeAttribute('disabled')
    } else if (e.target.value === 'methodBrandArticle') {
        document.querySelector('.method-import-excel').style.display = 'none';
        document.querySelector('.method-brute').style.display = 'none';
        document.querySelector('.method-brand-article').style.display = 'block';
        $getDataBtn.removeAttribute('disabled')
    } else if (e.target.value === 'methodImportExcel') {
        $getDataBtn.setAttribute('disabled', true)
        document.querySelector('.method-import-excel').style.display = 'block';
        document.querySelector('.method-brute').style.display = 'none';
        document.querySelector('.method-brand-article').style.display = 'none';
    }
});

const progress = document.querySelector('.pure-material-progress-linear');

$getDataBtn.addEventListener('click', (e) => {
    $getDataBtn.textContent = 'Loading...';
    progress.style.display = 'block';
    $getDataBtn.setAttribute('disabled', 'true');
    let submitError = false;
    const bruteLengthSelectorValue = document.querySelector('.brut-length').value;
    const helperText = document.querySelector('.helper-text');
    const helperTextArticle = document.querySelector('.helper-text-article');

    const input = document.querySelector('.brute-force');
    const articleInput = document.querySelector('.articul-input');
    const formatedInput = input.value.trim().split(',');



    if (methodSelector.value === 'methodBrute') {
        const dictionary = {};
        for(let i = 0; formatedInput.length > i; i++) {
            if (formatedInput[i].length !== 1) {
                submitError = true;
                break;
            }

            if (dictionary[formatedInput[i]]) {
                dictionary[formatedInput[i]] += 1;
            } else {
                dictionary[formatedInput[i]] = 1;
            }
        }
        for (let key in dictionary) {
            if (dictionary[key] !== 1) {
                submitError = true;
                break;
            }
        }
    } else if (methodSelector.value === 'methodBrandArticle') {
        if (!articleInput.value) {
            submitError = true;
        }
    }


        if (submitError) {
            $getDataBtn.textContent = buttonCurrentText;
            $getDataBtn.removeAttribute('disabled');
            progress.style.display = 'none';


            if (methodSelector.value === 'methodBrute') {
                helperText.style.display = 'block';
                helperText.textContent = 'Неверный формат!';
            } else if (methodSelector.value === 'methodBrandArticle') {
                if (!articleInput.value) {
                    helperTextArticle.style.display = 'block';
                    helperTextArticle.textContent = 'Обязательное поле!';
                } else {
                    helperTextArticle.style.display = 'none';
                }
            }


        } else {
            helperText.style.display = 'none';
            helperTextArticle.style.display = 'none';

            const filterChecked = {};
            const excelChecked = {};
            const selectedCity = document.querySelector('.selectpicker').value;
            document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
                if (checkbox.checked === true) {
                    filterChecked[checkbox.value] = checkbox.checked;
                }
            })
            document.querySelectorAll('.excel-checkbox').forEach(checkbox => {
                if (checkbox.checked === true) {
                    excelChecked[checkbox.value] = checkbox.checked;
                }
            })

            const method = {
                name: methodSelector.value,
            };

            if (methodSelector.value === 'methodBrute') {
                method.inputLength = bruteLengthSelectorValue;
                method.chars = formatedInput;
            } else if (methodSelector.value === 'methodBrandArticle') {
                method.articleInput = articleInput.value;
            }


            if (methodSelector.value !== 'methodImportExcel') {
                socket.emit('getStockData', { excelChecked, filterChecked, selectedCity, method }, (error) => {
                    $getDataBtn.textContent = buttonCurrentText;
                    $getDataBtn.removeAttribute('disabled');
                    progress.style.display = 'none';
                })
            } else {
                if (file) {
                    var stream = ss.createStream();
                    ss(socket).emit('importExcelFile', stream, { size: file.size, name: file.name, excelChecked, filterChecked, selectedCity, method }, (error) => {
                            $getDataBtn.textContent = buttonCurrentText;
                            $getDataBtn.removeAttribute('disabled');
                            progress.style.display = 'none';
                    });
                    const blobStream = ss.createBlobReadStream(file).pipe(stream);
                    let size = 0;

                    blobStream.on('data', function(chunk) {
                        size += chunk.length;
                        console.log(Math.floor(size / file.size * 100) + '%');
                    });

                    blobStream.pipe(stream);
                }
            }
        }
})
