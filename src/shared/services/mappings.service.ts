import { Injectable } from '@angular/core';

import { List, ListItem, ListComment } from '../interfaces';
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

        let list: List = {
            key: key,
            name: snapshot.name,
            dateCreated: snapshot.dateCreated,
            user: { uid: snapshot.user.uid, username: snapshot.user.username },
            items: snapshot.items == null ? 0 : snapshot.items,
            comments: snapshot.comments == null ? 0 : snapshot.comments,
            shares: snapshot.shares == null ? 0 : snapshot.shares
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
            //console.log(comment.votes);
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
        console.log(snapshotItem);
        item = {
            key: itemKey,
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

}