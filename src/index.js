const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const ss = require('socket.io-stream');
const Excel = require('exceljs');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')
const bf = require('bruteforce');
const fs = require('fs')


app.use(express.static(publicDirectoryPath))


const credKeys = {
    almaty: {
        guid: '19142b51-6518-11eb-8112-f8f21e09280d',
        apiKey: 'EU8USEQ1VXm0LsLguS6Z',
    },
};

io.on('connection', (socket) => {
    socket.on('getStockData', (message, callback) => {

        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet('Stock data');
        const worksheetColumns = [];

        Object.keys(message.excelChecked).forEach(key => {
            worksheetColumns.push({
                header: key,
                key: key,
            })
        });

        worksheet.columns = worksheetColumns;
        worksheet.columns.forEach(column => {
            column.width = 20
        });

        // const bf = require('bruteforce');
        // const bruteForceData = bf({
        //     len: 2,
        //     chars: ['A', 'B', 1, 2, 3, 4, 5],
        //     step: console.log
        // });




        let successCounter = 0;
        let errorCounter = 0;


        for(let i = 0; i < 1000; i++) {
            // here request to get files
            successCounter ++;
            worksheet.addRow({
                Brand: 'Harry',
                Article: 'Peake',
                Name: 'some name',
            })

            io.emit('excelFormationProcess', { errorRequest: 0, successRequest: successCounter })
        }

        const stream = ss.createStream();
        workbook.xlsx.write(stream);
        ss(socket).emit('excelFile', stream, {});

        callback()
    })

    socket.on('disconnect', () => {
        console.log("socket disconnected");
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})