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
  queryText: string = '';
  start: number = 0;

  public users: any;
  public friends: any;
  public loading: boolean;

  public userUid:string;
  public userFriends: Array<any>;

  //public users: Array<UserProfile>;
  //public friends: Array<UserProfile>;

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

    self.users = {
      init    : false,
      list    : [],
      search  : '',
      start   : 0
    };
    self.friends = {
      init    : false,
      list    : [],
      search  : '',
      start   : 0
    };

    self.loadData(true);
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
      self.userUid = self.authService.getLoggedInUser().uid;
      self.userFriends = [];
      self.loading = true;
      self.start = 0;

      self.dataService.getUserFriends(self.userUid).then(function (friendsSnap) {
        let friendsList: Array<any> = self.mappingsService.getFriends(friendsSnap);
        self.userFriends = friendsList || [];
        console.debug("i have " + self.userFriends.length + " friends");   
       
        if (self.segment === 'all') {
          self.getUsers();
        } else {
          self.getFriends();
        }
      });
    } else if (self.segment === 'all') {
      self.getUsers();
    } else {
      self.getFriends();
    }
  }

  getFriends() {
    var self = this;
    self.friends.list = [];

    self.userFriends.forEach(function (f) {
      self.loading = true;
      if(f.uid && f.friendship=='friends'){

        self.dataService.getUser(f.uid).then(function (friendSnap) {
          var u:UserProfile = self.mappingsService.getUserProfile(friendSnap, f.uid);
          if (self.queryText.trim().length !== 0){
            if( u.username.toLowerCase().includes(self.queryText.toLowerCase()) ) {
              self.friends.list.push(u);
            }
          } else {
            self.friends.list.push(u);
          } 
          self.friends.start++;
          self.loading = false; 
        }); 

      } 
    }); 
    self.friends.init = true;
    self.events.publish('friends:viewed'); 
    self.loading = false;
  }   

  getUsers(){
    var self = this;
    self.loading = true;
    self.users.list = [];
    
    self.dataService.loadUsers().then(function (usersSnap) {
      console.log("getUsers");
      console.log(usersSnap);
      self.itemsService.reversedItems<UserProfile>(self.mappingsService.getUserProfiles(usersSnap,self.userFriends)).forEach(function (user) {
        if (user.uid!=self.userUid)
          self.users.list.push(user);
      });
      self.loading = false;
    });
    self.users.init = true;
  }

  filterFriends(segment) {
    var self = this;
    if (self.selectedSegment !== self.segment) {
      self.selectedSegment = self.segment;

      if(self.segment === 'all'){
        self.friends.search = self.queryText + '';
        self.friends.start = self.start;
        self.queryText = self.users.search || '';
        self.start = self.users.start || 0 ;
        if (self.internetConnected && !self.users.init){
          self.getUsers();
        }

      }else{
        self.users.search = self.queryText + '';
        self.users.start = self.start;
        self.queryText = self.friends.search || '';
        self.start = self.friends.start || 0 ;
        if (self.internetConnected && !self.friends.init){
          self.getFriends();
        }

      }
      
    } else {
      self.scrollToTop();
    }
  }

  searchFriends() {
    var self = this;
    if (self.queryText.trim().length !== 0) {
      /*self.start = 0;
      self.loading = true;
      console.log("search : " + self.segment + " : " + self.queryText.trim());
      if(self.segment == 'friends'){
        self.friends = [];
        self.myFriends.forEach(function (friend) { 
          self.dataService.getUser(friend.uid).then(function(userSnap){
            var user: UserProfile = self.mappingsService.getUserProfile(userSnap,userSnap.key,self.myFriends);
            if (user.username.toLowerCase().includes(self.queryText.toLowerCase())){
              self.users.push(user);
              self.start++;
            }
            self.friends.push(friend);
          });  
        });  
        self.loading = false;
      }else{
        self.users = [];
        self.dataService.loadUsers().then(function (snapshot) {
          self.itemsService.reversedItems<UserProfile>(self.mappingsService.getUserProfiles(snapshot,self.myFriends)).forEach(function (user) {
            if (user.username.toLowerCase().includes(self.queryText.toLowerCase()) && user.uid!==self.userUid)
              self.users.push(user);
              self.start++;
          });
          self.loading = false;
        });
      }*/
      this.loadData(false);
    } else { // text cleared..
      this.loadData(false);
    }
  }

  friendRequest(friend : UserProfile) {
    var self = this;
    if (self.internetConnected && friend && friend.uid && friend.friendship!='send') {

      let loader = this.loadingCtrl.create({
          content: 'loading...',
          dismissOnPageChange: true
      });
      loader.present();

      if(friend.friendship=='pending'){
        self.dataService.acceptFriend(self.userUid, friend.uid)
          .then(function(res){ 
            loader.dismiss().then(() => {
              self.events.publish('friends:add');
            });

        });
      }
      else{
        self.dataService.addFriend(self.userUid, friend.uid)
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
    /*if (this.start > 0  && this.internetConnected) {
      this.loadData(false);
      infiniteScroll.complete();
    } else {
      infiniteScroll.complete();
    }*/
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

  viewProfile(profile: UserProfile) {
    console.log("viewProfile");
    if ( this.isUserLoggedIn() && profile ) {
      this.navCtrl.push(ProfilePage, { profile: profile });
    }
  }

}