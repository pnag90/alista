import { Component, OnInit } from '@angular/core';

@Component({
    templateUrl: 'auth.html'
})
export class AuthPage implements OnInit {
    homeScreen: string;

    constructor() { 
        this.homeScreen = "login";
    }

    ngOnInit() {
        //var self = this;
    }

}