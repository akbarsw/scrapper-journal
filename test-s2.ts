import { search as semantic } from "./src/sources/semantic.ts";

async function run() {
  const query = "Kepercayaan Loyalitas Anggota Volume Pasokan Susu Sapi Perah";
  const res = await semantic(query, undefined, undefined, 0, 10);
  console.log(`Semantic hits: ${res.papers.length}`);
  if(res.papers.length > 0) {
    console.log(`Title 1: ${res.papers[0].title}`);
  }
}
run();
