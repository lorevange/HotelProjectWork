import { LightningElement, track } from 'lwc';

import getReservations from '@salesforce/apex/FormHandler.getReservations';

export default class ReservationHistory extends LightningElement {

    @track ppsn;
    @track reservs;

    @track isCompiled = false;
    @track isEmpty = false;
    @track showGrid = false;

    @track columns = [
        {
            label: 'Reservation Number',
            fieldName: 'OrderNumber__c',
            type: 'text',
            sortable: true
        },
        {
            label: 'Link',
            fieldName: 'nameUrl',
            type: 'url',
            typeAttributes: {label: { fieldName: 'name' }, 
            target: '_blank'},
            sortable: true
        },
        {
            label: 'Total Price',
            fieldName: 'Amount',
            type: 'currency',
            sortable: true
        },
        {
            label: 'Check-In',
            fieldName: 'CheckIn__c',
            type: 'date',
            sortable: true
        },
        {
            label: 'Check-Out',
            fieldName: 'CloseDate',
            type: 'date',
            sortable: true
        }
    ]

    onChangePpsn(event) {
        this.ppsn = event.target.value;
        this.isEmpty = false;
        if(this.ppsn.length == 16) {
            this.isCompiled = true;
        } else {
            this.isCompiled = false;
        }
    }

    async search() {
        try {
            const data = await getReservations({
                "servNum" : this.ppsn
            });
            if(data) {
                let nameUrl;
                this.reservs = data.map(row => {
                    row.Amount += row.StayPrice__c;
                    nameUrl = `/${row.Id}`;
                    return {...row, nameUrl};
                });
            } else {
                this.reservs = [];
            }
            if(this.reservs.length == 0) {
                this.isEmpty = true;
                this.showGrid = false;
            } else {
                this.isEmpty = false;
                this.showGrid = true;
            }/*
            Array.prototype.forEach.call(this.reservs, res => {
                res.StayPrice__c = res.Amount + res.StayPrice__c;
            })*/
        } catch (err) {
            alert('Error');
        }
    }
}