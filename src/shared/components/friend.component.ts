import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PhotoViewer } from 'ionic-native';

import { UserProfile } from '../interfaces';
import { DataService } from '../services/data.service';

@Component({
    selector: 'friend-component',
    templateUrl: 'friend.component.html',
    styles: [`
        div.item-inner{
            border: none !important;
        }
        ion-thumbnail.user-thumbnail {
            position: relative;
            width: 50px;
            height: 50px;
            overflow: hidden;
            border-radius: 50%;
            min-width: initial !important;
            min-height: initial !important;
        }
        img.user-thumbnail {
            position: absolute;
            left: 50%;
            top: 50%;
            height: 100%;
            width: auto;
            -webkit-transform: translate(-50%,-50%);
            -ms-transform: translate(-50%,-50%);
            transform: translate(-50%,-50%);
        }
        img.user-thumbnail.portrait {
            width: 100%;
            height: auto;
        }
    `]
})
export class FriendComponent implements OnInit {
    @Input() user: UserProfile;
    @Input() friend: boolean = false;
    @Input() sharing: boolean = false;

    @Output() onViewProfile = new EventEmitter<string>();
    @Output() onFriendRequest = new EventEmitter<string>();
    @Output() onShare = new EventEmitter<string>();
    imageLoaded: boolean = false;
    imageUrl: string;

    constructor(private dataService: DataService) { }

    ngOnInit() {
        let self = this;
        let firebaseConnected: boolean = self.dataService.isFirebaseConnected(); 
        if ( self.user === null || self.user.uid === 'default' || !firebaseConnected) {
            self.imageUrl = 'assets/images/profile.png';
            self.imageLoaded = true;
        }else {
            var url:string = self.user.photoURL || 'assets/images/profile.png' ;
            self.imageUrl = url;
            self.imageLoaded = true;
        }
    }

    zoom() {
        PhotoViewer.show(this.imageUrl, this.user.username, { share: false });
    }

    viewProfile(user: any) {
        this.onViewProfile.emit(user);
    }

    friendRequest(user: any) {
        if(user.friendship==='pending'){
            //accept
            this.onFriendRequest.emit(user);
        }
        else if( user.friendship!='send' && user.friendship!='pending' && user.friendship!='friends' ){
            //send
            this.onFriendRequest.emit(user);
        }
        
    }

    share(user: any) {
        this.onShare.emit(user);
    }
    
}