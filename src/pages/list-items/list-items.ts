import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, ModalController, ToastController, LoadingController, NavParams, Content } from 'ionic-angular';

import { ItemCreatePage } from '../item-create/item-create';
import { ListItem } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { ItemsService } from '../../shared/services/items.service';
import { MappingsService } from '../../shared/services/mappings.service';

@Component({
    templateUrl: 'list-items.html'
})
export class ListItemsPage implements OnInit {
    @ViewChild(Content) content: Content;
    listKey: string;
    itemsLoaded: boolean = false;
    items: ListItem[];
    selectedItem: ListItem;

    changeStateOnClick: boolean = true;

    constructor(public actionSheeCtrl: ActionSheetController,
        public modalCtrl: ModalController,
        public toastCtrl: ToastController,
        public loadingCtrl: LoadingController,
        public navParams: NavParams,
        public authService: AuthService,
        public itemsService: ItemsService,
        public dataService: DataService,
        public mappingsService: MappingsService) { }

    ngOnInit() {
        var self = this;
        self.listKey = self.navParams.get('listKey');
        self.itemsLoaded = false;
        self.selectedItem = null;

        self.dataService.getListItemsRef(self.listKey).once('value', function (snapshot) {
            self.items = self.mappingsService.getListItems(snapshot);
            self.itemsLoaded = true;
            self.selectedItem = null;
        }, function (error) {});
    }

    createItem() {
        let self = this;

        console.log("createItem");

        let modalPage = this.modalCtrl.create(ItemCreatePage, {
            listKey: this.listKey
        });

        modalPage.onDidDismiss((itemData: any) => {
            if (itemData) {
                let itemVals = itemData.item;
                let itemUser = itemData.user;

                let createdItem: ListItem = {
                    key: itemVals.key,
                    list: itemVals.list,
                    text: itemVals.text,
                    category: itemVals.category,
                    user: itemVals.user || itemUser,
                    dateCreated: itemVals.dateCreated,
                    qt: itemVals.qt,
                    state : 1
                };

                self.items.push(createdItem);
                self.scrollToBottom();

                let toast = this.toastCtrl.create({
                    message: 'Item created',
                    duration: 2000,
                    position: 'top'
                });
                toast.present();
            }
        });

        modalPage.present();
        
    }

    selectItem(item:ListItem) {
        let self = this;

        self.selectedItem = item || null;

        if(self.selectedItem !== null && self.changeStateOnClick===true){
            this.buy(self.selectedItem);
        }
    }

    scrollToBottom() {
        this.content.scrollToBottom();
    }

    buy(item: ListItem) {
        var self = this;
        var newState:number = (item.state || 0) == 0 ? 1 : 0 ; 

        self.dataService.updateListItemState(item.key, newState).then(function () {
            self.dataService.getItemsRef().child(item.key).once('value').then(function (snapshot) {
                item = self.mappingsService.getListItem(snapshot, item.key);
                self.itemsService.setItem<ListItem>(self.items, c => c.key === item.key, item);
            });
        });
    }

    showItemActions() {
        var self = this;
        let actionSheet = self.actionSheeCtrl.create({
            title: 'List Actions',
            buttons: [
                {
                    text: 'Rename',
                    icon: 'create',
                    handler: () => {
                        //self.removeItem();
                    }
                },
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: () => { }
                }
            ]
        });

        actionSheet.present();
    }

    removeItem(item : ListItem) {
        var self = this;

        if(item && item.key){

            let currentUser = self.authService.getLoggedInUser();
            if (currentUser != null) {
                self.dataService.deleteListItem(self.listKey, item)
                    .then(function () {
                        let toast = self.toastCtrl.create({
                            message: 'Item removed',
                            duration: 3000,
                            position: 'top'
                        });
                        toast.present();
                    });
            } else {
                let toast = self.toastCtrl.create({
                    message: 'This action is available only for authenticated users',
                    duration: 3000,
                    position: 'top'
                });
                toast.present();
            }

        }

    }
}