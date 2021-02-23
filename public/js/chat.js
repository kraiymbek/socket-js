const socket = io()

const $getDataBtn = document.querySelector('button')

let footerTemplate = document.querySelector('#footer-template').innerHTML
let logsTemplate = document.querySelector('#logs-template').innerHTML

const renderedFooter = Mustache.render(footerTemplate, {
    date: new Date().getFullYear(),
})

document.querySelector('#footer').innerHTML = renderedFooter;

const buttonCurrentText = $getDataBtn.textContent;

function checkAll1() {

    var inputs = document.querySelectorAll('.check1');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].checked = true;
    }

    this.onclick = uncheckAll1;
}

function uncheckAll1() {
    var inputs = document.querySelectorAll('.check1');
    for (var i = 0; i < inputs.length; i++) {
        inputs[i].checked = false;
    }

    this.onclick = checkAll1; //function reference to original function
}

var el = document.getElementById("checkall1"); //let for ES6 aficionados
el.onclick = checkAll1; //again, function reference, no ()

socket.on('message', (message) => {
    console.log("message", message)
    // const html = Mustache.render(messageTemplate, {
    //     username: message.username,
    //     message: message.text,
    //     createdAt: moment(message.createdAt).format('h:mm a')
    // })
})


socket.on('excelFormationProcess', (messages) => {
    const html = Mustache.render(logsTemplate, {
        successRequests: messages.successRequest,
        errorRequests: messages.errorRequest,
    })
    document.querySelector('#logs_wrapper').innerHTML = html
})

$getDataBtn.addEventListener('click', (e) => {
    $getDataBtn.textContent = 'Loading...';
    $getDataBtn.setAttribute('disabled', 'true');
    socket.emit('getStockData', {}, (error) => {
        $getDataBtn.textContent = buttonCurrentText;
        $getDataBtn.removeAttribute('disabled');
        console.log('Message delivered!')
    })
})
