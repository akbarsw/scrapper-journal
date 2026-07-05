import { searchAll } from "./src/sources/engine.ts";

async function run() {
  const res = await searchAll({
    vars: "gen z penggunaan qris",
    limit: 10,
    lang: "both",
    scopus: false
  });
  console.log("Total Papers Akhir:", res.total);
  if (res.total > 0) {
    console.log("Top 1:", res.papers[0].title);
  } else {
    console.log("Sumber:", res.sources);
  }
}
run();
