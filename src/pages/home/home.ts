import { Component } from '@angular/core';
import { Storage } from '@ionic/storage';
import { NavController , Platform , ModalController , ActionSheetController , LoadingController } from 'ionic-angular';
import { Diagnostic } from '@ionic-native/diagnostic';
import { FCM } from '@ionic-native/fcm';

//for notifications
import { HttpClient } from '@angular/common/http/';
import { HttpHeaders } from '@angular/common/http';
import firebase from 'firebase';

import { TabsPage } from './../tabs/tabs';
import { SearchPage } from './../search/search';
import { LoginPage } from "../login/login";
import { ConseilModalPage } from "../conseil-modal/conseil-modal";
import { PublicationModalPage } from "../publication-modal/publication-modal";
import { AnnonceA0Page } from "../annonce-a0/annonce-a0";
import { AnnonceA3Page } from "../annonce-a3/annonce-a3";
import { AnnonceA2Page } from "../annonce-a2/annonce-a2";
import { AnnonceA1Page } from "../annonce-a1/annonce-a1";
import { CommentsModalPage } from "../comments-modal/comments-modal";
import { OtherprofilePage } from "../otherprofile/otherprofile";
import { PubsProvider } from "../../providers/pubs/pubs";
import { NotificationProvider } from "../../providers/notification/notification";

import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';

import { User } from "../../models/user";
import { UsercrudProvider } from "../../providers/usercrud/usercrud";

