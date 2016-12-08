import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, ModalController, ToastController, Content, ActionSheetController, Events } from 'ionic-angular';

import { List } from '../../shared/interfaces';
import { ListCreatePage } from '../list-create/list-create';
import { ListItemsPage } from '../list-items/list-items';
//import { ListCommentsPage } from '../list-comments/list-comments';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';
import { ItemsService } from '../../shared/services/items.service';
import { SqliteService } from '../../shared/services/sqlite.service';

import { ProfilePage } from '../profile/profile';
import { LoginPage } from '../login/login';
import { SignupPage } from '../signup/signup';
import { FriendsPage } from '../friends/friends';

@Component({
  selector: 'list-page',
  templateUrl: 'lists.html'
})
export class ListsPage implements OnInit {
  @ViewChild(Content) content: Content;

  public start: number;
  public pageSize: number = 6;
  public loading: boolean = true;
  public internetConnected: boolean = true;
  public connected: boolean = false;
  public myUser: any;

  public lists: Array<List> = [];
  public newLists: Array<List> = [];
  public favoriteListKeys: string[];

  public profilePage: any;
  public loginPage: any;
  public signUpPage: any;
  public friendsPage: any;

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

        if (!this.authService.isAuthenticated()) {
          this.navCtrl.setRoot(LoginPage);
        }

        this.profilePage = ProfilePage;
        this.loginPage = LoginPage;
        this.signUpPage = SignupPage;
        this.friendsPage = FriendsPage;
    }

  ngOnInit() {
    var self = this; 
    self.events.subscribe('network:connected', self.networkConnected);
    //self.events.subscribe('lists:add', self.addNewLists);
    self.checkFirebase();
  }

  checkFirebase() {
    let self = this;
    if (!self.dataService.isFirebaseConnected()) {
      setTimeout(function () {
        if(!self.connected){  // check after timeout
          console.log('Retry : ' + self.firebaseConnectionAttempts);
          self.firebaseConnectionAttempts++;
          if (self.firebaseConnectionAttempts < 5) {
            self.checkFirebase();
          } else {
            self.internetConnected = false;
            self.dataService.goOffline();
            self.loadSqliteLists();
          }
        }
      }, 1200);
    } else if(!self.connected){
      self.connected = true;
      self.myUser = self.authService.getLoggedInUser();
      console.log('Firebase connection found (lists.ts) - attempt: ' + self.firebaseConnectionAttempts);
      self.loadLists();
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
            shares: data.rows.item(i).shares, 
            users: data.rows.item(i).users || []
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
      self.loadLists();
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

  loadLists() {
    var self = this;

    if ( !self.isUserLoggedIn() ){
      self.loading = false;
    }else{
      self.lists = [];
      self.newLists = [];
      self.dataService.getTotalUserLists(self.myUser.uid).then(function (snapshot) {
        var total = snapshot.val() || 0;
        self.getLists(total==0);
      });
      /*this.dataService.getTotalUserLists(self.authService.getLoggedInUser().uid).then(function (snapshot) {
        self.start = snapshot.val() || self.pageSize;
        self.getLists();
      });*/
    }
  }

  getLists(userHasNoLists:boolean) {
    var self = this;
    /*this.dataService.getListsRef().orderByPriority().startAt(startFrom).endAt(self.start).once('value', function (snapshot) {
      self.itemsService.reversedItems<List>(self.mappingsService.getLists(snapshot)).forEach(function (list) {
        self.lists.push(list);
      });
      self.start -= (self.pageSize + 1);
      self.events.publish('lists:viewed');
      self.loading = false;
    });*/
    console.debug("load_lists:init "+ (new Date()).toString());
    if(userHasNoLists){
      self.loading = false;
      console.debug("load_lists:userHasNoLists - "+ (new Date()).toString());
    }

    self.dataService.getUserListsRef().child(self.myUser.uid).on('child_added', function(snap){  
      console.log("lists : child_added : "+snap.key);
      var listKey:string = snap.key;
      self.loading = true;
      self.dataService.getListsRef().child(listKey).once('value', function(listSnap) {
         console.log("lists : child_added : getListsRef");
          var newList:List = self.mappingsService.getList(listSnap, listKey);
          self.lists.unshift(newList);
          self.loading = false;
          console.debug("load_lists:stop - "+ (new Date()).toString());
      });
    });

    self.dataService.getUserListsRef().child(self.myUser.uid).on('child_removed', function(snap){ 
      console.log("lists : child_removed : "+snap.key);
      var listKey:string = snap.key;
      for(var i:number=0; i<self.lists.length; i++){
          if(self.lists[i].key == listKey){
              self.itemsService.removeItemFromArray(self.lists, self.lists[i]);
              break;
          }
      }
    });
    
    self.dataService.getListsRef().on('child_changed', function(changeSnap) {
      console.log("lists : child_changed : "+changeSnap.key);
      console.log(changeSnap.val());
      if(changeSnap.key && self.lists.length>0){
        var changedList:List = self.mappingsService.getList(changeSnap, changeSnap.key);
        for(var i:number=0; i<self.lists.length; i++){
          if(self.lists[i].key == changedList.key){
              self.lists[i] = changedList;
              break;
          }
        }
      }
    });   

    //self.start -= (self.pageSize + 1);
    
      
    self.events.publish('lists:viewed');
/*
    self.dataService.getUserListsRef().child(self.myUser.uid).once('value', function(snapshot){  
      self.itemsService.reversedItems<List>(self.mappingsService.getLists(snapshot)).forEach(function (list) {
        self.lists.push(list);
      });
      self.events.publish('lists:viewed');
      self.loading = false;
      console.debug("load_lists:end - "+ (new Date()).toString());
    });
*/
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

        /*if (data.priority === 1)
          self.newLists.push(data.list);

        self.addNewLists();*/
        self.scrollToTop();
      }
    });

    modalPage.present();
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
      console.log(newList);
      if(newList.user.uid==self.myUser.uid){
        console.log("lets share:"+newList.key);
        self.dataService.shareList(newList.key);
        //self.newLists.push(newList);
      }      
    });
  }


  viewItems(listKey:string) {
    var self = this;
    if (this.internetConnected && self.lists!=null) {
      for (var i = 0; i < self.lists.length; i++) {
        var list:List = self.lists[i];
        if( listKey == list.key){
          this.navCtrl.push(ListItemsPage, { list: list });
          break;
        }
      }
    } else {
      this.notify('Network not found..');
    }
  }

  reloadLists(refresher) {
    /*if (this.internetConnected) {
      this.loadLists(true);
      refresher.complete();
    } else {*/
      refresher.complete();
    //}
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

  friends() {
    if( this.isUserLoggedIn() ) {
      this.navCtrl.push(FriendsPage);
    } else {
      console.error("not logged in");
    } 
  }

  mail(){
    
  }

}