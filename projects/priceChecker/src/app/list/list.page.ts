import { HttpService } from './../http.service';
import { ConfigData } from './../config/config';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss']
})
export class ListPage implements OnInit {

  public status = 'not checked yet'

  constructor(public config: ConfigData,
              private httpClient: HttpClient,
              private httpService: HttpService) {}

  ngOnInit() {
    if (this.config.serverAddress) {
      this.checkServerStatus();
    }
  }

  saveServer(value) {
    value = value.indexOf('http') === 0 ? value : `http://${value}`;
    this.config.serverAddress = value;    
    this.checkServerStatus();
  }

  saveInterval(value) {
    value = Math.max(value, 30);
    this.config.searchInterval = value;

    this.httpClient.post(`${this.config.serverAddress}/interval`, { interval: value }).subscribe((res) => {
      this.status = 'Server online';
      this.httpService.updateResults();
    }, (err) => {
      this.status = `Error code: ${err.status}`
    });
  }
  
  checkServerStatus() {
    const headers = new HttpHeaders({
      'access-content-origin': '*'
    });
    this.status = 'checking...';
    console.log('checking for ', this.config.serverAddress + '/status', headers);
    this.httpClient.get(`${this.config.serverAddress}/status`, {headers: headers, responseType: 'text'}).subscribe((res) => {
      this.status = 'Server online';
    }, (err) => {
      console.log(err);
      this.status = `Error code: ${err.status}`
    });
  } 
}
