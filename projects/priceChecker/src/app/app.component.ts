import { HttpService } from './http.service';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Push, PushObject } from '@ionic-native/push/ngx';

import { ConfigData } from './config/config';
import { combineLatest } from 'rxjs';

// const { PushNotifications } = Plugins;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  public appPages = [
    {
      title: 'Results',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'Settings',
      url: '/list',
      icon: 'list'
    },
    {
      title: 'Queries',
      url: '/queries',
      icon: 'list'
    }
  ];

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private config: ConfigData,
    private httpClient: HttpClient,
    private push: Push,
    public httpService: HttpService
    ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      combineLatest(this.config.ready$, this.config.serverAddress$)
      .subscribe((res) => {
        if (res[0] && res[1]) {
          console.log(this.config.searchInterval);
          if (this.config.searchInterval) {
            this.httpService.updateInterval();
          }
          this.initPushNotifications();
          this.httpService.status();
          this.httpService.updateResults();
        }
      });
    });
  }

  initPushNotifications() {
    const pushObject: PushObject = this.push.init({
      android: {
      },
      ios: {
        alert: 'true',
        badge: true,
        sound: 'false'
      },
      windows: {}
    });

    console.log('on registration');
    pushObject.on('registration').subscribe((data) => {
        this.httpClient.post(`${this.config.serverAddress}/firebase/deviceId`,
                            {
                              deviceId: data.registrationId
                            },
                            {
                              responseType: 'text'
                            })
        .subscribe((res) => {
          console.log(res);
          console.log('device token sent to server ', data.registrationId);
        }, (err) => {
          console.error('Error while sending deviceId to backend', err);
        });
    });

    this.push.hasPermission()
      .then((res: any) => {
        if (res.isEnabled) {
          console.log('We have permission to send push notifications');
        } else {
          console.log('We do not have permission to send push notifications');
        }
    });

    pushObject.on('notification').subscribe((data) => {
      this.httpService.updateResults();
    });
  }

  startSearch() {
    this.httpService.start();
  }

  stopSearch() {
    this.httpService.stop();
  }
}