import { Geolocation } from '@ionic-native/geolocation';
import { InvitationPage } from '../invitation/invitation';
import { FriendsPage } from '../friends/friends';
import { AnnoncesPage } from '../annonces/annonces';
import { ProfilePage } from '../profile/profile';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  storageRef = firebase.storage().ref();

  pubType : string  = "pub";

  currentUser = {} as any;

  friendList: any;

  myFriends : any;

  pos : any;

  publications: any = [];


  constructor(public navCtrl: NavController,public modalCtrl: ModalController,
    public loadingCtrl: LoadingController,
    public actionSheetCtrl: ActionSheetController,
    private http: HttpClient,
    private storage: Storage,
    private modalController: ModalController,
    private afAuth: AngularFireAuth,
    private afDatabase :AngularFireDatabase,
    private pubsProvider: PubsProvider,
    private userProvider: UsercrudProvider,
    private notificationProvider: NotificationProvider,
    private geolocation: Geolocation,
    private diagnostic: Diagnostic,
    private platform: Platform,
    private fcm: FCM) {

      

      
  }

  ionViewWillEnter(){
    this.afAuth.auth.onAuthStateChanged(user => {
      if(user){
        this.afDatabase.database.ref("/users/"+user.uid).once("value",userSnap => {
          this.currentUser = userSnap.val();
          this.gettingPosition();
          this.subscribeNotification();
          this.loadHome();
        });
      }else{
        console.log("Erreur de chargement");
      }
    });
  }



  //go to search page
  rootSearch(){
    this.navCtrl.push(SearchPage);
  }

  getFriendList(){
    console.log("getting friend list : ");
    this.afDatabase.list<any>("/friends/").valueChanges().subscribe(data => {
      this.myFriends = data;
      console.log("my friends : "+this.myFriends);
      this.friendList = [];
      this.myFriends.forEach(element => {
        console.log("element : "+element);
        console.log("element sender id : "+element.senderId);
        this.afDatabase.object("/users/"+element.senderId).valueChanges().subscribe(data=>{
          this.friendList.push(data);
        });
      });
    });

    this.showFriend();
  }

  showFriend(){
    this.friendList.forEach(element => {
      console.log("elemnt user nchallah : "+element);
      console.log("elemnt user name nchallah : "+element.displayName);
    });
  }

  updateReputation(){
    this.userProvider.updateReputation(this.currentUser.id,5);
  }

  getPosition(){
    console.log(this.pos);
  }

  gettingPosition(){
    this.geolocation.getCurrentPosition().then((resp) => {
      console.log("---------------",this.currentUser.id,"////////////////////");
      console.log("access position given");
      console.log(resp);
      let values = {
        latitude: resp.coords.latitude,
        longitude: resp.coords.longitude
      }
      this.userProvider.updateUserPosition(this.currentUser.id,values);
      this.pos = resp;
     }).catch((error) => {
       this.navCtrl.pop();
       console.log('Error getting location', error);
              
     });
  }

  openConseilModal(){
    let thisModal = this.modalCtrl.create(ConseilModalPage, {"currentUserId":this.currentUser.id});
    thisModal.present();
  }

  openPublicationModal(){
    let thisModal = this.modalCtrl.create(PublicationModalPage,{"currentUserId":this.currentUser.id});
    thisModal.present();
  }

  loadHome(){
    //loading conseil
    this.afDatabase.database.ref("/conseils/").once("value", snapshot=>{
      snapshot.forEach(item => {
        let pub = item.val();
        // verify if friends
        let sVerifFriends = this.afDatabase.list<any>("/friends/").valueChanges().subscribe(data =>{
        data.forEach(element => {
          if((element.id1 == this.currentUser.id && element.id2 == pub.conseilCreatorId) || (element.id2 == this.currentUser.id && element.id1 == pub.conseilCreatorId)){          
            //getting user avatar url and display name and reputation
            pub.order = "conseil";
            let d = new Date(pub.date);
            pub.time = d.getDate()+"/"+d.getMonth().toString()+"/"+d.getFullYear() +" -"+d.getHours() +":"+d.getMinutes() ;
            pub.liked = false ;
            pub.myComment ="";
            this.isLiked(pub);
            this.afDatabase.database.ref('/users/'+pub.conseilCreatorId).once("value",userSnap=>{
              pub.userAvatar = userSnap.val().imageUrl;
              pub.userDisplayName = userSnap.val().displayName;
              pub.userReputation = userSnap.val().reputation;
            });
              this.publications.push(pub);
              //sorting final array by date
              this.publications.sort((a,b)=>{
                return b.date-a.date;
              });
          }
        });
        sVerifFriends.unsubscribe();
      });
        return false;
      })
    });
    //laoding publication
    this.afDatabase.database.ref("/publications/").once("value", snapshot=>{
      snapshot.forEach(item => {
        let pub = item.val();
        // verify if friends
        let sVerifFriends = this.afDatabase.list<any>("/friends/").valueChanges().subscribe(data =>{
        data.forEach(element => {
          if((element.id1 == this.currentUser.id && element.id2 == pub.creatorId) || (element.id2 == this.currentUser.id && element.id1 == pub.creatorId)){          
            //getting user avatar url and display name and reputation
            pub.order = "publication";
            pub.liked = false ;
            let d = new Date(pub.date);
            pub.time = d.getDate()+"/"+d.getMonth().toString()+"/"+d.getFullYear() +" -"+d.getHours() +":"+d.getMinutes() ;
            pub.myComment ="";
            //this.isLiked(pub);
            this.afDatabase.database.ref('/users/'+pub.creatorId).once("value",userSnap=>{
              pub.userAvatar = userSnap.val().imageUrl;
              pub.userDisplayName = userSnap.val().displayName;
              pub.userReputation = userSnap.val().reputation;
            });
            // getting publication images
            if(pub.nbimage>0){
              pub.imagesUrl = [];/**/
              for( let i = 0 ; i <pub.nbimage ; i++){
                this.storageRef.child("publicationsimages/"+pub.key+"/"+i+".jpg").getDownloadURL().then(res => {
                  pub.imagesUrl.push(res);
                }); 
              }
            }
            this.publications.push(pub);
            //sorting final array by date
            this.publications.sort((a,b)=>{
              return b.date-a.date;
            });
          }
        });
        sVerifFriends.unsubscribe();
      });
        return false;
      })
    });
    //loading annonce
    this.afDatabase.database.ref("/annonces/").once("value", snapshot=>{
      snapshot.forEach(item => {
        let pub = item.val();
        // verify if friends
        let sVerifFriends = this.afDatabase.list<any>("/friends/").valueChanges().subscribe(data =>{
        data.forEach(element => {
          if((element.id1 == this.currentUser.id && element.id2 == pub.creatorAnnonceId) || (element.id2 == this.currentUser.id && element.id1 == pub.creatorAnnonceId)){          
            //getting user avatar url and display name and reputation
            pub.order = "annonce";
            pub.liked = false ;
            let d = new Date(pub.date);
            pub.time = d.getDate()+"/"+d.getMonth().toString()+"/"+d.getFullYear() +" -"+d.getHours() +":"+d.getMinutes() ;
            pub.myComment ="";
            //this.isLiked(pub);
            this.afDatabase.database.ref('/users/'+pub.creatorAnnonceId).once("value",userSnap=>{
              pub.userAvatar = userSnap.val().imageUrl;
              pub.userDisplayName = userSnap.val().displayName;
              pub.userReputation = userSnap.val().reputation;
            });
            // getting annonce images
            if(pub.nbimage>0){
              pub.imagesUrl = [];/**/
              for( let i = 0 ; i <pub.nbimage ; i++){
                this.storageRef.child("annoncesimages/"+pub.idAnnonce+"/"+i+".jpg").getDownloadURL().then(res => {
                  pub.imagesUrl.push(res);
                }); 
              }
            }
            this.publications.push(pub);
            //sorting final array by date
            this.publications.sort((a,b)=>{
              return b.date-a.date;
            });
          }
        });
        sVerifFriends.unsubscribe();
      });
        return false;
      })
    });
    
  }

  sendNotification(){
    let body = {
      "notification":{
        "title":"New Notification has arrived",
        "body":"Notification Body",
        "sound":"default",
        "click_action":"FCM_PLUGIN_ACTIVITY",
        "icon":"fcm_push_icon"
      },
      "data":{
        "param1":"value1",
        "param2":"value2"
      },
        "to":"/topics/matchday",
        "priority":"high",
        "restricted_package_name":""
    }
    let options = new HttpHeaders().set('Content-Type','application/json');
    this.http.post("https://fcm.googleapis.com/fcm/send",body,{
      headers: options.set('Authorization', 'key=AAAA96ZF_R0:APA91bFQZUbbPmXhGZp09l_cjxeZVxzt_n-bkMqktzNrzwictuEKsdSOjxVMj9FAb4U2J6Io-2GbSuVO9-4FElsHZGMh7pXbfoIc3wijAPMXN0Eb5YgZZCAgjbfixwwc0smv2hPMp76-'),
    })
      .subscribe();
  }

  goToA0(){
    this.diagnostic.isLocationEnabled().then(res=>{
      if(res==true){
        this.navCtrl.push(AnnonceA0Page);
      }else{
        alert("Veuillez activez votre gps");
      }

    });
    //this.navCtrl.push(AnnonceA0Page);
  }

  goToA1(){
    this.diagnostic.isLocationEnabled().then(res=>{
      if(res==true){
        this.navCtrl.push(AnnonceA1Page);
      }else{
        alert("Veuillez activez votre gps");
      }

    });
    //this.navCtrl.push(AnnonceA1Page);
    
  }

  goToA2(){
    this.diagnostic.isLocationEnabled().then(res=>{
      if(res==true){
        this.navCtrl.push(AnnonceA2Page);
      }else{
        alert("Veuillez activez votre gps");
      }

    });
    // this.navCtrl.push(AnnonceA2Page);
    
  }

  goToA3(){
    this.diagnostic.isLocationEnabled().then(res=>{
      if(res==true){
        this.navCtrl.push(AnnonceA3Page);
      }else{
        alert("Veuillez activez votre gps");
      }

    });

    //this.navCtrl.push(AnnonceA3Page);
    
  }

  isLiked(pub){

    if(pub.order == "annonce"){
      let sLikes = this.afDatabase.list<any>("/annonces/"+pub.idAnnonce+"/likes/"+this.currentUser.id).valueChanges().subscribe(data =>{
        console.log(data.length);
        if(data.length == 1){
          pub.liked = true;
          console.log(pub.liked);
        }else{
          pub.liked = false;
          console.log(pub.liked);
        }
        sLikes.unsubscribe();
      });
    }else if(pub.order == "publication"){
      let sLikes = this.afDatabase.list<any>("/publications/"+pub.key+"/likes/"+this.currentUser.id).valueChanges().subscribe(data =>{
        console.log(data.length);
        if(data.length == 1){
          pub.liked = true;
          console.log(pub.liked);
        }else{
          pub.liked = false;
          console.log(pub.liked);
        }
        sLikes.unsubscribe();
      });
    }else if (pub.order == "conseil"){
      let sLikes = this.afDatabase.list<any>("/conseils/"+pub.conseilId+"/likes/"+this.currentUser.id).valueChanges().subscribe(data =>{
        console.log(data.length);
        if(data.length == 1){
          pub.liked = true;
        }else{
          pub.liked = false;
        }
        sLikes.unsubscribe();
      });
    }
  }

  likePub(pub){

    pub.liked = true;
    this.pubsProvider.likePub(pub,this.currentUser.id);
  }

  dislikePub(pub) {
    pub.liked = false;
    this.pubsProvider.dislikePub(pub,this.currentUser.id);
  }

  commenter(pub){
    this.pubsProvider.commenterPub(pub,this.currentUser.id);
  }

  openCommentsModal(pub){
    if(pub.order == "annonce"){
      let commentsModalPage = this.modalController.create(CommentsModalPage, {
        "order": "annonce",
        "idAnnonce": pub.idAnnonce,
        "titleAnnonce": pub.titleAnnonce
      }).present();

    }else if(pub.order == "publication"){
      let commentsModalPage = this.modalController.create(CommentsModalPage, {
        "order": "publication",
        "idAnnonce": pub.key
      }).present();

    }else if(pub.order == "conseil"){
      let commentsModalPage = this.modalController.create(CommentsModalPage, {
        "order": "conseil",
        "idAnnonce": pub.conseilId
      }).present();
    }
    
  }

  goToUserProfile(userId){
    let otherProfileModal = this.modalCtrl.create(OtherprofilePage, 
      { 
        "currentUserId": this.currentUser.id,
        "userId": userId,
        "relationStatus": 1
      });
      otherProfileModal.present();
  }

  addToContenuPrive(conseilId){
    let loading = this.loadingCtrl.create({
      spinner: 'hide',
      content: 'Conseil ajouté a votre contenu privé'
    });
  
    this.pubsProvider.addToContenuPrive(conseilId,this.currentUser.id).then(()=>{
      loading.present();
      setTimeout(() => {
        loading.dismiss();
      }, 750);
    });
  }

  showMoreConseil(pub){
    let actionSheet = this.actionSheetCtrl.create({
      buttons: [
        {
          text: 'Ajouter au contenu privé',
          handler: () => {
            this.addToContenuPrive(pub.conseilId);
          }
        }
      ]
    });
 
    actionSheet.present();
  }

  sendNotifFromProvider(){
    //this.notificationProvider.sendNotification(this.currentUser.id);
  }

  subscribeNotification(){
    //Notifications
    if(this.platform.is("cordova")){
     this.fcm.subscribeToTopic(this.currentUser.id);
     this.fcm.getToken().then(token=>{
         console.log(token);
     })
     this.fcm.onNotification().subscribe(data=>{
       if(data.wasTapped){

         if(data.type == "invitation"){
           this.navCtrl.setRoot(InvitationPage);
         }else if(data.type == "invitationRecu"){
           this.navCtrl.setRoot(FriendsPage);
         }else if(data.type == "annonce"){
          this.navCtrl.setRoot(AnnoncesPage);
         }else if(data.type == "annonceComment"){
          this.navCtrl.setRoot(ProfilePage);
         }

       } else {
         console.log("Received in foreground");
       };
     })
     this.fcm.onTokenRefresh().subscribe(token=>{
       console.log(token);
     });
   }else{
     console.log("platform is browser !! ");
   }
   
   //end notifications. 
  }
 

  verifChamps(val){

    if ((val && val.trim() != '') ){
      return true;
    }else{
      return false
    }
   }

   
}
