import { Injectable } from '@angular/core';
//import { AngularFire , FirebaseListObservable } from 'angularfire2';
import { Observable } from 'rxjs/Observable';  

import { AuthService } from '../../shared/services/auth.service';
import { List, ListItem, ListComment } from '../interfaces';

import firebase from 'firebase';
//declare var firebase: any;

@Injectable()
export class DataService {
    databaseRef: any;
    usersRef: any;
    listsRef: any;
    itemsRef: any;
    userListsRef: any;
    commentsRef: any ;
    statisticsRef: any;
    storageRef: any;
    connectionRef: any;

    defaultImageUrl: string;
    connected: boolean = false;

    constructor(public auth : AuthService) {
        var self = this;

        this.databaseRef = firebase.database();
        this.usersRef = firebase.database().ref('users');
        this.listsRef = firebase.database().ref('lists');
        this.itemsRef = firebase.database().ref('items');
        this.userListsRef = firebase.database().ref('user-lists');
        this.commentsRef = firebase.database().ref('comments');
        this.statisticsRef = firebase.database().ref('statistics');
        this.storageRef = firebase.storage().ref();
        this.connectionRef = firebase.database().ref('.info/connected');

        try {
            self.checkFirebaseConnection();
            /* original commented
            self.storageRef.child('images/default/profile.png').getDownloadURL().then(function (url) {
                self.defaultImageUrl = url.split('?')[0] + '?alt=media';
            });
            */
            self.InitData();
        } catch (error) {
            console.log('Data Service error:' + error);
        }
    }

    checkFirebaseConnection() {
        try {
            var self = this;
            var connectedRef = self.getConnectionRef();
            connectedRef.on('value', function (snap) {
                console.log(snap.val());
                if (snap.val() === true) {
                    console.log('Firebase: Connected:');
                    self.connected = true;
                } else {
                    console.log('Firebase: No connection:');
                    self.connected = false;
                }
            });
        } catch (error) {
            self.connected = false;
        }
    }

    isFirebaseConnected() {
        return this.connected;
    }

    private InitData() {
        let self = this;
        // Set statistics/lists = 1 for the first time only
        self.getStatisticsListsRef().transaction(function (currentRank) {
            if (currentRank === null) {
                return 0;
            }
        }, function (error, committed, snapshot) {
            if (error) {
                console.log('Transaction failed abnormally!', error);
            } else if (!committed) {
                //console.log('We aborted the transaction because there is already one list.');
            } else {
                console.log('Lists number initialized!');

                /*let list: List = {
                    key: null,
                    name: 'Nova lista',
                    dateCreated: (new Date()).toString(),
                    user: { uid: 'default', username: 'Administrator' },
                    items: 0,
                    comments: 0,
                    shares: 0,
                };

                let firstListRef = self.listsRef.push();
                firstListRef.setWithPriority(list, 1).then(function (dataShapshot) {
                    console.log('Congratulations! You have created the first list!');
                });*/
            }
            console.log('commited', snapshot.val());
        }, false);

    }

    getDatabaseRef() {
        return this.databaseRef;
    }

    getConnectionRef() {
        return this.connectionRef;
    }

    goOffline() {
        firebase.database().goOffline();
    }

    goOnline() {
        firebase.database().goOnline();
    }

    getDefaultImageUrl() {
        return this.defaultImageUrl;
    }

    getTotalLists() {
        return this.statisticsRef.child('lists').child('total').once('value');
    }

    getTotalUsers(){
        return this.statisticsRef.child('users').once('value');
    }

    getListsRef() {
        return this.listsRef;
    }

    getItemsRef() {
        return this.itemsRef;
    }

    getCommentsRef() {
        return this.commentsRef;
    }

    getStatisticsRef() {
        return this.statisticsRef;
    }

    getStatisticsListsRef() {
        return this.statisticsRef.child('lists').child('total');
    }

    getUsersRef() {
        return this.usersRef;
    }

    getUserListsRef() {
        return this.userListsRef;
    }

    getStorageRef() {
        return this.storageRef;
    }

    getListItemsRef(listKey: string) {
        return this.itemsRef.orderByChild('list').equalTo(listKey);
    }

    getListCommentsRef(listKey: string) {
        return this.commentsRef.orderByChild('list').equalTo(listKey);
    }

    loadUsers() {
        return this.usersRef.once('value');
    }

    loadLists() {
        //loadAllLists;
        return this.loadListsByUser();
    }

    loadAllLists() {
        return this.listsRef.once('value');
    }

    loadListsByUser() : Observable<List>{
       var userKey: string = firebase.auth().currentUser.uid;
        var userLists = this.userListsRef.child(userKey);
         /*userLists.on('child_added', function(snapshot) {
            var listKey:string = snapshot.key();
            var listRef = this.listsRef.child(listKey);
            listRef.on('value', function(list) {
               console.log(list);
            });
        });*/
        return Observable.create(observer => {

            let listener =  userLists.on('child_added', snapshot => {
                var listKey:string = snapshot.key();
                var listRef = this.listsRef.child(listKey);
                listRef.on('value', function(list) {
                    observer.next(list);
                });
                
            }, observer.error);

            return () => {
                this.userListsRef.off('child_added', listener);
            };
        });
    }

