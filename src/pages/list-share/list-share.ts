import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, LoadingController, NavParams } from 'ionic-angular';

import { List, UserProfile  } from '../../shared/interfaces';
import { AuthService } from  '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';
import { ItemsService } from '../../shared/services/items.service';

@Component({
  selector: 'list-share-page',
  templateUrl: 'list-share.html'
})
export class ListSharePage implements OnInit {

  friendsAll: Array<any> = [];
  friendsToShow: Array<any> = [];
  myUid: string;
  loading: boolean = true;
  queryText: string = '';
  list: List;

  constructor(public nav: NavController,
    public loadingCtrl: LoadingController,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public authService: AuthService,
    public dataService: DataService,
    public mappingsService: MappingsService,
    public itemsService: ItemsService) { }

  ngOnInit() {
    console.log('in list share..');
    this.friendsAll = [];
    this.friendsToShow = [];
    this.myUid = this.authService.getLoggedInUser().uid;
    this.list = this.navParams.get('list');
    this.loadFriends();
  }

  cancelShareList() {
    this.viewCtrl.dismiss();
  }

  share(friend: any): void {
    var self = this;
    if(self.list.key && friend){

      let loader = this.loadingCtrl.create({
        content: 'Processing...',
        dismissOnPageChange: true
      });

      loader.present();

      var sharing:boolean = self.itemsService.includesItem(self.list.users,function(user){
        return friend.uid === user.uid;
      });

      if(sharing){
         self.dataService.unshareListWith(self.list.key,friend.uid).then(function(){
           self.itemsService.removeItemFromArray(self.list.users,friend.uid);
           self.searchFriends();
           loader.dismiss();
         });
      }else{
         self.dataService.shareListWith(self.list.key,friend.uid).then(function(){
           self.list.users.push(friend.uid);
           self.searchFriends();
           loader.dismiss();
         });
      }
      
    }
  }

  loadFriends() {
    var self = this;
    self.loading = true;

    var count=0;
    self.dataService.getUserFriends(self.myUid).then(function (friendsSnap) {
      let listUsers = self.list.users;
      let friendsList: Array<any> = self.mappingsService.getFriends(friendsSnap,listUsers);
      self.friendsAll = [];
      console.log("friendsList",friendsList);
      friendsList.forEach(function (friend) {

        if(friend.uid && friend.friendship=='friends'){
          count++;
          self.dataService.getUser(friend.uid).then(function (userSnap) {
            var user:UserProfile = self.mappingsService.getUserProfile(userSnap,userSnap.key);
             console.log("getUser",user);
            self.friendsAll.push(user);
            count--;
            if(count<1){
              self.searchFriends();
            }
          });
        } 

      });
      self.searchFriends();
    });
  }

  searchFriends(){
    var self = this;
    self.loading = true;
    console.log("searchFriends");
    console.log(self.friendsAll);
    if (self.queryText.trim().length !== 0) {
      self.friendsToShow = self.friendsAll.filter(function (friend) {
        console.log(friend);
        return friend.username.toLowerCase().includes(self.queryText.toLowerCase());
      });  
    } else {
      self.friendsToShow = [];
      self.friendsAll.forEach(function (friend) {
         console.log(friend);
        self.friendsToShow.push(friend);
      });  
    } 
    self.loading = false;
  }


  doRefresh(refresher) {
    this.searchFriends();
  }


}