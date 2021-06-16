public with sharing class FormHandler {

    @AuraEnabled
    public static List<Account> getHotels(){
        return [SELECT Id, Name FROM Account];
    }

    @AuraEnabled
    public static List<Room__c> getRooms(Id hotelId, String size, String type, Date checkin, Date checkout, Integer max, Integer min){

        List<Room__c> rooms = [SELECT Id, Name, Type__c, Size__c, Attendance__c, Image__c, Account__c, CurrentPrice__c, Account__r.Name, Dec_Feb__c, Mar_May__c, Jun_Aug__c, Sep_Nov__c 
                                FROM Room__c 
                                WHERE Account__c =: hotelId 
                                AND Size__c =: size
                                AND Type__c =: type
                                AND CurrentPrice__c <=: max
                                AND CurrentPrice__c >=: min];

        Map<Id, Room__c> roomsMap = new Map<Id, Room__c>();
        List<Room__c> finalRooms = new List<Room__c>();

        for(Room__c r : rooms) {
            roomsMap.put(r.Id, r);
        }

        List<Opportunity> reserv = [SELECT CheckIn__c, CloseDate, Room__c FROM Opportunity WHERE Room__c in: rooms AND CloseDate >: Date.today()];
        Boolean case1, case2;
        
        for(Opportunity o : reserv) {
            //Case1 è il caso in cui checkin o checkout cadono dentro l'intervallo tra CheckIn__c e CloseDate.
            case1 = ((checkin >= o.CheckIn__c && checkin < o.CloseDate) || (checkout > o.CheckIn__c && checkout <= o.CloseDate));

            //Case2 è il caso in cui CheckIn__c e CloseDate sono contenute nell'intervallo tra checkin e checkout.
            case2 = (o.CheckIn__c >= checkin && o.CheckIn__c < checkout && o.CloseDate > checkin && o.CloseDate <= checkout);

            if(case1 || case2) {
                roomsMap.remove(o.Room__c);
            }
        }

        for(Id rId : roomsMap.keySet()) {
            finalRooms.add(roomsMap.get(rId));
        }

        return finalRooms;

    }

    @testVisible
    @AuraEnabled
    public static Boolean booking(List<List<String>> guests, Room__c room, Date checkin, Date checkout){
        List<Contact> newConts = new List<Contact>();

        List<String> snumbers = new List<String>();
        String lName = guests.get(0).get(1);

        for(List<String> g : guests) {
            if(g[0] == '') {
                break;
            } else {
                snumbers.add(g[3]);
                newConts.add(new Contact(LastName = g[1], FirstName = g[0], Email = g[2], ServiceNumber__c = g[3]));
            }
        }

        List<Contact> alreadyExisting = [SELECT Id, ServiceNumber__c FROM Contact WHERE ServiceNumber__c in: snumbers];

        Integer i = 0;
        Integer size = newConts.size();

        while(i < size) {
            for(Contact c1 : alreadyExisting) {
                if(c1.ServiceNumber__c == newConts[i].ServiceNumber__c) {
                    newConts.remove(i);
                    i--;
                    size--;
                    break;
                }
            }
            i++;
        }

        if(newConts.size() > 0) {
            insert newConts;
        }

        List<Contact> subscribed = [SELECT Id, FirstName, LastName, ServiceNumber__c, Email
                                    FROM Contact 
                                    WHERE ServiceNumber__c in: snumbers];

        Opportunity op = new Opportunity(Name = 'Prenotazione ' +  lName);

        List<Opportunity> reserv = [SELECT CheckIn__c, CloseDate, Room__c FROM Opportunity WHERE Room__c =: room.Id AND CloseDate >: Date.today()];
        Boolean case1, case2;
        
        for(Opportunity o : reserv) {
            //Case1 è il caso in cui checkin o checkout cadono dentro l'intervallo tra CheckIn__c e CloseDate.
            case1 = ((checkin >= o.CheckIn__c && checkin < o.CloseDate) || (checkout > o.CheckIn__c && checkout <= o.CloseDate));

            //Case2 è il caso in cui CheckIn__c e CloseDate sono contenute nell'intervallo tra checkin e checkout.
            case2 = (o.CheckIn__c >= checkin && o.CheckIn__c < checkout && o.CloseDate > checkin && o.CloseDate <= checkout);

            if(case1 || case2) {
                //o.addError('These dates have just been blocked. We\'re sorry!');
                return false;
            }
        }

        op.CheckIn__c = checkin;
        op.CloseDate = checkout;
        Double totAmount = 0;

        Date cycle = Date.newInstance(checkin.year(), checkin.month(), checkin.day());

        while(cycle.daysBetween(checkout) > 0) {
            switch on cycle.month() {
                when 1 {
                    totAmount += room.Dec_Feb__c;
                }
                when 2 {
                    totAmount += room.Dec_Feb__c;
                }
                when 3 {
                    totAmount += room.Mar_May__c;
                }
                when 4 {
                    totAmount += room.Mar_May__c;
                }
                when 5 {
                    totAmount += room.Mar_May__c;
                }
                when 6 {
                    totAmount += room.Jun_Aug__c;
                }
                when 7 {
                    totAmount += room.Jun_Aug__c;
                }
                when 8 {
                    totAmount += room.Jun_Aug__c;
                }
                when 9 {
                    totAmount += room.Sep_Nov__c;
                }
                when 10 {
                    totAmount += room.Sep_Nov__c;
                }
                when 11 {
                    totAmount += room.Sep_Nov__c;
                }
                when 12 {
                    totAmount += room.Dec_Feb__c;
                }
            }

            cycle = cycle.addDays(1);
        }

        op.Contact__c = subscribed[0].Id;
        op.Room__c = room.Id;
        op.StayPrice__c = totAmount;
        op.Amount = 0;
        op.AccountId = room.Account__c;
        op.StageName = 'On Hold';
        

        insert op;

        for(Contact c : subscribed) {
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            mail.setHtmlBody('Hi ' + c.FirstName + ' ' + c.LastName +
                                '!<br><br>Thank you for booking your stay at  ' + room.Account__r.Name + ' - ' + room.Name +
                                ' Room.<br><br>See you soon!');
            mail.setToAddresses(new List<String>{c.Email});
            mail.setSubject('Thank you!');
            Messaging.sendEmail(new Messaging.SingleEmailMessage[] { mail });
        }

        return true;
    }

    @AuraEnabled
    public static Boolean createCase(String ppsn, String subj, String descr){
        
        Contact c = [SELECT Id FROM Contact WHERE ServiceNumber__c =: ppsn LIMIT 1];

        if(c != NULL) {
            Case cas = new Case(ContactId = c.Id, Description = descr, Subject = subj, Origin = 'Web', Status = 'New');
            insert cas;
            return true;
        }
        return false;
    }

    @AuraEnabled
    public static List<Opportunity> getReservations(String servNum){
        return [SELECT Id, Name, OrderNumber__c, Amount, StayPrice__c, Contact__c, CheckIn__c, CloseDate, StageName FROM Opportunity WHERE Contact__r.ServiceNumber__c =: servNum];
    }
}