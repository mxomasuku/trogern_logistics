import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {

  apiKey: "AIzaSyCoA09Gl4YxyXIlQj8JvoAN2sACJSOwAeY",

  authDomain: "trogern-logistics.firebaseapp.com",

  projectId: "trogern-logistics",

  storageBucket: "trogern-logistics.firebasestorage.app",

  messagingSenderId: "357863085137",

  appId: "1:357863085137:web:46d08368df97f577e81470",

  measurementId: "G-P1JZGQDZH2"

};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };