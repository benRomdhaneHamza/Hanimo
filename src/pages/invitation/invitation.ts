import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase/app';

import { User } from "../../models/user";
import { Invitation } from "../../models/invitation";
import { Friend } from "../../models/friend";

import { UsercrudProvider } from "../../providers/usercrud/usercrud";
import { HttpHeaders, HttpClient } from '@angular/common/http';

@Component({
  selector: 'page-invitation',
  templateUrl: 'invitation.html',
})
export class InvitationPage {


  currentUser = {} as User;
  invitations : any = [] ;
  public users: Array<any> = [];
  invitationsRef =  this.afDatabase.database.ref('/invitations/');

  constructor(public navCtrl: NavController, public navParams: NavParams,
  private userProvider: UsercrudProvider,
  private storage: Storage,
  private afDatabase: AngularFireDatabase,
  private afAuth: AngularFireAuth,
  public http: HttpClient) {

    /* this.afAuth.auth.onAuthStateChanged(user => {
      if(user){
        this.currentUser.id = user.uid;
        this.initilizeInvitationsList();
        console.log(this.currentUser.id);
      }else{
        console.log("Erreur de chargement");
      }
    }); */
  }


  ionViewWillEnter(){
    this.afAuth.auth.onAuthStateChanged(user => {
      if(user){
        this.currentUser.id = user.uid;
        this.initilizeInvitationsList();
        console.log(this.currentUser.id);
      }else{
        console.log("Erreur de chargement");
      }
    });
  }

  initilizeInvitationsList(){
    this.invitationsRef
     .orderByChild("idReceiver").equalTo(this.currentUser.id).on("value",invitSnapshot => {
         console.log("usersnapshot : "+invitSnapshot.val());
         this.users=[];
         invitSnapshot.forEach( invitNap => {
           let invit = invitNap.val();
           console.log(invit);
           this.afDatabase.database.ref("/users/"+invit.idSender).once("value",userSnap=>{
             invit.displayName = userSnap.val().displayName;
             invit.imageUrl = userSnap.val().imageUrl;
             console.log(invit);
             this.users.push(invit);
           });
           //this.invitations.push(invitNap.val());
           return false;
         });
         this.users.sort(function (a, b) {
          return a.date - b.date;
        });
       });
 }

  getUsers(idUser,invitId){
    this.afDatabase.database.ref("/users/"+idUser).once("value",data=>{
      let invit : any = {};
      invit = data.val();
      invit.key = invitId;
      this.users.push(invit);
      console.log(invit);
    });
  }


  acceptInvitation(userId,key){
    let friendRef = this.afDatabase.list('/friends/').push({});
    friendRef.set({
      key: friendRef.key,
      id1: userId,
      id2: this.currentUser.id,
      date: firebase.database.ServerValue.TIMESTAMP
    });

    this.afDatabase.list('/invitations/').remove(key);
    this.users = [];

    
    let displayName;
    this.afDatabase.database.ref("users/"+this.currentUser.id+"/displayName").once("value" , snap =>{
      displayName = snap.val();
      //sending Notification
      let body = {
        "notification":{
          "title":"Invitation accepté",
          "body":displayName+"a accepté votre invitation ",
          "sound":"default",
          "click_action":"FCM_PLUGIN_ACTIVITY",
          "icon":"fcm_push_icon"
        },
        "data":{
          "type":"invitationRecu"
        },
          "to":"/topics/"+userId,
          "priority":"high",
          "restricted_package_name":""
      }
      let options = new HttpHeaders().set('Content-Type','application/json');
      this.http.post("https://fcm.googleapis.com/fcm/send",body,{
        headers: options.set('Authorization', 'key=AAAA96ZF_R0:APA91bFQZUbbPmXhGZp09l_cjxeZVxzt_n-bkMqktzNrzwictuEKsdSOjxVMj9FAb4U2J6Io-2GbSuVO9-4FElsHZGMh7pXbfoIc3wijAPMXN0Eb5YgZZCAgjbfixwwc0smv2hPMp76-'),
      })
        .subscribe();
    })
    
  }

  declineInvitation(key){
    this.afDatabase.list('/invitations/').remove(key);
  }
}
