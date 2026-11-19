import sharp from 'sharp';
import { join } from 'node:path';
const root='/Users/gaurav/open_world_horror_island_game/artifacts/critique/round-02/captures';
const out='/Users/gaurav/open_world_horror_island_game/artifacts/critique/round-02';
const spots=['beach','jungle','waterfall','village','cliffs','lighthouse'];
const conditions=['sunrise','noon','sunset','night','rain'];
for(const spot of spots){
 const parts=[];
 for(let i=0;i<conditions.length;i++){
  const c=conditions[i];
  const image=await sharp(join(root,`${spot}_${c}.jpg`)).resize(384,216,{fit:'cover'}).jpeg({quality:84}).toBuffer();
  const label=Buffer.from(`<svg width="384" height="26"><rect width="100%" height="100%" fill="#101714"/><text x="12" y="18" fill="#e8e5dc" font-family="Arial" font-size="12">${spot.toUpperCase()} · ${c.toUpperCase()}</text></svg>`);
  parts.push({input:label,left:i*384,top:0},{input:image,left:i*384,top:26});
 }
 await sharp({create:{width:1920,height:242,channels:3,background:'#101714'}}).composite(parts).jpeg({quality:88}).toFile(join(out,`contact-${spot}.jpg`));
}
