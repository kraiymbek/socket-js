const axios = require('axios');

const credKeys = {
    almaty: {
        guid: '19142b51-6518-11eb-8112-f8f21e09280d',
        apiKey: 'EU8USEQ1VXm0LsLguS6Z',
    },
};

const getBrands = (city, article) => {
    const url = encodeURI(`http://api.phaeton.kz/api/Search?Article=${article}&UserGuid=${credKeys[city].guid}&ApiKey=${credKeys[city].apiKey}`);
    return axios.get(url).then(res => res.data);
}

const getProducts = (city, article, brand, sources) => {
    const params = {
        Article: article,
        UserGuid: credKeys[city].guid,
        ApiKey: credKeys[city].apiKey,
        Brand: brand,
    };

    if (sources.InStock) {
        params['Sources[]'] = 1;
    }

    if (sources.LocalSuppliers) {
        params['Sources[]'] = 2;
    }

    if (sources.RemoteSuppliers) {
        params['Sources[]'] = 3;
    }

    if (sources.includeAnalogs) {
        params['includeAnalogs'] = true;
    } else {
        params['includeAnalogs'] = false;
    }


    return axios.get(encodeURI(`http://api.phaeton.kz/api/Search`), { params })
        .then(res => res.data);
}

module.exports = {
    getBrands,
    getProducts
}