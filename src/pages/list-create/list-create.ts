import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, LoadingController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';

import { List } from '../../shared/interfaces';
import { AuthService } from  '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';

@Component({
  selector: 'list-create-page',
  templateUrl: 'list-create.html'
})
export class ListCreatePage implements OnInit {

  createListForm: FormGroup;
  name: AbstractControl;
  question: AbstractControl;
  category: AbstractControl;

  constructor(public nav: NavController,
    public loadingCtrl: LoadingController,
    public viewCtrl: ViewController,
    public fb: FormBuilder,
    public authService: AuthService,
    public dataService: DataService) { }

  ngOnInit() {
    console.log('in list create..');
    this.createListForm = this.fb.group({
      'name': ['', Validators.compose([Validators.required, Validators.minLength(4), Validators.maxLength(16)])] /*,
      'question': ['', Validators.compose([Validators.required, Validators.minLength(10)])],
      'category': ['', Validators.compose([Validators.required, Validators.minLength(1)])]*/
    });

    this.name = this.createListForm.controls['name'];
   // this.question = this.createListForm.controls['question'];
   // this.category = this.createListForm.controls['category'];
  }

  cancelNewList() {
    this.viewCtrl.dismiss();
  }

  onSubmit(list: any): void {
    var self = this;
    if (this.createListForm.valid) {

      let loader = this.loadingCtrl.create({
        content: 'Posting list...',
        dismissOnPageChange: true
      });

      loader.present();

      let uid = self.authService.getLoggedInUser().uid;
      self.dataService.getUsername(uid).then(function (userSnap) {
        let username = userSnap.val();

        self.dataService.getTotalLists().then(function (totalSnap) {
          let currentNumber = totalSnap.val();
          let newPriority: number = currentNumber === null ? 1 : (currentNumber + 1);

          let newList: List = {
            key: null,
            name: list.name,
            user: { uid: uid, username: username }, 
            users: null,
            dateCreated: new Date().toString(),
            comments: 0,
            items: 0,
            shares: 0
          };

          self.dataService.submitList(newList, newPriority)
            .then(function () {

              loader.dismiss().then(() => {
                self.viewCtrl.dismiss({
                  list: newList,
                  priority: newPriority
                });
              });

            }, function (error) {
              // The Promise was rejected.
              console.error(error);
              loader.dismiss();
            });
        });
      });
    }
  }

}