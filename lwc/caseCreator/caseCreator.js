import { LightningElement, track } from 'lwc';

import createCase from '@salesforce/apex/FormHandler.createCase';

export default class CaseCreator extends LightningElement {

    @track ppsn;
    @track subject;
    @track description;

    @track isCompiled = false;
    @track isDone = false;

    onChangePPSN(event) {
        this.ppsn = event.detail.value;
        this.checkCompiled();
    }

    onChangeSubj(event) {
        this.subject = event.detail.value;
        this.checkCompiled();
    }

    onChangeDesc(event) {
        this.description = event.detail.value;
        this.checkCompiled();
    }

    checkCompiled() {
        if(this.ppsn.length == 16 && this.subject && this.description) {
            this.isCompiled = true;
        } else {
            this.isCompiled = false;
        }
    }

    async submit() {
        try {
            const result = await createCase({
                "ppsn" : this.ppsn,
                "subj" : this.subject,
                "descr" : this.description
            });
            this.isDone = result;
        } catch (err) {
            alert('Error');
        }
        
    }
}