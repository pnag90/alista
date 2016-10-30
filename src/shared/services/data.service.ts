import { Injectable } from '@angular/core';
//import { AngularFire , FirebaseListObservable } from 'angularfire2';

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
    commentsRef: any ;
    statisticsRef: any;
    storageRef: any;
    connectionRef: any;

    /*databaseRef: FirebaseListObservable<any>;
    usersRef: FirebaseListObservable<any>;
    listsRef: FirebaseListObservable<any>;
    itemsRef: FirebaseListObservable<any>;
    commentsRef: FirebaseListObservable<any>;
    statisticsRef: FirebaseListObservable<any>;
    storageRef: FirebaseListObservable<any>;
    connectionRef: FirebaseListObservable<any>;*/

    defaultImageUrl: string;
    connected: boolean = false;

    constructor(public auth : AuthService) {
        var self = this;

        this.databaseRef = firebase.database();
        this.usersRef = firebase.database().ref('users');
        this.listsRef = firebase.database().ref('lists');
        this.itemsRef = firebase.database().ref('items');
        this.commentsRef = firebase.database().ref('comments');
        this.statisticsRef = firebase.database().ref('statistics');
        this.storageRef = firebase.storage().ref();
        this.connectionRef = firebase.database().ref('.info/connected');

        //this.databaseRef    = af.database.list('/');
        /*this.usersRef       = af.database.list('/users');
        this.listsRef       = af.database.list('/lists');
        this.itemsRef       = af.database.list('/items');
        this.commentsRef    = af.database.list('/comments');
        this.statisticsRef  = af.database.list('/statistics');
        //this.storageRef     = af.storage.ref();
        this.connectionRef  = af.database.list('.info/connected');*/

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
        // Set statistics/threads = 1 for the first time only
        self.getStatisticsRef().child('lists').transaction(function (currentRank) {
            if (currentRank === null) {
                return 1;
            }
        }, function (error, committed, snapshot) {
            if (error) {
                console.log('Transaction failed abnormally!', error);
            } else if (!committed) {
                console.log('We aborted the transaction because there is already one list.');
            } else {
                console.log('Lists number initialized!');

                let list: List = {
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
                });
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

        return this.statisticsRef.child('lists').once('value');
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

    getUsersRef() {
        return this.usersRef;
    }

    getStorageRef() {
        return this.storageRef;
    }

    getListItemsRef(listKey: string) {
        /*return this.af.database.list('/items', {
            query: {
                orderByChild: 'list',
                equalTo: listKey
            }
        });*/
        return this.itemsRef.orderByChild('list').equalTo(listKey);
    }

    getListCommentsRef(listKey: string) {
        return this.commentsRef.orderByChild('list').equalTo(listKey);
       /* return this.af.database.list('/comments', {
            query: {
                orderByChild: 'list',
                equalTo: listKey
            }
        });*/
    }

    loadLists() {
        return this.listsRef.once('value');
    }

   submitList(list: List, priority: number) {
        var newListRef = this.listsRef.push();
        this.statisticsRef.child('lists').set(priority);
        console.log(priority);
        return newListRef.setWithPriority(list, priority);
    }

    addListToFavorites(userKey: string, listKey: string) {
        return this.usersRef.child(userKey + '/favorites/' + listKey).set(true);
    }

    getFavoriteLists(user: string) {
        return this.usersRef.child(user + '/favorites/').once('value');
    }

    setUserImage(uid: string) {
        this.usersRef.child(uid).update({
            image: true
        });
    }

    getListItems(listKey: string) {
        return this.itemsRef.orderByChild('list').equalTo(listKey).once('value');
    }

    setListItem(listKey: string, item: ListItem) {
        // let commentRef = this.commentsRef.push();
        // let commentkey: string = commentRef.key;
        this.itemsRef.child(item.key).set(item);

        return this.itemsRef.child(listKey + '/items').once('value')
            .then((snapshot) => {
                let numberOfItems = snapshot == null ? 0 : snapshot.val();
                this.itemsRef.child(listKey + '/items').set(numberOfItems + 1);
            });
    }

    updateListItemState(itemKey: string, state: number): any {
        let itemRef = this.itemsRef.child(itemKey + '/state');
        return itemRef.set(state);
    }

    deleteListItem(listKey: string, item: ListItem) {
        this.itemsRef.child(item.key).set(null);

        return this.itemsRef.child(listKey + '/items').once('value')
            .then((snapshot) => {
                let numberOfItems = snapshot == null ? 0 : snapshot.val();
                this.itemsRef.child(listKey + '/items').set(numberOfItems - 1);
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

    getUserComments(userUid: string) {
        return this.commentsRef.orderByChild('user/uid').equalTo(userUid).once('value');
    }
}