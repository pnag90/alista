import { Component, OnInit } from '@angular/core';
import { NavController, ViewController, LoadingController, NavParams } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';

import { ListItem, User } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';

@Component({
  templateUrl: 'item-create.html'
})
export class ItemCreatePage implements OnInit {

  createItemForm: FormGroup;
  item: AbstractControl;
  quantity: AbstractControl;
  listKey: string;
  loaded: boolean = false;

  constructor(public nav: NavController,
    public navParams: NavParams,
    public loadingCtrl: LoadingController,
    public viewCtrl: ViewController,
    public fb: FormBuilder,
    public authService: AuthService,
    public dataService: DataService) {

  }

  ngOnInit() {
    this.listKey = this.navParams.get('listKey');

    this.createItemForm = this.fb.group({
      'item': ['', Validators.compose([Validators.required, Validators.minLength(4)])],
      'quantity': ['', Validators.compose([Validators.minLength(1)])]
    });

    this.item = this.createItemForm.controls['item'];
    this.quantity = this.createItemForm.controls['quantity'];
    this.loaded = true;
  }

  cancelNewItem() {
    this.viewCtrl.dismiss();
  }

  onSubmit(itemForm: any): void {
    var self = this;
    if (this.createItemForm.valid) {

      let loader = this.loadingCtrl.create({
        content: 'Posting item...',
        dismissOnPageChange: true
      });

      loader.present();

      let uid = self.authService.getLoggedInUser().uid;
      self.dataService.getUsername(uid).then(function (snapshot) {
        let username = snapshot.val();

        let itemRef = self.dataService.getItemsRef().push();
        let itemkey: string = itemRef.key;
        let user: User = { uid: uid, username: username };

        let newItem: ListItem = {
          key: itemkey,
          list: self.listKey,
          user: user,
          text: itemForm.item,
          qt: itemForm.quantity || 1,
          category: itemForm.category || null,
          state: 0,
          dateCreated: new Date().toString()
        };

        self.dataService.setListItem(self.listKey, newItem)
          .then(function (snapshot) {
            loader.dismiss()
              .then(() => {
                self.viewCtrl.dismiss({
                  item: newItem,
                  user: user
                });
              });
          }, function (error) {
            // The Promise was rejected.
            console.error(error);
            loader.dismiss();
          });
      });
    }
  }
}
