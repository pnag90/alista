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

    loginWithFacebook() {
        var self = this;

        return Observable.create(observer => {
            if (self.platform.is('cordova')) {
                console.log("FacebookAuthProvider:cordova");

                Facebook.login(['public_profile', 'email']).then(facebookData => {
                    var provider = firebase.auth.FacebookAuthProvider.credential(facebookData.authResponse.accessToken);
                    firebase.auth().signInWithCredential(provider).then((firebaseData) => {
                         console.log("Firebase success: " + JSON.stringify(firebaseData));

                        console.log(firebaseData);
                        firebase.database().ref('users/' + firebaseData.uid).set({
                            username: firebaseData.providerData[0].displayName,
                            email: firebaseData.providerData[0].email,
                            photoURL : firebaseData.providerData[0].photoURL
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
                    console.log(result);
                    console.log(result.user);

                    firebase.database().ref('users/' + user.uid).set({
                        username: user.providerData[0].displayName,
                        email: user.providerData[0].email,
                        photoURL : user.providerData[0].photoURL || null
                    });

                    observer.next();
                }).catch(function(error) {
                    console.info("error", error);
                    observer.error(error);
                });

                /*firebase.auth.login({
                    provider: AuthProviders.Facebook,
                    method: AuthMethods.Popup,
                    remember: 'default',
                    scope: ['public_profile', 'email']
                }).then((facebookData) => {
                    this.usersRef.update(facebookData.auth.uid, {
                        name: facebookData.auth.displayName,
                        email: facebookData.auth.email,
                        provider: 'facebook',
                        image: facebookData.auth.photoURL
                    });
                    observer.next();
                }).catch((error) => {
                    console.info("error", error);
                    observer.error(error);
                });*/

            }
        });
    }

    signOut() {
        //return this.af.auth.logout();
        let toast = this.toastCtrl.create({
            message: 'Logged out successfully',
            duration: 3000,
            position: 'middle'
        });
        return firebase.auth().signOut();  
    }

    addUser(username: string, dateOfBirth: string, uid: string) {
        this.usersRef.child(uid).update({
            username: username,
            dateOfBirth: dateOfBirth
        });
    }

    getLoggedInUser() {
        return firebase.auth().currentUser;
    }

    onAuthStateChanged(callback) {
        return firebase.auth().onAuthStateChanged(callback);
        /*
        onAuthStateChanged(_function) {
        return firebase.auth().onAuthStateChanged((_currentUser) => {
            if (_currentUser) {
                console.log("User " + _currentUser.uid + " is logged in with " + _currentUser.provider);
                _function(_currentUser);
            } else {
                console.log("User is logged out");
                _function(null)
            }
        })
        }*/
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

}