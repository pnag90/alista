import { Component, EventEmitter, OnInit, OnDestroy, Input, Output } from '@angular/core';

import { List } from '../interfaces';
import { DataService } from '../services/data.service';

@Component({
    selector: 'list-component',
    templateUrl: 'list.component.html'
})
export class ListComponent implements OnInit, OnDestroy {
    @Input() list: List;
    @Output() onViewItems = new EventEmitter<string>();
    @Output() onViewComments = new EventEmitter<string>();

    constructor(private dataService: DataService) { }

    ngOnInit() {
        var self = this;
        self.dataService.getListsRef().child(self.list.key).on('child_changed', self.onCommentAdded);
        /* TODO 
            verificar items
            */
    }

    ngOnDestroy() {
        console.log('destroying..');
        var self = this;
        self.dataService.getListsRef().child(self.list.key).off('child_changed', self.onCommentAdded);
    }

    // Notice function declarion to keep the right this reference
    public onListItemAdded = (childSnapshot, prevChildKey) => {
       console.log(childSnapshot.val());
        var self = this;
        // Attention: only number of items is supposed to changed.
        // Otherwise you should run some checks..
        self.list.items = childSnapshot.val();
    }

    // Notice function declarion to keep the right this reference
    public onCommentAdded = (childSnapshot, prevChildKey) => {
       console.log(childSnapshot.val());
        var self = this;
        // Attention: only number of comments is supposed to changed.
        // Otherwise you should run some checks..
        self.list.comments = childSnapshot.val();
    }

    viewItems(key: string) {
        this.onViewItems.emit(key);
    }

    viewComments(key: string) {
        this.onViewComments.emit(key);
    }

}