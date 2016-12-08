import { Component, ViewChild, OnInit } from '@angular/core';
import { Platform, MenuController, NavController, ViewController, Events, ModalController } from 'ionic-angular';
import { Network, Splashscreen, StatusBar } from 'ionic-native';
import { Subscription } from '../../node_modules/rxjs/Subscription';

import { AuthService } from '../shared/services/auth.service';
import { DataService } from '../shared/services/data.service';
import { SqliteService } from '../shared/services/sqlite.service';
import { TabsPage} from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
//import { ListsPage } from '../pages/lists/lists';
import { SignupPage } from '../pages/signup/signup';
//import { AuthPage } from '../pages/auth/auth';

//import * as firebase from 'firebase';

declare var window: any;

@Component({
  templateUrl: 'app.html'
})
export class AListaApp implements OnInit {
  @ViewChild('content') nav: any;

  public rootPage: any;
  public homePage: any;
  public loginPage: any;

  connectSubscription: Subscription;

  constructor(platform: Platform,
    public dataService: DataService,
    public authService: AuthService,
    public sqliteService: SqliteService,
    public menu: MenuController,
    public events: Events,
    public modalCtrl: ModalController) {
    
    var self = this;
/*
    const firebaseConfig = {
      apiKey: "AIzaSyDMe9yFePVXg8vUfWznjqFwsV-5QlrjQEw",
      authDomain: "alista-cccbe.firebaseapp.com",
      databaseURL: "https://alista-cccbe.firebaseio.com",
      storageBucket: "alista-cccbe.appspot.com"
    };
    firebase.initializeApp(firebaseConfig);*/

    platform.ready().then(() => {

      if (window.cordova) {
        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        StatusBar.styleDefault();
        self.watchForConnection();
        self.watchForDisconnect();
        Splashscreen.hide();

        console.log('in ready..');
        let array: string[] = platform.platforms();
        console.log(array);
        self.sqliteService.InitDatabase();
      }

      this.rootPage = TabsPage; // ListsPage; //TabsPage; ListsPage AuthPage
      this.homePage = TabsPage;
      this.loginPage = LoginPage;

    });
  }

  watchForConnection() {
    var self = this;
    Network.onConnect().subscribe(() => {
      console.log('network connected!');
      // We just got a connection but we need to wait briefly
      // before we determine the connection type.  Might need to wait
      // prior to doing any api requests as well.
      setTimeout(() => {
        console.log('we got a connection..');
        console.log('Firebase: Go Online..');
        self.dataService.goOnline();
        self.events.publish('network:connected', true);
      }, 3000);
    });
  }

  watchForDisconnect() {
    var self = this;
    // watch network for a disconnect
    Network.onDisconnect().subscribe(() => {
      console.log('network was disconnected :-(');
      console.log('Firebase: Go Offline..');
      //self.sqliteService.resetDatabase();
      self.dataService.goOffline();
      self.events.publish('network:connected', false);
    });
  }

  hideSplashScreen() {
    if (Splashscreen) {
      setTimeout(() => {
        Splashscreen.hide();
      }, 100);
    }
  }

  private setRoot(newRootPage: any){
    this.rootPage = newRootPage;
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    var self = this;

    this.authService.onAuthStateChanged(function (user) {
      if (user === null) {
        self.menu.close();
        self.nav.setRoot(LoginPage);

        //let loginodal = self.modalCtrl.create(LoginPage);
        //loginodal.present();
      }else{
        self.nav.setRoot(TabsPage);
      }
    });
  }

  openPage(page) {
    let viewCtrl: ViewController = this.nav.getActive();
    // close the menu when clicking a link from the menu
    this.menu.close();

    if (page === 'signup') {
      if (!(viewCtrl.instance instanceof SignupPage))
        this.nav.push(SignupPage);
    }
    else {
      this.nav.setRoot(page);
    }
  }

  signout() {
    var self = this;
    self.menu.close();
    self.authService.signOut().then(function(){
        /*this.navCtrl.setRoot(LoginPage).then(data => {
                  console.log(`Data is ${data}`);
              }, (error) => {
                  console.log(`Error is ${error}`);
              });*/

        //self.nav.setRoot(LoginPage);
        this.nav.parent.pop();
        let toast = this.toastCtrl.create({
            message: 'Logged out successfully',
            duration: 3000,
            position: 'middle'
        });
        toast.present();
    });
  }

  isUserLoggedIn(): boolean {
    let user = this.authService.getLoggedInUser();
    return user !== null;
  }
}