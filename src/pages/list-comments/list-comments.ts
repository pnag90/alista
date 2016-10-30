import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, ModalController, ToastController, LoadingController, NavParams, Content } from 'ionic-angular';

import { CommentCreatePage } from '../comment-create/comment-create';
import { ListComment } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { ItemsService } from '../../shared/services/items.service';
import { MappingsService } from '../../shared/services/mappings.service';

@Component({
    templateUrl: 'list-comments.html'
})
export class ListCommentsPage implements OnInit {
    @ViewChild(Content) content: Content;
    listKey: string;
    commentsLoaded: boolean = false;
    comments: ListComment[];

    constructor(public actionSheeCtrl: ActionSheetController,
        public modalCtrl: ModalController,
        public toastCtrl: ToastController,
        public loadingCtrl: LoadingController,
        public navParams: NavParams,
        public authService: AuthService,
        public itemsService: ItemsService,
        public dataService: DataService,
        public mappingsService: MappingsService) { }

    ngOnInit() {
        var self = this;
        self.listKey = self.navParams.get('listKey');
        self.commentsLoaded = false;

        self.dataService.getListCommentsRef(self.listKey).once('value', function (snapshot) {
            self.comments = self.mappingsService.getComments(snapshot);
            self.commentsLoaded = true;
        }, function (error) {});
    }

    createComment() {
        let self = this;

        let modalPage = this.modalCtrl.create(CommentCreatePage, {
            listKey: this.listKey
        });

        modalPage.onDidDismiss((commentData: any) => {
            if (commentData) {
                let commentVals = commentData.comment;
                let commentUser = commentData.user;

                let createdComment: ListComment = {
                    key: commentVals.key,
                    list: commentVals.list,
                    text: commentVals.text,
                    user: commentUser,
                    dateCreated: commentVals.dateCreated,
                    votesUp: null,
                    votesDown: null
                };

                self.comments.push(createdComment);
                self.scrollToBottom();

                let toast = this.toastCtrl.create({
                    message: 'Comment created',
                    duration: 2000,
                    position: 'top'
                });
                toast.present();
            }
        });

        modalPage.present();
    }

    scrollToBottom() {
        this.content.scrollToBottom();
    }

    vote(like: boolean, comment: ListComment) {
        var self = this;

        self.dataService.voteComment(comment.key, like, self.authService.getLoggedInUser().uid).then(function () {
            self.dataService.getCommentsRef().child(comment.key).once('value').then(function (snapshot) {
                comment = self.mappingsService.getComment(snapshot, comment.key);
                self.itemsService.setItem<ListComment>(self.comments, c => c.key === comment.key, comment);
            });
        });
    }

    showCommentActions() {
        var self = this;
        let actionSheet = self.actionSheeCtrl.create({
            title: 'List Actions',
            buttons: [
                {
                    text: 'Add to favorites',
                    icon: 'heart',
                    handler: () => {
                        self.addListToFavorites();
                    }
                },
                {
                    text: 'Cancel',
                    icon: 'close-circle',
                    role: 'cancel',
                    handler: () => { }
                }
            ]
        });

        actionSheet.present();
    }

    addListToFavorites() {
        var self = this;
        let currentUser = self.authService.getLoggedInUser();
        if (currentUser != null) {
            /*self.dataService.addListToFavorites(currentUser.uid, self.listKey)
                .then(function () {
                    let toast = self.toastCtrl.create({
                        message: 'Added to favorites',
                        duration: 3000,
                        position: 'top'
                    });
                    toast.present();
                });*/
        } else {
            let toast = self.toastCtrl.create({
                message: 'This action is available only for authenticated users',
                duration: 3000,
                position: 'top'
            });
            toast.present();
        }
    }
}