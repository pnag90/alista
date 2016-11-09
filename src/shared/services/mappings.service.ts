import { Injectable } from '@angular/core';

import { List, ListItem, ListComment, User, UserProfile } from '../interfaces';
import { ItemsService } from '../services/items.service';

@Injectable()
export class MappingsService {

    constructor(private itemsService: ItemsService) { }

    getLists(snapshot: any): Array<List> {
        let lists: Array<List> = [];
        if (snapshot.val() == null)
            return lists;

        let arr = snapshot.val();

        Object.keys(snapshot.val()).map((key: any) => {
            let list: any = arr[key];
            lists.push({
                key: key,
                name: list.name,
                dateCreated: list.dateCreated,
                user: { uid: list.user.uid, username: list.user.username },
                items: list.items == null ? 0 : list.items,
                comments: list.comments == null ? 0 : list.comments,
                shares: list.shares == null ? 0 : list.shares
            });
        });

        return lists;
    }

    getList(snapshot: any, key: string): List {
        let list: List;

        if (snapshot.val() == null)
            return null;

        let snapshotList = snapshot.val();    
        list = {
            key: key || snapshotList.key,
            name: snapshotList.name,
            dateCreated: snapshotList.dateCreated,
            user: { uid: snapshotList.user.uid, username: snapshotList.user.username },
            items: snapshotList.items == null ? 0 : snapshotList.items,
            comments: snapshotList.comments == null ? 0 : snapshotList.comments,
            shares: snapshotList.shares == null ? 0 : snapshotList.shares
        };

        return list;
    }

    getListItems(snapshot: any): Array<ListItem> {
        let items: Array<ListItem> = [];
        if (snapshot.val() == null)
            return items;

        let list = snapshot.val();

        Object.keys(snapshot.val()).map((key: any) => {
            let item: any = list[key];
            this.itemsService.groupByBoolean(item.votes, true);

            items.push({
                key: key,
                list: item.list,
                user: item.user,
                text: item.text,
                qt: item.qt,
                category: item.category,
                state: item.state,
                dateCreated: item.dateCreated
            });
        });

        return items;
    }

    getListItem(snapshot: any, itemKey: string): ListItem {
        let item: ListItem;

        if (snapshot.val() == null)
            return null;

        let snapshotItem = snapshot.val();
        item = {
            key: itemKey || snapshot.key,
            list: snapshotItem.list,
            user: snapshotItem.user,
            text: snapshotItem.text,
            qt: snapshotItem.qt,
            category: snapshotItem.category,
            state: snapshotItem.state,
            dateCreated: snapshotItem.dateCreated
        };

        return item;
    }

    getComments(snapshot: any): Array<ListComment> {
        let comments: Array<ListComment> = [];
        if (snapshot.val() == null)
            return comments;

        let list = snapshot.val();

        Object.keys(snapshot.val()).map((key: any) => {
            let comment: any = list[key];
            //console.log(comment.votes);
            this.itemsService.groupByBoolean(comment.votes, true);

            comments.push({
                key: key,
                text: comment.text,
                list: comment.list,
                dateCreated: comment.dateCreated,
                user: comment.user,
                votesUp: this.itemsService.groupByBoolean(comment.votes, true),
                votesDown: this.itemsService.groupByBoolean(comment.votes, false)
            });
        });

        return comments;
    }

    getComment(snapshot: any, commentKey: string): ListComment {
        let comment: ListComment;

        if (snapshot.val() == null)
            return null;

        let snapshotComment = snapshot.val();
        console.log(snapshotComment);
        comment = {
            key: commentKey,
            text: snapshotComment.text,
            list: snapshotComment.list,
            dateCreated: snapshotComment.dateCreated,
            user: snapshotComment.user,
            votesUp: this.itemsService.groupByBoolean(snapshotComment.votes, true),
            votesDown: this.itemsService.groupByBoolean(snapshotComment.votes, false)
        };

        return comment;
    }


    getUsers(snapshot: any): Array<User> {
        let users: Array<User> = [];
        if (snapshot.val() == null)
            return users;

        let list = snapshot.val();

        Object.keys(snapshot.val()).map((key: any) => {
            let user: any = list[key];
            
            users.push({
                uid: key,
                username: user.username
            });
        });

        return users;
    }

    getUser(snapshot: any, userKey: string): User {
        let user: User;

        if (snapshot.val() == null)
            return null;

        let snapshotUser = snapshot.val();
        console.log(snapshotUser);
        user = {
            uid: userKey || snapshotUser.key,
            username: snapshotUser.username
        };

        return user;
    }

    getUserProfiles(snapshot: any): Array<UserProfile> {
        let profiles: Array<UserProfile> = [];
        if (snapshot.val() == null)
            return profiles;

        let list = snapshot.val();

        Object.keys(snapshot.val()).map((key: any) => {
            let profile: any = list[key];
            
            profiles.push({
                uid: key,
                username: profile.username,
                email: profile.email,
                dateOfBirth: profile.dateOfBirth || null,
                image: profile.image || null,
                photoURL: profile.photoURL || null
            });
        });

        return profiles;
    }

    getUserProfile(snapshot: any, userKey: string): UserProfile {
        let profile: UserProfile;

        if (snapshot.val() == null)
            return null;

        let snapshotUser = snapshot.val();
        console.log(snapshotUser);
        profile = {
            uid: userKey || snapshotUser.key,
            username: snapshotUser.username,
            email: snapshotUser.email,
            dateOfBirth: snapshotUser.dateOfBirth || null,
            image: snapshotUser.image || false,
            photoURL: snapshotUser.photoURL || null
        };

        return profile;
    }

}