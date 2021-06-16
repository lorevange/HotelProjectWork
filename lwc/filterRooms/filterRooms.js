import { LightningElement, track } from 'lwc';

import getHotels from '@salesforce/apex/FormHandler.getHotels';
import getRooms from '@salesforce/apex/FormHandler.getRooms';
import booking from '@salesforce/apex/FormHandler.booking';

export default class FilterRooms extends LightningElement {

    //Variabili degli input
    @track pickedHotel;
    @track pickedSize;
    @track pickedType;
    @track pickedRoom;
    @track pickedCheckIn;
    @track pickedCheckOut;
    @track pickedPicklist;
    @track totNumOfGuests = [];
    @track min = 0;
    @track max = 1000000;
    @track minDate = new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();

    @track guests = [
        {index : 1, fName: '', lName : '', email: '', cf: ''},
        {index : 2, fName: '', lName : '', email: '', cf: ''},
        {index : 3, fName: '', lName : '', email: '', cf: ''},
        {index : 4, fName: '', lName : '', email: '', cf: ''}
    ];

    //Popolate da Apex
    @track rooms;
    @track hotels = [];

    //Variabili d'appoggio
    @track placeholderImage = 'https://i.stack.imgur.com/y9DpT.jpg';
    @track isUnavailable = false;
    @track errore = false;
    @track isLoading = true;
    @track isCompiled = false;
    @track isModalOpen = false;
    @track canSubmit = false;
    @track areThereRooms = true;

    @track pickSingle = [
        {value : '1', label : '1'}
    ]

    @track pickDouble = [
        {value: '1', label: '1'},
        {value: '2', label: '2'}
    ]

    @track pickTriple = [
        {value: '1', label: '1'},
        {value: '2', label: '2'},
        {value: '3', label: '3'}
    ]

    @track pickQuadruple = [
        {value: '1', label: '1'},
        {value: '2', label: '2'},
        {value: '3', label: '3'},
        {value: '4', label: '4'}
    ]


    @track sizeOptions = [
        {value: 'Double Room', label: 'Double Room'},
        {value: 'Triple Room', label: 'Triple Room'},
        {value: 'Quadruple Room', label: 'Quadruple Room'}
    ];

    @track typeOptions = [
        {value: 'Standard', label: 'Standard'},
        {value: 'Business', label: 'Business'},
        {value: 'Suite', label: 'Suite'}
    ]

    connectedCallback() {
        this.loadContext();
    }

    async loadContext() {
        try {
            const result = await getHotels();
            Array.prototype.forEach.call(result, child => {
                this.hotels.push({
                    value: child.Id,
                    label: child.Name
                });
            });
        } catch (err) {
            this.errore = true;
        }
        this.isLoading = false;
    }

    closeModal() {
        Array.prototype.forEach.call(this.guests, child => {
            child.fName = '';
            child.lName = '';
            child.email = '';
        });
        this.isModalOpen = false;
    }

    checkCompiled() {
        if(this.pickedHotel && this.pickedSize && this.pickedCheckIn >= new Date() && this.pickedCheckOut > new Date() && this.pickedType) {
            this.isCompiled = true;
        } else {
            this.isCompiled = false;
        }
    }

    handleChangeHotel(event) {
        this.pickedHotel = event.detail.value;
        this.checkCompiled();
    }

    handleChangeSize(event) {
        this.pickedSize = event.detail.value;
        if(this.pickedSize == 'Double Room') {
            this.pickedPicklist = this.pickDouble;
        } else if (this.pickedSize == 'Triple Room') {
            this.pickedPicklist = this.pickTriple;
        } else if (this.pickedSize == 'Quadruple Room') {
            this.pickedPicklist = this.pickQuadruple;
        }
        this.checkCompiled();
    }

    handleChangeType(event) {
        this.pickedType = event.detail.value;
        this.checkCompiled();
    }

