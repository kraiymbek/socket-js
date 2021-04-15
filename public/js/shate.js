const socket = io();

const inputElement = document.querySelector("input");
const submitBtn = document.querySelector('.submit-btn');
let file = null;

submitBtn.setAttribute('disabled', true)

inputElement.addEventListener("change", function () {
    if (this.files && this.files[0]) {
        submitBtn.removeAttribute('disabled')
        file = this.files[0];
    }
}, false);

submitBtn.addEventListener('click', function () {
    if (file) {
        var stream = ss.createStream();
        ss(socket).emit('importExcelFile', stream, { size: file.size, name: file.name });
        const blobStream = ss.createBlobReadStream(file).pipe(stream);
        let size = 0;

        blobStream.on('data', function(chunk) {
            size += chunk.length;
            console.log(Math.floor(size / file.size * 100) + '%');
        });

        blobStream.pipe(stream);
    }
});




ss(socket).on('uploadExcelFile', function(stream,data) {

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