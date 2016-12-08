import { Platform, ToastController } from 'ionic-angular';
import { Injectable } from '@angular/core';
//import { AngularFire, AuthMethods, AuthProviders } from 'angularfire2';
import { Observable } from 'rxjs/Observable';
import { Facebook } from 'ionic-native';

import { UserCredentials } from '../interfaces';

import firebase from 'firebase';
//import { DataService } from '../../shared/services/data.service';

//declare let firebase: any;

@Injectable()
export class AuthService {

    usersRef : any;
    //usersRef: any; //= firebase.database().ref('users');

    constructor( public platform: Platform, private toastCtrl: ToastController) {
        //this.usersRef = firebase.database().ref('users');
        var firebaseConfig = {
            apiKey: "AIzaSyDMe9yFePVXg8vUfWznjqFwsV-5QlrjQEw",
            authDomain: "alista-cccbe.firebaseapp.com",
            databaseURL: "https://alista-cccbe.firebaseio.com",
            storageBucket: "alista-cccbe.appspot.com"
        };
        firebase.initializeApp(firebaseConfig);

        this.usersRef = firebase.database().ref('users');
    }

    registerUser(user: UserCredentials) {
        return firebase.auth().createUserWithEmailAndPassword(user.email, user.password);
    }

    signInUser(email: string, password: string) {
        return firebase.auth().signInWithEmailAndPassword(email, password);
    }

    creatUserProfile(profile:any) {
        return this.usersRef.child(profile.uid).set(profile);
    }

    loginWithFacebook() {
        var self = this;

        return Observable.create(observer => {
            if (self.platform.is('cordova')) {
                console.log("FacebookAuthProvider:cordova");

                Facebook.login(['public_profile', 'email']).then(facebookData => {
                    var provider = firebase.auth.FacebookAuthProvider.credential(facebookData.authResponse.accessToken);
                    firebase.auth().signInWithCredential(provider).then((firebaseData) => {
                        console.log("Firebase success: " + JSON.stringify(firebaseData));

                        console.debug(firebaseData);
                        self.creatUserProfile({
                            uid: firebaseData.uid,
                            username: firebaseData.providerData[0].displayName,
                            email: firebaseData.providerData[0].email,
                            dateOfBirth: firebaseData.providerData[0].dateOfBirth || null,
                            image: false,
                            photoURL: firebaseData.providerData[0].photoURL || null
                        });

                        observer.next();
                    });
                }, error => {
                    observer.error(error);
                });

            } else {
                console.log("FacebookAuthProvider:signInWithPopup");
                var provider = new firebase.auth.FacebookAuthProvider();
                provider.addScope('public_profile');
                provider.addScope('email');
                provider.addScope('user_birthday');

                firebase.auth().signInWithPopup(provider).then(function(result) {
                    //var token = result.credential.accessToken;
                    var user = result.user;
                    console.debug(user);

                    self.creatUserProfile({
                        uid: user.uid,
                        username: user.providerData[0].displayName,
                        email: user.providerData[0].email,
                        dateOfBirth: user.providerData[0].dateOfBirth || null,
                        image: false,
                        photoURL: user.providerData[0].photoURL || null
                    });

                    /*firebase.database().ref('users/' + user.uid).set({
                        username: user.providerData[0].displayName,
                        email: user.providerData[0].email,
                        photoURL : user.providerData[0].photoURL || null
                    });*/

                    observer.next();
                }).catch(function(error) {
                    console.info("error", error);
                    observer.error(error);
                });

            }
        });
    }

    signOut() {
        //return this.af.auth.logout();
        return firebase.auth().signOut();  
    }

    getLoggedInUser() {
        return firebase.auth().currentUser;
    }

    onAuthStateChanged(callback) {
        return firebase.auth().onAuthStateChanged(callback);
    }

    sendPasswordResetEmail(email) {
        return Observable.create(observer => {
            firebase.auth().sendPasswordResetEmail(email)
                .then(function() {
                    observer.next();
                    // Email sent.
                }, function(error) {
                    observer.error(error);
                    // An error happened.
                });
            });
     }

     isAuthenticated(){
          return firebase.auth().currentUser != null;
     }

}