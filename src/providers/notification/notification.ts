import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AngularFireDatabase } from 'angularfire2/database';

//for notifications
import { HttpHeaders } from '@angular/common/http';
/*
  Generated class for the NotificationProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class NotificationProvider {

  users: any = [];

  constructor(public http: HttpClient,
    private angularFireDatabase: AngularFireDatabase) {
    console.log('Hello NotificationProvider Provider');
  }

  sendNotification(topic: string, notifBody){
    let body = {
      "notification":{
        "title":notifBody.notifTitle,
        "body":notifBody.titleAnnonce,
        "sound":"default",
        "click_action":"FCM_PLUGIN_ACTIVITY",
        "icon":"fcm_push_icon"
      },
      "data":{
        "type":"annonce"
      },
        "to":"/topics/"+topic,
        "priority":"high",
        "restricted_package_name":""
    }
    let options = new HttpHeaders().set('Content-Type','application/json');
    this.http.post("https://fcm.googleapis.com/fcm/send",body,{
      headers: options.set('Authorization', 'key=AAAA96ZF_R0:APA91bFQZUbbPmXhGZp09l_cjxeZVxzt_n-bkMqktzNrzwictuEKsdSOjxVMj9FAb4U2J6Io-2GbSuVO9-4FElsHZGMh7pXbfoIc3wijAPMXN0Eb5YgZZCAgjbfixwwc0smv2hPMp76-'),
    })
      .subscribe();
  }

  sendAnnonceNotification(body){

    let annoncePos = {
      latitude : body.latitude,
      longitude: body.longitude
    }

    let sUsers= this.angularFireDatabase.list('/users/').valueChanges().subscribe(data => {
      this.users = data;
      this.users.forEach(user =>{
        console.log(user);

        let userPos = {
          latitude : user.currentPositionLat,
          longitude: user.currentPositionLng
        }

        let distance = this.getDistanceBetweenPoints(annoncePos,userPos,'km');
        console.log("distance : ",distance);

        if(body.type == 0 && distance<10){

          body.notifTitle = "Annonce de Danger";
          console.log("NotifBody : ", body);
          console.log("sending Notif to : ",user.id);
          this.sendNotification(user.id,body);

        }else if(body.type == 1 && distance<8){

          body.notifTitle = "Annonce de maladie/Blessure";
          console.log("NotifBody : ", body);
          console.log("sending Notif to : ",user.id);
          this.sendNotification(user.id,body);

        }else if(body.type == 2 && distance<4){

          body.notifTitle = "Annonce de besoin de foyer";
          console.log("NotifBody : ", body);
          console.log("sending Notif to : ",user.id);
          this.sendNotification(user.id,body);

        }else if(body.type == 3 && distance<2){

          body.notifTitle = "Annonce de besoin d'aide";
          console.log("NotifBody : ", body);
          console.log("sending Notif to : ",user.id);
          this.sendNotification(user.id,body);

        }

        /* if(body.type == 0 && distance<10){
          console.log("NotifBody : ", body);
          console.log("sending Notif to : ",user.id);
          this.sendNotification(user.id,body);
        } */

      })
      sUsers.unsubscribe();
    });

  }

  sendCommentNotification(displayName,toUserId,pubType,pubId,comment){
    let body = {
      "notification":{
        "title":displayName+" a commenté votre annonce",
        "body":comment,
        "sound":"default",
        "click_action":"FCM_PLUGIN_ACTIVITY",
        "icon":"fcm_push_icon"
      },
      "data":{
        "type":"annonceComment"
      },
        "to":"/topics/"+toUserId,
        "priority":"high",
        "restricted_package_name":""
    }
    let options = new HttpHeaders().set('Content-Type','application/json');
    this.http.post("https://fcm.googleapis.com/fcm/send",body,{
      headers: options.set('Authorization', 'key=AAAA96ZF_R0:APA91bFQZUbbPmXhGZp09l_cjxeZVxzt_n-bkMqktzNrzwictuEKsdSOjxVMj9FAb4U2J6Io-2GbSuVO9-4FElsHZGMh7pXbfoIc3wijAPMXN0Eb5YgZZCAgjbfixwwc0smv2hPMp76-'),
    })
      .subscribe();
  }

  getDistanceBetweenPoints(start, end, units){

    let earthRadius = {
        miles: 3958.8,
        km: 6371
    };

    let R = earthRadius[units || 'miles'];
    let lat1 = start.latitude;
    let lon1 = start.longitude;
    let lat2 = end.latitude;
    let lon2 = end.longitude;

    let dLat = this.toRad((lat2 - lat1));
    let dLon = this.toRad((lon2 - lon1));
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;

    return d;

  }

  toRad(x){
    return x * Math.PI / 180;
  }

}
