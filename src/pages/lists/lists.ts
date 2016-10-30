import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, ModalController, ToastController, Content, ActionSheetController, Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';  

import { List } from '../../shared/interfaces';
import { ListCreatePage } from '../list-create/list-create';
import { ListItemsPage } from '../list-items/list-items';
import { ListCommentsPage } from '../list-comments/list-comments';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';
import { ItemsService } from '../../shared/services/items.service';
import { SqliteService } from '../../shared/services/sqlite.service';

import { ProfilePage } from '../profile/profile';
import { LoginPage } from '../login/login';
import { SignupPage } from '../signup/signup';

@Component({
  templateUrl: 'lists.html'
})
export class ListsPage implements OnInit {
  @ViewChild(Content) content: Content;
  segment: string = 'all';
  selectedSegment: string = this.segment;
  queryText: string = '';
  public start: number;
  public pageSize: number = 3;
  public loading: boolean = true;
  public internetConnected: boolean = true;

  public lists: Array<List> = [];
  public newLists: Array<List> = [];
  public favoriteListKeys: string[];

  public profilePage: any;
  public loginPage: any;
  public signUpPage: any;

  public firebaseConnectionAttempts: number = 0;

  constructor(public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    public authService: AuthService,
    public dataService: DataService,
    public sqliteService: SqliteService,
    public mappingsService: MappingsService,
    public itemsService: ItemsService,
    public events: Events) { 
        this.profilePage = ProfilePage;
        this.loginPage = LoginPage;
        this.signUpPage = SignupPage;
    }

  ngOnInit() {
    var self = this;
    self.segment = 'all';
    self.events.subscribe('network:connected', self.networkConnected);
    self.events.subscribe('lists:add', self.addNewLists);

    self.checkFirebase();
  }

  checkFirebase() {
    let self = this;
    if (!self.dataService.isFirebaseConnected()) {
      setTimeout(function () {
        console.log('Retry : ' + self.firebaseConnectionAttempts);
        self.firebaseConnectionAttempts++;
        if (self.firebaseConnectionAttempts < 5) {
          self.checkFirebase();
        } else {
          self.internetConnected = false;
          self.dataService.goOffline();
          self.loadSqliteLists();
        }
      }, 1000);
    } else {
      console.log('Firebase connection found (lists.ts) - attempt: ' + self.firebaseConnectionAttempts);
      self.dataService.getStatisticsRef().on('child_changed', self.onListAdded);
      if (self.authService.getLoggedInUser() === null) {
        // 
        self.loadLists(true);
      } else {
        self.loadLists(true);
      }
    }
  }

