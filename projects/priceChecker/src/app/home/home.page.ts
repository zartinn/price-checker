import { HttpService } from './../http.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public get results() {
    return this.httpService.results;
  }

  constructor(private httpService: HttpService) {}

  routeTo(url) {
    window.open(url, '_system', 'location=yes');
  }

  deleteResults() {
    this.httpService.deleteResults();
  }

}