    submitList(list: List, priority: number) {
        var self = this;
        var newListRef = self.listsRef.push();
        console.log(priority);
        return newListRef.setWithPriority(list, priority).then(
            function(){
                self.getStatisticsListsRef().set(priority);
                self.shareList(newListRef.key);
            },
            function(err){
                console.error(err);
            });  
    }

    removeList(listKey: string) {
        var self = this;
        console.log("deleting list: "+listKey);
        var userKey: string = firebase.auth().currentUser.uid;
        var updates = {};
        updates['/lists/' + listKey] = null;
        updates['/user-lists/' + userKey + '/'+ listKey] = null;
        return self.databaseRef.ref().update(updates).then(
            function(){
                self.getStatisticsListsRef().once('value').then((snapshot) => {
                    let numberOfLists = snapshot == null ? 1 : snapshot.val() || 1;
                    self.getStatisticsListsRef().set(numberOfLists - 1);
                });
            },
            function(err){
                console.error(err);
            });  
    }

    shareList(listKey: string) {
        console.log("sharing list: "+listKey);
        var userKey: string = firebase.auth().currentUser.uid;
        return this.userListsRef.child(userKey).child(listKey).set(true);
    }
    unshareList(listKey: string) {
        var userKey: string = firebase.auth().currentUser.uid;
        return this.userListsRef.child(userKey).child(listKey).set(null);
    }

    getFavoriteLists(user: string) {
        return this.usersRef.child(user + '/favorites/').once('value');
    }

    setUserImage(uid: string) {
        this.usersRef.child(uid).update({
            image: true
        });
    }

    getFriends(user: string) {
        return this.usersRef.child(user).child('friends').once('value');
    }

    addFriend(user1: string, user2: string){
        var updates = {};
        updates['/users/' + user1 + '/friends/' + user2] = {state: "send"};
        updates['/users/' + user2 + '/friends/' + user1] = {state: "pending"};
        return this.databaseRef.ref().update(updates);
    }

    acceptFriend(user1: string, user2: string){
        var updates = {};
        var dta : string = (new Date()).toString();
        updates['/users/' + user1 + '/friends/' + user2] = {state: "friends", startDate: dta};
        updates['/users/' + user2 + '/friends/' + user1] = {state: "friends", startDate: dta};
        return this.databaseRef.ref().update(updates);
    }

    removeFriend(user1: string, user2: string){
        var updates = {};
        updates['/users/' + user1 + '/friends/' + user2] = null;
        updates['/users/' + user2 + '/friends/' + user1] = null;
        return this.databaseRef.ref().update(updates);
    }


    getListItems(listKey: string) {
        return this.itemsRef.orderByChild('list').equalTo(listKey).once('value');
    }

    setListItem(listKey: string, item: ListItem) {
        return this.listsRef.child(listKey).child('items').once('value')
            .then((snapshot) => {
                let numberOfItems = snapshot == null ? 0 : snapshot.val() || 0;
                let priority = numberOfItems + 1;
                
                this.itemsRef.child(item.key).setWithPriority(item, priority);
                this.listsRef.child(listKey).child('items').set(priority);
            });
    }

    updateListItem(itemKey: string, text:string, qt:number): any {
        this.itemsRef.child(itemKey).child('text').set(text);
        return this.itemsRef.child(itemKey).child('qt').set(qt);
    }

    updateListItemState(itemKey: string, state: number): any {
        let itemRef = this.itemsRef.child(itemKey + '/state');
        return itemRef.set(state);
    }

    deleteListItem(listKey: string, item: ListItem) {
        this.itemsRef.child(item.key).set(null);

        return this.listsRef.child(listKey + '/items').once('value')
            .then((snapshot) => {
                let numberOfItems = snapshot == null ? 1 : snapshot.val() || 1;
                this.listsRef.child(listKey + '/items').set(numberOfItems - 1);
            });
    }        

    loadComments(listKey: string) {
        return this.commentsRef.orderByChild('list').equalTo(listKey).once('value');
    }

    submitComment(listKey: string, comment: ListComment) {
        // let commentRef = this.commentsRef.push();
        // let commentkey: string = commentRef.key;
        this.commentsRef.child(comment.key).set(comment);

        return this.listsRef.child(listKey + '/comments').once('value')
            .then((snapshot) => {
                let numberOfComments = snapshot == null ? 0 : snapshot.val();
                this.listsRef.child(listKey + '/comments').set(numberOfComments + 1);
            });
    }

    voteComment(commentKey: string, like: boolean, user: string): any {
        let commentRef = this.commentsRef.child(commentKey + '/votes/' + user);
        return commentRef.set(like);
    }

    getUsername(userUid: string) {
        return this.usersRef.child(userUid + '/username').once('value');
    }

    getUser(userUid: string) {
        return this.usersRef.child(userUid).once('value');
    }

    getUserLists(userUid: string) {
        return this.listsRef.orderByChild('user/uid').equalTo(userUid).once('value');
    }

    getTotalUserLists(userUid: string){
        return this.usersRef.child(userUid).child('lists').once('value');
    }

    getOnlyUserLists(userUid: string) {
        return this.listsRef.orderByChild('user/uid').equalTo(userUid).once('value');
    }

    getUserComments(userUid: string) {
        return this.commentsRef.orderByChild('user/uid').equalTo(userUid).once('value');
    }
    
    getUserFriends(userUid: string) {
        return this.usersRef.child(userUid + '/friends').once('value');
    }

}