    async onSearch() {
        try{
            this.rooms = await getRooms({
                "hotelId" : this.pickedHotel, 
                "size" : this.pickedSize, 
                "checkin" : this.pickedCheckIn, 
                "checkout" : this.pickedCheckOut,
                "min" : this.min,
                "max" : this.max,
                "type" : this.pickedType
            });

            Array.prototype.forEach.call(this.rooms, room => {
                room.Dec_Feb__c = Math.floor(room.Dec_Feb__c * 100) / 100;
                room.Mar_May__c = Math.floor(room.Mar_May__c * 100) / 100;
                room.Jun_Aug__c = Math.floor(room.Jun_Aug__c * 100) / 100;
                room.Sep_Nov__c = Math.floor(room.Sep_Nov__c * 100) / 100;
            });

            if(this.rooms.length > 0) {
                this.areThereRooms = true;
            } else {
                this.areThereRooms = false;
            }
        } catch (err) {
            this.errore = true;
        }
    }

    async onBook(event) {
        this.pickedRoom = event.target.value;
        this.isModalOpen = true;
    }

    onChangeCheckIn(event) {
        this.pickedCheckIn = new Date(event.target.value);
        let dateCmp = this.template.querySelector('.dateCmpIn');
        if(this.pickedCheckIn >= this.pickedCheckOut) {
            this.pickedCheckIn = '';
            dateCmp.setCustomValidity('Check-in date must precede Check-out date.');
        } else {
            dateCmp.setCustomValidity('');
        }
        dateCmp.reportValidity();
        this.checkCompiled();
    }

    onChangeCheckOut(event) {
        this.pickedCheckOut = new Date(event.target.value);
        let dateCmp = this.template.querySelector('.dateCmpOut');
        if(this.pickedCheckOut <= this.pickedCheckIn) {
            this.pickedCheckOut = '';
            dateCmp.setCustomValidity('Check-out date must follow Check-in date.');
        } else {
            dateCmp.setCustomValidity('');
        }
        dateCmp.reportValidity();
        this.checkCompiled();
    }

    onChangeMin(event) {
        this.min = event.detail.value;
    }

    onChangeMax(event) {
        this.max = event.detail.value;
        if(!this.max) {
            this.max = 1000000;
        }
    }

    handleChangePickedPicklist(event) {

        const temp = parseInt(event.target.value);
        const oldLen = this.totNumOfGuests.length;
        const diff = oldLen - temp;
        switch (event.detail.value) {
            case '1' : 
                this.totNumOfGuests = this.pickSingle;
                break;
            case '2' : 
                this.totNumOfGuests = this.pickDouble;
                break;
            case '3' : 
                this.totNumOfGuests = this.pickTriple;
                break;
            case '4' : 
                this.totNumOfGuests = this.pickQuadruple;
                break;
        }

        if(diff != 0) {
            for(var i = oldLen; i < 4; i++) {
                this.guests[i].fName = '';
                this.guests[i].lName = '';
                this.guests[i].email = '';
                this.guests[i].cf = '';
            }
        }

        this.checkCanSubmit();
    }

    onChangeFirstName(event) {
        this.guests[parseInt(event.target.name) - 1].fName = event.detail.value;
        this.checkCanSubmit();
    }

    onChangeLastName(event) {
        this.guests[parseInt(event.target.name) - 1].lName = event.detail.value;
        this.checkCanSubmit();
    }

    onChangeEmail(event) {
        this.guests[parseInt(event.target.name) - 1].email = event.detail.value;
        this.checkCanSubmit();
    }

    onChangeCF(event) {
        this.guests[parseInt(event.target.name) - 1].cf = event.detail.value;
        this.checkCanSubmit();
    }

    checkCanSubmit() {
        for(var i = 0; i < this.totNumOfGuests.length; i++) {
            if(!this.guests[i].fName || !this.guests[i].lName || !this.guests[i].email || this.guests[i].cf.length != 16) {
                this.canSubmit = false;
                break;
            } else {
                this.canSubmit = true;
            }
        }
    }

    async submitDetails() {

        var lista = [];

        Array.prototype.forEach.call(this.guests, child => {
            if(child.fName) {
                lista.push([child.fName, child.lName, child.email, child.cf]);
            }
        });

        try{
            const result = await booking({
                "guests" : lista,
                "room" : this.pickedRoom,
                "checkin" : this.pickedCheckIn,
                "checkout" : this.pickedCheckOut});
            if(result === false) {
                alert('Prenotazione non effettuata.');
            } else {
                alert('Prenotazione effettuata!');
            }
        } catch (err) {
            alert('Prenotazione fallita.');
        }
        this.closeModal();
    }
}