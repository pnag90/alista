import { Component } from '@angular/core';
import { NavController, LoadingController, ToastController } from 'ionic-angular';
import { FormBuilder, Validators } from '@angular/forms';

import { DataService } from '../../shared/services/data.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'page-reset-password',
  templateUrl: 'reset-password.html',
})
export class ResetPasswordPage {

    public resetPasswordForm;
    emailChanged: boolean = false;
    passwordChanged: boolean = false;
    submitAttempt: boolean = false;
    message:string;

    constructor(public nav: NavController,
        public loadingCtrl: LoadingController,
        public dataService: DataService,
        public authService: AuthService,
        public formBuilder: FormBuilder, 
        public toastCtrl: ToastController) {

        this.resetPasswordForm = formBuilder.group({
            email: ['', Validators.compose([Validators.required])],
        })

        this.message = "We just sent you a reset link to your email";   
    }


    resetPassword(){
        this.submitAttempt = true;

        if (!this.resetPasswordForm.valid){
            console.log(this.resetPasswordForm.value);
        } else {
            this.authService.sendPasswordResetEmail(this.resetPasswordForm.value.email).then((user) => {
                /*let alert = this.alertCtrl.create({
                    message: "We just sent you a reset link to your email",
                    buttons: [{
                        text: "Ok",
                        role: 'cancel',
                        handler: () => { this.nav.pop(); }
                    }]
                });
                alert.present();*/
                let toast = this.toastCtrl.create({
                    message: this.message,
                    duration: 4000,
                    position: 'top'
                });
                toast.present();

            }, (error) => {
                var errorMessage: string = error.message;
                /*let errorAlert = this.alertCtrl.create({
                    message: errorMessage,
                    buttons: [{
                        text: "Ok",
                        role: 'cancel'
                    }]
                });
                errorAlert.present();*/
                    let toast = this.toastCtrl.create({
                    message: errorMessage,
                    duration: 4000,
                    position: 'top'
                });
                toast.present();
            });
        }
    }

}