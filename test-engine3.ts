import { search as openalex } from "./src/sources/openalex.ts";

const q = "\"qris\" AND \"gen z\"";
async function run() {
  const res = await openalex(q, undefined, undefined, 0, 5);
  console.log("OpenAlex Hits:", res.papers.length);
  if (res.papers.length > 0) {
    console.log("Top 1 Title:", res.papers[0].title);
  } else {
    console.log("Error:", res.error);
  }
}
run();
