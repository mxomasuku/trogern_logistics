import * as v2 from "firebase-functions/v2";
import * as v1 from "firebase-functions/v1";

export const helloWord = v2.https.onRequest((request, response) => {
type Indexable = {[key: string] : string};
const name = request.params[0].replace("/", "");
const items: Indexable = {lamp: "This is a lamp", chair: "Good chair"};

const message = items[name];

response.send(`<h1>${message}</h1>`);
});

type Sku = {name: string; usd: number; eur?: number};
const USD_TO_UER0 = 0.93;
export const createMonthlySummaries = v1.firestore.document('items/{sku}').onCreate(
    snapshot => {
        const data = snapshot.data() as Sku;
        const eur = data.usd * USD_TO_UER0;
   return snapshot.ref.set({eur, ...data}, {merge: true});
    }
)
