const socket = io()

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
        name: 'PriceWithoutDiscount',
        value: 'PriceWithoutDiscount',
        rus: '',
        checked: true,
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

const progress = document.querySelector('.pure-material-progress-linear');

$getDataBtn.addEventListener('click', (e) => {
    $getDataBtn.textContent = 'Loading...';
    progress.style.display = 'block';
    $getDataBtn.setAttribute('disabled', 'true');
    let submitError = false;

    const input = document.querySelector('.brute-force');
    const bruteLengthSelectorValue = document.querySelector('.brut-length').value;
    const formatedInput = input.value.trim().split(',');

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

    const helperText = document.querySelector('.helper-text');

    if (submitError) {
        $getDataBtn.textContent = buttonCurrentText;
        $getDataBtn.removeAttribute('disabled');
        helperText.style.display = 'block';
        helperText.textContent = 'Неверный формат!';
        progress.style.display = 'none';
    } else {
        helperText.style.display = 'none';
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

        socket.emit('getStockData', { excelChecked, filterChecked, selectedCity, bruteLengthSelectorValue, formatedInput  }, (error) => {
            $getDataBtn.textContent = buttonCurrentText;
            $getDataBtn.removeAttribute('disabled');
            progress.style.display = 'none';
        })
    }
})
