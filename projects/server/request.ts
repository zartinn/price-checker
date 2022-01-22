// import {request } from 'request';
const request = require('request');
const queryJson = require('./query.json');

const bodyHeader = `{"preference":"showdeal"}\n`;
// {"query":{"bool":{"must":[{"bool":{"must":[{"bool":{"should":[{"multi_match":{"query":"iphone","fields":["product^1","mainshop^2"],"type":"cross_fields","operator":"and"}},{"multi_match":{"query":"iphone","fields":["product^1","mainshop^2"],"type":"phrase_prefix","operator":"and"}}],"minimum_should_match":"1"}},{"exists":{"field":"mainshop.keyword"}},{"bool":{"must":[{"range":{"percent":{"gte":-100,"lte":-10}}},{"range":{"crawling":{"gte":"now-30m","lte":"now"}}},{"range":{"old_price":{"gte":10,"lte":99999}}}]}}]}}]}},"size":30,"aggs":{"mainshop.keyword":{"terms":{"field":"mainshop.keyword","size":50,"order":{"_count":"desc"}}}},"_source":{"includes":["*"],"excludes":[]},"from":0,"sort":[{"crawling":{"order":"desc"}}]}\n`


// Webseite: 
const options = {
    url: 'https://elk.averio.de/avp-diff/_msearch?',
    body: null,
    headers: {
        'Content-type': 'application/json'
    }
};


export async function sendApiRequest(queries, queryInterval): Promise<any> {
    options.body = getJsonQueries(queries, queryInterval);
    return new Promise((resolve, reject) => {
        request.post(options, async (err, res, body) => {
            const results = [];
            // body = JSON.parse(body);
            for (let result of body.responses[0].hits.hits) {
                results.push(result);
            }
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

function getJsonQueries(queries: any[], queryInterval) {
    let body = bodyHeader;
    queryJson.query.bool.must[0].bool.should = [];
    for (const query of queries) {
        addQuery(query.product, query.minPrice, query.maxPrice, queryInterval);
    }
    return body + JSON.stringify(queryJson) + '\n';
}

function addQuery(product, minPrice, maxPrice, queryInterval) {
    const obj = { bool: {}};
    obj.bool['should'] = [];
    const match = JSON.parse(JSON.stringify(multiMatch));
    match.multi_match.query = product;

    obj.bool['should'].push(match);
    obj.bool['minimum_should_match'] = '1';
    obj.bool['must'] = [];
    obj.bool['must'].push(percent);
    const interval = JSON.parse(JSON.stringify(crawling));
    interval.range.crawling.gte = 'now-' + queryInterval + 5 + 's';
    obj.bool['must'].push(interval);
    const priceObject = JSON.parse(JSON.stringify(price));
    priceObject.range.new_price.gte = minPrice;
    priceObject.range.new_price.lte = maxPrice;
    obj.bool['must'].push(priceObject);
    queryJson.query.bool.must[0].bool.should.push(obj);
}


export const percent = {
  range: {
    percent: {
      gte: -100,
      lte: -1
    }
  }
}

export const crawling = {
  range: {
    crawling: {
      gte: 'now-30m',
      lte: 'now'
    }
  }
}

export const price = {
  range: {
    new_price: {
      gte: 0,
      lte: 1000,
      boost: 2
    }
  }
}

export const multiMatch = {
  multi_match: {
    query: '',
    fields: ['product^1', 'mainshop^2'],
    type: 'cross_fields',
    operator: 'and'
  }
}

interface Result {
  category,
  crawling,
  key_id,
  url,
  mainshop,
  new_price,
  old_price,
  product
}