import { ConfigData } from './config/config';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  public queries = [];
  public results = [];
  public searching = false;

  constructor(private httpClient: HttpClient,
              private config: ConfigData) {}

  start() {
    this.httpClient.post(
      this.config.serverAddress + '/start',
      {}, 
      {
        responseType: 'text'
      }).subscribe(res => {
        this.searching = true;
        this.updateResults();
      });
  }

  stop() {
    this.httpClient.post(
      this.config.serverAddress + '/stop',
      {}, 
      {
        responseType: 'text'
      }).subscribe(res => {
        this.searching = false;
      });
  }

  status() {
    this.httpClient.get(
      this.config.serverAddress + '/status',
      {
        responseType: 'text'
      }).subscribe(res => {
        console.log('status: ', res);
        if (res === 'running') {
          this.searching = true;
        } else {
          this.searching = false;
        }
      });
  }

  updateQueries() {
    this.httpClient.get(this.config.serverAddress + '/queries').subscribe((res: any) => {
      const queries = [];
      console.log('res: ', res);
      for (const query of res) {
        queries.push({
          product: query.product,
          minPrice: query.minPrice,
          maxPrice: query.maxPrice,
          id: query._id
        })
      }
      this.queries = queries;
    });
  }

  addQuery(product, minPrice, maxPrice) {
    this.httpClient.post(this.config.serverAddress + '/queries', {
      product: product,
      minPrice: minPrice,
      maxPrice: maxPrice
    },
    {
      responseType: 'text'
    }).subscribe((res) => {
      this.updateQueries();
    });
  }

  deleteQuery(id) {
    this.httpClient.put(this.config.serverAddress + '/queries', {
      id: id
    },
    {
      responseType: 'text'
    }).subscribe((res) => {
      this.updateQueries();
    });
  }

  deleteResults() {
    this.httpClient.delete(
      this.config.serverAddress + '/results',
      {
        responseType: 'text'
      }
    ).subscribe( res => {
      console.log('result: ', res);
      this.results = [];
    });
  }

  updateResults() {
    this.httpClient.get(this.config.serverAddress + '/results').subscribe((res: any) => {
      const results = [];
      for (const result of res) {
        results.push({
          product: result.product,
          oldPrice: result.oldPrice,
          newPrice: result.newPrice,
          shop: result.shop,
          discount: result.discount,
          url: result.url
        })
      }
      this.results = results;
    });
  }

  updateInterval() {
    this.httpClient.post(
      this.config.serverAddress + '/interval',
      {
        interval: this.config.searchInterval
      },
      {
        responseType: 'text'
      }).subscribe( res => {
        console.log('interval updated');
      });
  }
}
