import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, ModalController, ToastController, LoadingController, NavParams, NavController, Content } from 'ionic-angular';

import { ItemCreatePage } from '../item-create/item-create';
import { ListSharePage } from '../list-share/list-share';
import { ListItem } from '../../shared/interfaces';
import { List } from '../../shared/interfaces';
import { AuthService } from '../../shared/services/auth.service';
import { DataService } from '../../shared/services/data.service';
import { ItemsService } from '../../shared/services/items.service';
import { MappingsService } from '../../shared/services/mappings.service';

@Component({
    selector: 'list-items',
    templateUrl: 'list-items.html'
})
export class ListItemsPage implements OnInit {
    @ViewChild(Content) content: Content;
    list: List;
    itemsLoaded: boolean = false;
    items: ListItem[];
    selectedItem: ListItem;

    changeStateOnClick: boolean = true;

    constructor(public navCtrl: NavController,
        public actionSheeCtrl: ActionSheetController,
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
        self.list = self.navParams.get('list') || null;
        var nItems:number = self.list.items || 0;
        self.getListItems(nItems==0);
    }

    getListItems(noItems:boolean){
        var self = this;
        self.itemsLoaded = false;
        self.items = [];
        self.selectedItem = null;

        if(noItems){
            self.itemsLoaded = true;
        }

        //self.dataService.getListItemsRef(self.listKey).once('value', function (snapshot) {
        //self.items = self.mappingsService.getListItems(snapshot);
        self.dataService.getListItemsRef(self.list.key).on('child_added', function (snapshot) {
            var item:ListItem = self.mappingsService.getListItem(snapshot, snapshot.key);
            self.items.unshift(item);  
            self.itemsLoaded = true; 
        }, function (error) {});

        self.dataService.getListItemsRef(self.list.key).on('child_changed', function (snapshot) {
            var item:ListItem = self.mappingsService.getListItem(snapshot, snapshot.key);
            for(var i:number=0; i<self.items.length; i++){
                if(self.items[i].key == item.key){
                    self.items[i] = item;
                    break;
                }
            }
        }, function (error) {});

         self.dataService.getListItemsRef(self.list.key).on('child_removed', function (snapshot) {
            var item:ListItem = self.mappingsService.getListItem(snapshot, snapshot.key);
            self.itemsService.removeItemFromArray(self.items, item);
            /*
            for(var i:number=0; i<self.items.length; i++){
                if(self.items[i].key == item.key){
                    self.itemsService.removeItemFromArray(self.items, self.items[i]);
                    break;
                }
            }
            self.items.unshift(item);
            self.itemsLoaded = true;*/
        }, function (error) {});

        
    }

    createItem() {
        let self = this;

        console.log("createItem");

        let modalPage = this.modalCtrl.create(ItemCreatePage, {
            listKey: self.list.key
        });

        modalPage.onDidDismiss((itemData: any) => {
            if (itemData) {
                /*let itemVals = itemData.item;
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

                self.items.push(createdItem);*/
                self.scrollToBottom();

                let toast = this.toastCtrl.create({
                    message: 'Item created',
                    duration: 3000,
                    position: 'bottom'
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
        var buttons = [
                {
                    text: 'Rename',
                    icon: 'create',
                    handler: () => {
                        self.renameList();
                    }
                },
                {
                    text: 'Remove',
                    icon: 'trash',
                    handler: () => {
                        self.removeList();
                    }
                },
                {
                    text: 'Cancel',
                    icon: 'close',
                    role: 'cancel',
                    handler: () => { }
                }
            ];

        if(self.list.user.uid==self.authService.getLoggedInUser().uid){
            buttons.push({
                    text: 'Share',
                    icon: 'share-alt',
                    handler: () => {
                        self.shareList();
                    }
                });
        }    

        let actionSheet = self.actionSheeCtrl.create({
            title: 'List Actions',
            buttons: buttons
        });

        actionSheet.present();
    }

    removeItem(item : ListItem) {
        var self = this;

        if(item && item.key){

            let currentUser = self.authService.getLoggedInUser();
            if (currentUser != null) {
                self.dataService.deleteListItem(self.list.key, item)
                    .then(function () {
                        let toast = self.toastCtrl.create({
                            message: 'Item removed',
                            duration: 3000,
                            position: 'bottom'
                        });
                        toast.present();
                    });
            } else {
                let toast = self.toastCtrl.create({
                    message: 'This action is available only for authenticated users',
                    duration: 3000,
                    position: 'bottom'
                });
                toast.present();
            }

        }
    }
    renameList(){
        var self = this;
        if( self.list.key != null ){
        
        }
    }

    removeList(){
        var self = this;
        if( self.list.key != null ){

            self.dataService.removeList(self.list.key)
                .then(function () {
                    let toast = self.toastCtrl.create({
                            message: 'List removed',
                            duration: 3000,
                            position: 'bottom'
                        });
                    toast.present();
                    self.navCtrl.pop();
                });
        }
    }

    shareList(){
        var self = this;
        if( self.list.key != null) {
            this.navCtrl.push(ListSharePage, { list: self.list });
        }
    }
}