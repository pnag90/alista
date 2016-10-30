import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, LoadingController, ToastController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';

import { UserCredentials } from '../../shared/interfaces';
import { DataService } from '../../shared/services/data.service';
import { AuthService } from '../../shared/services/auth.service';
import { CheckedValidator } from '../../shared/validators/checked.validator';
import { EmailValidator } from '../../shared/validators/email.validator';

@Component({
    selector: 'signup-page',
    templateUrl: 'signup.html'
})
export class SignupPage implements OnInit {

    createFirebaseAccountForm: FormGroup;
    username: AbstractControl;
    email: AbstractControl;
    password: AbstractControl;
    dateOfBirth: AbstractControl;
    terms: AbstractControl;

    constructor(public nav: NavController,
        public loadingCtrl: LoadingController,
        public toastCtrl: ToastController,
        public viewCtrl: ViewController,
        public fb: FormBuilder,
        public dataService: DataService,
        public authService: AuthService) { }

    ngOnInit() {
        this.createFirebaseAccountForm = this.fb.group({
            'username': ['', Validators.compose([Validators.required, Validators.minLength(8)])],
            'email': ['', Validators.compose([Validators.required, EmailValidator.isValid])],
            'password': ['', Validators.compose([Validators.required, Validators.minLength(5)])],
            'dateOfBirth': [new Date().toISOString().slice(0, 10), Validators.compose([Validators.required])],
            'terms': [false, CheckedValidator.isChecked]
        });

        this.username = this.createFirebaseAccountForm.controls['username'];
        this.email = this.createFirebaseAccountForm.controls['email'];
        this.password = this.createFirebaseAccountForm.controls['password'];
        this.dateOfBirth = this.createFirebaseAccountForm.controls['dateOfBirth'];
        this.terms = this.createFirebaseAccountForm.controls['terms'];
    }

    getFormattedDate(): string {
        let now = new Date();
        let mm = now.getMonth() + 1;
        let dd = now.getDate();

        let formattedDate = [now.getFullYear(), !mm[1] && '0', mm, !dd[1] && '0', dd].join('-');
        return formattedDate;
    }

    onSubmit(signupForm: any): void {
        var self = this;

        if (this.createFirebaseAccountForm.valid) {

            let loader = this.loadingCtrl.create({
                content: 'Creating account...',
                dismissOnPageChange: true
            });

            let newUser: UserCredentials = {
                email: signupForm.email,
                password: signupForm.password
            };

            loader.present();

            this.authService.registerUser(newUser)
                .then(function (result) {
                    self.authService.addUser(signupForm.username, signupForm.dateOfBirth, self.authService.getLoggedInUser().uid);
                    loader.dismiss()
                        .then(() => {
                            self.viewCtrl.dismiss({
                                user: newUser
                            }).then(() => {
                                let toast = self.toastCtrl.create({
                                    message: 'Account created successfully',
                                    duration: 4000,
                                    position: 'top'
                                });
                                toast.present();
                                self.CreateAndUploadDefaultImage();
                            });
                        });
                }).catch(function (error) {
                    // Handle Errors here.
                    console.error(error);
                    loader.dismiss().then(() => {
                        let toast = self.toastCtrl.create({
                            message: this.SignUpError(error),
                            duration: 4000,
                            position: 'top'
                        });
                        toast.present();
                    });
                });
        }
    }

    SignUpError(error): string {
        var errorMessage;
        switch (error.code) {
        case "auth/email-already-in-use":
            errorMessage = "The specified email is already in use!"
            break;
        case "auth/invalid-email":
            errorMessage = "The specified email is not valid!"
            break;
        case "auth/operation-not-allowed":
            errorMessage = "Your account has been disabled. Please contact support!"
            break;
        case "auth/weak-password":
            errorMessage = "Password should be at least 6 characters!"
            break;
        }
        return errorMessage || error.message;
    }

    CreateAndUploadDefaultImage() {
        let self = this;
        let imageData = 'assets/images/profile.png';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', imageData, true);
        xhr.responseType = 'blob';
        xhr.onload = function (e) {
            if (this.status === 200) {
                var myBlob = this.response;
                // myBlob is now the blob that the object URL pointed to.
                self.startUploading(myBlob);
            }
        };
        xhr.send();
    }

    startUploading(file) {

        let self = this;
        let uid = self.authService.getLoggedInUser().uid;
        let progress: number = 0;
        // display loader
        let loader = this.loadingCtrl.create({
            content: 'Uploading default image..',
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
                    console.log("Upload completed successfully, now we can get the download URL: "+downloadURL);
                    self.dataService.setUserImage(uid);
                });
            });
    }

}