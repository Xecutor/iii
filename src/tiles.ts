import { TileManager } from './tilemanager';
import { FwdAndBackAnimation } from './animation';
import { uiManager } from './uimanager';
import { MapAccessor } from "./mapaccessor";
import { Pos, DIR } from './utils';
import { Entity } from './entity';


export interface TileBase {
    passable: boolean;
    animate: boolean;
    getTileName(conn: Array<boolean>): string;
    getDescription(): string;
}

export class WallTile implements TileBase {
    passable = false;
    connector = false;
    animate = false;
    getTileName(conn: Array<boolean>) {
        let rv = 'wall-';
        for (let idx = 0; idx < conn.length; ++idx) {
            if (conn[idx]) {
                rv += DIR[idx];
            }
        }
        return rv;
    }

    getDescription() {
        return 'Wall';
    }
}

export class FloorTile implements TileBase {
    passable = true;
    animate = false;
    getTileName(conn: Array<boolean>) {
        let rv = 'floor';
        // for (let idx = 0; idx < conn.length; ++idx) {
        //     if (conn[idx]) {
        //         rv += DIR[idx];
        //     }
        // }
        return rv;
    }
    getDescription() {
        return 'Floor';
    }
}

export class StairsDownTile implements TileBase {
    passable = false
    animate = false
    getTileName() {
        return 'stairs-down'
    }
    getDescription() {
        return 'Staircase down'
    }
}


export class TileInfo {
    pos: Pos;
    tileName: string;
    tileFrame: number;
    tintColor : string
    tile: TileBase;
    entities: Entity[] = [];
    passable: boolean;
    visible: boolean;
    floodValue: number;
    floodSeq: number;
    roomIdx : number
    alwaysVis? : boolean
    conn = [false, false, false, false]
    constructor(tile: TileBase) {
        this.tile = tile;
        this.tileFrame = 0;
        this.visible = false;
        if (tile) {
            this.passable = tile.passable;
        }
    }
    update() {
        this.tileName = this.tile.getTileName(this.conn);
        if (this.tile.animate) {
            uiManager.addAnimation(
                new FwdAndBackAnimation(
                    (frame) => this.onFrame(frame), TileManager.instance.getTileFrames(this.tileName)
                )
            );
        }
    }
    onFrame(frame: number) {
        this.tileFrame = frame;
        return true;
    }
    addConn(dir: number) {
        this.conn[dir] = true;
        return this;
    }
    addEntity(entity: Entity) {
        this.entities.push(entity);
        entity.pos.assign(this.pos);
    }
    removeEntity(entity: Entity) {
        this.entities = this.entities.filter(e=>e!==entity)
    }
    hasEntities() {
        return this.entities.length > 0
    }
    hasBlockingEntity() {
        return this.entities.some(e=>e.blocking)
    }
    getBlockingEntity() {
        return this.entities.find(e=>e.blocking)
    }
}

/*
export class FloorTurtle {
    m: MapAccessor;
    pos: Pos;
    constructor(m: MapAccessor, pos: Pos) {
        this.m = m;
        this.pos = pos;
    }
    goto(pos: Pos) {
        this.pos = pos;
        return this;
    }
    move(dir: number, steps: number): FloorTurtle {
        let ti = this.m.mapGet(this.pos.x, this.pos.y);
        if (!ti) ti = this.m.mapSet(this.pos.x, this.pos.y, new FloorTile());
        ti.addConn(dir);
        for (let i = 0; i < steps; ++i) {
            this.pos.x += dirX[dir];
            this.pos.y += dirY[dir];
            ti = this.m.mapGet(this.pos.x, this.pos.y);
            if (!ti || !ti.tile) {
                ti = this.m.mapSet(this.pos.x, this.pos.y, new FloorTile());
            }
            if (i < steps - 1) {
                ti.addConn(dir);
            }
            ti.addConn(inverseDir[dir]);
        }
        return this;
    }
}
*/