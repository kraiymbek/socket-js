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


app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    socket.on('getStockData', (message, callback) => {
        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet('Stock data');
        worksheet.columns = [
            {header: 'First Name', key: 'firstName'},
            {header: 'Last Name', key: 'lastName'},
            {header: 'Purchase Price', key: 'purchasePrice'},
            {header: 'Payments Made', key: 'paymentsMade'},
            {header: 'Amount Remaining', key: 'amountRemaining'},
            {header: '% Remaining', key: 'percentRemaining'}
        ];
        worksheet.columns.forEach(column => {
            column.width = 20
        });

        let successCounter = 0;
        let errorCounter = 0;

        for(let i = 0; i < 1000; i++) {
            // here request to get files
            successCounter ++;
            worksheet.addRow({
                firstName: 'Harry',
                lastName: 'Peake',
                purchasePrice: 1000,
                paymentsMade: 1000
            })
            io.emit('excelFormationProcess', { errorRequest: 0, successRequest: successCounter })
        }

        // const stream = ss.createStream();
        // ss(socket).emit('message', stream, {name: filename});

        // io.emit('message', workbook.xlsx.writeBuffer())
        callback()
    })

    socket.on('disconnect', () => {
        console.log("socket disconnected");
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})