import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, ModalController, ToastController, Content, ActionSheetController, Events, LoadingController } from 'ionic-angular';

import { UserProfile } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';
import { ItemsService } from '../../shared/services/items.service';
import { SqliteService } from '../../shared/services/sqlite.service';

import { ProfilePage } from '../profile/profile';

@Component({
  selector: 'friends-page',
  templateUrl: 'friends.html'
})
export class FriendsPage implements OnInit {
  @ViewChild(Content) content: Content;
  segment: string = 'friends';
  selectedSegment: string = this.segment;
  queryF: string = '';
  queryU: string = '';
  queryText: string = '';
  initFriends: boolean = false;
  initAll: boolean = false;
  public start: number;
  public pageSize: number = 3;
  public loading: boolean = true;

  public users: Array<UserProfile> = [];
  public friends: Array<UserProfile> = [];
  public newFriends: Array<UserProfile> = [];
  public favoriteListKeys: string[];

  public profilePage: any;

  public firebaseConnectionAttempts: number = 0;
  public internetConnected: boolean = true;

  constructor(public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    public authService: AuthService,
    public dataService: DataService,
    public sqliteService: SqliteService,
    public mappingsService: MappingsService,
    public itemsService: ItemsService,
    public events: Events) { 
        this.profilePage = ProfilePage;
    }

  ngOnInit() {
    var self = this;
    self.segment = 'friends';
    self.events.subscribe('network:connected', self.networkConnected);
    self.events.subscribe('friends:add', self.addNewFriend);

    self.loadData(true);
  }

  // Notice function declarion to keep the right this reference
  public onFriendAdded = (childSnapshot, prevChildKey) => {
    let priority = childSnapshot.val(); // priority..
    var self = this;
    self.events.publish('friends:add');
  }

  public addNewFriend = () => {
    var self = this;
    self.loadData(true);
  }

  public networkConnected = (connection) => {
    var self = this;
    self.internetConnected = connection[0];
    console.log('NetworkConnected event: ' + self.internetConnected);
  }

  loadData(fromStart: boolean) {
    var self = this;

    if (fromStart) {
      self.loading = true;
      self.newFriends = [];
      self.friends = [];
      self.users = [];
      if (self.segment === 'all') {
        self.getUsers();
      } else {
        self.start = 0;
        /*self.favoriteListKeys = [];
        self.dataService.getFavoriteLists(self.authService.getLoggedInUser().uid).then(function (dataSnapshot) {
          let favoriteLists = dataSnapshot.val();
          self.itemsService.getKeys(favoriteLists).forEach(function (listKey) {
            self.start++;
            self.favoriteListKeys.push(listKey);
          });
          self.getFriends();
        });*/
        self.getFriends();
      }
    } else if (self.segment === 'all') {
      self.getUsers();
    } else {
      self.getFriends();
    }
  }

  getFriends() {
    var self = this;
    self.loading = true;
    self.initFriends = true;
    self.start = 0;
    /*this.dataService.getListsRef().orderByPriority().startAt(startFrom).endAt(self.start).once('value', function (snapshot) {
        self.itemsService.reversedItems<List>(self.mappingsService.getLists(snapshot)).forEach(function (list) {
          self.lists.push(list);
        });
        self.start -= (self.pageSize + 1);
        self.events.publish('lists:viewed');
        self.loading = false;
      });*/
    self.dataService.getFriends(self.authService.getLoggedInUser().uid).then(function(snapshot){
      console.log(snapshot.val());
      self.itemsService.reversedItems<UserProfile>(self.mappingsService.getUserProfiles(snapshot)).forEach(function (friend) {
        self.start++;
        self.friends.push(friend);
      });
      self.events.publish('friends:viewed');
      self.loading = false;
    });
  }

  getUsers(){
    var self = this;
    self.loading = true;
    self.initAll = true;
    var loggedUser:string = self.authService.getLoggedInUser().uid;
    self.dataService.loadUsers().then(function (snapshot) {
      console.log(snapshot.val());
      self.itemsService.reversedItems<UserProfile>(self.mappingsService.getUserProfiles(snapshot)).forEach(function (user) {
        if (user.uid!==loggedUser)
          self.users.push(user);
      });
      self.loading = false;
    });
  }

  filterFriends(segment) {
    if (this.selectedSegment !== this.segment) {
      this.selectedSegment = this.segment;
      var check: boolean;
      if(this.segment === 'all'){
        this.queryF = this.queryText + '';
        this.queryText = this.queryU;
        check = this.initAll;
      }else{
        this.queryU = this.queryText + '';
        this.queryText = this.queryF;
        check = this.initFriends;
      }
      if (this.internetConnected && !check)
        // Initialize
        this.loadData(true);
    } else {
      this.scrollToTop();
    }
  }

  searchFriends() {
    var self = this;
    if (self.queryText.trim().length !== 0) {
      self.start = 0;
      self.loading = true;
      var loggedUser: string = self.authService.getLoggedInUser().uid;
      console.log("search : " + self.segment + " : " + self.queryText.trim());
      if(self.segment == 'friends'){
        self.friends = [];
        self.dataService.getFriends(loggedUser).then(function (snapshot) {
          self.itemsService.reversedItems<UserProfile>(self.mappingsService.getUserProfiles(snapshot)).forEach(function (user) {
            if (user.username.toLowerCase().includes(self.queryText.toLowerCase()))
              self.users.push(user);
              self.start++;
          });
          self.loading = false;
        });
      }else{
        self.users = [];
        self.dataService.loadUsers().then(function (snapshot) {
          self.itemsService.reversedItems<UserProfile>(self.mappingsService.getUserProfiles(snapshot)).forEach(function (user) {
            if (user.username.toLowerCase().includes(self.queryText.toLowerCase()) && user.uid!==loggedUser)
              self.users.push(user);
              self.start++;
          });
          self.loading = false;
        });
      }
    } else { // text cleared..
      this.loadData(true);
    }
  }

  friendRequest(friend : UserProfile) {
    var self = this;
    if (self.internetConnected && friend && friend.uid) {
      let loader = this.loadingCtrl.create({
          content: 'Creating account...',
          dismissOnPageChange: true
      });
      loader.present();

      self.dataService.addFriend(self.authService.getLoggedInUser().uid, friend.uid)
        .then(function(res){
          friend.friendship = "pending";
          loader.dismiss().then(() => {
            let toast = self.toastCtrl.create({
                message: 'Friend request send',
                duration: 4000,
                position: 'bottom'
            });
            toast.present();
          });

        });
    }
  }

  reloadData(refresher) {
    this.queryText = '';
    if (this.internetConnected) {
      this.loadData(true);
      refresher.complete();
    } else {
      refresher.complete();
    }
  }

  fetchNextFriends(infiniteScroll) {
    if (this.start > 0  && this.internetConnected) {
      this.loadData(false);
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

  isUserLoggedIn(): boolean {
      let user = this.authService.getLoggedInUser();
      return user !== null;
  }

  viewProfile(key: string) {
      if( this.isUserLoggedIn() ) {
        this.navCtrl.push(ProfilePage, {
          userKey: key
        });
      }
  }

}