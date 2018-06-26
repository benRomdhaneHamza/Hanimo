import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { UsercrudProvider } from "../usercrud/usercrud";
import firebase from 'firebase';

@Injectable()
export class PubsProvider {

  constructor(public http: HttpClient,
    private afDatabase: AngularFireDatabase,
    private usercrudProvider: UsercrudProvider) {
    console.log('Hello PubsProvider Provider');
  }

  addConseil(conseil: any){
    const ref = this.afDatabase.database.ref('/conseils/').push({});
    console.log("conseil from provider : ");
    console.log(conseil);
    ref.set({
      conseilId : ref.key,
      conseilCreatorId : conseil.conseilCreatorId,
      conseilContent: conseil.content,
      date: firebase.database.ServerValue.TIMESTAMP
    });
    this.usercrudProvider.updateReputation(conseil.conseilCreatorId,3);

  }

  addPublication(publication: any,captureData: any){
    let newRef = this.afDatabase.list("/publications/").push({});
    publication.key = newRef.key;
    newRef.set(publication).then(()=>{
      this.usercrudProvider.updateReputation(publication.creatorId,1);
      for (let index = 0; index < captureData.length; index++) {
        console.log("captureData[index] : ");
        console.log(captureData[index]);
        this.uploadImagePublication(captureData[index],publication.key,index).then(()=>{index++;});    
      }
    });
  }

  async uploadImagePublication(captureDataUrl,idPublication,i){
    let storageRef = await firebase.storage().ref("publicationsimages/"+idPublication+"/");

    const filename = i+".jpg";
    const imageRef = storageRef.child(filename);

    await imageRef.putString(captureDataUrl, firebase.storage.StringFormat.DATA_URL).then(snap=>{
      console.log("image added : "+snap);
      console.log(snap);
    });

  }

  likePub(pub,currentUserId){

    if(pub.order == "annonce"){
      this.afDatabase.list('/annonces/'+pub.idAnnonce+'/likes/').set(currentUserId,{
        userId: currentUserId
      });
      this.usercrudProvider.updateReputation(pub.creatorAnnonceId,2);
      this.usercrudProvider.updateReputation(currentUserId,2);
    }else if (pub.order == "publication"){
      this.afDatabase.list('/publications/'+pub.key+'/likes/').set(currentUserId,{
        userId: currentUserId
      });
    }else if (pub.order == "conseil"){
      this.afDatabase.list('/conseils/'+pub.conseilId+'/likes/').set(currentUserId,{
        userId: currentUserId
      });
    }

  }

  dislikePub(pub,currentUserId) {

    if(pub.order == "annonce"){
      this.afDatabase.list('/annonces/'+pub.idAnnonce+'/likes/'+currentUserId).remove();
      this.usercrudProvider.updateReputation(pub.creatorAnnonceId,-2);
      this.usercrudProvider.updateReputation(currentUserId,-2);
    }else if (pub.order == "publication"){
      this.afDatabase.list('/publications/'+pub.key+'/likes/'+currentUserId).remove();
    }else if (pub.order == "conseil"){
      this.afDatabase.list('/conseils/'+pub.conseilId+'/likes/'+currentUserId).remove();
    }

  }

  commenterPub(pub,currentUserId){
    if(pub.order == "annonce"){
      let newRef = this.afDatabase.list('/annonces/'+pub.idAnnonce+'/comments/').push({});
      newRef.set({
        commentKey: newRef.key,
        userId: currentUserId,
        commentContent: pub.myComment,
        date: firebase.database.ServerValue.TIMESTAMP
      }).then(()=>{
        this.usercrudProvider.updateReputation(pub.creatorAnnonceId,2);
        this.usercrudProvider.updateReputation(currentUserId,2);
        pub.myComment = "";
      });
      
    }else if(pub.order == "publication"){
      let newRef = this.afDatabase.list('/publications/'+pub.key+'/comments/').push({});
      newRef.set({
        commentKey: newRef.key,
        userId: currentUserId,
        commentContent: pub.myComment,
        date: firebase.database.ServerValue.TIMESTAMP
      }).then(()=>{pub.myComment = "";});

    }else if(pub.order == "conseil"){
      let newRef = this.afDatabase.list('/conseils/'+pub.conseilId+'/comments/').push({});
      newRef.set({
        commentKey: newRef.key,
        userId: currentUserId,
        commentContent: pub.myComment,
        date: firebase.database.ServerValue.TIMESTAMP
      }).then(()=>{pub.myComment = "";});
    }

  }

  async addToContenuPrive(conseilId,userId){
    let object = {
      conseilId: conseilId,
      date: firebase.database.ServerValue.TIMESTAMP
    }

    this.afDatabase.list('/contenuprive/'+userId).set(conseilId,object);
  }

  async deleteFromContenu(userId,pubId){
    await this.afDatabase.database.ref("/contenuprive/"+userId+"/"+pubId).remove();
  }

}
