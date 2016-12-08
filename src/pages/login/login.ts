import { Component, OnInit } from '@angular/core';
import { NavController, LoadingController, ToastController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';

import { TabsPage } from '../tabs/tabs';
import { SignupPage } from '../signup/signup';
import { UserCredentials } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';

@Component({
    selector: 'login-page',
    templateUrl: 'login.html'
})
export class LoginPage implements OnInit {

    loginFirebaseAccountForm: FormGroup;
    email: AbstractControl;
    password: AbstractControl;

    constructor(public nav: NavController,
        public loadingCtrl: LoadingController,
        public toastCtrl: ToastController,
        public fb: FormBuilder,
        public dataService: DataService,
        public authService: AuthService) { }

    ngOnInit() {
        this.loginFirebaseAccountForm = this.fb.group({
            'email': ['', Validators.compose([Validators.required])],
            'password': ['', Validators.compose([Validators.required, Validators.minLength(5)])]
        });

        this.email = this.loginFirebaseAccountForm.controls['email'];
        this.password = this.loginFirebaseAccountForm.controls['password'];
    }

    onSubmit(signInForm: any): void {
        var self = this;
        if (self.loginFirebaseAccountForm.valid) {

            var loader = self.loadingCtrl.create({
                content: 'Signing in firebase..',
                dismissOnPageChange: true
            });
            loader.present();

            let user: UserCredentials = {
                email: signInForm.email,
                password: signInForm.password
            };

            console.log(user);
            self.authService.signInUser(user.email, user.password).then(
                function(data){
                    loader.dismiss().then(function(){
                        self.sucessfullLoginHandler(data);
                    });
                },
                function(err){
                    loader.dismiss().then(function(){
                        self.errorLoginHandler(err)
                    });  
                });
        }
    }

    loginUserWithFacebook(){
        var self = this;

        var loader = self.loadingCtrl.create({
                content: 'Signing in facebook..',
                dismissOnPageChange: true
            });
        loader.present();

        //this.authService.loginWithFacebook().then(this.sucessfullLoginHandler,this.errorLoginHandler);
        self.authService.loginWithFacebook().subscribe(data => {
                loader.dismiss().then(function(){
                    self.sucessfullLoginHandler(data);
                });
            }, err => {
                loader.dismiss().then(function(){
                    self.errorLoginHandler(err)
                });   
            });    
    }

    sucessfullLoginHandler(res): void{
        this.nav.setRoot(TabsPage);
        let toast = this.toastCtrl.create({
            message: 'Logged in successfully',
            duration: 3000,
            position: 'botttom'
        });
        toast.present();
    }
    errorLoginHandler(error): void{
         // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.error(errorCode + ': ' + errorMessage);
        let toast = this.toastCtrl.create({
            message: errorMessage,
            duration: 4000,
            position: 'top'
        });
        toast.present();
    }

    register() {
        this.nav.push(SignupPage);
    }
    
}