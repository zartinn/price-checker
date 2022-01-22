import { HttpService } from './../http.service';
import { ConfigData } from './../config/config';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-queries',
  templateUrl: './queries.component.html',
  styleUrls: ['./queries.component.scss'],
})
export class QueriesComponent implements OnInit {

  public get queries() {
    return this.httpService.queries;
  }


  constructor(private httpService: HttpService) {}

  ngOnInit() {
    this.httpService.updateQueries();
  }

  addQuery(product, minPrice, maxPrice) {
    this.httpService.addQuery(product, minPrice, maxPrice);
  }

  deleteQuery(id) {
    this.httpService.deleteQuery(id);
  }
}
