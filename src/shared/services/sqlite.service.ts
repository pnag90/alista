import { Injectable } from '@angular/core';
import { SQLite } from 'ionic-native';

import { List, User } from '../interfaces';
import { ItemsService } from '../services/items.service';

@Injectable()
export class SqliteService {
    db: SQLite;

    constructor(private itemsService: ItemsService) {

    }

    InitDatabase() {
        var self = this;
        this.db = new SQLite();
        self.db.openDatabase({
            name: 'forumdb.db',
            location: 'default' // the location field is required
        }).then(() => {
            self.createLists();
            self.createListItems();
            self.createListComments();
            self.createUsers();
        }, (err) => {
            console.error('Unable to open database: ', err);
        });
    }

    resetDatabase() {
        var self = this;
        self.resetUsers();
        self.resetLists();
        self.resetListItems()
        self.resetListComments();
    }

    resetUsers() {
        var self = this;
        let query = 'DELETE FROM Users';
        self.db.executeSql(query, {}).then((data) => {
            console.log('Users removed');
        }, (err) => {
            console.error('Unable to remove users: ', err);
        });
    }

    resetLists() {
        var self = this;
        let query = 'DELETE FROM Lists';
        self.db.executeSql(query, {}).then((data) => {
            console.log('Lists removed');
        }, (err) => {
            console.error('Unable to remove Lists: ', err);
        });
    }

    resetListItems() {
        var self = this;
        let query = 'DELETE FROM ListItems';
        self.db.executeSql(query, {}).then((data) => {
            console.log('ListItems removed');
        }, (err) => {
            console.error('Unable to remove ListItems: ', err);
        });
    }

    resetListComments() {
        var self = this;
        let query = 'DELETE FROM ListComments';
        self.db.executeSql(query, {}).then((data) => {
            console.log('ListComments removed');
        }, (err) => {
            console.error('Unable to remove ListComments: ', err);
        });
    }

    printLists() {
        var self = this;
        self.db.executeSql('SELECT * FROM Lists', {}).then((data) => {
            if (data.rows.length > 0) {
                for (var i = 0; i < data.rows.length; i++) {
                    console.log(data.rows.item(i));
                    console.log(data.rows.item(i).key);
                    console.log(data.rows.item(i).name);
                }
            } else {
                console.log('no lists found..');
            }
        }, (err) => {
            console.error('Unable to print lists: ', err);
        });
    }

    printListItems() {
        var self = this;
        self.db.executeSql('SELECT * FROM ListItems', {}).then((data) => {
            if (data.rows.length > 0) {
                for (var i = 0; i < data.rows.length; i++) {
                    console.log(data.rows.item(i));
                    console.log(data.rows.item(i).key);
                    console.log(data.rows.item(i).text);
                }
            } else {
                console.log('no items found..');
            }
        }, (err) => {
            console.error('Unable to print list items: ', err);
        });
    }

    createLists() {
        var self = this;
        self.db.executeSql('CREATE TABLE IF NOT EXISTS Lists ( key VARCHAR(255) PRIMARY KEY NOT NULL, name text NOT NULL,datecreated text, USER VARCHAR(255), items INT NULL, comments INT NULL, shares INT NULL);', {}).then(() => {
        }, (err) => {
            console.error('Unable to create Lists table: ', err);
        });
    }

    createListItems() {
        var self = this;
        self.db.executeSql('CREATE TABLE IF NOT EXISTS ListItems ( key VARCHAR(255) PRIMARY KEY NOT NULL, list VARCHAR(255) NOT NULL, USER VARCHAR(255) NOT NULL, text text NOT NULL, qt number NOT NULL DEFAULT 1, category text NOT NULL, state number NOT NULL default 1, datecreated text);', {}).then(() => {
        }, (err) => {
            console.error('Unable to create ListItems table: ', err);
        });
    }

    createListComments() {
        var self = this;
        self.db.executeSql('CREATE TABLE IF NOT EXISTS ListComments ( key VARCHAR(255) PRIMARY KEY NOT NULL, list VARCHAR(255) NOT NULL, text text NOT NULL, USER VARCHAR(255) NOT NULL, datecreated text, votesUp INT NULL, votesDown INT NULL);', {}).then(() => {
        }, (err) => {
            console.error('Unable to create Comments table: ', err);
        });
    }

    createUsers() {
        var self = this;
        self.db.executeSql('CREATE TABLE IF NOT EXISTS Users ( uid text PRIMARY KEY NOT NULL, username text NOT NULL); ', {}).then(() => {
        }, (err) => {
            console.error('Unable to create Users table: ', err);
        });
    }

    saveUsers(users: User[]) {
        var self = this;

        users.forEach(user => {
            self.addUser(user);
        });
    }

    addUser(user: User) {
        var self = this;
        let query: string = 'INSERT INTO Users (uid, username) Values (?,?)';
        self.db.executeSql(query, [user.uid, user.username]).then((data) => {
            console.log('user ' + user.username + ' added');
        }, (err) => {
            console.error('Unable to add user: ', err);
        });
    }

    saveLists(lists: List[]) {
        let self = this;
        let users: User[] = [];

        lists.forEach(list => {
            if (!self.itemsService.includesItem<User>(users, u => u.uid === list.user.uid)) {
                console.log('in add user..' + list.user.username);
                users.push(list.user);
            } else {
                console.log('user found: ' + list.user.username);
            }
            self.addList(list);
        });

        self.saveUsers(users);
    }

    addList(list: List) {
        var self = this;

        let query: string = 'INSERT INTO List (key, name, date_created, user, items, comments, shares) VALUES (?,?,?,?,?,?,?)';
        self.db.executeSql(query, [
            list.key,
            list.name,
            list.dateCreated,
            list.user.uid,
            list.items,
            list.comments,
            list.shares
        ]).then((data) => {
            console.log('list ' + list.key + ' added');
        }, (err) => {
            console.error('Unable to add list: ', err);
        });
    }

    getLists(): any {
        var self = this;
        return self.db.executeSql('SELECT Lists.*, username FROM Lists Lists JOIN Users ON Lists.user = Users.uid', {});
    }
}