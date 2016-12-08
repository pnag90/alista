import { Component, Input, OnInit } from '@angular/core';
import { PhotoViewer } from 'ionic-native';

import { UserProfile } from '../interfaces';
import { DataService } from '../services/data.service';

@Component({
    selector: 'lista-user-avatar',
    template: ` <img *ngIf="imageLoaded" src="{{imageUrl}}" (click)="zoom()">`
})
export class UserAvatarComponent implements OnInit {
    @Input() profile: UserProfile;
    imageLoaded: boolean = false;
    imageUrl: string;

    constructor(private dataService: DataService) { }

    ngOnInit() {
        let self = this;
        let firebaseConnected: boolean = self.dataService.isFirebaseConnected(); 
        if ( self.profile === null || self.profile.uid === 'default' || !firebaseConnected) {
            self.imageUrl = 'assets/images/profile.png';
            self.imageLoaded = true;
        /*} else if( self.profile===null ) {
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
            }*/
        }else {
            var url:string = self.profile.photoURL || 'assets/images/profile.png' ;
            self.imageUrl = url; //url.split('?')[0] + '?alt=media' + '&t=' + (new Date().getTime());
            self.imageLoaded = true;
        }
    }

    zoom() {
        PhotoViewer.show(this.imageUrl, this.profile.username, { share: false });
    }

    getUserImage() {
        var self = this;
        return self.dataService.getStorageRef().child('images/' + self.profile.uid + '/profile.png').getDownloadURL();
    }
}