const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const ss = require('socket.io-stream');
const Excel = require('exceljs');
const fs = require('fs');

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 7878
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

        let commonIndex = 0;
        let commonRows = 0;


        // next step

        if (continueRequest) {
            dataToBruteFoprce.forEach((estimatedArticule) => {
                logs.push({ status: 'system', message: `Идет подбор артикуля ${estimatedArticule}`})
                io.emit('excelFormationProcess', { logs });

                    firstStepPromises.push(
                        getBrands(selectedCity, estimatedArticule)
                            .then(data => {
                                logs.push({ status: 'success', message: `Получены бренды для артикуля ${estimatedArticule}`})
                                io.emit('excelFormationProcess', { logs });
                                return data.Items;
                            })
                            .then(res => {
                                const promises = [];
                                logs.push({ status: 'main', message: `----> ОБЩЕЕ КОЛИЧЕСТВО ПОЛУЧЕННЫХ ПОЗИИЦИИ(Брендов) ПО АРТИКУЛУ --${estimatedArticule}-- = ${res.length} штук`})
                                io.emit('excelFormationProcess', { logs });

                                res.forEach(item => {
                                    logs.push({ status: 'success', message: `Получены входные данные для запроса получении позиции артикул ${item.Article} и бренда ${item.Brand}`})
                                    io.emit('excelFormationProcess', { logs });

                                    promises.push(
                                            getProducts(selectedCity, item.Article, item.Brand, message.filterChecked)
                                                .then(res => res.Items)
                                                .then(products => {
                                                    logs.push({ status: 'main', message: `-------------- Получена позиция для артикуля --${item.Article}-- и бренда --${item.Brand}-- === ${products.length} штук`})
                                                    io.emit('excelFormationProcess', { logs });
                                                    commonRows += products.length;

                                                    products.forEach((product, index) => {
                                                        for(let key in product) {
                                                            if (message.excelChecked[key]) {
                                                                rowAdding[key] = product[key];
                                                            }
                                                        }

                                                        commonIndex++;
                                                        worksheet.addRow(rowAdding)
                                                        logs.push({ status: 'success', message: `#${commonIndex} Получена позиция для артикуля ${product.Article} и бренда ${product.Brand}`})
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
            });

            Promise.allSettled(firstStepPromises)
                .then(res => {
                    logs.push({status: 'success', message: `Все бренды получены`})
                    io.emit('excelFormationProcess', {logs});

                    return Promise.allSettled(res[0].value);
                })
                .then(data => {
                    const stream = ss.createStream();
                    workbook.xlsx.write(stream);
                    logs.push({status: 'success', message: `Excel сформирован!`})
                    logs.push({ status: 'main', message: `-------------- Записано ${commonRows} штук позиции`})
                    io.emit('excelFormationProcess', { logs });
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


    ss(socket).on('importExcelFile', async function(stream, message, callback) {
        try {
            // input excel data
            const inputWorkbook = new Excel.Workbook();
            await inputWorkbook.xlsx.read(stream);
            const inputWorksheet = inputWorkbook.worksheets[0];
            const brandHeaderName = 'mainART_BRANDS';
            const articleHeaderName = 'mainART_CODE_PARTS';

            let brandIndex;
            let articleIndex;

            // output excel data
            const logs = [];
            const firstStepPromises = [];
            const secondStepPromises = [];
            let continueRequest = false;
            const rowAdding = {};
            let outputWorkbook = new Excel.Workbook();
            let outputWorksheet = outputWorkbook.addWorksheet('Stock data');
            const outputWorksheetColumns = [];

            const selectedCity = message.selectedCity;

            Object.keys(message.excelChecked).forEach(key => {
                outputWorksheetColumns.push({
                    header: key,
                    key: key,
                })
            });

            outputWorksheet.columns = outputWorksheetColumns;
            outputWorksheet.columns.forEach(column => {
                column.width = 20
            });


            logs.push({ status: 'system', message: `---------Инициализация сервиса-----------------`})
            io.emit('excelFormationProcess', { logs });

            try {
                // init request
                await getBrands(selectedCity, 'АA1-------');
                logs.push({
                    status: 'system',
                    message: `--------- Инициализация сервиса прошла успешна -----------------`
                })
                io.emit('excelFormationProcess', {logs});
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

            let commonIndex = 0;
            let commonRows = 0;

            if (continueRequest) {
                inputWorksheet.eachRow(function(row, rowNumber) {
                    if (rowNumber === 1) {
                        row.values.forEach((item, index) => {
                            if (brandHeaderName === item) brandIndex = index;
                            if (articleHeaderName === item) articleIndex = index;
                        })
                    } else {
                        const currentBrand = row.values[brandIndex];
                        const currentArticle = row.values[articleIndex];

                        if (currentArticle && currentBrand) {
                            logs.push({ status: 'success', message: `Строка №${rowNumber - 1}: Бренд - ${currentBrand}, артикуль - ${currentArticle} `})
                            io.emit('excelFormationProcess', { logs });

                            firstStepPromises.push(
                                getProducts(selectedCity, currentArticle, currentBrand, message.filterChecked)
                                    .then(res => res.Items)
                                    .then(products => {
                                        console.log("prods", products)
                                        logs.push({ status: 'main', message: `-------------- Получена позиция для артикуля --${item.Article}-- и бренда --${item.Brand}-- === ${products.length} штук`})
                                        io.emit('excelFormationProcess', { logs });
                                        commonRows += products.length;

                                        products.forEach((product, index) => {
                                            for(let key in product) {
                                                if (message.excelChecked[key]) {
                                                    rowAdding[key] = product[key];
                                                }
                                            }

                                            commonIndex++;
                                            outputWorksheet.addRow(rowAdding)
                                            logs.push({ status: 'success', message: `#${commonIndex} Получена позиция для артикуля ${product.Article} и бренда ${product.Brand}`})
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
                            );

                        } else {
                            callback();
                            logs.push({ status: 'error', message: `Нет полей ${brandHeaderName} или ${articleHeaderName} в excel file `})
                            io.emit('excelFormationProcess', { logs });
                            throw {};
                        }
                    }
                });

                Promise.allSettled(firstStepPromises)
                    .then(res => {
                        logs.push({status: 'success', message: `Все бренды получены`})
                        io.emit('excelFormationProcess', {logs});

                        const stream = ss.createStream();
                        outputWorkbook.xlsx.write(stream);
                        logs.push({status: 'success', message: `Excel сформирован!`})
                        logs.push({ status: 'main', message: `-------------- Записано ${commonRows} штук позиции`})
                        io.emit('excelFormationProcess', { logs });
                        ss(socket).emit('excelFile', stream, {});
                        callback()
                    })
                    .catch(err => {
                        logs.push({status: 'error', message: `Ошибка на нашей стороне`})
                        console.log("err", err)
                        callback()
                    });
            }
        } catch (err) {
            console.log(err);
        }

    });


    socket.on('disconnect', () => {
        console.log("socket disconnected");
    })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})