import { Component, OnInit} from '@angular/core';
import { NavController, LoadingController, ActionSheetController, NavParams } from 'ionic-angular';
import { Camera, CameraOptions } from 'ionic-native';

import { UserProfile } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { MappingsService } from '../../shared/services/mappings.service';

@Component({
  templateUrl: 'profile.html'
})
export class ProfilePage implements OnInit {
  userDataLoaded: boolean = false;
  userUid: string;
  userProfile: UserProfile;
  firebaseAccount: any;
  mySelf:boolean = false;
  userStatistics: any = {};

  constructor(public navCtrl: NavController,
    public loadingCtrl: LoadingController,
    public navParams: NavParams,
    public actionSheetCtrl: ActionSheetController,
    public authService: AuthService,
    public dataService: DataService,
    public mappingsService: MappingsService) { }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    var self = this;
    console.log("--loadUserProfile--");
    self.userDataLoaded = false;

    if( self.navParams.get('profile') != null ){
      self.userProfile = self.navParams.get('profile');
      self.userUid = self.userProfile.uid;
      self.userDataLoaded = true;
      self.mySelf = false;
      self.getUserLists();
      self.getUserFriends();
      console.log("--userDataLoaded 1 --");
      console.log(self.userProfile);
    }
    else{
      self.getUserData().then(function (userSnap) {
        if(userSnap===null){
          //return null;
        }
        
        self.userProfile = self.mappingsService.getUserProfile(userSnap, self.userUid);
        self.userDataLoaded = true;
        console.log("--userDataLoaded 2 --");
        console.log(self.userProfile);

        /*if (self.userPhotoUrl==null){
          self.getUserImage().then(function (url) {
            self.userProfile = {
              username: userData.username,
              dateOfBirth: userData.dateOfBirth,
              image: null //url
            };

            self.user = {
              uid : self.userUid,
              username : userData.username
            };
            self.mySelf = self.authService.getLoggedInUser().uid === self.userUid;
            console.log("userDataLoaded 1");
            self.userDataLoaded = true;
          }).catch(function (error) {
            console.log(error.code);
            self.userProfile = {
              username: userData.username,
              dateOfBirth: userData.dateOfBirth,
              image: 'assets/images/profile.png' 
            };
            self.mySelf = self.authService.getLoggedInUser().uid === self.userUid;
            self.userDataLoaded = true;
            console.log("userDataLoaded 2");
          });

        } else {
          self.userProfile = {
              username: userData.username,
              dateOfBirth: userData.dateOfBirth,
              image: null
            };

            self.user = {
              uid : self.userUid,
              username : userData.username
            };

            self.mySelf = self.authService.getLoggedInUser().uid === self.userUid;
            self.userDataLoaded = true;
            console.log("userDataLoaded 3");
        } */

        self.getUserLists();
        //self.getUserComments();
        self.getUserFriends();
      });
    }
  }
  

  getUserData() {
    var self = this;
    console.log("getUserData");
    self.firebaseAccount = self.authService.getLoggedInUser();
    if( self.navParams.get('userKey') != null ){
      self.userUid = self.navParams.get('userKey');
      self.mySelf  = self.firebaseAccount.uid == self.userUid;
    }else{
      if( self.firebaseAccount == null ){
        return null;
      }
      self.userUid = self.firebaseAccount.uid;
      self.mySelf  = true;
    }
    return self.dataService.getUser(self.userUid);
  }

  getUserLists() {
    var self = this;

    self.dataService.getUserLists(self.userUid)
      .then(function (snapshot) {
        let userLists: any = snapshot.val();
        if (userLists !== null) {
          self.userStatistics.totalLists = Object.keys(userLists).length;
        } else {
          self.userStatistics.totalLists = 0;
        }
        console.log("getUserLists end "+ self.userStatistics.totalLists);
      });
  }

  getUserComments() {
    var self = this;

    self.dataService.getUserComments(self.userUid)
      .then(function (snapshot) {
        let userComments: any = snapshot.val();
        if (userComments !== null) {
          self.userStatistics.totalComments = Object.keys(userComments).length;
        } else {
          self.userStatistics.totalComments = 0;
        }
      });
  }

  getUserFriends() {
    var self = this;

    self.dataService.getUserFriends(self.userUid)
      .then(function (snapshot) {
        let userFriends: any = snapshot.val();
        if (userFriends !== null) {
          self.userStatistics.totalFriends = self.countFriends(userFriends,self.userUid);
        } else {
          self.userStatistics.totalFriends = 0;
        }
        console.log("getUserFriends end "+ self.userStatistics.totalFriends);
      });
  }

  countFriends(users:any,userUid:string):number {
    console.log(users);
    var count:number = 0;
    Object.keys(users).forEach(function (userKey) {
      var user = users[userKey];
      if(user && user.state==='friends' && user.uid!=userUid){
        count++;
      }
    });
    return count;
  }

  openImageOptions() {
    var self = this;

    let actionSheet = self.actionSheetCtrl.create({
      title: 'Upload new image from',
      buttons: [
        {
          text: 'Camera',
          icon: 'camera',
          handler: () => {
            self.openCamera(Camera.PictureSourceType.CAMERA);
          }
        },
        {
          text: 'Album',
          icon: 'folder-open',
          handler: () => {
            self.openCamera(Camera.PictureSourceType.PHOTOLIBRARY);
          }
        }
      ]
    });

    actionSheet.present();
  }

  openCamera(pictureSourceType: any) {
    var self = this;

    let options: CameraOptions = {
      quality: 95,
      destinationType: Camera.DestinationType.DATA_URL,
      sourceType: pictureSourceType,
      encodingType: Camera.EncodingType.PNG,
      targetWidth: 400,
      targetHeight: 400,
      saveToPhotoAlbum: true,
      correctOrientation: true
    };

    Camera.getPicture(options).then(imageData => {
      const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);

          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);

          byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
      };

      let capturedImage: Blob = b64toBlob(imageData, 'image/png');
      self.startUploading(capturedImage);
    }, error => {
      console.log('ERROR -> ' + JSON.stringify(error));
    });
  }

  reload() {
    this.loadUserProfile();
  }

  startUploading(file) {
    let self = this;
    let uid = self.authService.getLoggedInUser().uid;
    let progress: number = 0;
    // display loader
    let loader = this.loadingCtrl.create({
      content: 'Uploading image..',
    });
    loader.present();

    // Upload file and metadata to the object 'images/mountains.jpg'
    var metadata = {
      contentType: 'image/png',
      name: 'profile.png',
      cacheControl: 'no-cache',
    };

    var uploadTask = self.dataService.getStorageRef().child('images/' + uid + '/profile.png').put(file, metadata);

    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on('state_changed',
      function (snapshot) {
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      }, function (error) {
        loader.dismiss().then(() => {
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;

            case 'storage/canceled':
              // User canceled the upload
              break;

            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        });
      }, function () {
        loader.dismiss().then(() => {
          // Upload completed successfully, now we can get the download URL
          var downloadURL = uploadTask.snapshot.downloadURL;
          console.debug(downloadURL);
          self.dataService.setUserImage(uid,downloadURL);
          self.reload();
        });
      });
  }

  options() {
    let actionSheet = this.actionSheetCtrl.create({
        title: 'Options',
        buttons: [
        {
            text: 'Logout',
            handler: () => {
                console.log('Logout clicked');
                this.authService.signOut();
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
    actionSheet.present();
  }

  friendOptions() {
    let self = this;
    var uid1:string = self.authService.getLoggedInUser().uid;
    var uid2:string = self.userUid;
    if( uid1 && uid2 ){
      let actionSheet = this.actionSheetCtrl.create({
          title: 'Options',
          buttons: [
          {
              text: 'Remove friend',
              handler: () => {
                  console.log('Remove clicked');
                  this.dataService.removeFriend(uid1,uid2);
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
      actionSheet.present();
    }
  }
}