import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams , ViewController , ModalController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { OtherprofilePage } from '../otherprofile/otherprofile';

@Component({
  selector: 'page-comments-modal',
  templateUrl: 'comments-modal.html',
})
export class CommentsModalPage {

  idAnnonce: string;
  titleAnnonce: string;
  comments: any = [];
  sComments : any;
  order: string;
  currentUserId: any;



  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afDatabase :AngularFireDatabase,
    private afAuth: AngularFireAuth,
    public modalCtrl: ModalController,
    public viewController: ViewController) {


      this.currentUserId = this.afAuth.auth.currentUser.uid;
      this.order = this.navParams.get("order");
      console.log("order : ",this.order);
      this.idAnnonce = this.navParams.get("idAnnonce");
      console.log("id annonce : ",this.idAnnonce);
      this.titleAnnonce = this.navParams.get("titleAnnonce");
      console.log("titleAnnonce : ",this.titleAnnonce);
      this.loadComments();
  }

  loadComments() {
    console.log('ionViewDidLoad CommentsModalPage');
    if(this.order == "annonce"){
      this.sComments = this.afDatabase.list<any>("/annonces/"+this.idAnnonce+"/comments")
      .valueChanges().subscribe(data => {
        this.comments = [];
        console.log("all data :");
        console.log(data);
        data.forEach(element => {  
          let comment = element;
          console.log("comment");
          console.log(comment);

          this.afDatabase.database.ref("/users/"+comment.userId).once("value",snap => {
            comment.displayName = snap.val().displayName;
            comment.avaterUrl = snap.val().imageUrl;
            console.log(comment);
            this.comments.push(comment);
          });

        });
        this.comments.sort((a,b)=>{
          return b.date - a.date;
        });
      });
    }else if (this.order == "publication"){
      this.sComments = this.afDatabase.list<any>("/publications/"+this.idAnnonce+"/comments")
      .valueChanges().subscribe(data => {
        this.comments = [];
        console.log("all data :");
        console.log(data);
        data.forEach(element => {  
          let comment = element;
          console.log("comment");
          console.log(comment);

          this.afDatabase.database.ref("/users/"+comment.userId).once("value",snap => {
            comment.displayName = snap.val().displayName;
            comment.avaterUrl = snap.val().imageUrl;
            console.log(comment);
            this.comments.push(comment);
          });

        });
        this.comments.sort((a,b)=>{
          return b.date - a.date;
        });
      });
    }else if (this.order == "conseil"){
      this.sComments = this.afDatabase.list<any>("/conseils/"+this.idAnnonce+"/comments")
      .valueChanges().subscribe(data => {
        this.comments = [];
        console.log("all data :");
        console.log(data);
        data.forEach(element => {  
          let comment = element;
          console.log("comment");
          console.log(comment);

          this.afDatabase.database.ref("/users/"+comment.userId).once("value",snap => {
            comment.displayName = snap.val().displayName;
            comment.avaterUrl = snap.val().imageUrl;
            console.log(comment);
            this.comments.push(comment);
          });

        });
        this.comments.sort((a,b)=>{
          return b.date - a.date;
        });
      });
    }
    
  }

  dismissModal(){
    this.sComments.unsubscribe();
    this.viewController.dismiss();
  }

  goToUserprofile(userId){
    let sVerifFriends = this.afDatabase.list<any>("/friends/").valueChanges().subscribe(data =>{
      let relationState = 0;
      data.forEach(element => {
        if((element.id1 == this.currentUserId && element.id2 == userId) || (element.id2 == this.currentUserId && element.id1 == userId)){
          relationState = 1;
          let otherProfileModal = this.modalCtrl.create(OtherprofilePage, 
            { 
              "currentUserId": this.currentUserId,
              "userId": userId,
              "relationStatus": 1
            });
            otherProfileModal.present();
        }
      })
      if(relationState != 1){
        relationState = 0;
        let otherProfileModal = this.modalCtrl.create(OtherprofilePage, 
          { 
            "currentUserId": this.currentUserId,
            "userId": userId,
            "relationStatus": 0
          });
          otherProfileModal.present();
      }
      sVerifFriends.unsubscribe();
    });
  }

}
