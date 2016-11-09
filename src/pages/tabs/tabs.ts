import { Component, OnInit, ViewChild } from '@angular/core';
import { NavController, Events, ActionSheetController, ModalController , Tabs } from 'ionic-angular';

import { ListsPage } from '../lists/lists';
import { ProfilePage } from '../profile/profile';
import { AboutPage } from '../about/about';
import { FriendsPage } from '../friends/friends';
import { AuthService } from '../../shared/services/auth.service';

@Component({
    templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit {
    @ViewChild('forumTabs') tabRef: Tabs;

    public listsPage: any;
    public profilePage: any;
    public aboutPage: any;
    public friendsPage: any;

    public newLists: string = '';
    public selectedTab: number = -1;

    constructor(public nav: NavController,
        public authService: AuthService,
        public events: Events,
        public actionSheetCtrl: ActionSheetController,
        public modalCtrl: ModalController) {
        // this tells the tabs component which Pages
        // should be each tab's root Page
        this.listsPage = ListsPage;
        this.profilePage = ProfilePage;
        this.aboutPage = AboutPage;
        this.friendsPage = FriendsPage;
    }

    ngOnInit() {
        this.startListening();
    }

    startListening() {
        var self = this;

        self.events.subscribe('list:created', (listData) => {
            if (self.newLists === '') {
                self.newLists = '1';
            } else {
                self.newLists = (+self.newLists + 1).toString();
            }
        });

        self.events.subscribe('lists:viewed', (listData) => {
            self.newLists = '';
        });
    }

    clicked() {
        var self = this;      

        if (self.newLists !== '') {
            self.events.publish('lists:add');
            self.newLists = '';
        }
    }

    profile() {
        var self = this;
        if( !this.isUserLoggedIn() ) {
            /*let actionSheet = this.actionSheetCtrl.create({
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
                        self.nav.setRoot(SignupPage);
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
            actionSheet.present();*/
        }else{
            self.nav.setRoot(ProfilePage);
        }
    }

    isUserLoggedIn(): boolean {
        let user = this.authService.getLoggedInUser();
        return user !== null;
    }
}