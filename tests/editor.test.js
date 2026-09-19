import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newRoom,
  exampleRoom,
  validate,
  collision,
  parseRoom,
  placeAsset,
} from "../src/editor/model.js";
test("starter rooms have connected floor and valid entrances", () => {
  for (const name of ["Reading room", "Treasure room", "Encounter room"]) {
    const r = exampleRoom(name);
    assert.deepEqual(validate(r), []);
    assert.deepEqual(parseRoom(JSON.stringify(r)), r);
  }
});
test("editor respects furniture footprints, wall faces and tabletop support", () => {
  const r = newRoom();
  assert.ok(placeAsset(r, "Table Long.png", 6, 7));
  assert.equal(collision(r)[7][7], 0);
  assert.equal(placeAsset(r, "Coffin.png", 7, 7), false);
  assert.equal(placeAsset(r, "Coffin.png", 6, 13), false);
  assert.ok(placeAsset(r, "Book Red.png", 6, 7));
  assert.equal(r.props.at(-1).offsetY, -6);
  assert.ok(placeAsset(r, "Wall Chain 01.png", 7, 3));
  assert.equal(placeAsset(r, "Wall Chain 01.png", 7, 6), false);
  assert.deepEqual(parseRoom(JSON.stringify(r)), r);
});
test("editor checks isolated floors and invalid entrances and rejects malformed files", () => {
  const r = newRoom();
  r.markers.push({ kind: "entrance", x: 8, y: 8 });
  assert.ok(validate(r).some((s) => s.includes("edge")));
  r.terrain[2][2] = 1;
  assert.ok(validate(r).some((s) => s.includes("reached")));
  assert.throws(() => parseRoom("{}"));
  r.props.push({ file: "missing.png", x: 5, y: 5 });
  assert.throws(() => parseRoom(JSON.stringify(r)));
});

test("void and acid are blocked but bridges reconnect floor, and carpets support furniture", () => {
  const r = exampleRoom("Encounter room");
  r.props = [];
  for (let y = 4; y <= 13; y++)
    for (let x = 8; x <= 9; x++) r.terrain[y][x] = -1;
  assert.equal(collision(r)[8][8], 0);
  assert.ok(validate(r).some((s) => s.includes("reached")));
  assert.ok(placeAsset(r, "Bridge horizontal.png", 8, 8));
  assert.equal(collision(r)[8][8], 1);
  assert.ok(!validate(r).some((s) => s.includes("reached")));
  assert.ok(placeAsset(r, "Acid pool square.png", 5, 5));
  assert.equal(collision(r)[5][5], 0);
  assert.ok(placeAsset(r, "Bridge horizontal.png", 5, 5));
  assert.equal(collision(r)[5][5], 1);
  assert.ok(placeAsset(r, "Carpet horizontal plain.png", 10, 10));
  assert.ok(placeAsset(r, "Table Long.png", 10, 10));
  assert.ok(placeAsset(r, "Pillar 4.png", 4, 9));
  assert.equal(collision(r)[9][4], 0);
  assert.deepEqual(parseRoom(JSON.stringify(r)), r);
});

test('doorways open wall tiles on every side and survive export',async()=>{
 const {doorwayPosition,roomSprites}=await import('../src/editor/model.js');
 const r=newRoom();
 for(const [x,y] of [[8,3],[8,14],[3,8],[14,8]]) {
  assert.deepEqual(doorwayPosition(r,x,y),{x,y});
  r.markers.push({kind:'entrance',x,y});
  assert.equal(collision(r)[y][x],1);
  assert.ok(!roomSprites(r).some(s=>s.x===x&&s.y===y&&s.layer==='wall'));
 }
 assert.deepEqual(doorwayPosition(r,8,2),{x:8,y:3});
 assert.equal(doorwayPosition(r,1,1),null);
 assert.deepEqual(validate(r),[]);
 assert.deepEqual(parseRoom(JSON.stringify(r)),r);
 r.markers=[];assert.equal(collision(r)[3][8],0);
});

test('stairs split into independent halves and raised edges block walking',()=>{
 const r=newRoom();
 assert.ok(placeAsset(r,'Stairs low left.png',4,6));
 assert.ok(placeAsset(r,'Stairs low right.png',12,6));
 for(let x=6;x<12;x++)assert.ok(placeAsset(r,'Raised wall middle.png',x,9));
 assert.equal(collision(r)[9][8],0);
 assert.equal(collision(r)[9][4],1);
 const old=newRoom();old.props=[{file:'Stairs left.png',x:5,y:5}];
 const loaded=parseRoom(JSON.stringify(old));
 assert.deepEqual(loaded.props.map(p=>[p.file,p.x]),[['Stairs low left.png',5],['Stairs low right.png',7]]);
});

test('wall bottoms stand on void and suppress automatic wall tops',async()=>{
 const {roomSprites}=await import('../src/editor/model.js');
 const r=newRoom();r.terrain[10][8]=-1;
 assert.ok(placeAsset(r,'Rounded wall bottom left.png',8,10));
 assert.equal(collision(r)[10][8],0);
 assert.ok(!roomSprites(r).some(p=>p.x===8&&p.y===10));
 assert.deepEqual(parseRoom(JSON.stringify(r)),r);
});

test('door assets cut full-width wall openings and removal restores collision',async()=>{
 const {connections}=await import('../src/editor/model.js');
 const r=newRoom();
 assert.ok(placeAsset(r,'Door Closed.png',8,2));
 assert.deepEqual(connections(r).map(p=>[p.x,p.y]),[[8,3],[9,3]]);
 assert.equal(collision(r)[3][8],1);assert.equal(collision(r)[3][9],1);
 assert.deepEqual(validate(r),[]);
 assert.deepEqual(parseRoom(JSON.stringify(r)),r);
 assert.equal(placeAsset(r,'Iron Door.png',1,1),false);
 r.props=[];assert.equal(collision(r)[3][8],0);
});

test('terrain edits preserve independent asset and marker layers through reload',()=>{
 const r=newRoom();
 placeAsset(r,'Stairs small left.png',6,6);
 placeAsset(r,'Vase Yellow.png',10,10);
 r.markers.push({kind:'enemy',x:11,y:11});
 for(const [x,y] of [[6,6],[6,7],[10,10],[11,11]])r.terrain[y][x]=-1;
 const loaded=parseRoom(JSON.stringify(r));
 assert.deepEqual(loaded,r);
 assert.equal(collision(loaded)[6][6],1);
 assert.equal(collision(loaded)[7][6],1);
 assert.equal(collision(loaded)[11][11],0);
 assert.ok(validate(loaded).some(s=>s.includes('enemy')));
});