  loadSqliteLists() {
    let self = this;

    if (self.lists.length > 0)
      return;

    self.lists = [];
    console.log('Loading from db..');
    self.sqliteService.getLists().then((data) => {
      console.log('Found in db: ' + data.rows.length + ' lists');
      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
          let list: List = {
            key: data.rows.item(i).key,
            name: data.rows.item(i).name,
            dateCreated: data.rows.item(i).datecreated,
            user: { uid: data.rows.item(i).user, username: data.rows.item(i).username },
            items: data.rows.item(i).items,
            comments: data.rows.item(i).comments,
            shares: data.rows.item(i).shares
          };

          self.lists.push(list);
          console.log('List added from db:' + list.key);
          console.log(list);
        }
        self.loading = false;
      }
    }, (error) => {
      console.log('Error: ' + JSON.stringify(error));
      self.loading = true;
    });
  }

  public networkConnected = (connection) => {
    var self = this;
    self.internetConnected = connection[0];
    console.log('NetworkConnected event: ' + self.internetConnected);

    if (self.internetConnected) {
      self.lists = [];
      self.loadLists(true);
    } else {
      self.notify('Connection lost. Working offline..');
      // save current lists..
      setTimeout(function () {
        console.log(self.lists.length);
        self.sqliteService.saveLists(self.lists);
        self.loadSqliteLists();
      }, 1000);
    }
  }

  // Notice function declarion to keep the right this reference
  public onListAdded = (childSnapshot, prevChildKey) => {
    let priority = childSnapshot.val(); // priority..
    var self = this;
    self.events.publish('list:created');
    // fetch new list..
    self.dataService.getListsRef().orderByPriority().equalTo(priority).once('value').then(function (dataSnapshot) {
      let key = Object.keys(dataSnapshot.val())[0];
      let newList: List = self.mappingsService.getList(dataSnapshot.val()[key], key);
      console.log("lets share:"+key);
      self.dataService.shareList(key);
      //self.newLists.push(newList);
    });
  }

  public addNewLists = () => {
    var self = this;
    self.newLists.forEach(function (list: List) {
      self.lists.unshift(list);
    });

    self.newLists = [];
    self.scrollToTop();
    self.events.publish('lists:viewed');
  }

  loadLists(fromStart: boolean) {
    var self = this;

    if (fromStart) {
      self.loading = true;
      self.lists = [];
      self.newLists = [];

      if (self.segment === 'all') {
        this.dataService.getTotalLists().then(function (snapshot) {
          self.start = snapshot.val();
          self.getLists();
        });
      } else {
        self.start = 0;
        self.favoriteListKeys = [];
        self.dataService.getFavoriteLists(self.authService.getLoggedInUser().uid).then(function (dataSnapshot) {
          let favoriteLists = dataSnapshot.val();
          self.itemsService.getKeys(favoriteLists).forEach(function (listKey) {
            self.start++;
            self.favoriteListKeys.push(listKey);
          });
          self.getLists();
        });
      }
    } else {
      self.getLists();
    }
  }

  getLists() {
    var self = this;
    let startFrom: number = self.start - self.pageSize;
    if (startFrom < 0)
      startFrom = 0;
    if (self.segment === 'all') {
      /*this.dataService.getListsRef().orderByPriority().startAt(startFrom).endAt(self.start).once('value', function (snapshot) {
        self.itemsService.reversedItems<List>(self.mappingsService.getLists(snapshot)).forEach(function (list) {
          self.lists.push(list);
        });
        self.start -= (self.pageSize + 1);
        self.events.publish('lists:viewed');
        self.loading = false;
      });*/
      self.dataService.getUserListsRef().child(self.authService.getLoggedInUser().uid).on('child_added', function(snap){
        console.log("UserListsRef -> child_added", snap.key);
        var listKey:string = snap.key;
        self.dataService.getListsRef().child(listKey).on('value', function(listSnap) {
            self.lists.push(self.mappingsService.getList(listSnap.val(), listKey));
        });
      });
      self.start -= (self.pageSize + 1);
      self.events.publish('lists:viewed');
      self.loading = false;
    } else {
      self.favoriteListKeys.forEach(key => {
        this.dataService.getListsRef().child(key).once('value')
          .then(function (dataSnapshot) {
            self.lists.unshift(self.mappingsService.getList(dataSnapshot.val(), key));
          });
      });
      self.events.publish('lists:viewed');
      self.loading = false;
    }

  }

  filterLists(segment) {
    if (this.selectedSegment !== this.segment) {
      this.selectedSegment = this.segment;
      if (this.selectedSegment === 'favorites')
        this.queryText = '';
      if (this.internetConnected)
        // Initialize
        this.loadLists(true);
    } else {
      this.scrollToTop();
    }
  }

  searchLists() {
    var self = this;
    if (self.queryText.trim().length !== 0) {
      self.segment = 'all';
      // empty current lists
      self.lists = [];
      /*self.dataService.loadLists().then(function (snapshot) {
        self.itemsService.reversedItems<List>(self.mappingsService.getLists(snapshot)).forEach(function (list) {
          if (list.name.toLowerCase().includes(self.queryText.toLowerCase()))
            self.lists.push(list);
        });
      });*/
    } else { // text cleared..
      this.loadLists(true);
    }
  }

  createList() {
    var self = this;
    let modalPage = this.modalCtrl.create(ListCreatePage);

    modalPage.onDidDismiss((data: any) => {
      if (data) {
        let toast = this.toastCtrl.create({
          message: 'List created',
          duration: 3000,
          position: 'bottom'
        });
        toast.present();

        if (data.priority === 1)
          self.newLists.push(data.list);

        self.addNewLists();
      }
    });

    modalPage.present();
  }

  viewItems(key: string) {
    if (this.internetConnected) {
      this.navCtrl.push(ListItemsPage, {
        listKey: key
      });
    } else {
      this.notify('Network not found..');
    }
  }


  viewComments(key: string) {
    if (this.internetConnected) {
      this.navCtrl.push(ListCommentsPage, {
        listKey: key
      });
    } else {
      this.notify('Network not found..');
    }
  }

  reloadLists(refresher) {
    this.queryText = '';
    if (this.internetConnected) {
      this.loadLists(true);
      refresher.complete();
    } else {
      refresher.complete();
    }
  }

  fetchNextLists(infiniteScroll) {
    if (this.start > 0 && this.internetConnected) {
      this.loadLists(false);
      infiniteScroll.complete();
    } else {
      infiniteScroll.complete();
    }
  }

  scrollToTop() {
    var self = this;
    setTimeout(function () {
      self.content.scrollToTop();
    }, 1500);
  }

  notify(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    toast.present();
  }

  isUserLoggedIn(): boolean {
      let user = this.authService.getLoggedInUser();
      return user !== null;
  }

  profile() {
      var self = this;
      if( !this.isUserLoggedIn() ) {
          let actionSheet = this.actionSheetCtrl.create({
              title: 'Account',
              buttons: [
              {
                  text: 'I have an account',
                  handler: () => {
                      console.log('Login clicked');
                      let loginodal = self.modalCtrl.create(LoginPage);
                      loginodal.present();
                  }
              },
              {
                  text: 'Create an account',
                  handler: () => {
                      console.log('SignUp clicked');
                       this.navCtrl.push(SignupPage);
                  }
              },
              {
                  text: 'Cancel',
                  role: 'cancel',
                  handler: () => {
                      console.log('Cancel clicked');
                  }
              }
              ]
          });
          actionSheet.present();
      }else{
          this.navCtrl.push(ProfilePage);
      }
  }

  options() {
    let actionSheet = this.actionSheetCtrl.create({
        title: 'Options',
        buttons: [
        {
            text: 'Logout',
            handler: () => {
                console.log('Logout clicked');
                this.authService.signOut();
            }
        },
        {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
                console.log('Cancel clicked');
            }
        }
        ]
    });
    actionSheet.present();
  }

  mail(){
    
  }

}