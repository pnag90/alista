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
    @Input() photoURL: string;
    imageLoaded: boolean = false;
    imageUrl: string;

    constructor(private dataService: DataService) { }

    ngOnInit() {
        let self = this;
        let firebaseConnected: boolean = self.dataService.isFirebaseConnected(); 
        if (self.user.uid === 'default' || !firebaseConnected) {
            self.imageUrl = 'assets/images/profile.png';
            self.imageLoaded = true;
        } else if( this.photoURL===null ) {
            self.dataService.getStorageRef().child('images/' + self.user.uid + '/profile.png').getDownloadURL().then(function (url) {
                self.imageUrl = url.split('?')[0] + '?alt=media' + '&t=' + (new Date().getTime());
                self.imageLoaded = true;
            });
        } else{
            self.imageUrl = this.photoURL;
            self.imageLoaded = true;
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