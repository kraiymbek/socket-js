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
const { getBrands, getProducts } = require('./utils/excel')



app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {
    socket.on('getStockData', async (message, callback) => {
        const logs = [];
        const firstStepPromises = [];
        const secondStepPromises = [];
        let continueRequest = false;
        const rowAdding = {};
        let workbook = new Excel.Workbook();
        let worksheet = workbook.addWorksheet('Stock data');
        const worksheetColumns = [];




        const selectedCity = message.selectedCity;
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

        let dataToBruteFoprce = [];

        if (message.method.name === 'methodBrute') {
            const bruteForceData = bf({
                len: message.method.inputLength,
                chars: message.method.chars,
            });

            dataToBruteFoprce = bruteForceData.filter(item => item !== '');
        } else {
            dataToBruteFoprce.push(message.method.articleInput);
        }

        console.log("dataToBruteFoprce", dataToBruteFoprce)




        logs.push({ status: 'system', message: `---------Инициализация сервиса-----------------`})
        io.emit('excelFormationProcess', { logs });


        // init
        try {
            // init request
            await getBrands(selectedCity, 'АA1-------');
            logs.push({ status: 'system', message: `--------- Инициализация сервиса прошла успешна -----------------`})
            io.emit('excelFormationProcess', { logs });
            continueRequest = true;
        } catch (err) {
            callback();
            logs.push({ status: 'error', message: `--------- Провал инициализации сервиса -----------------`})
            io.emit('excelFormationProcess', { logs });

            if (err && err.response && err.response.data) {
                if (err.response.data.Message) {
                    logs.push({ status: 'error',
                        message:'ОТВЕТ ОТ СЕРВЕРА PHAETON: ' + err.response.data.Message })
                    io.emit('excelFormationProcess', { logs });
                }

                if (err.response.data.ErrorMessage) {
                    logs.push({ status: 'error',
                        message: 'ОТВЕТ ОТ СЕРВЕРА PHAETON: ' + err.response.data.ErrorMessage });
                    io.emit('excelFormationProcess', { logs });
                }
            }
        }


        // next step

        if (continueRequest) {
            dataToBruteFoprce.forEach((estimatedArticule) => {
                logs.push({ status: 'system', message: `Идет подбор артикуля ${estimatedArticule}`})
                io.emit('excelFormationProcess', { logs });

                setTimeout(() => {
                    firstStepPromises.push(
                        getBrands(selectedCity, estimatedArticule)
                            .then(data => {
                                logs.push({ status: 'success', message: `Получены бренды для артикуля ${estimatedArticule}`})
                                io.emit('excelFormationProcess', { logs });
                                return data.Items;
                            })
                            .then(res => {
                                const promises = [];
                                res.forEach(item => {
                                    setTimeout(() => {
                                        promises.push(
                                            getProducts(selectedCity, item.Article, item.Brand, message.filterChecked)
                                                .then(res => res.Items)
                                                .then(products => {
                                                    products.forEach(product => {
                                                        for(let key in product) {
                                                            if (message.excelChecked[key]) {
                                                                rowAdding[key] = product[key];
                                                            }
                                                        }
                                                        worksheet.addRow(rowAdding)
                                                        logs.push({ status: 'success', message: `Получена позиция для артикуля ${product.Article} и бренда ${product.Brand}`})
                                                        logs.push({ status: 'success', message: `В excel файл добавлена позиция артикул: ${rowAdding.Article}; название: ${rowAdding.Name}`})
                                                    });
                                                    io.emit('excelFormationProcess', { logs });
                                                    return products;
                                                })
                                                .catch(err => {
                                                    if (err && err.response.data) {
                                                        if (err.response.data.Message) {
                                                            logs.push({ status: 'error',
                                                                message:'ОТВЕТ ОТ СЕРВЕРА PHAETON: ' + err.response.data.Message + ' на запросе артикуля' + item.Article + ' и бренда ' + item.Brand})
                                                            io.emit('excelFormationProcess', { logs });
                                                        }

                                                        if (err.response.data.ErrorMessage) {
                                                            logs.push({ status: 'error',
                                                                message:'ОТВЕТ ОТ СЕРВЕРА PHAETON: ' + err.response.data.ErrorMessage + ' на запросе артикуля' + item.Article + ' и бренда ' + item.Brand});
                                                            io.emit('excelFormationProcess', { logs });
                                                        }
                                                    }
                                                })
                                        )
                                    }, 250);
                                });
                                return promises;
                            })
                            .catch(err => {
                                if (err && err.response.data) {
                                    if (err.response.data.Message) {
                                        logs.push({ status: 'error', message: 'ОТВЕТ ОТ СЕРВЕРА PHAETON: ' + err.response.data.Message + ' на запросе артикуля ' + estimatedArticule})
                                        io.emit('excelFormationProcess', { logs });
                                    }

                                    if (err.response.data.ErrorMessage) {
                                        logs.push({ status: 'error', message: 'ОТВЕТ ОТ СЕРВЕРА PHAETON: ' + err.response.data.ErrorMessage + ' на запросе артикуля ' + estimatedArticule})
                                        io.emit('excelFormationProcess', { logs });
                                    }
                                }
                            })
                    )
                }, 250);
            });

            Promise.allSettled(firstStepPromises)
                .then(res => {
                    logs.push({status: 'success', message: `Все бренды получены`})
                    io.emit('excelFormationProcess', {logs});

                    return Promise.allSettled(res[0].value);
                })
                .then(data => {
                    logs.push({status: 'success', message: `Excel сформирован!`})
                    const stream = ss.createStream();
                    workbook.xlsx.write(stream);
                    ss(socket).emit('excelFile', stream, {});
                    callback()
                })
                .catch(err => {
                    logs.push({status: 'error', message: `Ошибка на нашей стороне`})
                    console.log("err", err)
                    callback()
                });
        }
    })

    socket.on('disconnect', () => {
        console.log("socket disconnected");
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})