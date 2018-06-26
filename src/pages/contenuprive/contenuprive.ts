import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import { PubsProvider } from "../../providers/pubs/pubs";

@Component({
  selector: 'page-contenuprive',
  templateUrl: 'contenuprive.html',
})
export class ContenuprivePage {

  currentUser = {} as any;
  publications: any = [];

  constructor(public navCtrl: NavController, public navParams: NavParams,
    private afAuth: AngularFireAuth,
    private afDatabase :AngularFireDatabase,
    private pubsProvider: PubsProvider) {

  }

  ionViewWillEnter(){
    this.afAuth.auth.onAuthStateChanged(user => {
      if(user){
        this.currentUser.id = user.uid;
        this.loadingConseilList();
      }else{
        console.log("Erreur de chargement");
      }
    });
  }

  loadingConseilList(){
    let sConseils = this.afDatabase.list<any>('/contenuprive/'+this.currentUser.id).valueChanges().subscribe(data => {
      console.log(data);
      let i = 0;
      data.forEach(element=>{
        let pub = element ; 
        //retreiving conseil content 
        this.afDatabase.database.ref("/conseils/"+element.conseilId).once("value",conseilSnap=>{
          pub.content = conseilSnap.val().conseilContent;
          pub.conseilCreatorId = conseilSnap.val().conseilCreatorId;
          //retreiving conseil creator display name and avatar
          this.afDatabase.database.ref("/users/"+pub.conseilCreatorId).once("value",userSnap=>{
            pub.userDisplayName = userSnap.val().displayName;
            pub.userAvatar = userSnap.val().imageUrl;
            pub.indice = i;
            i++;
            console.log(pub);
            this.publications.push(pub);
          });
        });
      });
      sConseils.unsubscribe();
    });
  }

  deleteFromContenu(pub){
    this.pubsProvider.deleteFromContenu(this.currentUser.id,pub.conseilId).then(()=>{
      this.publications.splice(pub.indice,1);
    })
  }

}
