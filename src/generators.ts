import { LevelGenerator } from './generators';
import { Pos, Rect, dirX, dirY, DIR, dirArray, inverseDir, Size, weightedRandomFromArray } from './utils';
import { TileInfo, WallTile,  FloorTile, StairsDownTile } from './tiles';
import {Door} from './terrainentities'
import { Muncher } from "./enemies";
import { MapAccessor } from './mapaccessor';

enum DoorType {
    normal,
    locked
}

interface DoorInfo {
    dir: DIR
    type: DoorType
    dstRoomIdx:number
    corrIdx? : number
}

export interface RoomInfo {
    pos: Pos
    mrect: Rect
    explored?:boolean
    doors: DoorInfo[]
}

export function isNextToExplored(room: RoomInfo, rooms:RoomInfo[]) {
    return room.doors.some(d=>rooms[d.dstRoomIdx].explored)
}


export interface LevelGenerator {
    generate(m: MapAccessor): void;
}

const roomSize = 31
const gapSize = 4

interface ConnInfo {
    fromRoomIdx: number
    pos: Pos
    dir: DIR
    weight: number
}

const depthToRoomsCount = [
    7, 9, 12, 15, 18
]



export class RoomsGenerator implements LevelGenerator {
    depth: number;
    m: MapAccessor;
    rooms: RoomInfo[]

    constructor(depth: number) {
        this.depth = depth
        this.rooms = []
    }

    fixWallConn() {
        let m = this.m;
        for (let it = m.mapRect.getIterator(); it.next();) {
            let ti = m.mapPGet(it.value);
            if (!ti || !((ti.tile instanceof WallTile) || (ti.alwaysVis))) {
                continue;
            }
            for (let i = 0; i < 4; ++i) {
                let n = m.mapGet(it.value.x + dirX[i], it.value.y + dirY[i]);
                if (n && ((n.tile instanceof WallTile) || (n.alwaysVis))) {
                    ti.conn[i] = true;
                }
            }
        }
    }

    generate(m: MapAccessor) {
        this.m = m
        let roomsCount = depthToRoomsCount[this.depth - 1]
        let rooms = this.rooms
        rooms.push({ pos: new Pos(0, 0), doors: [], mrect: new Rect(new Pos(), new Size(roomSize, roomSize))})

        let pconns: ConnInfo[] = []

        for (let i = 0; i < 4; ++i) {
            pconns.push({ fromRoomIdx: 0, pos: new Pos(dirX[i], dirY[i]), dir: dirArray[i], weight: 100 })
        }

        while (rooms.length < roomsCount) {
            let newConn = weightedRandomFromArray(pconns, ci => ci.weight)
            newConn.weight = 0
            for (let conn of pconns) {
                if (conn.fromRoomIdx == newConn.fromRoomIdx) {
                    if (conn.weight != 0) conn.weight -= 25
                }
            }
            let newRoomIdx = rooms.length
            rooms[newConn.fromRoomIdx].doors.push({ dir: newConn.dir, type: DoorType.normal, dstRoomIdx:newRoomIdx })
            console.log(`adding room at pos:${newConn.pos.x}, ${newConn.pos.y}`)
            rooms.push({ pos: newConn.pos.clone(),
                         doors: [{ dir: inverseDir[newConn.dir], type: DoorType.normal, dstRoomIdx:newConn.fromRoomIdx }],
                         mrect: new Rect(newConn.pos.clone().mul(roomSize + gapSize), new Size(roomSize, roomSize)) })
            for (let i = 0; i < 4; ++i) {
                let newPos = new Pos(newConn.pos.x + dirX[i], newConn.pos.y + dirY[i])
                if (pconns.find(ci => ci.pos.isEqual(newPos)) || rooms.find(r=>r.pos.isEqual(newPos))) {
                    continue
                }
                pconns.push({ fromRoomIdx: newRoomIdx, pos: newPos, dir: dirArray[i], weight: 100 })
            }
        }
        let idx = 0
        for (let r of rooms) {
            let roomRect = r.mrect;//new Rect(r.pos.clone().mul(roomSize + gapSize), new Size(roomSize, roomSize))
            let iter = roomRect.getIterator()
            while (iter.next()) {
                let ti: TileInfo
                if (roomRect.isStrictlyInside(iter.value)) {
                    ti = m.mapPSet(iter.value, new FloorTile())
                }
                else {
                    ti = m.mapPSet(iter.value, new WallTile())
                }
                ti.roomIdx = idx
            }
            ++idx
        }
        for(let i = 0; i<rooms.length;++i) {
            console.log(`doors for room ${i}:`, rooms[i].doors)
        }

        for (let r of rooms) {
            let roomRect = new Rect(r.pos.clone().mul(roomSize + gapSize), new Size(roomSize, roomSize))
            for (let d of r.doors) {
                d.corrIdx = idx
                let pos: Pos;
                let off: Pos;
                let dir = dirArray[d.dir]
                switch (d.dir) {
                    case DIR.t: pos = roomRect.pos.clone().add(Math.floor(roomSize / 2), 0); off = new Pos(-1, 0); break;
                    case DIR.b: pos = roomRect.pos.clone().add(Math.floor(roomSize / 2), roomSize - 1); off = new Pos(-1, 0); break;
                    case DIR.l: pos = roomRect.pos.clone().add(0, Math.floor(roomSize / 2)); off = new Pos(0, -1); break;
                    case DIR.r: pos = roomRect.pos.clone().add(roomSize - 1, Math.floor(roomSize / 2)); off = new Pos(0, -1); break;
                }
                let ti = m.mapGet(pos.x + dirX[dir] * 2, pos.y + dirY[dir] * 2)
                if (!ti) {

                    for (let i = 0; i <= gapSize + 1; ++i) {
                        let endCap = i == 0 || i == gapSize + 1
                        let ti = m.mapPSet(pos,new FloorTile())
                        ti.roomIdx = idx
                        ti.alwaysVis = endCap

                        if (endCap) {
                            let door = new Door(d.dir==DIR.l || d.dir==DIR.r, false)
                            ti.addEntity(door)
                        }
                        ti = m.mapPSet(pos.clone().add(off), new WallTile())
                        ti.alwaysVis = endCap
                        ti.roomIdx = idx
                        ti = m.mapPSet(pos.clone().sub(off), new WallTile())
                        ti.alwaysVis = endCap
                        ti.roomIdx = idx
                        pos.add(dirX[dir], dirY[dir])
                    }
                    ++idx
                }
                else {
                    d.corrIdx = ti.roomIdx
                }
            }
        }

        m.mapGet(5, 5).tile=new StairsDownTile()


        for(let i = 1; i<rooms.length;++i) {
            for(let x=1;x<=2;++x) {
                for(let y=1;y<=2;++y) {
                    let r = rooms[i].mrect
                    let pos = r.pos.clone().add(r.size.width*x/3, r.size.height*y/3)
                    let ti = m.mapPGet(pos)
                    ti.addEntity(new Muncher)
                }
            }
        }

        this.fixWallConn()
        for (let it = m.mapRect.getIterator(); it.next();) {
            let ti = m.mapPGet(it.value);
            if (ti && ti.tile) {
                ti.update();
            }
        }

        m.setEntrance(new Pos(Math.floor(roomSize / 2), Math.floor(roomSize / 2)))
        m.setRoomsInfo(this.rooms)
    }
}