import { Component, Input, OnInit } from '@angular/core';
import { PhotoViewer } from 'ionic-native';

import { User } from '../interfaces';
import { DataService } from '../services/data.service';

@Component({
    selector: 'lista-user-avatar',
    template: ` <img *ngIf="imageLoaded" src="{{imageUrl}}" (click)="zoom()">`
})
export class UserAvatarComponent implements OnInit {
    @Input() user: User;
    @Input() profile: any;
    imageLoaded: boolean = false;
    imageUrl: string;

    constructor(private dataService: DataService) { }

    ngOnInit() {
        let self = this;
        let firebaseConnected: boolean = self.dataService.isFirebaseConnected(); 
        if (self.user.uid === 'default' || !firebaseConnected) {
            self.imageUrl = 'assets/images/profile.png';
            self.imageLoaded = true;
        } else if( self.profile===null ) {
            self.getUserImage().then(function (url) {
                self.imageUrl = url.split('?')[0] + '?alt=media' + '&t=' + (new Date().getTime());
                self.imageLoaded = true;
                console.log(self.imageUrl);
            });
        } else{
            if ( self.profile.photoURL !== null ){
                self.imageUrl = self.profile.photoURL;
                self.imageLoaded = true;
                console.log(self.imageUrl);
            } else{
                self.getUserImage().then(function (url) {
                    self.imageUrl = url.split('?')[0] + '?alt=media' + '&t=' + (new Date().getTime());
                    self.imageLoaded = true;
                    console.log(self.imageUrl);
                });
            }
        }
    }

    zoom() {
        PhotoViewer.show(this.imageUrl, this.user.username, { share: false });
    }

    getUserImage() {
        var self = this;

        return self.dataService.getStorageRef().child('images/' + self.user.uid + '/profile.png').getDownloadURL();
    }
}